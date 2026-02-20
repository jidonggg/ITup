"use client";

import { useState, useEffect } from "react";
import { useModalClose, useBodyScrollLock, formatPhoneNumber } from "@/hooks/useModal";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/contexts/AnalyticsContext";
import { useToast } from "@/contexts/ToastContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { products, ProductType } from "@/lib/payment/types";
import { getTieredPrice } from "@/lib/pricing/tiers";
import { ProductIcon } from "@/components/icons";

// 토스페이먼츠 클라이언트 키 (환경변수 필수)
const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

const PRODUCT_PREFIX_MAP: Record<ProductType, string> = {
  coffee: "COFFEE",
  resume: "RESUME",
  interview: "INTERVIEW",
};

interface ConsultModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorId?: string;
  mentorName?: string;
  mentorAvailableTimes?: string[];
  mentorExperience?: string;
  productType?: ProductType;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  interest: string;
  preferredTime: string;
  message: string;
  // 상품별 구조화 필드
  currentStatus: string;
  targetCompany: string;
  targetRole: string;
  discussTopics: string[];
  portfolioLink: string;
  interviewType: string;
  specificQuestion: string;
}

const initialFormData: FormData = {
  name: "",
  phone: "",
  email: "",
  interest: "",
  preferredTime: "",
  message: "",
  currentStatus: "",
  targetCompany: "",
  targetRole: "",
  discussTopics: [],
  portfolioLink: "",
  interviewType: "",
  specificQuestion: "",
};

// 상품별 상담 주제 옵션
const DISCUSS_TOPICS: Record<ProductType, { value: string; label: string }[]> = {
  coffee: [
    { value: "career_direction", label: "커리어 방향" },
    { value: "company_culture", label: "회사 분위기/문화" },
    { value: "industry_info", label: "업계 현황/트렌드" },
    { value: "skill_growth", label: "실력 향상 방법" },
    { value: "salary_negotiation", label: "연봉/처우" },
    { value: "work_life", label: "워라밸/근무 환경" },
  ],
  resume: [
    { value: "resume_structure", label: "이력서 구성" },
    { value: "portfolio_feedback", label: "포트폴리오 피드백" },
    { value: "appeal_points", label: "어필 포인트 강화" },
    { value: "project_description", label: "프로젝트 서술 방법" },
    { value: "career_summary", label: "경력 기술서" },
  ],
  interview: [
    { value: "technical", label: "기술 면접" },
    { value: "behavioral", label: "인성/컬처핏" },
    { value: "portfolio_review", label: "포트폴리오 발표" },
    { value: "coding_test", label: "코딩 테스트" },
    { value: "overall", label: "전체 프로세스" },
  ],
};

const CURRENT_STATUS_OPTIONS = [
  { value: "student", label: "학생 (취준 중)" },
  { value: "junior", label: "주니어 (1~3년차)" },
  { value: "mid", label: "미드레벨 (4~7년차)" },
  { value: "senior", label: "시니어 (8년차+)" },
  { value: "career_change", label: "이직 준비 중" },
  { value: "other", label: "기타" },
];

