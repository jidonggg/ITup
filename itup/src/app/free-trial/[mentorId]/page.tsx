"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Mentor, MentorSchedule } from "@/lib/supabase/types";
import FreeTrialConversionCTA from "@/components/FreeTrialConversionCTA";
import { LogoIcon } from "@/components/icons";

type Step = 1 | 2 | 3 | 4;

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function getNextDatesForDay(dayOfWeek: number, count: number = 4): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  let current = new Date(today);

  // Start from tomorrow
  current.setDate(current.getDate() + 1);

  while (dates.length < count) {
    if (current.getDay() === dayOfWeek) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export default function FreeTrialPage({
  params,
}: {
  params: Promise<{ mentorId: string }>;
}) {
  const { mentorId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [schedules, setSchedules] = useState<MentorSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<Step>(1);

  // Booking form state
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [menteeIntro, setMenteeIntro] = useState("");
  const [menteeGoal, setMenteeGoal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEligible, setIsEligible] = useState(true);
  const [bookingResult, setBookingResult] = useState<{ id: string; mentor_name: string; scheduled_at: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!isSupabaseConfigured()) {
        setIsLoading(false);
        return;
      }

      const supabase = createClient();

      // Fetch mentor (is_approved + is_active 모두 확인)
      const { data: mentorData } = await supabase
        .from("mentors")
        .select("*")
        .eq("id", mentorId)
        .eq("is_approved", true)
        .eq("is_active", true)
        .single();

      if (!mentorData) {
        setIsLoading(false);
        return;
      }

      setMentor(mentorData);

      // Fetch schedules
      const { data: scheduleData } = await supabase
        .from("mentor_schedules")
        .select("*")
        .eq("mentor_id", mentorId)
        .eq("is_active", true)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

      if (scheduleData) {
        setSchedules(scheduleData);
      }

      // Check eligibility
      if (user) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;
          if (token) {
            const response = await fetch("/api/free-trial/check", {
              headers: { "Authorization": `Bearer ${token}` },
            });
            const data = await response.json();
            setIsEligible(data.eligible);
          }
        } catch {
          // Default to eligible
        }
      }

      setIsLoading(false);
    };

    fetchData();
  }, [mentorId, user]);

  const availableSlots = schedules.reduce<{ date: Date; time: string; dayLabel: string }[]>((acc, schedule) => {
    const dates = getNextDatesForDay(schedule.day_of_week, 2);
    dates.forEach(date => {
      acc.push({
        date,
        time: schedule.start_time.slice(0, 5),
        dayLabel: DAY_LABELS[schedule.day_of_week],
      });
    });
    return acc;
  }, []).sort((a, b) => a.date.getTime() - b.date.getTime());

  const handleSubmit = async () => {
    if (!user) {
      showToast("로그인 후 무료 체험을 신청할 수 있습니다.", "error");
      // 로그인 후 현재 페이지로 돌아오도록 redirect 파라미터 추가
      router.push(`/login?redirect=${encodeURIComponent(`/free-trial/${mentorId}`)}`);
      return;
    }

    if (!selectedDate || !selectedTime) {
      showToast("일정을 선택해주세요.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const scheduledAt = `${selectedDate}T${selectedTime}:00`;

      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        showToast("로그인이 필요합니다.", "error");
        return;
      }

      const response = await fetch("/api/free-trial/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          mentorId,
          scheduledAt,
          menteeIntro: menteeIntro || null,
          menteeGoal: menteeGoal || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        showToast(result.error || "예약에 실패했습니다.", "error");
        return;
      }

      setBookingResult(result.booking);
      setStep(4);
      showToast("무료 체험 예약이 완료되었습니다!", "success");
    } catch {
      showToast("예약 처리 중 오류가 발생했습니다.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card-bg border border-card-border rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">멘토를 찾을 수 없어요</h2>
          <p className="text-muted mb-6">해당 멘토가 존재하지 않거나 현재 활동 중이 아닙니다.</p>
          <Link href="/mentors" className="inline-block px-6 py-2.5 bg-primary text-white rounded-full font-medium">
            다른 멘토 찾기
          </Link>
        </div>
      </div>
    );
  }

  if (!isEligible) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card-bg border border-card-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">이미 체험을 이용하셨어요</h2>
          <p className="text-muted mb-6">무료 체험은 1회만 가능합니다. 유료 멘토링을 이용해주세요.</p>
          <Link href={`/mentors/${mentorId}`} className="inline-block px-6 py-2.5 bg-primary text-white rounded-full font-medium">
            멘토링 상품 보기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-secondary/90 backdrop-blur-md border-b border-card-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <LogoIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                커피챗
              </span>
            </Link>
            <Link href={`/mentors/${mentorId}`} className="text-muted hover:text-foreground transition-colors text-sm">
              멘토 프로필
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                s <= step ? "bg-accent" : "bg-secondary"
              }`}
            />
          ))}
        </div>

        {/* Free Trial Badge */}
        <div className="flex items-center gap-3 mb-8 p-4 bg-accent/10 border border-accent/30 rounded-xl">
          <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
          <div>
            <p className="font-semibold text-accent">15분 무료 체험</p>
            <p className="text-sm text-muted">결제 없이 바로 예약 확정됩니다</p>
          </div>
        </div>

        {/* Step 1: Mentor Info */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold mb-6">멘토 확인</h1>

            <div className="bg-card-bg border border-card-border rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
                  {mentor.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{mentor.name}</h2>
                  <p className="text-muted">{mentor.company} {mentor.position && `· ${mentor.position}`}</p>
                  {mentor.years && <p className="text-sm text-muted">경력 {mentor.years}년</p>}
                </div>
              </div>

              {mentor.bio && (
                <p className="text-sm text-foreground leading-relaxed bg-secondary/50 rounded-lg p-4">
                  {mentor.bio}
                </p>
              )}

              <div className="mt-4 flex items-center gap-4 text-sm text-muted">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  {mentor.rating.toFixed(1)}
                </span>
                <span>리뷰 {mentor.reviews}개</span>
                <span>세션 {mentor.sessions}회</span>
              </div>
            </div>

            <div className="bg-card-bg border border-card-border rounded-2xl p-6">
              <h3 className="font-semibold mb-3">무료 체험 안내</h3>
              <ul className="space-y-2 text-sm text-muted">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  15분 동안 멘토와 1:1 화상 상담
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  결제 없이 바로 예약 확정
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  1인당 1회 무료 체험 제공
                </li>
              </ul>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-8 py-3 bg-gradient-to-r from-accent to-primary text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer"
              >
                일정 선택하기
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Schedule Selection */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold mb-6">일정 선택</h1>

            {availableSlots.length > 0 ? (
              <div className="space-y-3">
                {availableSlots.map((slot, i) => {
                  const dateStr = `${slot.date.getFullYear()}-${String(slot.date.getMonth() + 1).padStart(2, "0")}-${String(slot.date.getDate()).padStart(2, "0")}`;
                  const isSelected = selectedDate === dateStr && selectedTime === slot.time;

                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setSelectedTime(slot.time);
                      }}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-accent bg-accent/10"
                          : "border-card-border bg-card-bg hover:border-accent/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">
                            {slot.date.toLocaleDateString("ko-KR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              weekday: "short",
                            })}
                          </p>
                          <p className="text-sm text-muted">{slot.time} (15분)</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? "border-accent bg-accent" : "border-card-border"
                        }`}>
                          {isSelected && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-card-bg border border-card-border rounded-xl">
                <p className="text-muted mb-2">현재 사용 가능한 스케줄이 없어요</p>
                <p className="text-sm text-muted">멘토에게 직접 문의하거나 다른 멘토를 선택해주세요.</p>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-card-border text-foreground rounded-xl font-medium hover:border-primary transition-all cursor-pointer"
              >
                이전
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedDate || !selectedTime}
                className="px-8 py-3 bg-gradient-to-r from-accent to-primary text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Info & Submit */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold mb-6">신청 정보</h1>

            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-card-bg border border-card-border rounded-xl p-5">
                <h3 className="text-sm font-medium text-muted mb-3">예약 요약</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted">멘토</p>
                    <p className="font-medium">{mentor.name}</p>
                  </div>
                  <div>
                    <p className="text-muted">가격</p>
                    <p className="font-medium text-accent">무료</p>
                  </div>
                  <div>
                    <p className="text-muted">일시</p>
                    <p className="font-medium">
                      {selectedDate && new Date(selectedDate).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        weekday: "short",
                      })} {selectedTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">시간</p>
                    <p className="font-medium">15분</p>
                  </div>
                </div>
              </div>

              {/* Intro */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  자기소개 <span className="text-muted">(선택)</span>
                </label>
                <textarea
                  value={menteeIntro}
                  onChange={(e) => setMenteeIntro(e.target.value)}
                  placeholder="간단한 자기소개를 작성해주세요 (현재 상황, 관심 분야 등)"
                  rows={3}
                  className="w-full px-4 py-3 bg-card-bg border border-card-border rounded-xl text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>

              {/* Goal */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  상담 목표 <span className="text-muted">(선택)</span>
                </label>
                <textarea
                  value={menteeGoal}
                  onChange={(e) => setMenteeGoal(e.target.value)}
                  placeholder="이번 상담에서 알고 싶은 것이 있다면 적어주세요"
                  rows={3}
                  className="w-full px-4 py-3 bg-card-bg border border-card-border rounded-xl text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 border border-card-border text-foreground rounded-xl font-medium hover:border-primary transition-all cursor-pointer"
              >
                이전
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-accent to-primary text-white rounded-xl font-medium hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "예약 중..." : "무료 체험 신청"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 4 && bookingResult && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold mb-3">예약이 완료되었어요!</h1>
            <p className="text-muted mb-8">
              {bookingResult.mentor_name} 멘토님과의 무료 체험이 확정되었습니다.
            </p>

            <div className="bg-card-bg border border-card-border rounded-xl p-6 mb-8 max-w-sm mx-auto text-left">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">멘토</span>
                  <span className="font-medium">{bookingResult.mentor_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">일시</span>
                  <span className="font-medium">
                    {new Date(bookingResult.scheduled_at).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "short",
                    })}{" "}
                    {new Date(bookingResult.scheduled_at).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">가격</span>
                  <span className="font-medium text-accent">무료</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Link
                href="/mypage"
                className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                마이페이지에서 확인
              </Link>
              <Link
                href="/mentors"
                className="px-6 py-3 border border-card-border text-foreground rounded-xl font-medium hover:border-primary hover:text-primary transition-all"
              >
                다른 멘토 둘러보기
              </Link>
            </div>

            {/* Teaser for paid mentoring */}
            <div className="max-w-lg mx-auto">
              <FreeTrialConversionCTA
                mentorId={mentorId}
                mentorName={bookingResult.mentor_name}
                variant="compact"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
