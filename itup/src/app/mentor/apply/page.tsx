"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { ProductType, JobType, EngineType } from "@/lib/supabase/types";
import {
  PRICE_LIMITS,
  RECOMMENDED_PRICES,
  PRODUCT_INFO,
  JOB_TYPES,
  ENGINE_TYPES,
  VALIDATION,
} from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StepOneData {
  name: string;
  company: string;
  position: string;
  years: number | "";
  jobType: JobType | "";
  engine: EngineType | "";
}

interface StepTwoData {
  companyEmail: string;
  verificationCode: string;
  isVerified: boolean;
  verifiedEmail: string | null;
}

interface StepThreeData {
  wantsPreviousCareer: boolean | null;
  previousCompanies: string;
  insuranceFile: File | null;
}

interface StepFourData {
  bio: string;
  profilePhoto: File | null;
}

interface ProductSetting {
  enabled: boolean;
  price: number | "";
}

type StepFiveData = Record<ProductType, ProductSetting>;

const TOTAL_STEPS = 5;

const STEP_LABELS = [
  "기본 정보",
  "이메일 인증",
  "이전 경력",
  "프로필",
  "상품 등록",
];

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
};

const initialStepTwo: StepTwoData = {
  companyEmail: "",
  verificationCode: "",
  isVerified: false,
  verifiedEmail: null,
};

const initialStepThree: StepThreeData = {
  wantsPreviousCareer: null,
  previousCompanies: "",
  insuranceFile: null,
};

const initialStepFour: StepFourData = {
  bio: "",
  profilePhoto: null,
};

