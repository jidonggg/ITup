"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { trackEvent } from "@/lib/analytics/track";
import { useToast } from "@/contexts/ToastContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { InsertableProductType, JobType, EngineType } from "@/lib/supabase/types";
import { SITE_CONFIG } from "@/lib/site-config";
import {
  PRICE_LIMITS,
  RECOMMENDED_PRICES,
  PRODUCT_INFO,
  JOB_TYPES,
  ENGINE_TYPES,
  VALIDATION,
} from "@/lib/constants";
import { ProductIcon } from "@/components/icons";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StepOneData {
  // 기본 정보
  name: string;
  company: string;
  position: string;
  years: number | "";
  jobType: JobType | "";
  engine: EngineType | "";
  // 이메일 인증
  companyEmail: string;
  verificationCode: string;
  isVerified: boolean;
  verifiedEmail: string | null;
  // 경력 인증 서류 (건강보험자격득실확인서)
  documentUrl: string | null;
}

/** Only product types accepted by the DB products table check constraint */
type MentorProductType = InsertableProductType;

interface StepTwoData {
  // 이전 경력 (선택)
  wantsPreviousCareer: boolean | null;
  previousCompanies: string;
  insuranceFile: File | null;
  // 프로필
  bio: string;
  profilePhoto: File | null;
  // 상품 등록
  products: Record<MentorProductType, ProductSetting>;
}

interface ProductSetting {
  enabled: boolean;
  price: number | "";
}

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

interface StepThreeData {
  availableTimes: Record<DayKey, string[]>;
}

const TOTAL_STEPS = 3;

const STEP_LABELS = ["기본정보 + 인증", "프로필 + 상품", "시간 설정"];

const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
  { key: "sat", label: "토" },
  { key: "sun", label: "일" },
];

const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => {
  const hour = i + 9; // 09:00 ~ 22:00
  return `${hour.toString().padStart(2, "0")}:00`;
});

// ---------------------------------------------------------------------------
// Initial states
// ---------------------------------------------------------------------------

const initialStepOne: StepOneData = {
  name: "",
  company: "",
  position: "",
  years: "",
  jobType: "",
  engine: "",
  companyEmail: "",
  verificationCode: "",
  isVerified: false,
  verifiedEmail: null,
  documentUrl: null,
};

const initialStepTwo: StepTwoData = {
  wantsPreviousCareer: null,
  previousCompanies: "",
  insuranceFile: null,
  bio: "",
  profilePhoto: null,
  products: {
    coffee_chat: { enabled: false, price: "" },
    mock_interview: { enabled: false, price: "" },
  },
};

