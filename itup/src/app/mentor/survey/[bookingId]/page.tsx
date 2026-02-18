"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Booking, Mentor, Product, Profile } from "@/lib/supabase/types";
import { PRODUCT_INFO } from "@/lib/constants";
import { ProductIcon, LogoIcon } from "@/components/icons";

const RATING_LABELS = ["매우 부족", "부족", "보통", "좋음", "매우 좋음"];

const RATING_QUESTIONS = [
  {
    key: "mentee_preparedness",
    label: "멘티의 상담 준비도",
    description: "멘티가 상담 전 질문/자료를 충분히 준비했나요?",
  },
  {
    key: "goal_clarity",
    label: "상담 목표 명확성",
    description: "멘티의 상담 목표가 명확했나요?",
  },
  {
    key: "communication_attitude",
    label: "소통 태도",
    description: "멘티의 소통 태도가 적극적이었나요?",
  },
  {
    key: "overall_satisfaction",
    label: "전반적 만족도",
    description: "이번 상담에 대한 전반적 만족도는?",
  },
];

const SESSION_PROGRESS_OPTIONS = [
  { value: "on_schedule", label: "예정대로 진행됨" },
  { value: "slightly_over", label: "시간이 약간 초과됨" },
  { value: "time_short", label: "시간이 많이 부족했음" },
  { value: "mentee_late", label: "멘티가 늦게 참여함" },
];

const NEXT_STEP_OPTIONS = [
  { value: "additional_coffee_chat", label: "커피챗 추가 상담" },
  { value: "document_review", label: "서류 리뷰" },
  { value: "mock_interview", label: "모의 면접" },
  { value: "sufficient", label: "현재 상담으로 충분" },
  { value: "other", label: "기타" },
];

interface SurveyData {
  id?: string;
  booking_id: string;
  mentor_id: string;
  mentee_preparedness: number;
  goal_clarity: number;
  communication_attitude: number;
  overall_satisfaction: number;
  session_progress: string;
  recommended_next_step: string;
  admin_note: string;
}