const initialStepFive: StepFiveData = {
  coffee_chat: { enabled: false, price: "" },
  document_review: { enabled: false, price: "" },
  mock_interview: { enabled: false, price: "" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MentorApplyPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Form data per step
  const [stepOne, setStepOne] = useState<StepOneData>(initialStepOne);
  const [stepTwo, setStepTwo] = useState<StepTwoData>(initialStepTwo);
  const [stepThree, setStepThree] = useState<StepThreeData>(initialStepThree);
  const [stepFour, setStepFour] = useState<StepFourData>(initialStepFour);
  const [stepFive, setStepFive] = useState<StepFiveData>(initialStepFive);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

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
  // Step 1 handlers
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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------------------------------------------------------------------
  // Step 2 handlers
  // ---------------------------------------------------------------------------

  const handleSendCode = async () => {
    if (!stepTwo.companyEmail.trim()) {
      setErrors({ companyEmail: "회사 이메일을 입력해주세요." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stepTwo.companyEmail)) {
      setErrors({ companyEmail: "올바른 이메일 형식을 입력해주세요." });
      return;
    }
    setIsSendingCode(true);
    clearError("companyEmail");
    clearError("verification");

    try {
      const res = await fetch("/api/verification/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: stepTwo.companyEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors({ companyEmail: data.error || "인증 코드 발송에 실패했습니다." });
        return;
      }

      setCodeSent(true);
      showToast("인증 코드가 발송되었습니다. 이메일을 확인해주세요.", "success");
    } catch {
      setErrors({ companyEmail: "인증 코드 발송 중 오류가 발생했습니다." });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!stepTwo.verificationCode.trim()) {
      setErrors({ verificationCode: "인증 코드를 입력해주세요." });
      return;
    }
    setIsVerifying(true);
    clearError("verificationCode");
    clearError("verification");

    try {
      const res = await fetch("/api/verification/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: stepTwo.companyEmail,
          code: stepTwo.verificationCode,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors({ verificationCode: data.error || "인증에 실패했습니다." });
        return;
      }

      setStepTwo((prev) => ({
        ...prev,
        isVerified: true,
        verifiedEmail: prev.companyEmail,
      }));
      showToast("이메일 인증이 완료되었습니다!", "success");
    } catch {
      setErrors({ verificationCode: "인증 처리 중 오류가 발생했습니다." });
    } finally {
      setIsVerifying(false);
    }
  };

  const validateStepTwo = (): boolean => {
    if (!stepTwo.isVerified) {
      setErrors({ verification: "회사 이메일 인증을 완료해주세요." });
      return false;
    }
    setErrors({});
    return true;
  };

  // ---------------------------------------------------------------------------
  // Step 3 handlers (optional – always valid)
  // ---------------------------------------------------------------------------

  const handleInsuranceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setStepThree((prev) => ({ ...prev, insuranceFile: file }));
  };

  // ---------------------------------------------------------------------------
  // Step 4 handlers
  // ---------------------------------------------------------------------------

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setStepFour((prev) => ({ ...prev, profilePhoto: file }));
  };

  const validateStepFour = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!stepFour.bio.trim()) {
      newErrors.bio = "자기소개를 입력해주세요.";
    } else if (stepFour.bio.length > VALIDATION.MAX_BIO_LENGTH) {
      newErrors.bio = `자기소개는 ${VALIDATION.MAX_BIO_LENGTH}자 이하여야 합니다.`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------------------------------------------------------------------
  // Step 5 handlers
  // ---------------------------------------------------------------------------

  const toggleProduct = (type: ProductType) => {
    setStepFive((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        enabled: !prev[type].enabled,
        price: !prev[type].enabled ? RECOMMENDED_PRICES[type] : "",
      },
    }));
    clearError(`price_${type}`);
  };

  const handlePriceChange = (type: ProductType, value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    const num = numericValue === "" ? "" : parseInt(numericValue, 10);
    setStepFive((prev) => ({
      ...prev,
      [type]: { ...prev[type], price: num },
    }));
    clearError(`price_${type}`);
  };

  const validateStepFive = (): boolean => {
    const newErrors: Record<string, string> = {};
    const enabledProducts = (Object.keys(stepFive) as ProductType[]).filter(
      (t) => stepFive[t].enabled
    );

    if (enabledProducts.length === 0) {
      newErrors.products = "최소 1개 이상의 상품을 등록해주세요.";
    }

    for (const type of enabledProducts) {
      const price = stepFive[type].price;
      const limits = PRICE_LIMITS[type];
      if (price === "" || price < limits.min || price > limits.max) {
        newErrors[`price_${type}`] = `가격은 ${formatPrice(limits.min)}원 ~ ${formatPrice(limits.max)}원 사이여야 합니다.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        // Step 3 is optional, always valid
        valid = true;
        break;
      case 4:
        valid = validateStepFour();
        break;
      case 5:
        valid = validateStepFive();
        if (valid) handleFinalSubmit();
        return;
    }

    if (valid) {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
      setErrors({});
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

    setIsSubmitting(true);

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
      const previousCompaniesArray = stepThree.previousCompanies
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      // Insert mentor
      const { data: mentorData, error: mentorError } = await supabase
        .from("mentors")
        .insert({
          user_id: user.id,
          name: stepOne.name.trim(),
          company: stepOne.company.trim(),
          position: stepOne.position.trim(),
          years: stepOne.years as number,
          job_type: stepOne.jobType as JobType,
          engine: stepOne.engine as EngineType,
          role: stepOne.position.trim(),
          experience: `${stepOne.years}년`,
          skills: [],
          bio: stepFour.bio.trim() || null,
          consult_types: [],
          verified_email: stepTwo.verifiedEmail,
          verified_company: stepTwo.verifiedEmail
            ? stepTwo.verifiedEmail.split("@")[1]
            : null,
          is_verified: stepTwo.isVerified,
          verification_method: stepTwo.isVerified ? "email" as const : null,
          verified_at: stepTwo.isVerified ? new Date().toISOString() : null,
          verification_status: stepTwo.isVerified ? "verified" as const : "pending" as const,
          previous_companies: previousCompaniesArray.length > 0 ? previousCompaniesArray : null,
          previous_companies_detail: [],
          profile_image_url: null,
          available_times: null,
          price: null,
          contact_method: null,
        })
        .select("id")
        .single();

      if (mentorError || !mentorData) {
        throw new Error(mentorError?.message || "멘토 등록에 실패했습니다.");
      }

      // Insert enabled products
      const enabledProducts = (Object.keys(stepFive) as ProductType[]).filter(
        (t) => stepFive[t].enabled
      );

      if (enabledProducts.length > 0) {
        const productInserts = enabledProducts.map((type) => ({
          mentor_id: mentorData.id,
          type,
          title: PRODUCT_INFO[type].name,
          description: PRODUCT_INFO[type].description,
          duration_minutes: PRODUCT_INFO[type].duration,
          price: stepFive[type].price as number,
          is_active: true,
        }));

        const { error: productError } = await supabase
          .from("products")
          .insert(productInserts);

        if (productError) {
          // Mentor was created successfully, but products failed — still show success
          // since products can be added later from the dashboard
          showToast("상품 등록 중 일부 오류가 있었습니다. 대시보드에서 다시 등록할 수 있습니다.", "warning");
        }
      }

      // Update user profile role to mentor
      await supabase
        .from("profiles")
        .update({ role: "mentor" })
        .eq("id", user.id);

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
  // Step 1: Basic Info
  // ---------------------------------------------------------------------------

  const renderStepOne = () => (
    <div className="bg-card-bg border border-card-border rounded-2xl p-6 space-y-5">
      <h3 className="text-lg font-semibold">기본 정보</h3>
      <p className="text-sm text-muted -mt-3">
        멘토로 활동하기 위한 기본 정보를 입력해주세요.
      </p>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          이름 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={stepOne.name}
          onChange={handleStepOneChange}
          placeholder="멘토로 표시될 이름"
          maxLength={VALIDATION.MAX_NAME_LENGTH}
          className={`w-full px-4 py-3 bg-secondary border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors ${
            errors.name ? "border-red-500" : "border-card-border"
          }`}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      {/* Company */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          현재 회사 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="company"
          value={stepOne.company}
          onChange={handleStepOneChange}
          placeholder="예: 넥슨, 넷마블, 크래프톤"
          className={`w-full px-4 py-3 bg-secondary border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors ${
            errors.company ? "border-red-500" : "border-card-border"
          }`}
        />
        {errors.company && (
          <p className="mt-1 text-sm text-red-500">{errors.company}</p>
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
          className={`w-full px-4 py-3 bg-secondary border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors ${
            errors.position ? "border-red-500" : "border-card-border"
          }`}
        />
        {errors.position && (
          <p className="mt-1 text-sm text-red-500">{errors.position}</p>
        )}
      </div>

      {/* Years of experience */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          경력 (년) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="years"
          value={stepOne.years}
          onChange={handleStepOneChange}
          placeholder="최소 3년 이상"
          min={3}
          max={40}
          className={`w-full px-4 py-3 bg-secondary border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors ${
            errors.years ? "border-red-500" : "border-card-border"
          }`}
        />
        {errors.years && (
          <p className="mt-1 text-sm text-red-500">{errors.years}</p>
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
  );

  // ---------------------------------------------------------------------------
  // Step 2: Company Email Verification
  // ---------------------------------------------------------------------------

  const renderStepTwo = () => (
    <div className="bg-card-bg border border-card-border rounded-2xl p-6 space-y-5">
      <h3 className="text-lg font-semibold">회사 이메일 인증</h3>
      <p className="text-sm text-muted -mt-3">
        현재 재직 중인 회사의 이메일로 인증해주세요. 인증된 멘토에게는 인증 뱃지가 부여됩니다.
      </p>

      {stepTwo.isVerified ? (
        /* Verified state */
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
              <p className="text-sm text-green-700">{stepTwo.verifiedEmail}</p>
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
                value={stepTwo.companyEmail}
                onChange={(e) => {
                  setStepTwo((prev) => ({ ...prev, companyEmail: e.target.value }));
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
                  value={stepTwo.verificationCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                    setStepTwo((prev) => ({ ...prev, verificationCode: val }));
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
                    isVerifying || stepTwo.verificationCode.length !== 6
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
                  setStepTwo((prev) => ({
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
                  "회사 이메일이 없는 경우 support@itup.kr 로 문의해주세요. 재직증명서 등 대체 인증 방법을 안내드립니다.",
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
  );

  // ---------------------------------------------------------------------------
  // Step 3: Previous Career (Optional)
  // ---------------------------------------------------------------------------

  const renderStepThree = () => (
    <div className="bg-card-bg border border-card-border rounded-2xl p-6 space-y-5">
      <h3 className="text-lg font-semibold">이전 경력</h3>
      <p className="text-sm text-muted -mt-3">
        이전 회사 경력을 추가하면 멘티에게 더 풍부한 프로필을 보여줄 수 있어요.
      </p>

      {/* Yes/No selection */}
      {stepThree.wantsPreviousCareer === null && (
        <div>
          <p className="text-sm font-medium mb-3">
            이전 회사 경력을 추가하시겠어요?
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() =>
                setStepThree((prev) => ({ ...prev, wantsPreviousCareer: true }))
              }
              className="flex-1 px-4 py-3 bg-primary/10 border border-primary/30 text-primary rounded-xl font-medium hover:bg-primary/20 transition-colors cursor-pointer"
            >
              네, 추가할게요
            </button>
            <button
              type="button"
              onClick={() =>
                setStepThree((prev) => ({
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
      {stepThree.wantsPreviousCareer === true && (
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
                {stepThree.insuranceFile ? (
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
                      {stepThree.insuranceFile.name}
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
              value={stepThree.previousCompanies}
              onChange={(e) =>
                setStepThree((prev) => ({
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
              setStepThree({
                wantsPreviousCareer: null,
                previousCompanies: "",
                insuranceFile: null,
              })
            }
            className="text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            다시 선택하기
          </button>
        </>
      )}

      {/* Skipped state */}
      {stepThree.wantsPreviousCareer === false && (
        <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-muted">이전 경력을 건너뛰었습니다.</p>
          <button
            type="button"
            onClick={() =>
              setStepThree((prev) => ({ ...prev, wantsPreviousCareer: null }))
            }
            className="text-sm text-primary hover:underline cursor-pointer"
          >
            다시 선택
          </button>
        </div>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // Step 4: Profile
  // ---------------------------------------------------------------------------

  const renderStepFour = () => (
    <div className="bg-card-bg border border-card-border rounded-2xl p-6 space-y-5">
      <h3 className="text-lg font-semibold">프로필 작성</h3>
      <p className="text-sm text-muted -mt-3">
        멘티들에게 보여질 프로필을 작성해주세요.
      </p>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          자기소개 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={stepFour.bio}
          onChange={(e) => {
            setStepFour((prev) => ({ ...prev, bio: e.target.value }));
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
              stepFour.bio.length > VALIDATION.MAX_BIO_LENGTH
                ? "text-red-500"
                : "text-muted"
            }`}
          >
            {stepFour.bio.length}/{VALIDATION.MAX_BIO_LENGTH}
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
            {stepFour.profilePhoto ? (
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
                  {stepFour.profilePhoto.name}
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
  );

  // ---------------------------------------------------------------------------
  // Step 5: Product Registration
  // ---------------------------------------------------------------------------

  const renderStepFive = () => {
    const productTypes: ProductType[] = [
      "coffee_chat",
      "document_review",
      "mock_interview",
    ];

    return (
      <div className="bg-card-bg border border-card-border rounded-2xl p-6 space-y-5">
        <h3 className="text-lg font-semibold">상품 등록</h3>
        <p className="text-sm text-muted -mt-3">
          제공하고 싶은 멘토링 서비스와 가격을 설정해주세요. 최소 1개 이상 등록해야 합니다.
        </p>

        {errors.products && (
          <p className="text-sm text-red-500">{errors.products}</p>
        )}

        <div className="space-y-4">
          {productTypes.map((type) => {
            const info = PRODUCT_INFO[type];
            const limits = PRICE_LIMITS[type];
            const recommended = RECOMMENDED_PRICES[type];
            const setting = stepFive[type];

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
                    <span className="text-2xl">{info.icon}</span>
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
                          setStepFive((prev) => ({
                            ...prev,
                            [type]: { ...prev[type], price: recommended },
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
    );
  };

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
      case 4:
        return renderStepFour();
      case 5:
        return renderStepFive();
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
          <h1 className="text-3xl font-bold mb-2">멘토 지원</h1>
          <p className="text-muted">
            커피챗 멘토가 되어 게임 업계 주니어들의 성장을 도와주세요
          </p>
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
              ) : currentStep === 3 ? (
                stepThree.wantsPreviousCareer === null
                  ? "다음 단계"
                  : "다음"
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