const initialStepThree: StepThreeData = {
  availableTimes: {
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
    sun: [],
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MentorApplyPage() {
  const router = useRouter();
  const { user, session, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Form data per step
  const [stepOne, setStepOne] = useState<StepOneData>(initialStepOne);
  const [stepTwo, setStepTwo] = useState<StepTwoData>(initialStepTwo);
  const [stepThree, setStepThree] = useState<StepThreeData>(initialStepThree);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  // Document upload states
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [documentFileName, setDocumentFileName] = useState<string | null>(null);

  // Analytics: page view on mount
  useEffect(() => {
    trackEvent({ category: "page_view", action: "mentor_apply_view" });
  }, []);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const clearError = useCallback((key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const formatPrice = (value: number): string => {
    return value.toLocaleString("ko-KR");
  };

  // ---------------------------------------------------------------------------
  // Step 1 handlers (기본정보 + 인증)
  // ---------------------------------------------------------------------------

  const handleStepOneChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "years") {
      const num = value === "" ? "" : parseInt(value, 10);
      setStepOne((prev) => ({ ...prev, years: num }));
    } else {
      setStepOne((prev) => ({ ...prev, [name]: value }));
    }
    clearError(name);
  };

  const handleSendCode = async () => {
    if (!stepOne.companyEmail.trim()) {
      setErrors((prev) => ({ ...prev, companyEmail: "회사 이메일을 입력해주세요." }));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stepOne.companyEmail)) {
      setErrors((prev) => ({ ...prev, companyEmail: "올바른 이메일 형식을 입력해주세요." }));
      return;
    }
    setIsSendingCode(true);
    trackEvent({ category: "button_click", action: "mentor_apply_send_code" });
    clearError("companyEmail");
    clearError("verification");

    try {
      const res = await fetch("/api/verification/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({ email: stepOne.companyEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors((prev) => ({ ...prev, companyEmail: data.error || "인증 코드 발송에 실패했습니다." }));
        return;
      }

      setCodeSent(true);
      showToast("인증 코드가 발송되었습니다. 이메일을 확인해주세요.", "success");
    } catch {
      setErrors((prev) => ({ ...prev, companyEmail: "인증 코드 발송 중 오류가 발생했습니다." }));
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!stepOne.verificationCode.trim()) {
      setErrors((prev) => ({ ...prev, verificationCode: "인증 코드를 입력해주세요." }));
      return;
    }
    setIsVerifying(true);
    trackEvent({ category: "button_click", action: "mentor_apply_verify_code" });
    clearError("verificationCode");
    clearError("verification");

    try {
      const res = await fetch("/api/verification/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({
          email: stepOne.companyEmail,
          code: stepOne.verificationCode,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors((prev) => ({ ...prev, verificationCode: data.error || "인증에 실패했습니다." }));
        return;
      }

      setStepOne((prev) => ({
        ...prev,
        isVerified: true,
        verifiedEmail: prev.companyEmail,
      }));
      showToast("이메일 인증이 완료되었습니다!", "success");
    } catch {
      setErrors((prev) => ({ ...prev, verificationCode: "인증 처리 중 오류가 발생했습니다." }));
    } finally {
      setIsVerifying(false);
    }
  };

  // 건강보험자격득실확인서 업로드
  const DOCUMENT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const DOCUMENT_ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    if (!DOCUMENT_ALLOWED_TYPES.includes(file.type)) {
      showToast("PDF, JPG, PNG 형식의 파일만 업로드 가능합니다.", "error");
      e.target.value = "";
      return;
    }

    // 파일 크기 검증
    if (file.size > DOCUMENT_MAX_SIZE) {
      showToast("파일 크기는 10MB 이하여야 합니다.", "error");
      e.target.value = "";
      return;
    }

    setIsUploadingDocument(true);
    clearError("document");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/verification/upload-document", {
        method: "POST",
        headers: {
          ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors((prev) => ({ ...prev, document: data.error || "파일 업로드에 실패했습니다." }));
        e.target.value = "";
        return;
      }

      setStepOne((prev) => ({ ...prev, documentUrl: data.storagePath }));
      setDocumentFileName(file.name);
      showToast("경력 인증 서류가 업로드되었습니다.", "success");
    } catch {
      setErrors((prev) => ({ ...prev, document: "파일 업로드 중 오류가 발생했습니다." }));
      e.target.value = "";
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const handleRemoveDocument = () => {
    setStepOne((prev) => ({ ...prev, documentUrl: null }));
    setDocumentFileName(null);
    clearError("document");
  };

  const validateStepOne = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!stepOne.name.trim()) newErrors.name = "이름을 입력해주세요.";
    if (!stepOne.company.trim()) newErrors.company = "현재 회사를 입력해주세요.";
    if (!stepOne.position.trim()) newErrors.position = "직책/직급을 입력해주세요.";
    if (stepOne.years === "" || stepOne.years < 3) {
      newErrors.years = "경력은 최소 3년 이상이어야 합니다.";
    }
    if (!stepOne.jobType) newErrors.jobType = "직군을 선택해주세요.";
    if (!stepOne.engine) newErrors.engine = "엔진을 선택해주세요.";
    if (!stepOne.isVerified) {
      newErrors.verification = "회사 이메일 인증을 완료해주세요.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------------------------------------------------------------------
  // Step 2 handlers (프로필 + 상품)
  // ---------------------------------------------------------------------------

  // 파일 업로드 크기 제한 (5MB)
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"];
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

  const handleInsuranceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        showToast("파일 크기는 5MB 이하여야 합니다.", "error");
        e.target.value = "";
        return;
      }
      if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
        showToast("PDF, JPG, PNG 형식의 파일만 업로드 가능합니다.", "error");
        e.target.value = "";
        return;
      }
    }
    setStepTwo((prev) => ({ ...prev, insuranceFile: file }));
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        showToast("파일 크기는 5MB 이하여야 합니다.", "error");
        e.target.value = "";
        return;
      }
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        showToast("JPG, PNG, WebP 형식의 이미지만 업로드 가능합니다.", "error");
        e.target.value = "";
        return;
      }
    }
    setStepTwo((prev) => ({ ...prev, profilePhoto: file }));
  };

  const toggleProduct = (type: MentorProductType) => {
    setStepTwo((prev) => ({
      ...prev,
      products: {
        ...prev.products,
        [type]: {
          ...prev.products[type],
          enabled: !prev.products[type].enabled,
          price: !prev.products[type].enabled ? RECOMMENDED_PRICES[type] : "",
        },
      },
    }));
    clearError(`price_${type}`);
  };

  const handlePriceChange = (type: MentorProductType, value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    const num = numericValue === "" ? "" : parseInt(numericValue, 10);
    setStepTwo((prev) => ({
      ...prev,
      products: {
        ...prev.products,
        [type]: { ...prev.products[type], price: num },
      },
    }));
    clearError(`price_${type}`);
  };

  const validateStepTwo = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 자기소개 필수 + 최소/최대 길이 검증
    const trimmedBio = stepTwo.bio.trim();
    if (!trimmedBio) {
      newErrors.bio = "자기소개를 입력해주세요.";
    } else if (trimmedBio.length < VALIDATION.MIN_INTRO_LENGTH) {
      newErrors.bio = `자기소개는 최소 ${VALIDATION.MIN_INTRO_LENGTH}자 이상 입력해주세요.`;
    } else if (stepTwo.bio.length > VALIDATION.MAX_BIO_LENGTH) {
      newErrors.bio = `자기소개는 ${VALIDATION.MAX_BIO_LENGTH}자 이하여야 합니다.`;
    }

    // 상품 최소 1개
    const enabledProducts = (Object.keys(stepTwo.products) as MentorProductType[]).filter(
      (t) => stepTwo.products[t].enabled
    );

    if (enabledProducts.length === 0) {
      newErrors.products = "최소 1개 이상의 상품을 등록해주세요.";
    }

    for (const type of enabledProducts) {
      const price = stepTwo.products[type].price;
      const limits = PRICE_LIMITS[type];
      if (price === "" || price < limits.min || price > limits.max) {
        newErrors[`price_${type}`] = `가격은 ${formatPrice(limits.min)}원 ~ ${formatPrice(limits.max)}원 사이여야 합니다.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------------------------------------------------------------------
  // Step 3 handlers (시간 설정)
  // ---------------------------------------------------------------------------

  const toggleTimeSlot = (day: DayKey, time: string) => {
    setStepThree((prev) => {
      const current = prev.availableTimes[day];
      const updated = current.includes(time)
        ? current.filter((t) => t !== time)
        : [...current, time].sort();
      return {
        ...prev,
        availableTimes: { ...prev.availableTimes, [day]: updated },
      };
    });
  };

  const toggleAllDay = (day: DayKey) => {
    setStepThree((prev) => {
      const current = prev.availableTimes[day];
      const allSelected = current.length === TIME_SLOTS.length;
      return {
        ...prev,
        availableTimes: {
          ...prev.availableTimes,
          [day]: allSelected ? [] : [...TIME_SLOTS],
        },
      };
    });
  };

  const validateStepThree = (): boolean => {
    const hasAnySlot = Object.values(stepThree.availableTimes).some(
      (slots) => slots.length > 0
    );
    if (!hasAnySlot) {
      setErrors({ availableTimes: "최소 1개 이상의 시간대를 선택해주세요." });
      return false;
    }
    setErrors({});
    return true;
  };

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  const handleNext = () => {
    let valid = true;

    switch (currentStep) {
      case 1:
        valid = validateStepOne();
        break;
      case 2:
        valid = validateStepTwo();
        break;
      case 3:
        valid = validateStepThree();
        if (valid) handleFinalSubmit();
        return;
    }

    if (valid) {
      const nextStep = Math.min(currentStep + 1, TOTAL_STEPS);
      setCurrentStep(nextStep);
      setErrors({});
      trackEvent({
        category: "form_step",
        action: "mentor_apply_step",
        label: `step_${nextStep}`,
        metadata: { step: nextStep },
      });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setErrors({});
  };

  // ---------------------------------------------------------------------------
  // Final submit
  // ---------------------------------------------------------------------------

  const handleFinalSubmit = async () => {
    if (!user) {
      showToast("로그인이 필요합니다.", "error");
      return;
    }

    if (!isSupabaseConfigured()) {
      showToast("서비스 설정 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", "error");
      return;
    }

    // 제출 전 모든 스텝 재검증 (뒤로 갔다 수정 후 다시 돌아온 경우 대비)
    if (!validateStepOne()) {
      setCurrentStep(1);
      showToast("기본정보를 다시 확인해주세요.", "error");
      return;
    }
    if (!validateStepTwo()) {
      setCurrentStep(2);
      showToast("프로필/상품 정보를 다시 확인해주세요.", "error");
      return;
    }

    setIsSubmitting(true);
    trackEvent({ category: "form_submit", action: "mentor_apply_submit" });

    try {
      const supabase = createClient();

      // Check for existing mentor registration
      const { data: existingMentor, error: existingError } = await supabase
        .from("mentors")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingError && existingError.code !== "PGRST116") {
        throw new Error("멘토 등록 확인 중 오류가 발생했습니다.");
      }

      if (existingMentor) {
        showToast("이미 멘토로 등록되어 있습니다. 대시보드로 이동합니다.", "info");
        router.push("/mentor/dashboard");
        return;
      }

      // Parse previous companies
      const previousCompaniesArray = stepTwo.previousCompanies
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      // Build available_times as flat string array (DB expects JSON array)
      const availableTimesArray: string[] = [];
      for (const [day, slots] of Object.entries(stepThree.availableTimes)) {
        for (const slot of slots) {
          availableTimesArray.push(`${day} ${slot}`);
        }
      }

      // Insert mentor (DB 실제 컬럼만 사용)
      const { data: mentorData, error: mentorError } = await supabase
        .from("mentors")
        .insert({
          user_id: user.id,
          name: stepOne.name.trim(),
          company: stepOne.company.trim(),
          role: stepOne.position.trim(),
          experience: `${stepOne.years}년`,
          skills: [],
          bio: stepTwo.bio.trim() || null,
          consult_types: (Object.keys(stepTwo.products) as MentorProductType[])
            .filter((t) => stepTwo.products[t].enabled)
            .map((t) => t === "coffee_chat" ? "coffee" : "interview"),
          verified_company: stepOne.verifiedEmail
            ? stepOne.verifiedEmail.split("@")[1]
            : null,
          is_verified: stepOne.isVerified,
          verification_method: stepOne.isVerified
            ? (stepOne.documentUrl ? "document" as const : "email" as const)
            : null,
          verified_at: stepOne.isVerified ? new Date().toISOString() : null,
          previous_companies: previousCompaniesArray.length > 0 ? previousCompaniesArray : null,
          document_url: stepOne.documentUrl || null,
          available_times: availableTimesArray.length > 0 ? availableTimesArray : null,
          price: null,
        })
        .select("id")
        .single();

      if (mentorError || !mentorData) {
        throw new Error(mentorError?.message || "멘토 등록에 실패했습니다.");
      }

      // Insert enabled products
      const enabledProducts = (Object.keys(stepTwo.products) as MentorProductType[]).filter(
        (t) => stepTwo.products[t].enabled
      );

      if (enabledProducts.length > 0) {
        const productInserts = enabledProducts.map((type) => ({
          mentor_id: mentorData.id,
          type,
          title: PRODUCT_INFO[type].name,
          description: PRODUCT_INFO[type].description,
          duration_minutes: PRODUCT_INFO[type].duration,
          price: stepTwo.products[type].price as number,
          is_active: true,
        }));

        const { error: productError } = await supabase
          .from("products")
          .insert(productInserts);

        if (productError) {
          showToast("상품 등록 중 일부 오류가 있었습니다. 대시보드에서 다시 등록할 수 있습니다.", "warning");
        }
      }

      // 멘토 역할은 관리자 승인 시 설정됨 (신청 단계에서는 role 변경하지 않음)

      setIsSuccess(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "멘토 등록 중 오류가 발생했습니다.";
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Not logged in
  // ---------------------------------------------------------------------------

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card-bg border border-card-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">로그인이 필요해요</h2>
          <p className="text-muted mb-6">
            멘토 지원을 하려면 먼저 로그인해주세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium cursor-pointer"
            >
              로그인하기
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2.5 border border-card-border rounded-full font-medium cursor-pointer"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Success screen
  // ---------------------------------------------------------------------------

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card-bg border border-card-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">멘토 지원 완료!</h2>
          <p className="text-muted mb-6">
            관리자 검토 후 승인되면 멘토 활동을 시작할 수 있어요.
            <br />
            승인 결과는 이메일로 안내드릴게요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium cursor-pointer"
            >
              홈으로 돌아가기
            </button>
            <button
              onClick={() => router.push("/mentors")}
              className="px-6 py-2.5 border border-card-border rounded-full font-medium cursor-pointer"
            >
              멘토 목록 보기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Progress bar
  // ---------------------------------------------------------------------------

  const renderProgressBar = () => (
    <div className="mb-8">
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-3">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const step = i + 1;
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;

          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    isCompleted
                      ? "bg-primary text-white"
                      : isActive
                        ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/30"
                        : "bg-secondary text-muted"
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                <span
                  className={`text-xs mt-1.5 whitespace-nowrap hidden sm:block ${
                    isActive ? "text-primary font-semibold" : "text-muted"
                  }`}
                >
                  {STEP_LABELS[i]}
                </span>
              </div>
              {step < TOTAL_STEPS && (
                <div className="flex-1 mx-2 sm:mx-3">
                  <div className="h-0.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: isCompleted ? "100%" : "0%" }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile step label */}
      <p className="text-center text-sm text-muted sm:hidden">
        {currentStep}단계: {STEP_LABELS[currentStep - 1]}
      </p>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Step 1: 기본정보 + 인증
  // ---------------------------------------------------------------------------

  const renderStepOne = () => (
    <div className="space-y-6">
      {/* Step 1 Tip Callout */}
      <div className="flex gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-blue-700 text-sm">시작하기 전에</p>
          <p className="text-sm text-foreground/80">회사 이메일 인증이 필요합니다. 인증된 멘토에게는 프로필에 <span className="font-semibold text-blue-700">인증 뱃지</span>가 부여됩니다.</p>
        </div>
      </div>

      {/* 기본 정보 섹션 */}
      <div className="bg-card-bg border border-card-border border-l-4 border-l-primary rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold">기본 정보</h3>
            <p className="text-sm text-muted">
              멘토로 활동하기 위한 기본 정보를 입력해주세요.
            </p>
          </div>
        </div>

        {/* Name */}
        <div>
          <label htmlFor="mentor-name" className="block text-sm font-medium mb-1.5">
            이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="mentor-name"
            name="name"
            value={stepOne.name}
            onChange={handleStepOneChange}
            placeholder="멘토로 표시될 이름"
            maxLength={VALIDATION.MAX_NAME_LENGTH}
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={`w-full px-4 py-3 bg-secondary border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors ${
              errors.name ? "border-red-500" : "border-card-border"
            }`}
          />
          {errors.name && (
            <p id="name-error" className="mt-1 text-sm text-red-500" role="alert">{errors.name}</p>
          )}
        </div>

        {/* Company */}
        <div>
          <label htmlFor="mentor-company" className="block text-sm font-medium mb-1.5">
            현재 회사 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="mentor-company"
            name="company"
            value={stepOne.company}
            onChange={handleStepOneChange}
            placeholder="예: 넥슨, 넷마블, 크래프톤"
            aria-required="true"
            aria-invalid={!!errors.company}
            aria-describedby={errors.company ? "company-error" : undefined}
            className={`w-full px-4 py-3 bg-secondary border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors ${
              errors.company ? "border-red-500" : "border-card-border"
            }`}
          />
          {errors.company && (
            <p id="company-error" className="mt-1 text-sm text-red-500" role="alert">{errors.company}</p>
          )}
        </div>

        {/* Position */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            직책/직급 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="position"
            value={stepOne.position}
            onChange={handleStepOneChange}
            placeholder="예: 시니어 클라이언트 프로그래머"
            aria-required="true"
            aria-invalid={!!errors.position}
            aria-describedby={errors.position ? "position-error" : undefined}
            className={`w-full px-4 py-3 bg-secondary border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors ${
              errors.position ? "border-red-500" : "border-card-border"
            }`}
          />
          {errors.position && (
            <p id="position-error" className="mt-1 text-sm text-red-500" role="alert">{errors.position}</p>
          )}
        </div>

        {/* Years of experience */}
        <div>
          <label htmlFor="mentor-years" className="block text-sm font-medium mb-1.5">
            경력 (년) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="mentor-years"
            name="years"
            value={stepOne.years}
            onChange={handleStepOneChange}
            placeholder="최소 3년 이상"
            min={3}
            max={40}
            aria-required="true"
            aria-invalid={!!errors.years}
            aria-describedby={errors.years ? "years-error" : undefined}
            className={`w-full px-4 py-3 bg-secondary border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors ${
              errors.years ? "border-red-500" : "border-card-border"
            }`}
          />
          {errors.years && (
            <p id="years-error" className="mt-1 text-sm text-red-500" role="alert">{errors.years}</p>
          )}
        </div>

        {/* Job type */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            직군 <span className="text-red-500">*</span>
          </label>
          <select
            name="jobType"
            value={stepOne.jobType}
            onChange={handleStepOneChange}
            className={`w-full px-4 py-3 bg-secondary border rounded-xl text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer ${
              errors.jobType ? "border-red-500" : "border-card-border"
            }`}
          >
            <option value="">선택해주세요</option>
            {JOB_TYPES.map((jt) => (
              <option key={jt.value} value={jt.value}>
                {jt.label}
              </option>
            ))}
          </select>
          {errors.jobType && (
            <p className="mt-1 text-sm text-red-500">{errors.jobType}</p>
          )}
        </div>

        {/* Engine */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            주력 엔진 <span className="text-red-500">*</span>
          </label>
          <select
            name="engine"
            value={stepOne.engine}
            onChange={handleStepOneChange}
            className={`w-full px-4 py-3 bg-secondary border rounded-xl text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer ${
              errors.engine ? "border-red-500" : "border-card-border"
            }`}
          >
            <option value="">선택해주세요</option>
            {ENGINE_TYPES.map((et) => (
              <option key={et.value} value={et.value}>
                {et.label}
              </option>
            ))}
          </select>
          {errors.engine && (
            <p className="mt-1 text-sm text-red-500">{errors.engine}</p>
          )}
        </div>
      </div>

      {/* 이메일 인증 섹션 */}
      <div className="bg-card-bg border border-card-border border-l-4 border-l-emerald-500 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold">회사 이메일 인증</h3>
            <p className="text-sm text-muted">
              현재 재직 중인 회사의 이메일로 인증해주세요. 인증된 멘토에게는 인증 뱃지가 부여됩니다.
            </p>
          </div>
        </div>

        {stepOne.isVerified ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-green-800">인증 완료</p>
                <p className="text-sm text-green-700">{stepOne.verifiedEmail}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Email input + send button */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                회사 이메일 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={stepOne.companyEmail}
                  onChange={(e) => {
                    setStepOne((prev) => ({ ...prev, companyEmail: e.target.value }));
                    clearError("companyEmail");
                  }}
                  placeholder="name@company.com"
                  disabled={codeSent}
                  className={`flex-1 px-4 py-3 bg-secondary border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors disabled:opacity-60 ${
                    errors.companyEmail ? "border-red-500" : "border-card-border"
                  }`}
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isSendingCode || codeSent}
                  className="px-4 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  {isSendingCode ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      발송 중
                    </span>
                  ) : codeSent ? (
                    "발송 완료"
                  ) : (
                    "인증 코드 발송"
                  )}
                </button>
              </div>
              {errors.companyEmail && (
                <p className="mt-1 text-sm text-red-500">{errors.companyEmail}</p>
              )}
              {codeSent && !errors.companyEmail && (
                <p className="mt-1 text-sm text-green-600">
                  인증 코드가 발송되었습니다. 이메일을 확인해주세요.
                </p>
              )}
            </div>

            {/* Verification code input */}
            {codeSent && (
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  인증 코드 (6자리)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={stepOne.verificationCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                      setStepOne((prev) => ({ ...prev, verificationCode: val }));
                      clearError("verificationCode");
                    }}
                    placeholder="000000"
                    maxLength={6}
                    className={`flex-1 px-4 py-3 bg-secondary border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors text-center text-lg tracking-widest font-mono ${
                      errors.verificationCode
                        ? "border-red-500"
                        : "border-card-border"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={
                      isVerifying || stepOne.verificationCode.length !== 6
                    }
                    className="px-5 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    {isVerifying ? (
                      <span className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        확인 중
                      </span>
                    ) : (
                      "인증하기"
                    )}
                  </button>
                </div>
                {errors.verificationCode && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.verificationCode}
                  </p>
                )}

                {/* Resend link */}
                <button
                  type="button"
                  onClick={() => {
                    setCodeSent(false);
                    setStepOne((prev) => ({
                      ...prev,
                      verificationCode: "",
                    }));
                  }}
                  className="mt-2 text-sm text-primary hover:underline cursor-pointer"
                >
                  인증 코드 재발송
                </button>
              </div>
            )}

            {errors.verification && (
              <p className="text-sm text-red-500">{errors.verification}</p>
            )}

            {/* No company email note */}
            <div className="pt-2 border-t border-card-border">
              <button
                type="button"
                onClick={() =>
                  showToast(
                    `회사 이메일이 없는 경우 ${SITE_CONFIG.contactEmail.support} 로 문의해주세요. 재직증명서 등 대체 인증 방법을 안내드립니다.`,
                    "info"
                  )
                }
                className="text-sm text-primary hover:underline cursor-pointer"
              >
                회사 이메일이 없는 경우?
              </button>
            </div>
          </>
        )}
      </div>

      {/* 경력 인증 서류 업로드 섹션 */}
      <div className="bg-card-bg border border-card-border border-l-4 border-l-amber-500 rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold">이전 경력 인증 <span className="text-sm font-normal text-muted">(선택)</span></h3>
            <p className="text-sm text-muted">
              건강보험자격득실확인서를 업로드하면 이전 경력을 인증할 수 있습니다.
              관리자 검토 후 경력 인증 뱃지가 부여됩니다.
            </p>
          </div>
        </div>

        {stepOne.documentUrl ? (
          /* 업로드 완료 상태 */
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-green-800">서류 업로드 완료</p>
                  <p className="text-sm text-green-700 break-all">
                    {documentFileName || "업로드된 파일"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveDocument}
                className="text-sm text-red-500 hover:text-red-700 hover:underline cursor-pointer shrink-0 ml-3"
              >
                삭제
              </button>
            </div>
          </div>
        ) : (
          /* 업로드 UI */
          <>
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleDocumentUpload}
                disabled={isUploadingDocument}
                className="hidden"
                id="career-document"
              />
              <label
                htmlFor="career-document"
                className={`flex flex-col items-center justify-center gap-3 w-full px-4 py-8 border-2 border-dashed rounded-xl transition-colors ${
                  isUploadingDocument
                    ? "border-primary/50 bg-primary/5 cursor-wait"
                    : "border-card-border text-muted hover:border-primary hover:text-primary cursor-pointer"
                }`}
              >
                {isUploadingDocument ? (
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-8 h-8 animate-spin text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span className="text-sm text-primary font-medium">
                      업로드 중...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        건강보험자격득실확인서 업로드
                      </p>
                      <p className="text-xs text-muted mt-1">
                        PDF, JPG, PNG (최대 10MB)
                      </p>
                    </div>
                  </>
                )}
              </label>
            </div>

            {errors.document && (
              <p className="text-sm text-red-500">{errors.document}</p>
            )}

            <div className="bg-secondary/50 rounded-xl p-4">
              <p className="text-xs text-muted leading-relaxed">
                <span className="font-semibold text-foreground">
                  건강보험자격득실확인서란?
                </span>
                <br />
                국민건강보험공단에서 발급하는 서류로, 이전 직장의 근무 기간과 회사명이 기재되어 있어 경력을 증명할 수 있습니다.
                <br />
                <a
                  href="https://www.nhis.or.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline mt-1 inline-block"
                >
                  국민건강보험공단 바로가기
                </a>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Step 2: 프로필 + 상품
  // ---------------------------------------------------------------------------

  const renderStepTwo = () => {
    const productTypes: MentorProductType[] = [
      "coffee_chat",
      "mock_interview",
    ];

    return (
      <div className="space-y-6">
        {/* Step 2 Tip Callout */}
        <div className="flex gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-amber-700 text-sm">프로필 작성 팁</p>
            <p className="text-sm text-foreground/80">구체적인 경력과 전문 분야를 작성하면 멘티 매칭률이 <span className="font-semibold text-amber-700">2배 이상</span> 높아집니다.</p>
          </div>
        </div>

        {/* 이전 경력 (선택) */}
        <div className="bg-card-bg border border-card-border border-l-4 border-l-blue-500 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">이전 경력 <span className="text-sm font-normal text-muted">(선택)</span></h3>
              <p className="text-sm text-muted">
                이전 회사 경력을 추가하면 멘티에게 더 풍부한 프로필을 보여줄 수 있어요.
              </p>
            </div>
          </div>

          {/* Yes/No selection */}
          {stepTwo.wantsPreviousCareer === null && (
            <div>
              <p className="text-sm font-medium mb-3">
                이전 회사 경력을 추가하시겠어요?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setStepTwo((prev) => ({ ...prev, wantsPreviousCareer: true }))
                  }
                  className="flex-1 px-4 py-3 bg-primary/10 border border-primary/30 text-primary rounded-xl font-medium hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  네, 추가할게요
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setStepTwo((prev) => ({
                      ...prev,
                      wantsPreviousCareer: false,
                    }))
                  }
                  className="flex-1 px-4 py-3 bg-secondary border border-card-border text-muted rounded-xl font-medium hover:bg-secondary/80 transition-colors cursor-pointer"
                >
                  아니요, 건너뛸게요
                </button>
              </div>
            </div>
          )}

          {/* Previous career form */}
          {stepTwo.wantsPreviousCareer === true && (
            <>
              {/* Insurance file upload */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  건강보험 자격득실확인서{" "}
                  <span className="text-muted">(선택)</span>
                </label>
                <p className="text-xs text-muted mb-2">
                  경력 인증을 위해 건강보험 자격득실확인서를 업로드할 수 있습니다. (추후 관리자 검토)
                </p>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleInsuranceFileChange}
                    className="hidden"
                    id="insurance-file"
                  />
                  <label
                    htmlFor="insurance-file"
                    className="flex items-center justify-center gap-2 w-full px-4 py-8 border-2 border-dashed border-card-border rounded-xl text-muted hover:border-primary hover:text-primary transition-colors cursor-pointer"
                  >
                    {stepTwo.insuranceFile ? (
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-foreground text-sm">
                          {stepTwo.insuranceFile.name}
                        </span>
                      </div>
                    ) : (
                      <>
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <span className="text-sm">
                          PDF, JPG, PNG 파일을 선택하세요
                        </span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Previous companies text input */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  이전 회사명 <span className="text-muted">(선택)</span>
                </label>
                <input
                  type="text"
                  value={stepTwo.previousCompanies}
                  onChange={(e) =>
                    setStepTwo((prev) => ({
                      ...prev,
                      previousCompanies: e.target.value,
                    }))
                  }
                  placeholder="쉼표로 구분 (예: 스마일게이트, 펄어비스)"
                  className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                />
                <p className="mt-1 text-xs text-muted">
                  쉼표(,)로 구분하여 여러 회사를 입력할 수 있습니다.
                </p>
              </div>

              {/* Reset button */}
              <button
                type="button"
                onClick={() =>
                  setStepTwo((prev) => ({
                    ...prev,
                    wantsPreviousCareer: null,
                    previousCompanies: "",
                    insuranceFile: null,
                  }))
                }
                className="text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                다시 선택하기
              </button>
            </>
          )}

          {/* Skipped state */}
          {stepTwo.wantsPreviousCareer === false && (
            <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between">
              <p className="text-sm text-muted">이전 경력을 건너뛰었습니다.</p>
              <button
                type="button"
                onClick={() =>
                  setStepTwo((prev) => ({ ...prev, wantsPreviousCareer: null }))
                }
                className="text-sm text-primary hover:underline cursor-pointer"
              >
                다시 선택
              </button>
            </div>
          )}
        </div>

        {/* 프로필 작성 */}
        <div className="bg-card-bg border border-card-border border-l-4 border-l-violet-500 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">프로필 작성</h3>
              <p className="text-sm text-muted">
                멘티들에게 보여질 프로필을 작성해주세요.
              </p>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              자기소개 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={stepTwo.bio}
              onChange={(e) => {
                setStepTwo((prev) => ({ ...prev, bio: e.target.value }));
                clearError("bio");
              }}
              placeholder="멘티들에게 어떤 도움을 줄 수 있는지 소개해주세요. 경력, 전문 분야, 멘토링 스타일 등을 자유롭게 작성해주세요."
              rows={6}
              maxLength={VALIDATION.MAX_BIO_LENGTH}
              className={`w-full px-4 py-3 bg-secondary border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors resize-none ${
                errors.bio ? "border-red-500" : "border-card-border"
              }`}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.bio ? (
                <p className="text-sm text-red-500">{errors.bio}</p>
              ) : (
                <span />
              )}
              <span
                className={`text-xs ${
                  stepTwo.bio.length > VALIDATION.MAX_BIO_LENGTH
                    ? "text-red-500"
                    : "text-muted"
                }`}
              >
                {stepTwo.bio.length}/{VALIDATION.MAX_BIO_LENGTH}
              </span>
            </div>
          </div>

          {/* Profile photo */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              프로필 사진 <span className="text-muted">(선택)</span>
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleProfilePhotoChange}
                className="hidden"
                id="profile-photo"
              />
              <label
                htmlFor="profile-photo"
                className="flex flex-col items-center justify-center gap-3 w-full px-4 py-8 border-2 border-dashed border-card-border rounded-xl text-muted hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                {stepTwo.profilePhoto ? (
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-foreground text-sm">
                      {stepTwo.profilePhoto.name}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <span className="text-sm">
                      JPG, PNG, WebP (추후 업로드 기능 제공 예정)
                    </span>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* 상품 등록 */}
        <div className="bg-card-bg border border-card-border border-l-4 border-l-accent rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">상품 등록</h3>
              <p className="text-sm text-muted">
                제공하고 싶은 멘토링 서비스와 가격을 설정해주세요. 최소 1개 이상 등록해야 합니다.
              </p>
            </div>
          </div>

          {/* Revenue Info Callout */}
          <div className="flex gap-3 p-3 bg-accent/5 border border-accent/20 rounded-xl">
            <svg className="w-4 h-4 text-accent shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-xs text-foreground/70">멘토는 설정 가격의 <span className="font-bold text-accent">85%</span>를 수령합니다. 상담 건수가 늘수록 수수료가 낮아져요.</p>
          </div>

          {errors.products && (
            <p className="text-sm text-red-500">{errors.products}</p>
          )}

          <div className="space-y-4">
            {productTypes.map((type) => {
              const info = PRODUCT_INFO[type];
              const limits = PRICE_LIMITS[type];
              const recommended = RECOMMENDED_PRICES[type];
              const setting = stepTwo.products[type];

              return (
                <div
                  key={type}
                  className={`border rounded-xl p-5 transition-all duration-300 ${
                    setting.enabled
                      ? "border-primary bg-primary/5"
                      : "border-card-border bg-secondary/30"
                  }`}
                >
                  {/* Header with toggle */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <ProductIcon name={info.icon} className="w-6 h-6 text-primary" />
                      <div>
                        <p className="font-semibold">{info.name}</p>
                        <p className="text-xs text-muted">
                          {info.description} ({info.duration}분)
                        </p>
                      </div>
                    </div>

                    {/* Toggle switch */}
                    <button
                      type="button"
                      onClick={() => toggleProduct(type)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-300 cursor-pointer ${
                        setting.enabled ? "bg-primary" : "bg-secondary"
                      }`}
                      role="switch"
                      aria-checked={setting.enabled}
                      aria-label={`${info.name} 활성화`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                          setting.enabled ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Price input (shown when enabled) */}
                  {setting.enabled && (
                    <div className="mt-4 space-y-2">
                      <label className="block text-sm font-medium">
                        가격 (원)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={
                            setting.price === ""
                              ? ""
                              : formatPrice(setting.price as number)
                          }
                          onChange={(e) => handlePriceChange(type, e.target.value)}
                          placeholder={`${formatPrice(limits.min)} ~ ${formatPrice(limits.max)}`}
                          className={`w-full px-4 py-3 pr-10 bg-secondary border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors ${
                            errors[`price_${type}`]
                              ? "border-red-500"
                              : "border-card-border"
                          }`}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted text-sm">
                          원
                        </span>
                      </div>

                      {errors[`price_${type}`] && (
                        <p className="text-sm text-red-500">
                          {errors[`price_${type}`]}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted">
                        <span>
                          설정 범위: {formatPrice(limits.min)}원 ~{" "}
                          {formatPrice(limits.max)}원
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setStepTwo((prev) => ({
                              ...prev,
                              products: {
                                ...prev.products,
                                [type]: { ...prev.products[type], price: recommended },
                              },
                            }));
                            clearError(`price_${type}`);
                          }}
                          className="text-primary hover:underline cursor-pointer"
                        >
                          권장가 {formatPrice(recommended)}원 적용
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Step 3: 시간 설정
  // ---------------------------------------------------------------------------

  const renderStepThree = () => (
    <div className="space-y-6">
      {/* Step 3 Tip Callout */}
      <div className="flex gap-3 p-4 bg-accent/10 border border-accent/20 rounded-xl">
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-accent text-sm">시간 설정 팁</p>
          <p className="text-sm text-foreground/80"><span className="font-semibold text-accent">평일 저녁(19~22시)</span>과 <span className="font-semibold text-accent">주말 오전</span>이 멘티 수요가 가장 많습니다. 최소 주 3슬롯 이상 등록을 권장합니다.</p>
        </div>
      </div>

    <div className="bg-card-bg border border-card-border border-l-4 border-l-primary rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold">가능 시간 설정</h3>
          <p className="text-sm text-muted">
            멘토링이 가능한 요일과 시간대를 선택해주세요. 최소 1개 이상의 시간대를 선택해야 합니다.
          </p>
        </div>
      </div>

      {errors.availableTimes && (
        <p className="text-sm text-red-500">{errors.availableTimes}</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-sm font-medium text-muted w-20">시간</th>
              {DAYS.map((day) => (
                <th key={day.key} className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => toggleAllDay(day.key)}
                    className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer"
                    title={`${day.label}요일 전체 선택/해제`}
                  >
                    {day.label}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((time) => (
              <tr key={time} className="border-t border-card-border/50">
                <td className="p-2 text-sm text-muted whitespace-nowrap">{time}</td>
                {DAYS.map((day) => {
                  const isSelected = stepThree.availableTimes[day.key].includes(time);
                  return (
                    <td key={day.key} className="p-1 text-center">
                      <button
                        type="button"
                        onClick={() => toggleTimeSlot(day.key, time)}
                        className={`w-8 h-8 rounded-lg transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-primary text-white shadow-sm"
                            : "bg-secondary hover:bg-secondary/80 text-transparent"
                        }`}
                        aria-label={`${day.label}요일 ${time}`}
                        aria-pressed={isSelected}
                      >
                        {isSelected && (
                          <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {Object.values(stepThree.availableTimes).some((s) => s.length > 0) && (
        <div className="bg-secondary/50 rounded-xl p-4">
          <p className="text-sm font-medium mb-2">선택된 시간대</p>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const slots = stepThree.availableTimes[day.key];
              if (slots.length === 0) return null;
              return (
                <span
                  key={day.key}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-xs rounded-full"
                >
                  {day.label} ({slots.length}개)
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render current step
  // ---------------------------------------------------------------------------

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStepOne();
      case 2:
        return renderStepTwo();
      case 3:
        return renderStepThree();
      default:
        return null;
    }
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => {
              if (currentStep === 1) {
                router.push("/");
              } else {
                handleBack();
              }
            }}
            className="flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-4 cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {currentStep === 1 ? "홈으로" : "이전 단계"}
          </button>
          {/* Gradient Hero Banner */}
          <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border border-primary/20 p-6 sm:p-8 overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs text-primary font-medium mb-3">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                {TOTAL_STEPS}단계 신청 프로세스
              </div>
              <h1 className="text-3xl font-bold mb-2">멘토 지원</h1>
              <p className="text-muted">
                커피챗 멘토가 되어 게임 업계 주니어들의 성장을 도와주세요
              </p>

              {/* Benefit Pills */}
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  수익 85% 수령
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent text-xs rounded-full font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  자유로운 일정
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-600 text-xs rounded-full font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  인증 뱃지
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {renderProgressBar()}

        {/* Step content */}
        <div className="space-y-6">
          {renderCurrentStep()}

          {/* Navigation buttons */}
          <div className="flex gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-4 border border-card-border text-foreground rounded-xl font-semibold hover:bg-secondary transition-colors cursor-pointer"
              >
                이전
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className={`${
                currentStep > 1 ? "flex-1" : "w-full"
              } py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  등록 중...
                </span>
              ) : currentStep === TOTAL_STEPS ? (
                "멘토 지원 완료"
              ) : (
                "다음"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
