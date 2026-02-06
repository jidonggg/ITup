"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { JOB_TYPES, ENGINE_TYPES, PRODUCT_INFO } from "@/lib/constants";
import type { JobType, EngineType, ProductType } from "@/lib/supabase/types";

type Step = 1 | 2 | 3;

const productTypes: { value: ProductType; label: string; icon: string; description: string }[] = [
  { value: "coffee_chat", label: PRODUCT_INFO.coffee_chat.name, icon: PRODUCT_INFO.coffee_chat.icon, description: PRODUCT_INFO.coffee_chat.description },
  { value: "document_review", label: PRODUCT_INFO.document_review.name, icon: PRODUCT_INFO.document_review.icon, description: PRODUCT_INFO.document_review.description },
  { value: "mock_interview", label: PRODUCT_INFO.mock_interview.name, icon: PRODUCT_INFO.mock_interview.icon, description: PRODUCT_INFO.mock_interview.description },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [selectedJobType, setSelectedJobType] = useState<JobType | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<EngineType | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const handleNext = () => {
    if (step < 3) setStep((step + 1) as Step);
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const handleComplete = async () => {
    setIsSaving(true);

    try {
      if (isSupabaseConfigured() && user) {
        const supabase = createClient();
        await supabase
          .from("profiles")
          .update({
            preferences: {
              job_type: selectedJobType,
              engine: selectedEngine,
              mentoring_type: selectedProduct,
            },
            onboarded_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      }

      // Build query params for mentor search
      const params = new URLSearchParams();
      if (selectedJobType) params.set("job_type", selectedJobType);
      if (selectedEngine) params.set("engine", selectedEngine);
      if (selectedProduct) params.set("product", selectedProduct);

      const queryString = params.toString();
      router.push(`/mentors${queryString ? `?${queryString}` : ""}`);
    } catch {
      // If save fails, still redirect
      router.push("/mentors");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    if (isSkipping) return;
    setIsSkipping(true);

    try {
      if (isSupabaseConfigured() && user) {
        const supabase = createClient();
        await supabase
          .from("profiles")
          .update({
            preferences: {},
            onboarded_at: new Date().toISOString(),
          })
          .eq("id", user.id);
      }
      router.push("/mentors");
    } catch {
      // 저장 실패해도 멘토 목록으로 이동
      router.push("/mentors");
    } finally {
      setIsSkipping(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return selectedJobType !== null;
    if (step === 2) return selectedEngine !== null;
    if (step === 3) return selectedProduct !== null;
    return false;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-card-border bg-card-bg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white text-sm">☕</span>
            </div>
            <span className="font-bold">커피챗</span>
          </Link>
          <button
            onClick={handleSkip}
            disabled={isSkipping || isSaving}
            className="text-sm text-muted hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSkipping ? "이동 중..." : "건너뛰기"}
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-2xl mx-auto w-full px-4 pt-8">
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                s <= step ? "bg-primary" : "bg-secondary"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted text-right">{step} / 3 단계</p>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          {/* Step 1: Job Type */}
          {step === 1 && (
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-3">어떤 직군에 관심이 있으세요?</h1>
              <p className="text-muted mb-10">
                관심 직군을 선택하면 맞춤 멘토를 추천해 드릴게요
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {JOB_TYPES.map((job) => (
                  <button
                    key={job.value}
                    onClick={() => setSelectedJobType(job.value as JobType)}
                    className={`p-6 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                      selectedJobType === job.value
                        ? "border-primary bg-primary/10"
                        : "border-card-border bg-card-bg hover:border-primary/50"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                      <span className="text-2xl">
                        {job.value === "client" ? "🖥️" :
                         job.value === "server" ? "🔧" :
                         job.value === "planner" ? "📋" :
                         job.value === "artist" ? "🎨" : "🔗"}
                      </span>
                    </div>
                    <p className="font-semibold text-lg">{job.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Engine */}
          {step === 2 && (
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-3">주로 사용하는 엔진은?</h1>
              <p className="text-muted mb-10">
                해당 엔진을 사용하는 멘토를 우선으로 추천해 드릴게요
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto">
                {ENGINE_TYPES.map((engine) => (
                  <button
                    key={engine.value}
                    onClick={() => setSelectedEngine(engine.value as EngineType)}
                    className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedEngine === engine.value
                        ? "border-primary bg-primary/10"
                        : "border-card-border bg-card-bg hover:border-primary/50"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-3 mx-auto">
                      <span className="text-2xl">
                        {engine.value === "unity" ? "🔷" :
                         engine.value === "unreal" ? "🔶" : "⚙️"}
                      </span>
                    </div>
                    <p className="font-semibold text-lg">{engine.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Mentoring Type */}
          {step === 3 && (
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-3">어떤 멘토링이 필요하세요?</h1>
              <p className="text-muted mb-10">
                원하는 멘토링 유형에 맞는 멘토를 찾아드릴게요
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {productTypes.map((product) => (
                  <button
                    key={product.value}
                    onClick={() => setSelectedProduct(product.value)}
                    className={`p-6 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                      selectedProduct === product.value
                        ? "border-primary bg-primary/10"
                        : "border-card-border bg-card-bg hover:border-primary/50"
                    }`}
                  >
                    <div className="text-3xl mb-3">{product.icon}</div>
                    <p className="font-semibold text-lg mb-1">{product.label}</p>
                    <p className="text-sm text-muted">{product.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-12">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="px-6 py-3 border border-card-border text-foreground rounded-xl font-medium hover:border-primary hover:text-primary transition-all cursor-pointer"
              >
                이전
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-8 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!canProceed() || isSaving}
                className="px-8 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "저장 중..." : "멘토 찾기"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
