"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Mentor, Booking, Product, MentorSchedule, Profile } from "@/lib/supabase/types";
import { PRODUCT_INFO } from "@/lib/constants";
import { ProductIcon, LogoIcon } from "@/components/icons";
import VerificationModal from "@/components/VerificationModal";
import BookingCalendar from "@/components/mentor/BookingCalendar";
import ReferralShareCard from "@/components/mentor/ReferralShareCard";

// v2 Booking status
type BookingStatusType = "pending" | "paid" | "confirmed" | "completed" | "cancelled" | "refunded";

const bookingStatusLabels: Record<BookingStatusType, string> = {
  pending: "대기중",
  paid: "결제완료",
  confirmed: "확정",
  completed: "완료",
  cancelled: "취소",
  refunded: "환불",
};

const bookingStatusColors: Record<BookingStatusType, string> = {
  pending: "bg-yellow-500/20 text-yellow-500",
  paid: "bg-blue-500/20 text-blue-500",
  confirmed: "bg-indigo-500/20 text-indigo-500",
  completed: "bg-green-500/20 text-green-500",
  cancelled: "bg-red-500/20 text-red-500",
  refunded: "bg-orange-500/20 text-orange-500",
};

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default function MentorDashboardPage() {
  const { user, isInitialized } = useAuth();
  const { showToast } = useToast();
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  // v2 State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingProfiles, setBookingProfiles] = useState<Record<string, Profile>>({});
  const [bookingProducts, setBookingProducts] = useState<Record<string, Product>>({});
  const [schedules, setSchedules] = useState<MentorSchedule[]>([]);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [meetingLinkInput, setMeetingLinkInput] = useState<Record<string, string>>({});
  const [savingMeetingLink, setSavingMeetingLink] = useState<string | null>(null);
  const [bookingFeedbacks, setBookingFeedbacks] = useState<Record<string, boolean>>({});
  const [bookingSurveys, setBookingSurveys] = useState<Record<string, boolean>>({});

  // Schedule form state
  const [newScheduleDay, setNewScheduleDay] = useState(1);
  const [newScheduleStart, setNewScheduleStart] = useState("10:00");
  const [newScheduleEnd, setNewScheduleEnd] = useState("11:00");
  const [addingSchedule, setAddingSchedule] = useState(false);
  const [togglingScheduleId, setTogglingScheduleId] = useState<string | null>(null);
  const [deletingScheduleId, setDeletingScheduleId] = useState<string | null>(null);
  const [schedulesTableAvailable, setSchedulesTableAvailable] = useState(true);

  // View mode state for bookings (list or calendar)
  const [bookingViewMode, setBookingViewMode] = useState<"list" | "calendar">("list");

  // Pagination for bookings
  const BOOKINGS_PER_PAGE = 20;
  const [bookingPage, setBookingPage] = useState(1);
  const totalBookingPages = Math.ceil(bookings.length / BOOKINGS_PER_PAGE);
  const paginatedBookings = bookings.slice(
    (bookingPage - 1) * BOOKINGS_PER_PAGE,
    bookingPage * BOOKINGS_PER_PAGE
  );

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchMentorData = async () => {
      if (!isSupabaseConfigured()) {
        setError("데이터베이스 연결이 필요해요.");
        setIsLoading(false);
        return;
      }

      const supabase = createClient();

      try {
        // 현재 사용자가 멘토인지 확인
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

      setMentor(mentorData);

      // v2: Fetch bookings
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("*")
        .eq("mentor_id", mentorData.id)
        .order("created_at", { ascending: false });

      if (bookingData && bookingData.length > 0) {
        setBookings(bookingData);

        // Fetch mentee profiles
        const menteeIds = [...new Set(bookingData.map((b: Booking) => b.mentee_id).filter(Boolean))] as string[];
        if (menteeIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("*")
            .in("id", menteeIds);
          if (profilesData) {
            const profileMap: Record<string, Profile> = {};
            profilesData.forEach((p: Profile) => { profileMap[p.id] = p; });
            setBookingProfiles(profileMap);
          }
        }

        // Fetch products
        const productIds = [...new Set(bookingData.map((b: Booking) => b.product_id).filter(Boolean))] as string[];
        if (productIds.length > 0) {
          const { data: productsData } = await supabase
            .from("products")
            .select("*")
            .in("id", productIds);
          if (productsData) {
            const productMap: Record<string, Product> = {};
            productsData.forEach((p: Product) => { productMap[p.id] = p; });
            setBookingProducts(productMap);
          }
        }

        // Initialize meeting link inputs
        const linkMap: Record<string, string> = {};
        bookingData.forEach((b: Booking) => { linkMap[b.id] = b.meeting_link || ""; });
        setMeetingLinkInput(linkMap);

        // Fetch mentor feedbacks to check which bookings have feedback
        const bookingIds = bookingData.map((b: Booking) => b.id);
        const { data: feedbackData } = await supabase
          .from("mentor_feedbacks")
          .select("booking_id")
          .in("booking_id", bookingIds);

        if (feedbackData) {
          const feedbackMap: Record<string, boolean> = {};
          feedbackData.forEach((f: { booking_id: string }) => { feedbackMap[f.booking_id] = true; });
          setBookingFeedbacks(feedbackMap);
        }

        // Fetch mentor session surveys to check which bookings have surveys
        try {
          const { data: surveyData } = await supabase
            .from("mentor_session_surveys")
            .select("booking_id")
            .in("booking_id", bookingIds);
          if (surveyData) {
            const surveyMap: Record<string, boolean> = {};
            surveyData.forEach((s: { booking_id: string }) => { surveyMap[s.booking_id] = true; });
            setBookingSurveys(surveyMap);
          }
        } catch {
          // mentor_session_surveys table may not exist yet
        }
      }

      // v2: Fetch schedules (mentor_schedules table may not exist yet)
      try {
        const { data: scheduleData, error: scheduleError } = await supabase
          .from("mentor_schedules")
          .select("*")
          .eq("mentor_id", mentorData.id)
          .order("day_of_week", { ascending: true })
          .order("start_time", { ascending: true });

        if (scheduleError) {
          console.warn("[dashboard] mentor_schedules table not available:", scheduleError.message);
          setSchedulesTableAvailable(false);
        } else if (scheduleData) {
          setSchedules(scheduleData);
        }
      } catch {
        console.warn("[dashboard] mentor_schedules table not available");
        setSchedulesTableAvailable(false);
      }
    } catch (err) {
      setError("데이터를 불러오는 중 오류가 발생했어요.");
    } finally {
      setIsLoading(false);
    }
    };

    fetchMentorData();
  }, [isInitialized, user]);

  // v2: Update booking status
  const updateBookingStatus = async (bookingId: string, newStatus: BookingStatusType) => {
    if (!isSupabaseConfigured()) return;

    // 취소/환불 등 되돌리기 어려운 상태 변경 시 확인
    if (newStatus === "cancelled" || newStatus === "refunded") {
      const label = newStatus === "cancelled" ? "거절" : "환불";
      if (!window.confirm(`이 예약을 ${label} 처리하시겠어요? 이 작업은 되돌릴 수 없습니다.`)) {
        return;
      }
    }

    setUpdatingBookingId(bookingId);
    const supabase = createClient();

    try {
      if (!mentor) return;
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId)
        .eq("mentor_id", mentor.id);

      if (error) {
        showToast("상태 변경에 실패했어요.", "error");
        return;
      }
      showToast("예약 상태가 변경되었어요.", "success");

      // 예약 확정 시 멘티에게 이메일 알림 발송 (비동기, 에러 무시)
      if (newStatus === "confirmed") {
        const session = await supabase.auth.getSession();
        const accessToken = session.data.session?.access_token;
        fetch("/api/email/booking-notification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            type: "confirmed",
            bookingId,
          }),
        }).catch((e) => console.error("[이메일 알림 실패]", e));
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: newStatus } : b
        )
      );
    } catch {
      showToast("오류가 발생했어요.", "error");
    } finally {
      setUpdatingBookingId(null);
    }
  };

  // v2: Save meeting link (returns true on success, false on failure)
  const saveMeetingLink = async (bookingId: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) return false;

    const linkValue = meetingLinkInput[bookingId]?.trim();

    // 미팅 링크가 비어있지 않으면 URL 형식 검증
    if (linkValue) {
      try {
        const url = new URL(linkValue);
        // http 또는 https 프로토콜만 허용
        if (!["http:", "https:"].includes(url.protocol)) {
          showToast("올바른 미팅 링크 형식이 아니에요. (http:// 또는 https://로 시작해야 해요)", "error");
          return false;
        }
      } catch {
        showToast("올바른 미팅 링크 형식이 아니에요. (예: https://meet.google.com/...)", "error");
        return false;
      }
    }

    setSavingMeetingLink(bookingId);
    const supabase = createClient();

    try {
      if (!mentor) return false;
      const { error } = await supabase
        .from("bookings")
        .update({ meeting_link: meetingLinkInput[bookingId] || null })
        .eq("id", bookingId)
        .eq("mentor_id", mentor.id);

      if (error) {
        showToast("미팅 링크 저장에 실패했어요.", "error");
        return false;
      }
      showToast("미팅 링크가 저장되었어요.", "success");

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, meeting_link: meetingLinkInput[bookingId] || null } : b
        )
      );
      return true;
    } catch {
      showToast("오류가 발생했어요.", "error");
      return false;
    } finally {
      setSavingMeetingLink(null);
    }
  };

  // v2: Add schedule slot
  const addScheduleSlot = async () => {
    if (!mentor || !isSupabaseConfigured() || !schedulesTableAvailable) {
      if (!schedulesTableAvailable) showToast("스케줄 기능이 아직 준비되지 않았어요.", "error");
      return;
    }

    // 시간 유효성 검증: 분(minute) 변환 비교로 정확한 시간 비교
    const toMinutes = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    if (toMinutes(newScheduleStart) >= toMinutes(newScheduleEnd)) {
      showToast("시작 시간이 종료 시간보다 이전이어야 해요.", "error");
      return;
    }

    // 중복 스케줄 검증: 동일 요일, 동일 시간대 스케줄이 있는지 확인
    const duplicateSchedule = schedules.find(
      (s) =>
        s.day_of_week === newScheduleDay &&
        s.start_time.slice(0, 5) === newScheduleStart &&
        s.end_time.slice(0, 5) === newScheduleEnd
    );
    if (duplicateSchedule) {
      showToast("이미 동일한 시간대의 스케줄이 있어요.", "error");
      return;
    }

    setAddingSchedule(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("mentor_schedules")
        .insert({
          mentor_id: mentor.id,
          day_of_week: newScheduleDay,
          start_time: newScheduleStart + ":00",
          end_time: newScheduleEnd + ":00",
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        showToast("스케줄 추가에 실패했어요.", "error");
        return;
      }
      showToast("스케줄이 추가되었어요.", "success");
      setSchedules((prev) => [...prev, data].sort((a, b) =>
        a.day_of_week !== b.day_of_week
          ? a.day_of_week - b.day_of_week
          : a.start_time.localeCompare(b.start_time)
      ));
    } catch {
      showToast("오류가 발생했어요.", "error");
    } finally {
      setAddingSchedule(false);
    }
  };

  // v2: Toggle schedule active
  const toggleScheduleActive = async (scheduleId: string, isActive: boolean) => {
    if (!isSupabaseConfigured() || !schedulesTableAvailable) return;

    setTogglingScheduleId(scheduleId);
    const supabase = createClient();

    try {
      if (!mentor) return;
      const { error } = await supabase
        .from("mentor_schedules")
        .update({ is_active: !isActive })
        .eq("id", scheduleId)
        .eq("mentor_id", mentor.id);

      if (error) {
        showToast("상태 변경에 실패했어요.", "error");
        return;
      }
      showToast(isActive ? "스케줄이 비활성화되었어요." : "스케줄이 활성화되었어요.", "success");
      setSchedules((prev) =>
        prev.map((s) => s.id === scheduleId ? { ...s, is_active: !isActive } : s)
      );
    } catch {
      showToast("오류가 발생했어요.", "error");
    } finally {
      setTogglingScheduleId(null);
    }
  };

  // v2: Delete schedule slot
  const deleteScheduleSlot = async (scheduleId: string) => {
    if (!isSupabaseConfigured() || !schedulesTableAvailable) return;

    setDeletingScheduleId(scheduleId);
    const supabase = createClient();

    try {
      if (!mentor) return;
      const { error } = await supabase
        .from("mentor_schedules")
        .delete()
        .eq("id", scheduleId)
        .eq("mentor_id", mentor.id);

      if (error) {
        showToast("스케줄 삭제에 실패했어요.", "error");
        return;
      }
      showToast("스케줄이 삭제되었어요.", "success");
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
    } catch {
      showToast("오류가 발생했어요.", "error");
    } finally {
      setDeletingScheduleId(null);
    }
  };

  // v2 booking stats
  const bookingStats = {
    pending: bookings.filter((b) => b.status === "pending" || b.status === "paid").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    totalRevenue: bookings
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + (b.mentor_amount || 0), 0),
  };

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card-bg border border-card-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">로그인이 필요해요</h2>
          <p className="text-muted mb-6">멘토 대시보드는 로그인 후 이용할 수 있어요.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login?redirect=/mentor/dashboard"
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

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">멘토 전용 페이지</h1>
          <p className="text-muted mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/mentor/apply"
              className="px-6 py-3 bg-primary text-white rounded-full font-medium"
            >
              멘토 지원하기
            </Link>
            <Link
              href="/"
              className="px-6 py-3 border border-card-border text-foreground rounded-full font-medium"
            >
              홈으로 이동
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-card-border bg-card-bg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <LogoIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">커피챗</span>
            </Link>
            <span className="text-muted">/</span>
            <span className="font-medium">멘토 대시보드</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">{mentor?.name} 멘토</span>
            <Link href="/mentor/settlement" className="text-sm text-green-500 hover:underline">
              정산
            </Link>
            <Link href="/mentor/edit" className="text-sm text-accent hover:underline">
              프로필 수정
            </Link>
            <Link href="/" className="text-sm text-primary hover:underline">
              사이트로 이동
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">안녕하세요, {mentor?.name}님!</h1>
          <p className="text-muted">받은 예약을 확인하고 관리하세요.</p>
        </div>

        {/* Booking Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card-bg border border-card-border rounded-xl p-6">
            <p className="text-sm text-muted mb-1">대기/결제</p>
            <p className="text-3xl font-bold text-yellow-500">{bookingStats.pending}</p>
          </div>
          <div className="bg-card-bg border border-card-border rounded-xl p-6">
            <p className="text-sm text-muted mb-1">확정</p>
            <p className="text-3xl font-bold text-blue-500">{bookingStats.confirmed}</p>
          </div>
          <div className="bg-card-bg border border-card-border rounded-xl p-6">
            <p className="text-sm text-muted mb-1">완료</p>
            <p className="text-3xl font-bold text-green-500">{bookingStats.completed}</p>
          </div>
          <div className="bg-card-bg border border-card-border rounded-xl p-6">
            <p className="text-sm text-muted mb-1">총 수익</p>
            <p className="text-3xl font-bold text-primary">{bookingStats.totalRevenue.toLocaleString()}원</p>
          </div>
        </div>

        {/* Settlement Quick Link */}
        {mentor && (
          <div className="mb-6">
            <Link
              href="/mentor/settlement"
              className="block bg-card-bg border border-card-border rounded-xl p-6 hover:border-primary/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold group-hover:text-primary transition-colors">정산 관리</p>
                    <p className="text-sm text-muted">정산 내역 확인 및 계좌 관리</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-muted group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        )}

        {/* Mentor Info */}
        {mentor && !mentor.is_approved && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-yellow-500 text-sm">
              멘토 승인 대기 중이에요. 승인 후 멘토 목록에 노출돼요.
            </p>
          </div>
        )}

        {/* Verification Status */}
        {mentor && (
          <div className={`mb-6 p-4 rounded-xl flex items-center justify-between ${
            mentor.is_verified
              ? "bg-green-500/10 border border-green-500/30"
              : mentor.verification_status === "pending"
                ? "bg-yellow-500/10 border border-yellow-500/30"
                : mentor.verification_status === "rejected"
                  ? "bg-red-500/10 border border-red-500/30"
                  : "bg-blue-500/10 border border-blue-500/30"
          }`}>
            <div className="flex items-center gap-3">
              {mentor.is_verified ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-green-500">인증 완료</p>
                    <p className="text-sm text-green-400/70">회사 이메일로 인증되었어요</p>
                  </div>
                </>
              ) : mentor.verification_status === "pending" ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-yellow-500">인증 심사 중</p>
                    <p className="text-sm text-yellow-400/70">제출한 인증이 검토 중이에요</p>
                  </div>
                </>
              ) : mentor.verification_status === "rejected" ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-red-500">인증 반려</p>
                    <p className="text-sm text-red-400/70">인증이 반려되었어요. 다시 시도해주세요.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-blue-500">멘토 인증</p>
                    <p className="text-sm text-blue-400/70">회사 이메일로 인증하면 신뢰도가 올라갑니다</p>
                  </div>
                </>
              )}
            </div>
            {!mentor.is_verified && (
              <button
                onClick={() => setIsVerificationModalOpen(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors cursor-pointer"
              >
                인증하기
              </button>
            )}
          </div>
        )}

        {/* ========================================= */}
        {/* Bookings Section                          */}
        {/* ========================================= */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">예약 관리</h2>
            <p className="text-muted text-sm">받은 예약을 확인하고 관리하세요.</p>
          </div>

          {/* View Mode Toggle */}
          {bookings.length > 0 && (
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
              <button
                onClick={() => setBookingViewMode("list")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  bookingViewMode === "list"
                    ? "bg-card-bg text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  목록
                </span>
              </button>
              <button
                onClick={() => setBookingViewMode("calendar")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  bookingViewMode === "calendar"
                    ? "bg-card-bg text-foreground shadow-sm"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  캘린더
                </span>
              </button>
            </div>
          )}
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-16 bg-card-bg border border-card-border rounded-xl mb-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">아직 예약이 없어요</h3>
            <p className="text-muted">새로운 예약이 들어오면 여기에 표시돼요.</p>
          </div>
        ) : bookingViewMode === "calendar" ? (
          /* Calendar View */
          <div className="mb-12">
            <BookingCalendar
              bookings={bookings}
              bookingProfiles={bookingProfiles}
              bookingProducts={bookingProducts}
            />
            <p className="text-xs text-muted mt-3 text-center">
              예약을 클릭하면 상세 정보를 확인할 수 있어요. 예약 관리(확정/거절 등)는 목록 보기에서 가능해요.
            </p>
          </div>
        ) : (
          /* List View */
          <div className="space-y-4 mb-12">
            {paginatedBookings.map((booking) => {
              const menteeProfile = booking.mentee_id ? bookingProfiles[booking.mentee_id] : null;
              const product = booking.product_id ? bookingProducts[booking.product_id] : null;
              const productInfo = product ? PRODUCT_INFO[product.type] : null;

              return (
                <div key={booking.id} className="bg-card-bg border border-card-border rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {menteeProfile?.name || "멘티 정보 없음"}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${bookingStatusColors[booking.status]}`}>
                          {bookingStatusLabels[booking.status]}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted">
                        {menteeProfile?.email && <span>{menteeProfile.email}</span>}
                        {productInfo && (
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">
                            <ProductIcon name={productInfo.icon} className="w-4 h-4 inline-block" /> {productInfo.name}
                          </span>
                        )}
                        {product && (
                          <span className="text-accent font-medium">
                            {product.price.toLocaleString()}원 / {product.duration_minutes}분
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scheduled date/time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted mb-1">예약 일시</p>
                      <p className="font-medium">
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
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted mb-1">결제 금액</p>
                      <p className="font-medium">{booking.amount.toLocaleString()}원</p>
                    </div>
                  </div>

                  {/* Mentee intro / goal */}
                  {(booking.mentee_intro || booking.mentee_goal) && (
                    <div className="mb-4 space-y-2">
                      {booking.mentee_intro && (
                        <div>
                          <p className="text-xs text-muted mb-1">멘티 소개</p>
                          <p className="p-3 bg-secondary rounded-lg text-sm">{booking.mentee_intro}</p>
                        </div>
                      )}
                      {booking.mentee_goal && (
                        <div>
                          <p className="text-xs text-muted mb-1">상담 목표</p>
                          <p className="p-3 bg-secondary rounded-lg text-sm">{booking.mentee_goal}</p>
                        </div>
                      )}
                      {/* Mentee Questions */}
                      {booking.mentee_questions && (
                        (booking.mentee_questions as any).predefined?.length > 0 ||
                        (booking.mentee_questions as any).custom?.length > 0
                      ) && (
                        <div className="mt-3">
                          <p className="text-xs text-muted mb-1.5">멘티 질문 목록</p>
                          <div className="p-3 bg-secondary/50 rounded-lg space-y-1.5">
                            {(booking.mentee_questions as any).predefined?.map((q: string, i: number) => (
                              <p key={`p-${i}`} className="text-sm flex items-start gap-2">
                                <svg className="w-4 h-4 text-primary mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {q}
                              </p>
                            ))}
                            {(booking.mentee_questions as any).custom?.map((q: string, i: number) => (
                              <p key={`c-${i}`} className="text-sm flex items-start gap-2 text-accent">
                                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {q}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Meeting link for pending/paid/confirmed bookings */}
                  {(booking.status === "pending" || booking.status === "paid" || booking.status === "confirmed") && (
                    <div className="mb-4">
                      <p className="text-xs text-muted mb-1">
                        미팅 링크 {(booking.status === "pending" || booking.status === "paid") && <span className="text-red-500">* 확정 전 필수 입력</span>}
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={meetingLinkInput[booking.id] || ""}
                          onChange={(e) =>
                            setMeetingLinkInput((prev) => ({ ...prev, [booking.id]: e.target.value }))
                          }
                          placeholder="https://meet.google.com/... 또는 줌 링크"
                          className="flex-1 px-3 py-2 bg-secondary border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          onClick={() => saveMeetingLink(booking.id)}
                          disabled={savingMeetingLink === booking.id}
                          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {savingMeetingLink === booking.id ? "저장중..." : "저장"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {!mentor?.is_approved && (booking.status === "pending" || booking.status === "paid" || booking.status === "confirmed") && (
                      <span className="px-4 py-2 bg-yellow-500/10 text-yellow-500 rounded-lg text-sm font-medium">
                        멘토 승인 후 예약 관리가 가능해요
                      </span>
                    )}
                    {mentor?.is_approved && (booking.status === "pending") && (
                      <>
                        <button
                          onClick={async () => {
                            // 미팅링크가 없으면 저장 먼저 요청
                            if (!meetingLinkInput[booking.id]?.trim()) {
                              showToast("미팅 링크를 먼저 입력해주세요.", "error");
                              return;
                            }
                            // 미팅링크 저장 후 확정 (저장 실패 시 확정하지 않음)
                            const saved = await saveMeetingLink(booking.id);
                            if (!saved) return;
                            await updateBookingStatus(booking.id, "confirmed");
                          }}
                          disabled={updatingBookingId === booking.id || savingMeetingLink === booking.id}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {updatingBookingId === booking.id || savingMeetingLink === booking.id ? "처리중..." : "확정"}
                        </button>
                        <button
                          onClick={() => updateBookingStatus(booking.id, "cancelled")}
                          disabled={updatingBookingId === booking.id}
                          className="px-4 py-2 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {updatingBookingId === booking.id ? "처리중..." : "거절"}
                        </button>
                      </>
                    )}
                    {mentor?.is_approved && booking.status === "paid" && (
                      <>
                        <button
                          onClick={async () => {
                            // 미팅링크가 없으면 저장 먼저 요청
                            if (!meetingLinkInput[booking.id]?.trim()) {
                              showToast("미팅 링크를 먼저 입력해주세요.", "error");
                              return;
                            }
                            // 미팅링크 저장 후 확정 (저장 실패 시 확정하지 않음)
                            const saved = await saveMeetingLink(booking.id);
                            if (!saved) return;
                            await updateBookingStatus(booking.id, "confirmed");
                          }}
                          disabled={updatingBookingId === booking.id || savingMeetingLink === booking.id}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {updatingBookingId === booking.id || savingMeetingLink === booking.id ? "처리중..." : "확정"}
                        </button>
                        <button
                          onClick={() => updateBookingStatus(booking.id, "cancelled")}
                          disabled={updatingBookingId === booking.id}
                          className="px-4 py-2 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {updatingBookingId === booking.id ? "처리중..." : "거절"}
                        </button>
                      </>
                    )}
                    {mentor?.is_approved && booking.status === "confirmed" && (
                      <Link
                        href={`/session/confirm/${booking.id}`}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        완료 확인
                      </Link>
                    )}
                    {booking.status === "completed" && (
                      bookingFeedbacks[booking.id] ? (
                        <span className="px-4 py-2 bg-green-500/10 text-green-500 rounded-lg text-sm font-medium">
                          피드백 완료
                        </span>
                      ) : (
                        <Link
                          href={`/mentor/feedback/${booking.id}`}
                          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          피드백 작성
                        </Link>
                      )
                    )}
                    {booking.status === "completed" && (
                      <Link
                        href={`/mentor/survey/${booking.id}`}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          bookingSurveys[booking.id]
                            ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                            : "bg-accent/10 text-accent hover:bg-accent/20"
                        }`}
                      >
                        {bookingSurveys[booking.id] ? "설문 완료" : "품질 설문"}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {totalBookingPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setBookingPage((p) => Math.max(1, p - 1))}
                  disabled={bookingPage === 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-card-border hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <span className="text-sm text-muted">
                  {bookingPage} / {totalBookingPages}
                </span>
                <button
                  onClick={() => setBookingPage((p) => Math.min(totalBookingPages, p + 1))}
                  disabled={bookingPage === totalBookingPages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-card-border hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================= */}
        {/* Mentor Referral Section                    */}
        {/* ========================================= */}
        <div className="mt-12 mb-8">
          <ReferralShareCard />
        </div>

        {/* ========================================= */}
        {/* Schedule Management Section               */}
        {/* ========================================= */}
        <div className="mt-12 mb-8">
          <h2 className="text-2xl font-bold mb-2">스케줄 관리</h2>
          <p className="text-muted text-sm">상담 가능한 시간대를 설정하세요. 멘티가 예약 시 이 시간대를 참고해요.</p>
        </div>

        {!schedulesTableAvailable ? (
          <div className="text-center py-16 bg-card-bg border border-card-border rounded-xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">스케줄 기능 준비 중</h3>
            <p className="text-muted text-sm">스케줄 관리 기능이 아직 설정되지 않았어요.<br />관리자에게 문의해 주세요.</p>
          </div>
        ) : (
        <>
        {/* Add new schedule slot */}
        <div className="bg-card-bg border border-card-border rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-4">새 시간대 추가</h3>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs text-muted mb-1">요일</label>
              <select
                value={newScheduleDay}
                onChange={(e) => setNewScheduleDay(Number(e.target.value))}
                disabled={addingSchedule}
                className="px-3 py-2 bg-secondary border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                {DAY_LABELS.map((label, i) => (
                  <option key={i} value={i}>{label}요일</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">시작 시간</label>
              <input
                type="time"
                value={newScheduleStart}
                onChange={(e) => setNewScheduleStart(e.target.value)}
                disabled={addingSchedule}
                className="px-3 py-2 bg-secondary border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">종료 시간</label>
              <input
                type="time"
                value={newScheduleEnd}
                onChange={(e) => setNewScheduleEnd(e.target.value)}
                disabled={addingSchedule}
                className="px-3 py-2 bg-secondary border border-card-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
            <button
              onClick={addScheduleSlot}
              disabled={addingSchedule}
              className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50"
            >
              {addingSchedule ? "추가중..." : "추가"}
            </button>
          </div>
        </div>

        {/* Schedule list by day */}
        {schedules.length === 0 ? (
          <div className="text-center py-16 bg-card-bg border border-card-border rounded-xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">등록된 스케줄이 없어요</h3>
            <p className="text-muted">위에서 상담 가능한 시간대를 추가해 보세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {DAY_LABELS.map((dayLabel, dayIndex) => {
              const daySchedules = schedules.filter((s) => s.day_of_week === dayIndex);
              if (daySchedules.length === 0) return null;

              return (
                <div key={dayIndex} className="bg-card-bg border border-card-border rounded-xl p-4">
                  <h4 className="font-semibold mb-3 text-primary">{dayLabel}요일</h4>
                  <div className="space-y-2">
                    {daySchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          schedule.is_active
                            ? "bg-green-500/5 border-green-500/20"
                            : "bg-secondary border-card-border opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${schedule.is_active ? "bg-green-500" : "bg-gray-400"}`} />
                          <span className="text-sm font-medium">
                            {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleScheduleActive(schedule.id, schedule.is_active)}
                            disabled={togglingScheduleId === schedule.id}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                              schedule.is_active
                                ? "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30"
                                : "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                            }`}
                            title={schedule.is_active ? "비활성화" : "활성화"}
                          >
                            {togglingScheduleId === schedule.id
                              ? "..."
                              : schedule.is_active
                              ? "OFF"
                              : "ON"}
                          </button>
                          <button
                            onClick={() => deleteScheduleSlot(schedule.id)}
                            disabled={deletingScheduleId === schedule.id}
                            className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors cursor-pointer disabled:opacity-50"
                            title="삭제"
                          >
                            {deletingScheduleId === schedule.id ? "..." : "삭제"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </>
        )}
      </main>

      {/* Verification Modal */}
      {mentor && (
        <VerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => setIsVerificationModalOpen(false)}
          mentorId={mentor.id}
          onVerified={() => {
            setMentor({ ...mentor, is_verified: true });
          }}
        />
      )}
    </div>
  );
}

