"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Booking, Mentor } from "@/lib/supabase/types";
import { VALIDATION } from "@/lib/constants";

// =============================================
// Star Rating Component
// =============================================

function StarRating({
  rating,
  hoveredRating,
  onSelect,
  onHover,
  onLeave,
}: {
  rating: number;
  hoveredRating: number;
  onSelect: (star: number) => void;
  onHover: (star: number) => void;
  onLeave: () => void;
}) {
  const labels = ["", "별로예요", "그저 그래요", "보통이에요", "좋아요", "최고예요!"];

  return (
    <div>
      <label className="block text-sm font-medium mb-3">만족도</label>
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onSelect(star)}
            onMouseEnter={() => onHover(star)}
            onMouseLeave={onLeave}
            className="p-1 transition-transform hover:scale-110 cursor-pointer"
          >
            <svg
              className={`w-10 h-10 ${
                star <= (hoveredRating || rating)
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-600"
              }`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-muted mt-2">{labels[rating]}</p>
    </div>
  );
}

// =============================================
// Review Write Content (uses useSearchParams)
// =============================================

function ReviewWriteContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const mentorId = searchParams.get("mentorId");

  const { user, profile, isLoading: authLoading, isInitialized } = useAuth();
  const { showToast } = useToast();

  // Data states
  const [booking, setBooking] = useState<Booking | null>(null);
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  // Form states
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // =============================================
  // Validate params and fetch data
  // =============================================

  useEffect(() => {
    if (!isInitialized || authLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Validate query params
    if (!bookingId || !mentorId) {
      setError("잘못된 접근이에요. 예약 정보가 필요합니다.");
      setIsLoading(false);
      return;
    }

    if (!isSupabaseConfigured()) {
      setError("데이터베이스 연결이 필요해요.");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
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

        // 2. Verify the current user is the mentee
        if (bookingData.mentee_id !== user.id) {
          setError("이 예약에 대한 리뷰 작성 권한이 없어요.");
          setIsLoading(false);
          return;
        }

        // 3. Verify booking status is completed
        if (bookingData.status !== "completed") {
          setError("완료된 예약에만 리뷰를 작성할 수 있어요.");
          setIsLoading(false);
          return;
        }

        // 4. Verify mentor_id matches
        if (bookingData.mentor_id !== mentorId) {
          setError("잘못된 멘토 정보예요.");
          setIsLoading(false);
          return;
        }

        setBooking(bookingData);

        // 5. Fetch mentor info
        const { data: mentorData } = await supabase
          .from("mentors")
          .select("*")
          .eq("id", mentorId)
          .single();

        if (mentorData) {
          setMentor(mentorData);
        }

        // 6. Check if review already exists
        const { data: existingReview } = await supabase
          .from("reviews")
          .select("id")
          .eq("booking_id", bookingId)
          .maybeSingle();

        if (existingReview) {
          setAlreadyReviewed(true);
        }
      } catch {
        setError("데이터를 불러오는 중 오류가 발생했어요.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isInitialized, authLoading, user, bookingId, mentorId]);

  // =============================================
  // Handle submit
  // =============================================

  const handleSubmit = async () => {
    if (!user || !profile || !booking || !bookingId || !mentorId) return;

    if (content.length < VALIDATION.MIN_REVIEW_LENGTH) {
      showToast(`리뷰는 최소 ${VALIDATION.MIN_REVIEW_LENGTH}자 이상 작성해주세요.`, "error");
      return;
    }

    if (content.length > VALIDATION.MAX_REVIEW_LENGTH) {
      showToast(`리뷰는 최대 ${VALIDATION.MAX_REVIEW_LENGTH}자까지 작성할 수 있어요.`, "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // Insert review
      const { error: reviewError } = await supabase.from("reviews").insert({
        booking_id: bookingId,
        mentor_id: mentorId,
        user_id: user.id,
        user_name: profile.name || user.email || "익명",
        rating,
        content,
      });

      if (reviewError) {
        if (reviewError.code === "23505") {
          showToast("이미 이 예약에 대한 리뷰를 작성했어요.", "error");
          setAlreadyReviewed(true);
        } else {
          throw reviewError;
        }
        setIsSubmitting(false);
        return;
      }

      // Update mentor review count and rating
      if (mentor) {
        const newReviewCount = mentor.reviews + 1;
        const newRating =
          mentor.reviews > 0
            ? (mentor.rating * mentor.reviews + rating) / newReviewCount
            : rating;

        await supabase
          .from("mentors")
          .update({
            reviews: newReviewCount,
            rating: Math.round(newRating * 10) / 10,
          })
          .eq("id", mentorId);
      }

      showToast("리뷰가 등록되었어요!", "success");
      setIsSuccess(true);
    } catch {
      showToast("리뷰 등록 중 오류가 발생했어요. 다시 시도해주세요.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =============================================
  // Render: Loading
  // =============================================

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

  // =============================================
  // Render: Auth Required
  // =============================================

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
          <p className="text-muted mb-6">리뷰 작성을 위해 로그인해주세요.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium"
            >
              로그인하기
            </Link>
            <Link
              href="/"
              className="px-6 py-2.5 border border-card-border text-foreground rounded-full font-medium"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =============================================
  // Render: Error
  // =============================================

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
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/mypage"
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium"
            >
              마이페이지로
            </Link>
            <Link
              href="/"
              className="px-6 py-2.5 border border-card-border text-foreground rounded-full font-medium"
            >
              홈으로 이동
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =============================================
  // Render: Already Reviewed
  // =============================================

  if (alreadyReviewed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card-bg border border-card-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">이미 리뷰를 작성했어요</h2>
          <p className="text-muted mb-6">
            이 예약에 대한 리뷰가 이미 등록되어 있어요.
          </p>
          <Link
            href="/mypage"
            className="inline-block px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium"
          >
            마이페이지로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // =============================================
  // Render: Success
  // =============================================

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card-bg border border-card-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">리뷰가 등록되었어요!</h2>
          <p className="text-muted mb-2">
            {mentor?.name || "멘토"}님에 대한 소중한 리뷰 감사합니다.
          </p>
          <p className="text-muted text-sm mb-6">
            작성해주신 리뷰는 다른 멘티들에게 큰 도움이 돼요.
          </p>
          <Link
            href="/mypage"
            className="inline-block px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium"
          >
            마이페이지로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // =============================================
  // Render: Review Form
  // =============================================

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-card-border bg-card-bg">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white text-sm">&#9749;</span>
              </div>
              <span className="font-bold">커피챗</span>
            </Link>
            <span className="text-muted">/</span>
            <span className="font-medium text-sm sm:text-base">리뷰 작성</span>
          </div>
          <Link
            href="/mypage"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            돌아가기
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Page Title */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold mb-1">리뷰 작성</h1>
          <p className="text-sm text-muted">
            {mentor?.name || "멘토"}님과의 상담은 어떠셨나요?
          </p>
        </div>

        {/* Booking Info Card */}
        {booking && (
          <div className="bg-card-bg border border-card-border rounded-2xl p-6">
            <h3 className="font-semibold text-lg mb-4">예약 정보</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted text-sm">멘토</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{mentor?.name || "멘토"}</span>
                  {mentor?.is_verified && (
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
              {mentor?.company && (
                <div className="flex justify-between items-center">
                  <span className="text-muted text-sm">소속</span>
                  <span className="font-medium">{mentor.company}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted text-sm">상담 일시</span>
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
              <div className="flex justify-between items-center">
                <span className="text-muted text-sm">결제 금액</span>
                <span className="font-bold text-primary">
                  {booking.amount.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Review Form */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-6">
          <h3 className="font-semibold text-lg mb-6">리뷰 작성</h3>

          <div className="space-y-6">
            {/* Star Rating */}
            <StarRating
              rating={rating}
              hoveredRating={hoveredRating}
              onSelect={setRating}
              onHover={setHoveredRating}
              onLeave={() => setHoveredRating(0)}
            />

            {/* Review Content */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                리뷰 내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`멘토링 경험을 자세히 공유해주세요 (최소 ${VALIDATION.MIN_REVIEW_LENGTH}자)`}
                rows={5}
                maxLength={VALIDATION.MAX_REVIEW_LENGTH}
                className="w-full px-4 py-3 bg-background border border-card-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              />
              <div className="flex items-center justify-between mt-1.5">
                {content.length > 0 && content.length < VALIDATION.MIN_REVIEW_LENGTH && (
                  <p className="text-xs text-red-500">
                    최소 {VALIDATION.MIN_REVIEW_LENGTH}자 이상 작성해주세요.
                  </p>
                )}
                {content.length === 0 && <span />}
                {content.length >= VALIDATION.MIN_REVIEW_LENGTH && <span />}
                <p className="text-xs text-muted">
                  {content.length}/{VALIDATION.MAX_REVIEW_LENGTH}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || content.length < VALIDATION.MIN_REVIEW_LENGTH}
              className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold text-lg cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  등록 중...
                </>
              ) : (
                "리뷰 등록"
              )}
            </button>
          </div>
        </div>

        {/* Back Link */}
        <div className="pt-4">
          <Link
            href="/mypage"
            className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            마이페이지로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
}

// =============================================
// Main Page (Suspense boundary for useSearchParams)
// =============================================

export default function ReviewWritePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-10 h-10 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full" />
            <p className="text-muted">불러오는 중...</p>
          </div>
        </div>
      }
    >
      <ReviewWriteContent />
    </Suspense>
  );
}