export default function ConsultModal({ isOpen, onClose, mentorId, mentorName, mentorAvailableTimes, mentorExperience, productType: initialProductType }: ConsultModalProps) {
  const { user, profile } = useAuth();
  const { trackEvent } = useAnalytics();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [step, setStep] = useState<"form" | "payment">("form");
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductType>(initialProductType || "coffee");

  // 멘토 실제 상품 가격 (DB에서 조회)
  const [mentorPrices, setMentorPrices] = useState<Record<string, number>>({});

  // 할인 코드 상태
  const [discountResetNotice, setDiscountResetNotice] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountResult, setDiscountResult] = useState<{
    valid: boolean;
    percentage: number;
    description: string;
    discountAmount: number;
    finalAmount: number;
  } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);

  const currentProduct = products.find((p) => p.id === selectedProduct) ?? products[0];

  // PaymentProductType → DB ProductType 매핑
  const PRODUCT_TYPE_MAP: Record<ProductType, string> = {
    coffee: "coffee_chat",
    resume: "document_review",
    interview: "mock_interview",
  };

  // 멘토 DB 가격이 있으면 사용, 없으면 티어 가격 폴백
  const getProductPrice = (productId: ProductType): number => {
    const dbType = PRODUCT_TYPE_MAP[productId];
    if (mentorPrices[dbType] !== undefined) return mentorPrices[dbType];
    return getTieredPrice(productId, mentorExperience);
  };

  const price = getProductPrice(selectedProduct);
  const finalPrice = discountResult ? discountResult.finalAmount : price;

  useModalClose(isOpen, onClose);
  useBodyScrollLock(isOpen);

  // 모달 오픈 시 초기화 및 데이터 로드
  useEffect(() => {
    if (!isOpen) return;

    if (initialProductType) {
      setSelectedProduct(initialProductType);
    }

    // 이벤트 추적
    trackEvent("modal", "상담모달_오픈", { mentorId: mentorId || "general" });

    // 멘토 데이터 로드 (시간 + 상품 가격)
    const loadMentorData = async () => {
      if (mentorAvailableTimes && mentorAvailableTimes.length > 0) {
        requestAnimationFrame(() => setAvailableTimes(mentorAvailableTimes));
      } else if (mentorId && isSupabaseConfigured()) {
        const supabase = createClient();
        const { data } = await supabase
          .from("mentors")
          .select("available_times")
          .eq("id", mentorId)
          .single();

        if (data?.available_times) {
          setAvailableTimes(data.available_times);
        }
      }

      // 멘토 상품 가격 로드
      if (mentorId && isSupabaseConfigured()) {
        const supabase = createClient();
        const { data: productData } = await supabase
          .from("products")
          .select("type, price")
          .eq("mentor_id", mentorId)
          .eq("is_active", true);

        if (productData && productData.length > 0) {
          const prices: Record<string, number> = {};
          for (const p of productData) {
            prices[p.type] = p.price;
          }
          setMentorPrices(prices);
        }
      }
    };

    // 유저 정보로 폼 초기화
    if (user) {
      requestAnimationFrame(() => {
        setFormData((prev) => ({
          ...prev,
          name: profile?.name || prev.name,
          email: user.email || prev.email,
          phone: profile?.phone || prev.phone,
        }));
      });
    }

    loadMentorData();
  }, [isOpen, mentorId, mentorAvailableTimes, trackEvent, user, profile, initialProductType]);

  const interests = [
    { value: "programming", label: "프로그래밍" },
    { value: "planning", label: "기획" },
    { value: "art", label: "아트" },
    { value: "qa", label: "QA" },
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "이름을 입력해주세요";
    } else if (formData.name.trim().length > 50) {
      newErrors.name = "이름은 50자 이내로 입력해주세요";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "연락처를 입력해주세요";
    } else if (!/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(formData.phone.replace(/-/g, ""))) {
      newErrors.phone = "올바른 전화번호 형식이 아닙니다";
    }

    if (!formData.email.trim()) {
      newErrors.email = "이메일을 입력해주세요";
    } else if (formData.email.length > 254) {
      newErrors.email = "이메일은 254자 이내로 입력해주세요";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "올바른 이메일 형식이 아닙니다";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildStructuredMessage = (data: FormData, product: ProductType): string => {
    const parts: string[] = [];

    if (data.currentStatus) {
      const statusLabel = CURRENT_STATUS_OPTIONS.find((o) => o.value === data.currentStatus)?.label || data.currentStatus;
      parts.push(`[현재 상태] ${statusLabel}`);
    }
    if (data.targetCompany) parts.push(`[목표 회사] ${data.targetCompany}`);
    if (data.targetRole) parts.push(`[목표 직무] ${data.targetRole}`);
    if (data.discussTopics.length > 0) {
      const topicLabels = data.discussTopics
        .map((v) => DISCUSS_TOPICS[product]?.find((t) => t.value === v)?.label || v)
        .join(", ");
      parts.push(`[상담 주제] ${topicLabels}`);
    }
    if (product === "resume" && data.portfolioLink) {
      parts.push(`[포트폴리오 링크] ${data.portfolioLink}`);
    }
    if (product === "interview" && data.interviewType) {
      parts.push(`[면접 유형] ${data.interviewType}`);
    }
    if (data.specificQuestion) parts.push(`[구체적 질문] ${data.specificQuestion}`);
    if (data.message) parts.push(`[추가 메시지] ${data.message}`);

    return parts.join("\n");
  };

  const saveToLocalStorage = () => {
    const consultations = JSON.parse(localStorage.getItem("consultations") || "[]");
    const newConsultation = {
      ...formData,
      productType: selectedProduct,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };
    consultations.push(newConsultation);
    localStorage.setItem("consultations", JSON.stringify(consultations));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    if (!isSupabaseConfigured()) {
      saveToLocalStorage();
      trackEvent("submit", "상담신청_폼완료", { interest: formData.interest, mentorId: mentorId || "general", productType: selectedProduct });
      setStep("payment");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // 구조화된 메시지 생성
      const structuredMessage = buildStructuredMessage(formData, selectedProduct);

      // 상담 신청 저장 (결제 대기 상태)
      const { data, error } = await supabase.from("consultations").insert({
        mentor_id: mentorId || null,
        user_id: user?.id || null,
        user_name: formData.name,
        user_phone: formData.phone,
        user_email: formData.email,
        interest: formData.interest || null,
        product_type: selectedProduct,
        preferred_time: formData.preferredTime || null,
        message: structuredMessage || null,
        expected_amount: price,
      }).select("id").single();

      if (error) {
        saveToLocalStorage();
      } else if (data) {
        setConsultationId(data.id);
      }

      trackEvent("submit", "상담신청_폼완료", { interest: formData.interest, mentorId: mentorId || "general", productType: selectedProduct });
      setStep("payment");
      setIsLoading(false);
    } catch (error) {
      saveToLocalStorage();
      setStep("payment");
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!user) {
      showToast("결제하려면 로그인이 필요해요.", "error");
      return;
    }

    // 시범운영: 결제 없이 완료 처리
    // TODO: 정식 운영 시 Toss 결제 연동 복구
    showToast("시범운영 기간이라 결제 없이 신청이 완료되었어요!", "success");
    handleClose();
  };

  const handleApplyDiscount = async () => {
    if (discountLoading) return;

    if (!discountCode.trim()) {
      setDiscountError("할인 코드를 입력해주세요.");
      return;
    }

    setDiscountLoading(true);
    setDiscountError(null);
    setDiscountResult(null);

    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setDiscountError("로그인이 필요합니다.");
        setDiscountLoading(false);
        return;
      }

      const res = await fetch("/api/discount/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: discountCode.trim(), amount: price }),
      });

      const data = await res.json();

      if (data.valid) {
        setDiscountResult({
          valid: true,
          percentage: data.percentage,
          description: data.description,
          discountAmount: data.discountAmount,
          finalAmount: data.finalAmount,
        });
        trackEvent("discount", "할인코드_적용_성공", { code: discountCode.trim(), percentage: data.percentage });
      } else {
        setDiscountError(data.error || "유효하지 않은 할인 코드입니다.");
      }
    } catch {
      setDiscountError("할인 코드 확인 중 오류가 발생했습니다.");
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountCode("");
    setDiscountResult(null);
    setDiscountError(null);
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    setStep("form");
    setConsultationId(null);
    setSelectedProduct(initialProductType || "coffee");
    setMentorPrices({});
    setDiscountCode("");
    setDiscountResult(null);
    setDiscountError(null);
    setDiscountResetNotice(false);
    onClose();
  };

  const toggleDiscussTopic = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      discussTopics: prev.discussTopics.includes(value)
        ? prev.discussTopics.filter((t) => t !== value)
        : [...prev.discussTopics, value],
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const newValue = name === "phone" ? formatPhoneNumber(value) : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consult-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-[calc(100%-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto bg-card-bg border border-card-border rounded-2xl shadow-[0_25px_80px_-12px_rgba(160,113,79,0.25)] animate-[modalIn_0.3s_ease-out]">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-foreground hover:bg-secondary/60 rounded-full transition-colors cursor-pointer"
          aria-label="닫기"
          type="button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-4 sm:p-6 md:p-8">
          {step === "payment" ? (
            /* 결제 화면 */
            <div className="text-center py-4">
              <h2 id="consult-modal-title" className="text-2xl font-bold mb-2">결제하기</h2>
              <p className="text-muted text-sm mb-6">
                {currentProduct.name} 신청을 완료하려면 결제를 진행해주세요.
              </p>

              {/* 결제 정보 */}
              <div className="bg-secondary/50 rounded-xl p-4 mb-6 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted">멘토</span>
                  <span className="font-medium">{mentorName || "멘토"}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted">상품</span>
                  <span className="font-medium"><ProductIcon name={currentProduct.icon} className="w-4 h-4 inline-block" /> {currentProduct.name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted">시간</span>
                  <span className="font-medium">{currentProduct.duration}</span>
                </div>
                {discountResult && (
                  <div className="flex justify-between items-center mb-2 text-sm">
                    <span className="text-green-500">할인 ({discountResult.percentage}%)</span>
                    <span className="text-green-500 font-medium">-{discountResult.discountAmount.toLocaleString()}원</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-card-border">
                  <span className="font-medium">결제 금액</span>
                  <div className="text-right">
                    {discountResult && (
                      <span className="text-sm text-muted line-through mr-2">{price.toLocaleString()}원</span>
                    )}
                    <span className="text-xl font-bold text-primary">{finalPrice.toLocaleString()}원</span>
                  </div>
                </div>
              </div>

              {/* 할인 코드 */}
              <div className="mb-6">
                {discountResult ? (
                  <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
                    <div className="text-sm">
                      <span className="text-green-500 font-medium">{discountResult.description}</span>
                      <span className="text-muted ml-2">({discountResult.percentage}% 할인 적용)</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveDiscount}
                      className="text-muted hover:text-foreground text-sm ml-2 cursor-pointer"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => {
                          setDiscountCode(e.target.value);
                          if (discountError) setDiscountError(null);
                        }}
                        placeholder="할인 코드 입력"
                        maxLength={50}
                        className={`flex-1 px-4 py-2.5 bg-secondary border rounded-xl text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-primary transition-colors ${
                          discountError ? "border-red-500" : "border-card-border"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={handleApplyDiscount}
                        disabled={discountLoading || !discountCode.trim()}
                        className="px-4 py-2.5 bg-secondary border border-card-border rounded-xl text-sm font-medium hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {discountLoading ? "확인 중..." : "적용"}
                      </button>
                    </div>
                    {discountError && (
                      <p className="mt-1.5 text-sm text-red-500">{discountError}</p>
                    )}
                  </>
                )}
              </div>

              {/* 신청 정보 요약 */}
              <div className="bg-secondary/30 rounded-xl p-4 mb-6 text-left text-sm space-y-1">
                <p className="text-muted">신청자: {formData.name}</p>
                <p className="text-muted">연락처: {formData.phone}</p>
                {formData.currentStatus && (
                  <p className="text-muted">상태: {CURRENT_STATUS_OPTIONS.find((o) => o.value === formData.currentStatus)?.label}</p>
                )}
                {formData.targetCompany && <p className="text-muted">목표: {formData.targetCompany}{formData.targetRole ? ` / ${formData.targetRole}` : ""}</p>}
                {formData.discussTopics.length > 0 && (
                  <p className="text-muted">주제: {formData.discussTopics.map((v) => DISCUSS_TOPICS[selectedProduct]?.find((t) => t.value === v)?.label || v).join(", ")}</p>
                )}
                {formData.preferredTime && (
                  <p className="text-muted">희망 시간: {formData.preferredTime}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep("form");
                  }}
                  className="flex-1 py-3 border border-card-border text-foreground rounded-xl font-medium hover:bg-secondary transition-colors cursor-pointer"
                >
                  이전으로
                </button>
                <button
                  onClick={handlePayment}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? "처리 중..." : `${finalPrice.toLocaleString()}원 결제할게요`}
                </button>
              </div>

              <p className="mt-4 text-xs text-muted">
                결제는 토스페이먼츠를 통해 안전하게 처리돼요.
              </p>
            </div>
          ) : (
            /* 폼 화면 */
            <>
              <h2 id="consult-modal-title" className="text-2xl font-bold mb-2">상담 신청</h2>
              <p className="text-muted text-sm mb-6">
                상품을 선택하고 정보를 입력해주세요.
              </p>

              {/* 상품 타입 선택 - 상세 카드 */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">상품 선택</label>
                <div className="space-y-2">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        setSelectedProduct(product.id);
                        setFormData((prev) => ({ ...prev, discussTopics: [] }));
                        if (discountResult) {
                          setDiscountResult(null);
                          setDiscountCode("");
                          setDiscountResetNotice(true);
                          setTimeout(() => setDiscountResetNotice(false), 3000);
                        }
                      }}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer text-left ${
                        selectedProduct === product.id
                          ? "border-primary bg-primary/8 ring-1 ring-primary/20"
                          : "border-card-border bg-secondary/50 hover:border-primary/40"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        selectedProduct === product.id ? "bg-primary/15" : "bg-secondary"
                      }`}>
                        <ProductIcon name={product.icon} className={`w-5 h-5 ${selectedProduct === product.id ? "text-primary" : "text-muted"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-semibold ${selectedProduct === product.id ? "text-primary" : "text-foreground"}`}>
                            {product.name}
                          </span>
                          <span className={`text-sm font-bold whitespace-nowrap ${selectedProduct === product.id ? "text-primary" : "text-foreground"}`}>
                            {getProductPrice(product.id).toLocaleString()}원
                          </span>
                        </div>
                        <p className="text-xs text-muted mt-0.5">{product.duration} · {product.description}</p>
                        {selectedProduct === product.id && (
                          <div className="mt-2 space-y-1">
                            {product.features.slice(0, 3).map((f, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-[11px] text-primary/70">
                                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {f}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                {discountResetNotice && (
                  <p className="mt-2 text-xs text-warning">
                    상품이 변경되어 할인 코드가 초기화되었습니다. 결제 시 다시 입력해주세요.
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 이름 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="홍길동"
                    className={`w-full px-4 py-3 bg-secondary border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors ${
                      errors.name ? "border-red-500" : "border-card-border"
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500" role="alert">{errors.name}</p>
                  )}
                </div>

                {/* 연락처 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    연락처 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="010-1234-5678"
                    className={`w-full px-4 py-3 bg-secondary border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors ${
                      errors.phone ? "border-red-500" : "border-card-border"
                    }`}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-500" role="alert">{errors.phone}</p>
                  )}
                </div>

                {/* 이메일 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    className={`w-full px-4 py-3 bg-secondary border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors ${
                      errors.email ? "border-red-500" : "border-card-border"
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500" role="alert">{errors.email}</p>
                  )}
                </div>

                {/* 관심 분야 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">관심 분야</label>
                  <select
                    name="interest"
                    value={formData.interest}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
                  >
                    <option value="">선택해주세요</option>
                    {interests.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 희망 시간 */}
                {availableTimes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5">희망 상담 시간</label>
                    <div className="flex flex-wrap gap-2">
                      {availableTimes.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, preferredTime: time }))}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${
                            formData.preferredTime === time
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-card-border bg-secondary text-muted hover:border-primary/50"
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                    {formData.preferredTime && (
                      <p className="mt-2 text-sm text-primary">
                        선택: {formData.preferredTime}
                      </p>
                    )}
                  </div>
                )}

                {/* 상품별 구조화 질문 */}
                <div className="space-y-4 pt-2 border-t border-card-border/50">
                  <p className="text-xs text-muted">
                    멘토가 상담을 더 잘 준비할 수 있도록 알려주세요
                  </p>

                  {/* 현재 상태 - 공통 */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">현재 상태</label>
                    <div className="flex flex-wrap gap-1.5">
                      {CURRENT_STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, currentStatus: opt.value }))}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                            formData.currentStatus === opt.value
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-card-border bg-secondary text-muted hover:border-primary/40"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 목표 회사/직무 - 이력서, 모의면접 */}
                  {(selectedProduct === "resume" || selectedProduct === "interview") && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">목표 회사</label>
                        <input
                          type="text"
                          name="targetCompany"
                          value={formData.targetCompany}
                          onChange={handleChange}
                          placeholder="예: 넥슨, 크래프톤"
                          className="w-full px-3 py-2.5 bg-secondary border border-card-border rounded-xl text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">목표 직무</label>
                        <input
                          type="text"
                          name="targetRole"
                          value={formData.targetRole}
                          onChange={handleChange}
                          placeholder="예: 클라이언트 개발"
                          className="w-full px-3 py-2.5 bg-secondary border border-card-border rounded-xl text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {/* 포트폴리오 링크 - 이력서 첨삭 */}
                  {selectedProduct === "resume" && (
                    <div>
                      <label className="block text-sm font-medium mb-1.5">포트폴리오/이력서 링크</label>
                      <input
                        type="url"
                        name="portfolioLink"
                        value={formData.portfolioLink}
                        onChange={handleChange}
                        placeholder="Google Drive, Notion 등 공유 링크"
                        className="w-full px-3 py-2.5 bg-secondary border border-card-border rounded-xl text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                      />
                      <p className="mt-1 text-[11px] text-muted">상담 전에 미리 공유하면 더 깊은 피드백을 받을 수 있어요</p>
                    </div>
                  )}

                  {/* 상담 주제 선택 - 상품별 */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      {selectedProduct === "coffee" ? "이야기하고 싶은 주제" : selectedProduct === "resume" ? "피드백 받고 싶은 부분" : "준비하고 싶은 면접 유형"}
                      <span className="text-xs text-muted font-normal ml-1">(복수 선택)</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {(DISCUSS_TOPICS[selectedProduct] || []).map((topic) => (
                        <button
                          key={topic.value}
                          type="button"
                          onClick={() => toggleDiscussTopic(topic.value)}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                            formData.discussTopics.includes(topic.value)
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-card-border bg-secondary text-muted hover:border-primary/40"
                          }`}
                        >
                          {topic.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 구체적 질문 */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      {selectedProduct === "coffee" ? "멘토에게 꼭 묻고 싶은 질문" : selectedProduct === "resume" ? "특별히 고민되는 부분" : "가장 걱정되는 부분"}
                    </label>
                    <textarea
                      name="specificQuestion"
                      value={formData.specificQuestion}
                      onChange={handleChange}
                      placeholder={
                        selectedProduct === "coffee"
                          ? "예: 게임 기획자로 취업하려면 어떤 준비를 해야 하나요?"
                          : selectedProduct === "resume"
                          ? "예: 프로젝트 경험이 부족한데 어떻게 어필하면 좋을까요?"
                          : "예: 기술 면접에서 자료구조 질문이 가장 걱정돼요"
                      }
                      rows={2}
                      maxLength={500}
                      className="w-full px-3 py-2.5 bg-secondary border border-card-border rounded-xl text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-primary transition-colors resize-none"
                    />
                  </div>

                  {/* 추가 메시지 */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">추가 전달 사항 <span className="text-xs text-muted font-normal">(선택)</span></label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="그 외 멘토에게 미리 알려주고 싶은 내용"
                      rows={2}
                      maxLength={500}
                      className="w-full px-3 py-2.5 bg-secondary border border-card-border rounded-xl text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-primary transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* 제출 버튼 */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      처리 중...
                    </span>
                  ) : (
                    "다음으로"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