export default function MentorSurveyPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading, isInitialized } = useAuth();
  const { showToast } = useToast();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [menteeProfile, setMenteeProfile] = useState<Profile | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [existingSurvey, setExistingSurvey] = useState<SurveyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Survey form state
  const [ratings, setRatings] = useState<Record<string, number>>({
    mentee_preparedness: 0,
    goal_clarity: 0,
    communication_attitude: 0,
    overall_satisfaction: 0,
  });
  const [sessionProgress, setSessionProgress] = useState("");
  const [recommendedNextStep, setRecommendedNextStep] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("데이터베이스 연결이 필요해요.");
      setIsLoading(false);
      return;
    }

    if (!user) return;

    const supabase = createClient();

    try {
      // 1. Fetch booking
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (bookingError || !bookingData) {
        setError("예약 정보를 찾을 수 없어요.");
        setIsLoading(false);
        return;
      }

      // 예약 상태 검증: completed 상태에서만 설문 작성 가능
      if (bookingData.status !== "completed") {
        setError("완료된 세션에 대해서만 설문을 작성할 수 있어요.");
        setIsLoading(false);
        return;
      }

      setBooking(bookingData);

      // 2. Fetch mentor and verify ownership
      const { data: mentorData, error: mentorError } = await supabase
        .from("mentors")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (mentorError || !mentorData) {
        setError("멘토 정보를 찾을 수 없어요.");
        setIsLoading(false);
        return;
      }

      if (bookingData.mentor_id !== mentorData.id) {
        setError("이 예약에 대한 설문 작성 권한이 없어요.");
        setIsLoading(false);
        return;
      }

      setMentor(mentorData);

      // 3. Fetch mentee profile
      if (bookingData.mentee_id) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", bookingData.mentee_id)
          .single();

        if (profileData) {
          setMenteeProfile(profileData);
        }
      }

      // 4. Fetch product
      if (bookingData.product_id) {
        const { data: productData } = await supabase
          .from("products")
          .select("*")
          .eq("id", bookingData.product_id)
          .single();

        if (productData) {
          setProduct(productData);
        }
      }

      // 5. Check for existing survey
      try {
        const { data: surveyData } = await supabase
          .from("mentor_session_surveys")
          .select("*")
          .eq("booking_id", bookingId)
          .eq("mentor_id", mentorData.id)
          .single();

        if (surveyData) {
          setExistingSurvey(surveyData);
          setRatings({
            mentee_preparedness: surveyData.mentee_preparedness || 0,
            goal_clarity: surveyData.goal_clarity || 0,
            communication_attitude: surveyData.communication_attitude || 0,
            overall_satisfaction: surveyData.overall_satisfaction || 0,
          });
          setSessionProgress(surveyData.session_progress || "");
          setRecommendedNextStep(surveyData.recommended_next_step || "");
          setAdminNote(surveyData.admin_note || "");
        }
      } catch {
        // mentor_session_surveys table may not exist yet
      }
    } catch {
      setError("데이터를 불러오는 중 오류가 발생했어요.");
    } finally {
      setIsLoading(false);
    }
  }, [user, bookingId]);

  useEffect(() => {
    if (!isInitialized || authLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }
    fetchData();
  }, [isInitialized, authLoading, user, fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !booking || !mentor) return;

    // Validate all ratings
    const allRated = RATING_QUESTIONS.every((q) => ratings[q.key] > 0);
    if (!allRated) {
      showToast("모든 평가 항목을 선택해주세요.", "error");
      return;
    }

    if (!sessionProgress) {
      showToast("상담 진행 상태를 선택해주세요.", "error");
      return;
    }

    if (!recommendedNextStep) {
      showToast("추천 다음 단계를 선택해주세요.", "error");
      return;
    }

    if (adminNote.length > 500) {
      showToast("추가 메모는 500자 이내로 작성해주세요.", "error");
      return;
    }

    if (!isSupabaseConfigured()) {
      showToast("데이터베이스 연결이 필요해요.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const surveyPayload = {
        booking_id: bookingId,
        mentor_id: mentor.id,
        mentee_preparedness: ratings.mentee_preparedness,
        goal_clarity: ratings.goal_clarity,
        communication_attitude: ratings.communication_attitude,
        overall_satisfaction: ratings.overall_satisfaction,
        session_progress: sessionProgress,
        recommended_next_step: recommendedNextStep,
        admin_note: adminNote.trim() || null,
      };

      if (existingSurvey?.id) {
        // Update existing survey
        const { error: updateError } = await supabase
          .from("mentor_session_surveys")
          .update(surveyPayload)
          .eq("id", existingSurvey.id)
          .eq("mentor_id", mentor.id);

        if (updateError) {
          showToast("설문 수정에 실패했어요.", "error");
          setIsSubmitting(false);
          return;
        }

        showToast("설문이 수정되었어요!", "success");
      } else {
        // Create new survey
        const { error: insertError } = await supabase
          .from("mentor_session_surveys")
          .insert(surveyPayload);

        if (insertError) {
          showToast("설문 작성에 실패했어요.", "error");
          setIsSubmitting(false);
          return;
        }

        showToast("설문이 제출되었어요!", "success");
      }

      router.push("/mentor/dashboard");
    } catch {
      showToast("오류가 발생했어요.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isInitialized || authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-muted">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card-bg border border-card-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">로그인이 필요해요</h2>
          <p className="text-muted mb-6">설문 작성을 위해 로그인해주세요.</p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card-bg border border-card-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">오류가 발생했어요</h2>
          <p className="text-muted mb-6">{error}</p>
          <Link
            href="/mentor/dashboard"
            className="inline-block px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium"
          >
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!booking || !mentor) return null;

  const productInfo = product ? PRODUCT_INFO[product.type] : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-card-border bg-card-bg">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <LogoIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">커피챗</span>
            </Link>
            <span className="text-muted">/</span>
            <span className="font-medium text-sm sm:text-base">품질 설문</span>
          </div>
          <Link
            href="/mentor/dashboard"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            대시보드로
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">
            {existingSurvey ? "품질 설문 수정" : "세션 품질 설문"}
          </h1>
          <p className="text-sm text-muted">
            세션에 대한 품질 설문을 작성해주세요.
          </p>
        </div>

        {/* Booking Info */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-6 mb-6">
          <h3 className="font-semibold text-lg mb-4">세션 정보</h3>

          <div className="space-y-3">
            {/* Mentee */}
            <div className="flex justify-between items-center">
              <span className="text-muted text-sm">멘티</span>
              <span className="font-medium">{menteeProfile?.name || "멘티"}</span>
            </div>

            {/* Product */}
            {product && productInfo && (
              <div className="flex justify-between items-center">
                <span className="text-muted text-sm">상품</span>
                <span className="font-medium">
                  <ProductIcon name={productInfo.icon} className="w-4 h-4 inline-block" /> {product.title}
                </span>
              </div>
            )}

            {/* Scheduled Time */}
            <div className="flex justify-between items-center">
              <span className="text-muted text-sm">일시</span>
              <span className="font-medium">
                {new Date(booking.scheduled_at).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "short",
                })}{" "}
                {new Date(booking.scheduled_at).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Survey Form */}
        <form onSubmit={handleSubmit}>
          {/* Rating Questions */}
          <div className="bg-card-bg border border-card-border rounded-2xl p-4 md:p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">평가 항목</h3>

            <div className="space-y-6">
              {RATING_QUESTIONS.map((question) => (
                <div key={question.key}>
                  <div className="mb-2">
                    <p className="font-medium text-sm">
                      {question.label} <span className="text-red-500">*</span>
                    </p>
                    <p className="text-xs text-muted">{question.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setRatings((prev) => ({ ...prev, [question.key]: value }))
                        }
                        className={`w-10 h-10 md:w-11 md:h-11 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                          ratings[question.key] === value
                            ? "bg-primary text-white"
                            : "bg-secondary text-foreground hover:bg-primary/10"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                    <span className="text-xs text-muted ml-2">
                      {ratings[question.key] > 0
                        ? RATING_LABELS[ratings[question.key] - 1]
                        : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Multiple Choice Questions */}
          <div className="bg-card-bg border border-card-border rounded-2xl p-4 md:p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">상담 진행 상태</h3>

            {/* Session Progress */}
            <div className="mb-6">
              <p className="font-medium text-sm mb-2">
                상담 진행 상태 <span className="text-red-500">*</span>
              </p>
              <div className="space-y-2">
                {SESSION_PROGRESS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSessionProgress(option.value)}
                    className={`w-full text-left p-3 rounded-xl text-sm transition-colors cursor-pointer ${
                      sessionProgress === option.value
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-secondary border border-transparent hover:bg-secondary/80"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recommended Next Step */}
            <div>
              <p className="font-medium text-sm mb-2">
                추천 다음 단계 <span className="text-red-500">*</span>
              </p>
              <div className="space-y-2">
                {NEXT_STEP_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRecommendedNextStep(option.value)}
                    className={`w-full text-left p-3 rounded-xl text-sm transition-colors cursor-pointer ${
                      recommendedNextStep === option.value
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-secondary border border-transparent hover:bg-secondary/80"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Free Text */}
          <div className="bg-card-bg border border-card-border rounded-2xl p-4 md:p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">추가 메모</h3>

            <div>
              <label className="block text-sm font-medium mb-2">
                추가 메모 <span className="text-xs text-muted font-normal">(선택사항)</span>
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="관리자 참고용 메모를 입력하세요"
                rows={4}
                maxLength={500}
                className="w-full p-4 bg-background border border-card-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              <div className="flex justify-end mt-2 text-xs text-muted">
                <span className={adminNote.length > 500 ? "text-red-500" : ""}>
                  {adminNote.length}/500
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              isSubmitting ||
              !RATING_QUESTIONS.every((q) => ratings[q.key] > 0) ||
              !sessionProgress ||
              !recommendedNextStep
            }
            className="w-full py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold text-lg cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                제출 중...
              </>
            ) : existingSurvey ? (
              "설문 수정"
            ) : (
              "설문 제출"
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            href="/mentor/dashboard"
            className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            대시보드로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
}
