"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Mentor, Booking, Product, MentorFeedback } from "@/lib/supabase/types";
import { PRODUCT_INFO } from "@/lib/constants";
import FreeTrialConversionCTA from "@/components/FreeTrialConversionCTA";

interface BookingWithDetails extends Booking {
  mentor?: Mentor | null;
  product?: Product | null;
  has_review?: boolean;
  feedback?: MentorFeedback | null;
}

type TabType = "profile" | "bookings";

export default function MyPage() {
  const router = useRouter();
  const { user, profile, isLoading, isInitialized, signOut, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [showConversionCTA, setShowConversionCTA] = useState(false);
  const [lastFreeTrialMentorId, setLastFreeTrialMentorId] = useState<string | null>(null);

  // 비로그인 시 차단 화면에서 처리 (early return)

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user || !isSupabaseConfigured()) {
        setIsLoadingBookings(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data: bookingData, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("mentee_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          // 예약 내역 조회 실패
          setBookings([]);
          setIsLoadingBookings(false);
          return;
        }

        if (bookingData && bookingData.length > 0) {
          // Fetch related mentors
          const mentorIds = [...new Set(bookingData.map(b => b.mentor_id).filter(Boolean))];
          let mentorsMap: Record<string, Mentor> = {};

          if (mentorIds.length > 0) {
            const { data: mentorData } = await supabase
              .from("mentors")
              .select("*")
              .in("id", mentorIds);

            if (mentorData) {
              mentorsMap = Object.fromEntries(mentorData.map(m => [m.id, m]));
            }
          }

          // Fetch related products
          const productIds = [...new Set(bookingData.map(b => b.product_id).filter(Boolean))] as string[];
          let productsMap: Record<string, Product> = {};

          if (productIds.length > 0) {
            const { data: productData } = await supabase
              .from("products")
              .select("*")
              .in("id", productIds);

            if (productData) {
              productsMap = Object.fromEntries(productData.map(p => [p.id, p]));
            }
          }

          // Fetch reviews to check has_review
          const bookingIds = bookingData.map(b => b.id);
          let reviewedBookingIds = new Set<string>();

          if (bookingIds.length > 0) {
            const { data: reviewData } = await supabase
              .from("reviews")
              .select("booking_id")
              .in("booking_id", bookingIds);

            if (reviewData) {
              reviewedBookingIds = new Set(reviewData.map(r => r.booking_id).filter(Boolean) as string[]);
            }
          }

          // Fetch mentor feedbacks
          let feedbacksMap: Record<string, MentorFeedback> = {};
          if (bookingIds.length > 0) {
            const { data: feedbackData } = await supabase
              .from("mentor_feedbacks")
              .select("*")
              .in("booking_id", bookingIds);

            if (feedbackData) {
              feedbacksMap = Object.fromEntries(feedbackData.map((f: MentorFeedback) => [f.booking_id, f]));
            }
          }

          const bookingsWithDetails: BookingWithDetails[] = bookingData.map(b => ({
            ...b,
            mentor: b.mentor_id ? mentorsMap[b.mentor_id] : null,
            product: b.product_id ? productsMap[b.product_id] : null,
            has_review: reviewedBookingIds.has(b.id),
            feedback: feedbacksMap[b.id] || null,
          }));

          setBookings(bookingsWithDetails);

          // Check if user completed free trial but hasn't booked a paid session
          const completedFreeTrial = bookingData.find(
            b => b.payment_method === "free_trial" && b.status === "completed"
          );
          const hasPaidBooking = bookingData.some(
            b => b.payment_method !== "free_trial" && b.amount > 0 && b.status !== "cancelled"
          );

          if (completedFreeTrial && !hasPaidBooking) {
            setShowConversionCTA(true);
            setLastFreeTrialMentorId(completedFreeTrial.mentor_id);
          }
        }
      } catch (error) {
        // 예약 내역 로딩 오류
        setBookings([]);
      } finally {
        setIsLoadingBookings(false);
      }
    };

    if (user) {
      fetchBookings();
    }
  }, [user]);

  // Initialize edit form
  useEffect(() => {
    if (profile) {
      setEditName(profile.name || "");
      setEditPhone(profile.phone || "");
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user || !isSupabaseConfigured()) return;

    // 이름 유효성 검사
    const trimmedName = editName.trim();
    if (!trimmedName) {
      showToast("이름을 입력해주세요.", "error");
      return;
    }
    if (trimmedName.length > 50) {
      showToast("이름은 50자 이내로 입력해주세요.", "error");
      return;
    }

    // 연락처 유효성 검사 (입력된 경우에만)
    const trimmedPhone = editPhone.trim();
    if (trimmedPhone && !/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(trimmedPhone)) {
      showToast("올바른 연락처 형식이 아니에요. (예: 010-1234-5678)", "error");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          name: trimmedName,
          phone: trimmedPhone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        showToast("프로필 수정에 실패했어요.", "error");
      } else {
        // user_metadata도 업데이트 (F5 시 fallback으로 사용)
        await supabase.auth.updateUser({ data: { name: trimmedName } });
        await refreshProfile();
        setIsEditing(false);
        showToast("프로필이 수정되었어요.", "success");
      }
    } catch (error) {
      showToast("프로필 수정 중 오류가 발생했어요.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    // signOut 내부에서 window.location.href = "/" 처리됨
  };

  const getBookingStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-500",
      paid: "bg-blue-500/20 text-blue-500",
      confirmed: "bg-indigo-500/20 text-indigo-500",
      completed: "bg-green-500/20 text-green-500",
      cancelled: "bg-red-500/20 text-red-500",
      refunded: "bg-orange-500/20 text-orange-500",
    };
    const labels: Record<string, string> = {
      pending: "대기중",
      paid: "결제완료",
      confirmed: "확정",
      completed: "완료",
      cancelled: "취소",
      refunded: "환불",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || "bg-gray-500/20 text-gray-500"}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getBookingProductBadge = (booking: BookingWithDetails) => {
    const product = booking.product;
    if (product && PRODUCT_INFO[product.type]) {
      const info = PRODUCT_INFO[product.type];
      return (
        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
          {info.icon} {info.name}
        </span>
      );
    }
    return null;
  };

  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);

  const handleCancelBooking = async (bookingId: string) => {
    if (!user || cancellingBookingId) return;
    if (!confirm("정말 예약을 취소하시겠어요?\n\n환불 규정:\n• 48시간 전: 전액 환불\n• 24~48시간: 50% 환불\n• 24시간 이내: 환불 불가")) return;

    setCancellingBookingId(bookingId);
    try {
      const res = await fetch("/api/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "취소에 실패했어요. 다시 시도해 주세요.", "error");
      } else {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId ? { ...b, status: "cancelled" as const, cancelled_at: new Date().toISOString(), cancelled_by: "mentee" as const } : b
          )
        );
        const refundMsg = data.refund_amount > 0
          ? `예약이 취소되었어요. 환불 금액: ${data.refund_amount.toLocaleString()}원 (${data.refund_rate}%)`
          : "예약이 취소되었어요. 환불 규정에 따라 환불이 불가합니다.";
        showToast(refundMsg, "success");
      }
    } catch {
      showToast("취소에 실패했어요.", "error");
    } finally {
      setCancellingBookingId(null);
    }
  };

  const tabs = [
    { id: "profile" as TabType, label: "프로필", icon: "👤" },
    { id: "bookings" as TabType, label: "예약 내역", icon: "📅" },
  ];

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
          <p className="text-muted mb-6">마이페이지는 로그인 후 이용할 수 있어요.</p>
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-card-border">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white text-sm">☕</span>
            </div>
            <span className="font-bold text-foreground group-hover:text-primary transition-colors">
              커피챗
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">마이페이지</h1>

        {/* Conversion CTA for free trial users */}
        {showConversionCTA && (
          <div className="mb-8">
            <FreeTrialConversionCTA
              mentorId={lastFreeTrialMentorId || undefined}
              variant="inline"
              onDismiss={() => setShowConversionCTA(false)}
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-card-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <section className="bg-card-bg border border-card-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">프로필 정보</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-primary hover:underline cursor-pointer"
                >
                  수정
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted mb-1">이름</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-card-border rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-1">이메일</label>
                  <input
                    type="email"
                    value={user.email || ""}
                    disabled
                    className="w-full px-4 py-3 bg-secondary border border-card-border rounded-lg text-muted cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted mb-1">연락처</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="010-0000-0000"
                    className="w-full px-4 py-3 bg-background border border-card-border rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving || !editName.trim()}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? "저장 중..." : "저장"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(profile?.name || "");
                      setEditPhone(profile?.phone || "");
                    }}
                    className="px-6 py-2 border border-card-border rounded-lg hover:border-primary transition-colors cursor-pointer"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
                    {(profile?.name || user.user_metadata?.name || user.email)?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{profile?.name || user.user_metadata?.name || "이름 미설정"}</p>
                    <p className="text-muted text-sm">{user.email}</p>
                  </div>
                </div>
                {profile?.phone && (
                  <div className="pt-4 border-t border-card-border">
                    <p className="text-sm text-muted">연락처</p>
                    <p>{profile.phone}</p>
                  </div>
                )}
                <div className="pt-4 border-t border-card-border">
                  <p className="text-sm text-muted">가입일</p>
                  <p>{new Date(profile?.created_at || user.created_at).toLocaleDateString("ko-KR")}</p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Bookings Tab (v2) */}
        {activeTab === "bookings" && (
          <section className="bg-card-bg border border-card-border rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-6">예약 내역</h2>

            {isLoadingBookings ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📅</div>
                <p className="text-muted mb-4">아직 예약 내역이 없어요.</p>
                <Link
                  href="/mentors"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  멘토 둘러보기
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 bg-background border border-card-border rounded-xl"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">
                            {booking.mentor?.name || "멘토"} 멘토님
                          </p>
                          {getBookingProductBadge(booking)}
                        </div>
                        <p className="text-sm text-muted">
                          {booking.mentor?.company}
                          {booking.product?.title ? ` · ${booking.product.title}` : ""}
                        </p>
                      </div>
                      {getBookingStatusBadge(booking.status)}
                    </div>

                    {/* Scheduled date/time */}
                    <div className="mb-3 flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-foreground">
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

                    {/* Meeting link for confirmed bookings */}
                    {booking.status === "confirmed" && booking.meeting_link && (
                      <div className="mb-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <p className="text-xs text-muted mb-1 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          미팅 링크
                        </p>
                        <a
                          href={booking.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
                        >
                          세션 참여하기
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    )}
                    {booking.status === "confirmed" && !booking.meeting_link && (
                      <div className="mb-3 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                        <p className="text-xs text-yellow-600 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          멘토가 미팅 링크를 아직 등록하지 않았어요
                        </p>
                      </div>
                    )}

                    {/* Mentor feedback for completed bookings */}
                    {booking.status === "completed" && booking.feedback && (
                      <div className="mb-3">
                        <button
                          onClick={() => setExpandedFeedback(expandedFeedback === booking.id ? null : booking.id)}
                          className="w-full text-left p-3 bg-green-500/5 border border-green-500/20 rounded-lg hover:bg-green-500/10 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-green-600 flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              멘토 피드백이 있어요
                            </p>
                            <svg
                              className={`w-4 h-4 text-green-600 transition-transform ${expandedFeedback === booking.id ? "rotate-180" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>
                        {expandedFeedback === booking.id && (
                          <div className="mt-2 p-3 bg-background rounded-lg border border-card-border">
                            <p className="text-sm whitespace-pre-wrap">{booking.feedback.content}</p>
                            <p className="text-xs text-muted mt-2">
                              작성일: {new Date(booking.feedback.created_at).toLocaleDateString("ko-KR")}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Amount */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <p className="text-sm font-semibold">
                          {booking.amount.toLocaleString()}원
                        </p>
                        <p className="text-xs text-muted">
                          신청일: {new Date(booking.created_at).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>

                      {/* Action buttons based on status */}
                      <div className="flex items-center gap-2">
                        {booking.status === "confirmed" && (
                          <Link
                            href={`/session/confirm/${booking.id}`}
                            className="px-3 py-1.5 text-xs font-medium bg-indigo-500/10 text-indigo-500 rounded-lg hover:bg-indigo-500/20 transition-colors"
                          >
                            상담 완료 확인
                          </Link>
                        )}
                        {booking.status === "completed" && !booking.has_review && booking.mentor_id && (
                          <Link
                            href={`/review/write?bookingId=${booking.id}&mentorId=${booking.mentor_id}`}
                            className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                          >
                            리뷰 작성
                          </Link>
                        )}
                        {booking.status === "completed" && booking.has_review && (
                          <span className="px-3 py-1.5 text-xs font-medium bg-green-500/10 text-green-500 rounded-lg">
                            리뷰 완료
                          </span>
                        )}
                        {(booking.status === "pending" || booking.status === "paid" || booking.status === "confirmed") && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancellingBookingId === booking.id}
                            className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {cancellingBookingId === booking.id ? "취소 중..." : "취소하기"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Back Link */}
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            홈으로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
}
