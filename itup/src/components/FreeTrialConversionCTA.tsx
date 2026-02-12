"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  trackConversionCTAShown,
  trackConversionCTAClicked,
} from "@/lib/analytics/conversion";
import { FIRST_BOOKING_DISCOUNT } from "@/lib/constants";

interface FreeTrialConversionCTAProps {
  mentorId?: string;
  mentorName?: string;
  variant?: "full" | "compact" | "inline";
  onDismiss?: () => void;
}

// Discount code for first-time paid booking (from constants)
const FIRST_BOOKING_DISCOUNT_CODE = FIRST_BOOKING_DISCOUNT.CODE;
const DISCOUNT_PERCENTAGE = FIRST_BOOKING_DISCOUNT.PERCENTAGE;

// Limited time offer duration (in hours)
const OFFER_DURATION_HOURS = FIRST_BOOKING_DISCOUNT.OFFER_DURATION_HOURS;

export default function FreeTrialConversionCTA({
  mentorId,
  mentorName,
  variant = "full",
  onDismiss,
}: FreeTrialConversionCTAProps) {
  const { user } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isVisible, setIsVisible] = useState(true);
  const [topMentorId, setTopMentorId] = useState<string | null>(null);

  // Calculate time remaining for the offer
  useEffect(() => {
    const calculateTimeRemaining = () => {
      // Get or set the offer start time
      const storageKey = `conversion_offer_start_${user?.id || "guest"}`;
      let offerStart = localStorage.getItem(storageKey);

      if (!offerStart) {
        offerStart = new Date().toISOString();
        localStorage.setItem(storageKey, offerStart);
      }

      const startTime = new Date(offerStart).getTime();
      const endTime = startTime + OFFER_DURATION_HOURS * 60 * 60 * 1000;
      const now = Date.now();
      const remaining = endTime - now;

      if (remaining <= 0) {
        setTimeRemaining("만료됨");
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeRemaining(`${hours}시간 ${minutes}분`);
      } else {
        setTimeRemaining(`${minutes}분`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000);

    return () => clearInterval(interval);
  }, [user?.id]);

  // Fetch top mentor if no mentorId provided
  useEffect(() => {
    if (mentorId || !isSupabaseConfigured()) return;

    const fetchTopMentor = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("mentors")
          .select("id")
          .eq("is_approved", true)
          .eq("is_active", true)
          .order("rating", { ascending: false })
          .limit(1)
          .single();
        if (data) setTopMentorId(data.id);
      } catch {
        // Ignore
      }
    };

    fetchTopMentor();
  }, [mentorId]);

  // Track CTA shown
  useEffect(() => {
    if (isVisible) {
      trackConversionCTAShown(user?.id, mentorId || topMentorId || undefined);
    }
  }, [isVisible, user?.id, mentorId, topMentorId]);

  const handleCTAClick = () => {
    trackConversionCTAClicked(user?.id, mentorId || topMentorId || undefined, variant);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const targetMentorId = mentorId || topMentorId;

  if (!isVisible) return null;

  // Compact variant for inline usage
  if (variant === "compact") {
    return (
      <div className="bg-gradient-to-r from-accent/20 via-primary/10 to-accent/20 border border-accent/30 rounded-xl p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">
                첫 유료 멘토링 {DISCOUNT_PERCENTAGE}% 할인
              </p>
              <p className="text-xs text-muted">
                코드: <span className="font-mono font-bold text-primary">{FIRST_BOOKING_DISCOUNT_CODE}</span>
              </p>
            </div>
          </div>
          <Link
            href={targetMentorId ? `/mentors/${targetMentorId}` : "/mentors"}
            onClick={handleCTAClick}
            className="px-4 py-2 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all whitespace-nowrap"
          >
            예약하기
          </Link>
        </div>
      </div>
    );
  }

  // Inline variant for mypage
  if (variant === "inline") {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-accent/10 via-primary/5 to-accent/10 border border-accent/20 rounded-2xl p-6">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-primary/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">
                  무료 체험 어떠셨나요?
                </h3>
                <p className="text-sm text-muted">
                  지금 유료 멘토링을 시작하세요!
                </p>
              </div>
            </div>
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className="text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-accent">✓</span>
              <span>30~60분 심층 상담</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-accent">✓</span>
              <span>맞춤형 커리어 조언</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-accent">✓</span>
              <span>멘토 피드백 제공</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-accent">✓</span>
              <span>서류 리뷰 & 모의 면접</span>
            </div>
          </div>

          {/* Discount offer */}
          <div className="bg-card-bg border border-card-border rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-1">특별 할인 코드</p>
                <p className="font-mono text-xl font-bold text-primary">
                  {FIRST_BOOKING_DISCOUNT_CODE}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-accent">
                  {DISCOUNT_PERCENTAGE}% <span className="text-lg">OFF</span>
                </p>
                {timeRemaining && timeRemaining !== "만료됨" && (
                  <p className="text-xs text-muted flex items-center gap-1 justify-end">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {timeRemaining} 남음
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Link
            href={targetMentorId ? `/mentors/${targetMentorId}` : "/mentors"}
            onClick={handleCTAClick}
            className="block w-full py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white text-center font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all"
          >
            유료 멘토링 예약하기
          </Link>
        </div>
      </div>
    );
  }

  // Full variant (default) - for post-session completion
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-accent/15 via-primary/10 to-accent/15 border border-accent/30 rounded-2xl p-8">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-gradient" />

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative">
        {/* Close button */}
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="absolute top-0 right-0 text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-primary mb-4 animate-pulse-glow">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            무료 체험이 도움이 되셨나요?
          </h2>
          <p className="text-muted">
            {mentorName
              ? `${mentorName} 멘토와 더 깊은 대화를 나눠보세요!`
              : "지금 유료 멘토링으로 커리어 성장을 이어가세요!"}
          </p>
        </div>

        {/* Comparison: Free Trial vs Full Session */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Free Trial */}
          <div className="bg-card-bg/50 border border-card-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
              <h3 className="font-semibold text-muted">무료 체험</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex items-center gap-2">
                <span>•</span> 15분 간단 상담
              </li>
              <li className="flex items-center gap-2">
                <span>•</span> 기본 질의응답
              </li>
              <li className="flex items-center gap-2">
                <span>•</span> 멘토 분위기 확인
              </li>
            </ul>
          </div>

          {/* Full Session */}
          <div className="bg-gradient-to-br from-accent/20 to-primary/10 border-2 border-accent/40 rounded-xl p-5 relative">
            <div className="absolute -top-3 right-4">
              <span className="px-3 py-1 bg-accent text-white text-xs font-bold rounded-full">
                추천
              </span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              <h3 className="font-semibold text-foreground">유료 멘토링</h3>
            </div>
            <ul className="space-y-2 text-sm text-foreground">
              <li className="flex items-center gap-2">
                <span className="text-accent">✓</span> 30~60분 심층 상담
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent">✓</span> 맞춤형 커리어 조언
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent">✓</span> 서류 리뷰 & 모의 면접
              </li>
              <li className="flex items-center gap-2">
                <span className="text-accent">✓</span> 상세 피드백 리포트
              </li>
            </ul>
          </div>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-6 mb-6 text-sm">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-muted">평균 평점 <span className="text-foreground font-semibold">4.9점</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-muted">누적 상담 <span className="text-foreground font-semibold">500+건</span></span>
          </div>
        </div>

        {/* Discount offer box */}
        <div className="bg-card-bg border-2 border-dashed border-accent rounded-xl p-5 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-sm text-muted mb-1">첫 유료 예약 특별 할인</p>
              <div className="flex items-center gap-3">
                <p className="font-mono text-2xl font-bold text-primary">
                  {FIRST_BOOKING_DISCOUNT_CODE}
                </p>
                <span className="px-3 py-1 bg-accent text-white font-bold rounded-full text-lg">
                  {DISCOUNT_PERCENTAGE}% OFF
                </span>
              </div>
            </div>
            {timeRemaining && timeRemaining !== "만료됨" && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                <svg className="w-5 h-5 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                  <p className="text-red-600 font-medium">한정 시간 할인</p>
                  <p className="text-red-500 font-bold">{timeRemaining} 남음</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <Link
          href={targetMentorId ? `/mentors/${targetMentorId}` : "/mentors"}
          onClick={handleCTAClick}
          className="block w-full py-4 bg-gradient-to-r from-primary via-accent to-primary text-white text-center font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-accent/40 transition-all animate-gradient bg-[length:200%_200%]"
        >
          지금 유료 멘토링 예약하기
        </Link>

        {/* Secondary CTA */}
        <p className="text-center text-sm text-muted mt-4">
          <Link href="/mentors" className="text-primary hover:underline">
            다른 멘토 둘러보기
          </Link>
        </p>
      </div>
    </div>
  );
}
