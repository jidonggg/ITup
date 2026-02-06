"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Booking, Mentor, Product, Profile, MentorFeedback } from "@/lib/supabase/types";
import { PRODUCT_INFO, VALIDATION } from "@/lib/constants";

export default function MentorFeedbackPage({
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
  const [existingFeedback, setExistingFeedback] = useState<MentorFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [content, setContent] = useState("");

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

      // 예약 상태 검증: completed 상태에서만 피드백 작성 가능
      if (bookingData.status !== "completed") {
        setError("완료된 세션에 대해서만 피드백을 작성할 수 있어요.");
        setIsLoading(false);
        return;
      }

      setBooking(bookingData);

      // 2. Fetch mentor and verify ownership
      const { data: mentorData, error: mentorError } = await supabase
        .from("mentors")
        .select("*")
        .eq("id", bookingData.mentor_id)
        .single();

      if (mentorError || !mentorData) {
        setError("멘토 정보를 찾을 수 없어요.");
        setIsLoading(false);
        return;
      }

      if (mentorData.user_id !== user.id) {
        setError("이 예약에 대한 피드백 작성 권한이 없어요.");
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

      // 5. Check for existing feedback
      const { data: feedbackData } = await supabase
        .from("mentor_feedbacks")
        .select("*")
        .eq("booking_id", bookingId)
        .single();

      if (feedbackData) {
        setExistingFeedback(feedbackData);
        setContent(feedbackData.content);
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

    if (content.trim().length < VALIDATION.MIN_FEEDBACK_LENGTH) {
      showToast(`피드백은 최소 ${VALIDATION.MIN_FEEDBACK_LENGTH}자 이상 작성해주세요.`, "error");
      return;
    }

    if (content.trim().length > VALIDATION.MAX_FEEDBACK_LENGTH) {
      showToast(`피드백은 ${VALIDATION.MAX_FEEDBACK_LENGTH}자 이내로 작성해주세요.`, "error");
      return;
    }

    if (!isSupabaseConfigured()) {
      showToast("데이터베이스 연결이 필요해요.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      if (existingFeedback) {
        // Update existing feedback
        const { error: updateError } = await supabase
          .from("mentor_feedbacks")
          .update({
            content: content.trim(),
          })
          .eq("id", existingFeedback.id);

        if (updateError) {
          showToast("피드백 수정에 실패했어요.", "error");
          setIsSubmitting(false);
          return;
        }

        showToast("피드백이 수정되었어요!", "success");
      } else {
        // Create new feedback
        const { error: insertError } = await supabase.from("mentor_feedbacks").insert({
          booking_id: bookingId,
          mentor_id: mentor.id,
          mentee_id: booking.mentee_id,
          content: content.trim(),
        });

        if (insertError) {
          showToast("피드백 작성에 실패했어요.", "error");
          setIsSubmitting(false);
          return;
        }

        // 멘티에게 피드백 도착 이메일 알림 발송 (비동기, 에러 무시)
        fetch("/api/email/booking-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "feedback_received",
            bookingId,
          }),
        }).catch(() => {});

        showToast("피드백이 작성되었어요!", "success");
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
          <p className="text-muted mb-6">피드백 작성을 위해 로그인해주세요.</p>
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
                <span className="text-white text-sm">☕</span>
              </div>
              <span className="font-bold">커피챗</span>
            </Link>
            <span className="text-muted">/</span>
            <span className="font-medium text-sm sm:text-base">피드백 작성</span>
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
            {existingFeedback ? "피드백 수정" : "멘티 피드백 작성"}
          </h1>
          <p className="text-sm text-muted">
            멘티에게 세션에 대한 피드백을 남겨주세요.
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
                  {productInfo.icon} {product.title}
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

        {/* Feedback Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-card-bg border border-card-border rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">피드백 내용</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  피드백 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="멘티에게 전달할 피드백을 작성해주세요. 세션에서 다룬 내용, 조언, 추천 자료 등을 포함할 수 있어요."
                  rows={8}
                  className="w-full p-4 bg-background border border-card-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <div className="flex justify-between mt-2 text-xs text-muted">
                  <span>최소 {VALIDATION.MIN_FEEDBACK_LENGTH}자 이상</span>
                  <span className={content.length > VALIDATION.MAX_FEEDBACK_LENGTH ? "text-red-500" : ""}>
                    {content.length}/{VALIDATION.MAX_FEEDBACK_LENGTH}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || content.trim().length < VALIDATION.MIN_FEEDBACK_LENGTH}
            className="w-full py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold text-lg cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                제출 중...
              </>
            ) : existingFeedback ? (
              "피드백 수정"
            ) : (
              "피드백 제출"
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
