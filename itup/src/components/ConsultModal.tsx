"use client";

import { useState, useEffect } from "react";
import { useModalClose, useBodyScrollLock, formatPhoneNumber } from "@/hooks/useModal";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/contexts/AnalyticsContext";
import { useToast } from "@/contexts/ToastContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { PRICES } from "@/lib/constants";

// 토스페이먼츠 클라이언트 키 (환경변수 필수)
const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

interface ConsultModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorId?: string;
  mentorName?: string;
  mentorAvailableTimes?: string[];
  mentorPrice?: number;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  interest: string;
  preferredTime: string;
  message: string;
}

const initialFormData: FormData = {
  name: "",
  phone: "",
  email: "",
  interest: "",
  preferredTime: "",
  message: "",
};

export default function ConsultModal({ isOpen, onClose, mentorId, mentorName, mentorAvailableTimes, mentorPrice }: ConsultModalProps) {
  const { user, profile } = useAuth();
  const { trackEvent } = useAnalytics();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [step, setStep] = useState<"form" | "payment" | "success">("form");
  const [consultationId, setConsultationId] = useState<string | null>(null);

  const price = mentorPrice || PRICES.DEFAULT_CONSULT;
  const discountedPrice = Math.floor(price * 0.7); // 첫 상담 30% 할인

  useModalClose(isOpen, onClose);
  useBodyScrollLock(isOpen);

  // 모달 오픈 시 초기화 및 데이터 로드
  useEffect(() => {
    if (!isOpen) return;

    // 이벤트 추적
    trackEvent("modal", "상담모달_오픈", { mentorId: mentorId || "general" });

    // 멘토 시간 로드 (비동기 작업)
    const loadMentorTimes = async () => {
      if (mentorAvailableTimes && mentorAvailableTimes.length > 0) {
        // props로 전달된 시간 사용 (비동기 콜백으로 처리)
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
    };

    // 유저 정보로 폼 초기화 (비동기 콜백으로 처리)
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

    loadMentorTimes();
  }, [isOpen, mentorId, mentorAvailableTimes, trackEvent, user, profile]);

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
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "연락처를 입력해주세요";
    } else if (!/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(formData.phone.replace(/-/g, ""))) {
      newErrors.phone = "올바른 전화번호 형식이 아닙니다";
    }

    if (!formData.email.trim()) {
      newErrors.email = "이메일을 입력해주세요";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "올바른 이메일 형식이 아닙니다";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveToLocalStorage = () => {
    const consultations = JSON.parse(localStorage.getItem("consultations") || "[]");
    const newConsultation = {
      ...formData,
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
      trackEvent("submit", "상담신청_폼완료", { interest: formData.interest, mentorId: mentorId || "general" });
      setStep("payment");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // 상담 신청 저장 (결제 대기 상태)
      const { data, error } = await supabase.from("consultations").insert({
        mentor_id: mentorId || null,
        user_name: formData.name,
        user_phone: formData.phone,
        user_email: formData.email,
        interest: formData.interest || null,
        preferred_time: formData.preferredTime || null,
        message: formData.message || null,
        status: "pending",
      }).select("id").single();

      if (error) {
        console.error("Error saving consultation:", error);
        saveToLocalStorage();
      } else if (data) {
        setConsultationId(data.id);
      }

      trackEvent("submit", "상담신청_폼완료", { interest: formData.interest, mentorId: mentorId || "general" });
      setStep("payment");
      setIsLoading(false);
    } catch (error) {
      console.error("Error saving consultation:", error);
      saveToLocalStorage();
      setStep("payment");
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!TOSS_CLIENT_KEY) {
      showToast("결제 시스템이 설정되지 않았습니다. 관리자에게 문의해주세요.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
      const customerKey = user?.id || `guest_${Date.now()}`;
      const orderId = `CONSULT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 위젯 인스턴스 생성
      const widgets = tossPayments.widgets({ customerKey });

      // 결제 금액 설정
      await widgets.setAmount({
        currency: "KRW",
        value: discountedPrice,
      });

      // 결제 요청
      await widgets.requestPayment({
        orderId,
        orderName: `ITup 멘토링 상담 - ${mentorName || "멘토"}`,
        successUrl: `${window.location.origin}/payment/success?consultationId=${consultationId || "local"}`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail: user?.email || formData.email,
        customerName: profile?.name || formData.name,
      });
    } catch (error) {
      console.error("Payment error:", error);
      // 사용자가 결제창을 닫은 경우 등
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    setIsSubmitted(false);
    setStep("form");
    setConsultationId(null);
    onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-card-bg border border-card-border rounded-2xl shadow-[0_25px_80px_-12px_rgba(139,92,246,0.4)] animate-[modalIn_0.3s_ease-out]">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-muted hover:text-foreground transition-colors cursor-pointer"
          aria-label="닫기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 md:p-8">
          {step === "payment" ? (
            /* 결제 화면 */
            <div className="text-center py-4">
              <h2 className="text-2xl font-bold mb-2">결제하기</h2>
              <p className="text-muted text-sm mb-6">
                상담 신청을 완료하려면 결제를 진행해주세요.
              </p>

              {/* 결제 정보 */}
              <div className="bg-secondary/50 rounded-xl p-4 mb-6 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted">멘토</span>
                  <span className="font-medium">{mentorName || "멘토"}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted">상담 시간</span>
                  <span className="font-medium">30분</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted">정가</span>
                  <span className="text-muted line-through">{price.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-card-border">
                  <span className="font-medium">
                    결제 금액
                    <span className="ml-2 text-xs text-green-500 font-normal">첫 상담 30% 할인</span>
                  </span>
                  <span className="text-xl font-bold text-primary">{discountedPrice.toLocaleString()}원</span>
                </div>
              </div>

              {/* 신청 정보 요약 */}
              <div className="bg-secondary/30 rounded-xl p-4 mb-6 text-left text-sm">
                <p className="text-muted mb-1">신청자: {formData.name}</p>
                <p className="text-muted mb-1">연락처: {formData.phone}</p>
                {formData.preferredTime && (
                  <p className="text-muted">희망 시간: {formData.preferredTime}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("form")}
                  className="flex-1 py-3 border border-card-border text-foreground rounded-xl font-medium hover:bg-secondary transition-colors cursor-pointer"
                >
                  이전으로
                </button>
                <button
                  onClick={handlePayment}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? "처리 중..." : `${discountedPrice.toLocaleString()}원 결제하기`}
                </button>
              </div>

              <p className="mt-4 text-xs text-muted">
                결제는 토스페이먼츠를 통해 안전하게 처리됩니다.
              </p>
            </div>
          ) : isSubmitted ? (
            /* 성공 화면 */
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">신청이 완료되었습니다!</h3>
              <p className="text-muted mb-6">
                빠른 시일 내에 연락드리겠습니다.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium cursor-pointer"
              >
                확인
              </button>
            </div>
          ) : (
            /* 폼 화면 */
            <>
              <h2 className="text-2xl font-bold mb-2">상담 신청</h2>
              <p className="text-muted text-sm mb-6">
                아래 정보를 입력하고 결제를 진행해주세요.
              </p>

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
                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
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
                    <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
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
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
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

                {/* 문의 내용 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">문의 내용</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="궁금한 점이나 상담받고 싶은 내용을 적어주세요"
                    rows={3}
                    className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors resize-none"
                  />
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
                    "다음: 결제하기"
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
