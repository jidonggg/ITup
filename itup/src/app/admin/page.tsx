"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Mentor, Consultation, Booking, SessionConfirmation, ProductType, Settlement, SettlementStatus } from "@/lib/supabase/types";
import { PRODUCT_INFO, PAGINATION } from "@/lib/constants";
import { ProductIcon } from "@/components/icons";

type TabType = "overview" | "mentors" | "consultations" | "analytics" | "user_analytics" | "verification" | "bookings" | "disputes" | "settlements" | "surveys" | "feedback";

interface MentorWithEmail extends Mentor {
  user_email?: string;
}

interface DailyStats {
  date: string;
  views: number;
  unique_sessions: number;
}

interface PageStats {
  path: string;
  views: number;
}

interface ClickStats {
  target: string;
  clicks: number;
}

interface BookingWithNames extends Booking {
  mentee_name?: string;
  mentor_name?: string;
  product_type?: ProductType;
}

interface DisputeItem {
  confirmation: SessionConfirmation;
  booking: Booking;
  mentee_name?: string;
  mentor_name?: string;
  product_type?: ProductType;
}

interface BookingStats {
  totalBookings: number;
  totalRevenue: number;
  pendingCount: number;
}

interface Stats {
  totalMentors: number;
  pendingMentors: number;
  totalConsultations: number;
  pendingConsultations: number;
  totalPageViews: number;
  totalSessions: number;
  pendingVerifications: number;
  disputeCount: number;
}

function AdminPageContent() {
  const { user, profile, isInitialized } = useAuth();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const middlewareError = searchParams.get("error");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Stats
  const [stats, setStats] = useState<Stats>({
    totalMentors: 0,
    pendingMentors: 0,
    totalConsultations: 0,
    pendingConsultations: 0,
    totalPageViews: 0,
    totalSessions: 0,
    pendingVerifications: 0,
    disputeCount: 0,
  });

  // Mentors
  const [mentors, setMentors] = useState<MentorWithEmail[]>([]);
  const [mentorFilter, setMentorFilter] = useState<"all" | "pending" | "approved">("all");
  const [updatingMentorId, setUpdatingMentorId] = useState<string | null>(null);

  // Consultations
  const [consultations, setConsultations] = useState<(Consultation & { mentor_name?: string })[]>([]);
  const [consultFilter, setConsultFilter] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all");

  // Payments (for refund)
  const [paymentMap, setPaymentMap] = useState<Record<string, { id: string; amount: number; status: string }>>({});

  // Refund modal
  const [refundTarget, setRefundTarget] = useState<{
    consultationId: string;
    paymentId: string;
    amount: number;
    userName: string;
  } | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);

  // Daily stats
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);

  // Analytics data
  const [pageStats, setPageStats] = useState<PageStats[]>([]);
  const [clickStats, setClickStats] = useState<ClickStats[]>([]);

  // v2: Mentor Verification
  const [pendingVerifications, setPendingVerifications] = useState<MentorWithEmail[]>([]);
  const [verifyingMentorId, setVerifyingMentorId] = useState<string | null>(null);

  // v2: Bookings
  const [bookings, setBookings] = useState<BookingWithNames[]>([]);
  const [bookingFilter, setBookingFilter] = useState<"all" | "pending" | "paid" | "confirmed" | "completed" | "cancelled" | "refunded">("all");
  const [bookingPage, setBookingPage] = useState(1);
  const [bookingStats, setBookingStats] = useState<BookingStats>({ totalBookings: 0, totalRevenue: 0, pendingCount: 0 });

  // v2: Disputes
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [resolvingDisputeId, setResolvingDisputeId] = useState<string | null>(null);
  const [disputeResolution, setDisputeResolution] = useState<{
    confirmationId: string;
    finalStatus: "completed" | "mentee_noshow" | "mentor_noshow" | "disputed";
  } | null>(null);

  // v2: Settlements
  const [adminSettlements, setAdminSettlements] = useState<(Settlement & { mentor_name?: string })[]>([]);
  const [settlementFilter, setSettlementFilter] = useState<SettlementStatus | "all">("all");
  const [processingSettlementId, setProcessingSettlementId] = useState<string | null>(null);

  // v2: Surveys
  const [surveys, setSurveys] = useState<any[]>([]);

  // Feedback
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [feedbackFilter, setFeedbackFilter] = useState<"all" | "bug" | "feature" | "opinion" | "new" | "in_progress">("all");
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);
  const [feedbackAdminNote, setFeedbackAdminNote] = useState("");
  const [updatingFeedbackId, setUpdatingFeedbackId] = useState<string | null>(null);

  // User Analytics (activity_logs)
  interface UserAnalyticsData {
    totalEvents: number;
    uniqueUsers: number;
    mostActivePage: string | null;
    eventsByCategory: Record<string, number>;
    eventsByPage: Record<string, number>;
    eventsByHour: number[];
    recentEvents: {
      id: string;
      user_id: string | null;
      category: string;
      action: string;
      label: string | null;
      page: string | null;
      metadata: Record<string, unknown> | null;
      created_at: string;
    }[];
    funnelData: {
      pageViews: number;
      step1: number;
      step2: number;
      step3: number;
      submitted: number;
    } | null;
  }
  const [userAnalytics, setUserAnalytics] = useState<UserAnalyticsData | null>(null);
  const [userAnalyticsDays, setUserAnalyticsDays] = useState<number>(7);
  const [userAnalyticsLoading, setUserAnalyticsLoading] = useState(false);

  // 미들웨어를 통과한 사용자(middlewareError 없음)는 관리자로 간주
  const isAdminUser = !middlewareError && !!user;

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAdminUser) {
      setIsLoading(false);
      return;
    }

    fetchAllData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAllData();
    }, 30000);

    return () => clearInterval(interval);
  }, [isInitialized, isAdminUser]);

  const fetchAllData = async () => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      // Fetch mentors with user email
      const { data: mentorsData } = await supabase
        .from("mentors")
        .select("*")
        .order("created_at", { ascending: false });

      if (mentorsData) {
        // Get user emails
        const userIds = mentorsData.map(m => m.user_id).filter(Boolean);
        let emailMap: Record<string, string> = {};

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, email")
            .in("id", userIds);

          if (profiles) {
            emailMap = Object.fromEntries(profiles.map(p => [p.id, p.email || ""]));
          }
        }

        const mentorsWithEmail = mentorsData.map(m => ({
          ...m,
          user_email: m.user_id ? emailMap[m.user_id] : undefined,
        }));

        setMentors(mentorsWithEmail);

        // Update stats
        const pendingCount = mentorsData.filter(m => !m.is_approved).length;
        setStats(prev => ({
          ...prev,
          totalMentors: mentorsData.length,
          pendingMentors: pendingCount,
        }));
      }

      // Fetch consultations with mentor names
      const { data: consultsData } = await supabase
        .from("consultations")
        .select("*")
        .order("created_at", { ascending: false });

      if (consultsData) {
        // Get mentor names
        const mentorIds = [...new Set(consultsData.map(c => c.mentor_id).filter(Boolean))];
        let mentorNameMap: Record<string, string> = {};

        if (mentorIds.length > 0) {
          const { data: mentorNames } = await supabase
            .from("mentors")
            .select("id, name")
            .in("id", mentorIds);

          if (mentorNames) {
            mentorNameMap = Object.fromEntries(mentorNames.map(m => [m.id, m.name]));
          }
        }

        const consultsWithMentor = consultsData.map(c => ({
          ...c,
          mentor_name: c.mentor_id ? mentorNameMap[c.mentor_id] : "미지정",
        }));

        setConsultations(consultsWithMentor);

        const pendingCount = consultsData.filter(c => c.status === "pending").length;
        setStats(prev => ({
          ...prev,
          totalConsultations: consultsData.length,
          pendingConsultations: pendingCount,
        }));
      }

      // Fetch payments (for refund mapping)
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("id, consultation_id, amount, status");

      if (paymentsData) {
        const pMap: Record<string, { id: string; amount: number; status: string }> = {};
        paymentsData.forEach(p => {
          if (p.consultation_id) {
            pMap[p.consultation_id] = { id: p.id, amount: p.amount, status: p.status };
          }
        });
        setPaymentMap(pMap);
      }

      // Fetch analytics
      const { count: totalViews } = await supabase
        .from("page_views")
        .select("*", { count: "exact", head: true });

      const { count: totalSessions } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true });

      setStats(prev => ({
        ...prev,
        totalPageViews: totalViews || 0,
        totalSessions: totalSessions || 0,
      }));

      // Daily stats (last 7 days)
      const { data: dailyData } = await supabase
        .from("page_views")
        .select("created_at, session_id")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(5000);

      if (dailyData) {
        const dailyCounts: Record<string, { views: number; sessions: Set<string> }> = {};
        dailyData.forEach((pv) => {
          const date = new Date(pv.created_at).toISOString().split("T")[0];
          if (!dailyCounts[date]) {
            dailyCounts[date] = { views: 0, sessions: new Set() };
          }
          dailyCounts[date].views++;
          dailyCounts[date].sessions.add(pv.session_id);
        });

        const dailyStatsList = Object.entries(dailyCounts)
          .map(([date, data]) => ({
            date,
            views: data.views,
            unique_sessions: data.sessions.size,
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setDailyStats(dailyStatsList);
      }

      // Page stats (top pages)
      const { data: pageData } = await supabase
        .from("page_views")
        .select("path")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1000);

      if (pageData) {
        const pageCounts: Record<string, number> = {};
        pageData.forEach((pv) => {
          const path = pv.path || "/";
          pageCounts[path] = (pageCounts[path] || 0) + 1;
        });

        const pageStatsList = Object.entries(pageCounts)
          .map(([path, views]) => ({ path, views }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 10);

        setPageStats(pageStatsList);
      }

      // Click stats (top actions)
      const { data: clickData } = await supabase
        .from("analytics_events")
        .select("event_name")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1000);

      if (clickData) {
        const clickCounts: Record<string, number> = {};
        clickData.forEach((ev) => {
          const target = ev.event_name || "unknown";
          clickCounts[target] = (clickCounts[target] || 0) + 1;
        });

        const clickStatsList = Object.entries(clickCounts)
          .map(([target, clicks]) => ({ target, clicks }))
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, 10);

        setClickStats(clickStatsList);
      }

      // =============================================
      // v2: Mentor Verification Queue
      // =============================================
      const { data: pendingMentorsData } = await supabase
        .from("mentors")
        .select("*")
        .eq("is_approved", false)
        .order("created_at", { ascending: false });

      if (pendingMentorsData) {
        const userIdsForVerify = pendingMentorsData.map(m => m.user_id).filter(Boolean);
        let verifyEmailMap: Record<string, string> = {};

        if (userIdsForVerify.length > 0) {
          const { data: verifyProfiles } = await supabase
            .from("profiles")
            .select("id, email")
            .in("id", userIdsForVerify);

          if (verifyProfiles) {
            verifyEmailMap = Object.fromEntries(verifyProfiles.map(p => [p.id, p.email || ""]));
          }
        }

        const pendingWithEmail = pendingMentorsData.map(m => ({
          ...m,
          user_email: m.user_id ? verifyEmailMap[m.user_id] : undefined,
        }));

        setPendingVerifications(pendingWithEmail);
        setStats(prev => ({
          ...prev,
          pendingVerifications: pendingMentorsData.length,
        }));
      }

      // =============================================
      // v2: Bookings
      // =============================================
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (bookingsData) {
        // Get mentee names
        const menteeIds = [...new Set(bookingsData.map(b => b.mentee_id).filter(Boolean))] as string[];
        let menteeNameMap: Record<string, string> = {};
        if (menteeIds.length > 0) {
          const { data: menteeProfiles } = await supabase
            .from("profiles")
            .select("id, name")
            .in("id", menteeIds);
          if (menteeProfiles) {
            menteeNameMap = Object.fromEntries(menteeProfiles.map(p => [p.id, p.name || "알 수 없음"]));
          }
        }

        // Get mentor names for bookings
        const bookingMentorIds = [...new Set(bookingsData.map(b => b.mentor_id).filter(Boolean))];
        let bookingMentorNameMap: Record<string, string> = {};
        if (bookingMentorIds.length > 0) {
          const { data: bMentorNames } = await supabase
            .from("mentors")
            .select("id, name")
            .in("id", bookingMentorIds);
          if (bMentorNames) {
            bookingMentorNameMap = Object.fromEntries(bMentorNames.map(m => [m.id, m.name]));
          }
        }

        // Get product types
        const productIds = [...new Set(bookingsData.map(b => b.product_id).filter(Boolean))] as string[];
        let productTypeMap: Record<string, ProductType> = {};
        if (productIds.length > 0) {
          const { data: productsData } = await supabase
            .from("products")
            .select("id, type")
            .in("id", productIds);
          if (productsData) {
            productTypeMap = Object.fromEntries(productsData.map(p => [p.id, p.type as ProductType]));
          }
        }

        const bookingsWithNames: BookingWithNames[] = bookingsData.map(b => ({
          ...b,
          mentee_name: b.mentee_id ? menteeNameMap[b.mentee_id] : "알 수 없음",
          mentor_name: bookingMentorNameMap[b.mentor_id] || "알 수 없음",
          product_type: b.product_id ? productTypeMap[b.product_id] : undefined,
        }));

        setBookings(bookingsWithNames);

        const totalRevenue = bookingsData
          .filter(b => b.status === "completed")
          .reduce((sum, b) => sum + (b.amount || 0), 0);
        const pendingBookings = bookingsData.filter(b => b.status === "pending").length;

        setBookingStats({
          totalBookings: bookingsData.length,
          totalRevenue,
          pendingCount: pendingBookings,
        });
      }

      // =============================================
      // v2: Disputes (session_confirmations with mismatches)
      // =============================================
      const { data: confirmationsData } = await supabase
        .from("session_confirmations")
        .select("*")
        .eq("final_status", "disputed")
        .is("resolved_by", null)
        .order("created_at", { ascending: false });

      if (confirmationsData) {
        // Filter for mismatches: both sides responded and at least one disagrees
        // mentor_confirmed/mentee_confirmed 값이 있고 (양측 모두 응답함)
        // 서로 불일치하거나 둘 중 하나라도 문제 상태(noshow, issue)인 경우 분쟁으로 처리
        const disputeConfirmations = confirmationsData.filter(sc => {
          // 양측 모두 응답해야 함
          if (!sc.mentor_confirmed || !sc.mentee_confirmed) return false;
          // 불일치하거나 문제 상태가 있는 경우
          const hasIssue =
            sc.mentor_confirmed !== sc.mentee_confirmed ||
            sc.mentor_confirmed.includes("noshow") ||
            sc.mentee_confirmed.includes("noshow") ||
            sc.mentor_confirmed === "issue" ||
            sc.mentee_confirmed === "issue";
          return hasIssue;
        });

        if (disputeConfirmations.length > 0) {
          const disputeBookingIds = disputeConfirmations.map(sc => sc.booking_id);
          const { data: disputeBookings } = await supabase
            .from("bookings")
            .select("*")
            .in("id", disputeBookingIds);

          if (disputeBookings) {
            const disputeBookingMap: Record<string, Booking> = {};
            disputeBookings.forEach(b => { disputeBookingMap[b.id] = b; });

            // Get names for dispute parties
            const dMenteeIds = [...new Set(disputeBookings.map(b => b.mentee_id).filter(Boolean))] as string[];
            const dMentorIds = [...new Set(disputeBookings.map(b => b.mentor_id).filter(Boolean))];
            let dMenteeNameMap: Record<string, string> = {};
            let dMentorNameMap: Record<string, string> = {};
            let dProductTypeMap: Record<string, ProductType> = {};

            if (dMenteeIds.length > 0) {
              const { data: dMenteeProfiles } = await supabase.from("profiles").select("id, name").in("id", dMenteeIds);
              if (dMenteeProfiles) dMenteeNameMap = Object.fromEntries(dMenteeProfiles.map(p => [p.id, p.name || "알 수 없음"]));
            }
            if (dMentorIds.length > 0) {
              const { data: dMentorNames } = await supabase.from("mentors").select("id, name").in("id", dMentorIds);
              if (dMentorNames) dMentorNameMap = Object.fromEntries(dMentorNames.map(m => [m.id, m.name]));
            }
            const dProductIds = [...new Set(disputeBookings.map(b => b.product_id).filter(Boolean))] as string[];
            if (dProductIds.length > 0) {
              const { data: dProducts } = await supabase.from("products").select("id, type").in("id", dProductIds);
              if (dProducts) dProductTypeMap = Object.fromEntries(dProducts.map(p => [p.id, p.type as ProductType]));
            }

            const disputeItems: DisputeItem[] = disputeConfirmations
              .filter(sc => disputeBookingMap[sc.booking_id])
              .map(sc => {
                const booking = disputeBookingMap[sc.booking_id];
                return {
                  confirmation: sc,
                  booking,
                  mentee_name: booking.mentee_id ? dMenteeNameMap[booking.mentee_id] : "알 수 없음",
                  mentor_name: dMentorNameMap[booking.mentor_id] || "알 수 없음",
                  product_type: booking.product_id ? dProductTypeMap[booking.product_id] : undefined,
                };
              });

            setDisputes(disputeItems);
            setStats(prev => ({
              ...prev,
              disputeCount: disputeItems.length,
            }));
          }
        } else {
          setDisputes([]);
          setStats(prev => ({ ...prev, disputeCount: 0 }));
        }
      }
      // =============================================
      // v2: Settlements
      // =============================================
      const { data: settlementsData } = await supabase
        .from("settlements")
        .select("*")
        .order("created_at", { ascending: false });

      if (settlementsData) {
        const sMentorIds = [...new Set(settlementsData.map(s => s.mentor_id).filter(Boolean))];
        let sMentorNameMap: Record<string, string> = {};
        if (sMentorIds.length > 0) {
          const { data: sMentorNames } = await supabase
            .from("mentors")
            .select("id, name")
            .in("id", sMentorIds);
          if (sMentorNames) {
            sMentorNameMap = Object.fromEntries(sMentorNames.map(m => [m.id, m.name]));
          }
        }

        setAdminSettlements(settlementsData.map(s => ({
          ...s,
          mentor_name: sMentorNameMap[s.mentor_id] || "알 수 없음",
        })));
      }

      // =============================================
      // Fetch mentor session surveys
      // =============================================
      try {
        const { data: surveyData } = await supabase
          .from("mentor_session_surveys")
          .select("*")
          .order("created_at", { ascending: false });
        if (surveyData) setSurveys(surveyData);
      } catch {
        // Table may not exist
      }

      // =============================================
      // Fetch user feedback
      // =============================================
      try {
        const { data: feedbackData } = await supabase
          .from("user_feedback")
          .select("*")
          .order("created_at", { ascending: false });
        if (feedbackData) setFeedbackList(feedbackData);
      } catch {
        // Table may not exist
      }

    } catch (error) {
      console.error("[Admin] fetchAllData error:", error);
      showToast("데이터를 불러오는 중 오류가 발생했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================
  // User Analytics — fetch from /api/analytics/stats
  // =============================================
  const fetchUserAnalytics = async (days: number) => {
    setUserAnalyticsLoading(true);
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const res = await fetch(`/api/analytics/stats?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserAnalytics(data);
      }
    } catch {
      // Silently fail
    } finally {
      setUserAnalyticsLoading(false);
    }
  };

  // Fetch user analytics when the tab is opened or days filter changes
  useEffect(() => {
    if (activeTab === "user_analytics" && isAdminUser) {
      fetchUserAnalytics(userAnalyticsDays);
    }
  }, [activeTab, userAnalyticsDays, isAdminUser]);

  // 서버 API를 통한 관리자 작업 (보안 강화)
  const getAuthToken = async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  };

  const handleApproveMentor = async (mentorId: string, approve: boolean) => {
    if (!confirm(approve ? "이 멘토를 승인하시겠습니까?" : "이 멘토를 보류 처리하시겠습니까?")) return;
    setUpdatingMentorId(mentorId);

    try {
      const token = await getAuthToken();
      if (!token) {
        showToast("인증이 필요합니다.", "error");
        return;
      }

      const response = await fetch("/api/admin/mentors", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          mentorId,
          action: approve ? "approve" : "reject",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        showToast(result.error || "멘토 상태 변경 중 오류가 발생했습니다.", "error");
        return;
      }

      showToast(approve ? "멘토가 승인되었습니다." : "멘토가 보류 처리되었습니다.", "success");

      // Update local state
      const targetMentor = mentors.find(m => m.id === mentorId);
      const wasApproved = targetMentor?.is_approved ?? false;

      setMentors(prev => prev.map(m =>
        m.id === mentorId ? { ...m, is_approved: approve } : m
      ));

      // pendingMentors 카운트 정확하게 업데이트
      // approve=true: pending -> approved (-1)
      // approve=false: approved -> pending (+1)
      // 이미 같은 상태면 변경 없음
      if (wasApproved !== approve) {
        setStats(prev => ({
          ...prev,
          pendingMentors: approve
            ? Math.max(0, prev.pendingMentors - 1)
            : prev.pendingMentors + 1,
        }));
      }

    } catch (error) {
      showToast("오류가 발생했습니다.", "error");
    } finally {
      setUpdatingMentorId(null);
    }
  };

  const handleDeleteMentor = async (mentorId: string) => {
    if (!confirm("정말 이 멘토를 삭제하시겠습니까?")) return;

    try {
      const token = await getAuthToken();
      if (!token) {
        showToast("인증이 필요합니다.", "error");
        return;
      }

      const response = await fetch(`/api/admin/mentors?mentorId=${mentorId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        showToast(result.error || "멘토 삭제 중 오류가 발생했습니다.", "error");
        return;
      }

      showToast("멘토가 삭제되었습니다.", "success");
      const deletedMentor = mentors.find(m => m.id === mentorId);
      const wasPending = deletedMentor && !deletedMentor.is_approved;
      setMentors(prev => prev.filter(m => m.id !== mentorId));
      setStats(prev => ({
        ...prev,
        totalMentors: prev.totalMentors - 1,
        ...(wasPending ? { pendingMentors: Math.max(0, prev.pendingMentors - 1) } : {}),
      }));
    } catch (error) {
      showToast("오류가 발생했습니다.", "error");
    }
  };

  const handleRefund = async () => {
    if (!refundTarget) return;
    setRefundLoading(true);

    try {
      const token = await getAuthToken();
      if (!token) {
        showToast("인증이 필요해요.", "error");
        return;
      }

      const response = await fetch("/api/payment/refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentId: refundTarget.paymentId,
          reason: refundReason || "관리자 환불 처리",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        showToast(result.error || "환불 처리 중 오류가 발생했어요.", "error");
        return;
      }

      showToast(result.message || "환불이 완료됐어요.", "success");

      // Update local state
      setConsultations(prev => prev.map(c =>
        c.id === refundTarget.consultationId ? { ...c, status: "cancelled" as const } : c
      ));
      setPaymentMap(prev => {
        const updated = { ...prev };
        if (updated[refundTarget.consultationId]) {
          updated[refundTarget.consultationId] = {
            ...updated[refundTarget.consultationId],
            status: "refunded",
          };
        }
        return updated;
      });
      setRefundTarget(null);
      setRefundReason("");
    } catch (error) {
      showToast("환불 처리 중 오류가 발생했어요.", "error");
    } finally {
      setRefundLoading(false);
    }
  };

  // =============================================
  // v2: Mentor Verification Handlers
  // =============================================
  const handleVerifyMentor = async (mentorId: string, action: "approve" | "reject") => {
    if (!confirm(action === "approve" ? "이 멘토의 검증을 승인하시겠습니까?" : "이 멘토의 검증을 거절하시겠습니까?")) return;

    let reason = "";
    if (action === "reject") {
      reason = prompt("거절 사유를 입력해주세요:") || "";
      if (!reason) return; // 사유 미입력 시 취소
    }

    setVerifyingMentorId(mentorId);
    try {
      const token = await getAuthToken();
      if (!token) {
        showToast("인증이 필요합니다.", "error");
        return;
      }

      // 서버 API를 통한 검증 처리 (보안 강화)
      const response = await fetch("/api/admin/mentors", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ mentorId, action: action === "approve" ? "verify_approve" : "verify_reject", reason }),
      });

      const result = await response.json();

      if (!response.ok) {
        showToast(result.error || "멘토 검증 처리 중 오류가 발생했습니다.", "error");
        return;
      }

      if (action === "approve") {
        showToast("멘토가 검증 승인되었습니다.", "success");
      } else {
        showToast("멘토 검증이 거절되었습니다.", "success");
      }

      // Update local state
      setPendingVerifications(prev => prev.filter(m => m.id !== mentorId));
      setStats(prev => ({
        ...prev,
        pendingVerifications: Math.max(0, prev.pendingVerifications - 1),
      }));

      // Also update the mentors list
      if (action === "approve") {
        setMentors(prev => prev.map(m =>
          m.id === mentorId ? { ...m, is_approved: true, is_verified: true } : m
        ));
      } else {
        setMentors(prev => prev.map(m =>
          m.id === mentorId ? { ...m, is_approved: false } : m
        ));
      }
    } catch (error) {
      showToast("오류가 발생했습니다.", "error");
    } finally {
      setVerifyingMentorId(null);
    }
  };

  // =============================================
  // v2: Dispute Resolution Handler
  // =============================================
  const handleResolveDispute = async (confirmationId: string, finalStatus: "completed" | "mentee_noshow" | "mentor_noshow" | "disputed") => {
    setResolvingDisputeId(confirmationId);
    try {
      const token = await getAuthToken();
      if (!token) {
        showToast("인증이 필요합니다.", "error");
        return;
      }

      const dispute = disputes.find(d => d.confirmation.id === confirmationId);

      const res = await fetch("/api/admin/disputes", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          confirmationId,
          finalStatus,
          bookingId: dispute?.booking.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "분쟁 해결 중 오류가 발생했습니다.", "error");
        return;
      }

      showToast(finalStatus === "disputed" ? "분쟁 상태가 유지됩니다." : "분쟁이 해결되었습니다.", "success");

      // Update local state
      if (finalStatus === "disputed") {
        // "disputed" keeps the dispute active (no resolved_at), just update the status
        setDisputes(prev => prev.map(d =>
          d.confirmation.id === confirmationId
            ? { ...d, confirmation: { ...d.confirmation, final_status: finalStatus } }
            : d
        ));
      } else {
        // "resolved" / "mentor_noshow" etc. fully resolve — remove from list
        setDisputes(prev => prev.filter(d => d.confirmation.id !== confirmationId));
        setStats(prev => ({
          ...prev,
          disputeCount: Math.max(0, prev.disputeCount - 1),
        }));
      }
      setDisputeResolution(null);
    } catch {
      showToast("오류가 발생했습니다.", "error");
    } finally {
      setResolvingDisputeId(null);
    }
  };

  // =============================================
  // Feedback handlers
  // =============================================
  const handleUpdateFeedback = async (feedbackId: string, status?: string, adminNote?: string) => {
    setUpdatingFeedbackId(feedbackId);
    try {
      const token = await getAuthToken();
      if (!token) {
        showToast("인증이 필요합니다.", "error");
        return;
      }

      const response = await fetch("/api/feedback", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: feedbackId,
          ...(status ? { status } : {}),
          ...(adminNote !== undefined ? { admin_note: adminNote } : {}),
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        showToast(result.error || "업데이트에 실패했습니다.", "error");
        return;
      }

      showToast("피드백이 업데이트되었습니다.", "success");

      // Update local state
      setFeedbackList(prev => prev.map(f =>
        f.id === feedbackId
          ? {
              ...f,
              ...(status ? { status } : {}),
              ...(adminNote !== undefined ? { admin_note: adminNote } : {}),
            }
          : f
      ));
    } catch {
      showToast("오류가 발생했습니다.", "error");
    } finally {
      setUpdatingFeedbackId(null);
    }
  };

  const filteredFeedback = feedbackList.filter(f => {
    if (feedbackFilter === "all") return true;
    if (feedbackFilter === "bug" || feedbackFilter === "feature" || feedbackFilter === "opinion") return f.type === feedbackFilter;
    if (feedbackFilter === "new") return f.status === "new";
    if (feedbackFilter === "in_progress") return f.status === "in_progress";
    return true;
  });

  const feedbackStats = {
    total: feedbackList.length,
    bug: feedbackList.filter(f => f.type === "bug").length,
    feature: feedbackList.filter(f => f.type === "feature").length,
    opinion: feedbackList.filter(f => f.type === "opinion").length,
    new: feedbackList.filter(f => f.status === "new").length,
    in_progress: feedbackList.filter(f => f.status === "in_progress").length,
    resolved: feedbackList.filter(f => f.status === "resolved").length,
    closed: feedbackList.filter(f => f.status === "closed").length,
  };

  const getFeedbackTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      bug: "bg-red-500/20 text-red-400",
      feature: "bg-blue-500/20 text-blue-400",
      opinion: "bg-gray-500/20 text-muted",
    };
    const labels: Record<string, string> = {
      bug: "오류",
      feature: "기능 제안",
      opinion: "의견",
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full ${styles[type] || ""}`}>
        {labels[type] || type}
      </span>
    );
  };

  const getFeedbackStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: "bg-yellow-500/20 text-yellow-500",
      in_progress: "bg-blue-500/20 text-blue-500",
      resolved: "bg-green-500/20 text-green-500",
      closed: "bg-gray-500/20 text-muted",
    };
    const labels: Record<string, string> = {
      new: "새로운",
      in_progress: "처리중",
      resolved: "해결",
      closed: "닫힘",
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full ${styles[status] || ""}`}>
        {labels[status] || status}
      </span>
    );
  };

  // =============================================
  // v2: Booking helpers
  // =============================================
  const filteredBookings = bookings.filter(b => {
    if (bookingFilter === "all") return true;
    return b.status === bookingFilter;
  });

  const bookingsPerPage = PAGINATION.ADMIN_PAGE_SIZE;
  const totalBookingPages = Math.max(1, Math.ceil(filteredBookings.length / bookingsPerPage));
  const paginatedBookings = filteredBookings.slice(
    (bookingPage - 1) * bookingsPerPage,
    bookingPage * bookingsPerPage
  );

  const getProductLabel = (type?: ProductType) => {
    if (!type) return "-";
    const info = PRODUCT_INFO[type];
    return info ? info.name : type;
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
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || ""}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getConfirmationLabel = (value: string | null) => {
    if (!value) return "미확인";
    const labels: Record<string, string> = {
      completed: "완료 확인",
      mentee_noshow: "멘티 노쇼",
      mentor_noshow: "멘토 노쇼",
      issue: "문제 발생",
    };
    return labels[value] || value;
  };

  const getVerificationMethodLabel = (method: string | null) => {
    if (!method) return "-";
    const labels: Record<string, string> = {
      email: "이메일 인증",
      document: "서류 인증",
    };
    return labels[method] || method;
  };

  const filteredMentors = mentors.filter(m => {
    if (mentorFilter === "pending") return !m.is_approved;
    if (mentorFilter === "approved") return m.is_approved;
    return true;
  });

  const filteredConsultations = consultations.filter(c => {
    if (consultFilter === "all") return true;
    // "취소/환불" 필터: cancelled와 refunded 모두 표시
    if (consultFilter === "cancelled") return c.status === "cancelled" || (c.status as string) === "refunded";
    return c.status === consultFilter;
  });

  const getStatusBadge = (status: string, type: "mentor" | "consult") => {
    if (type === "mentor") {
      return status ? (
        <span className="px-2 py-1 bg-green-500/20 text-green-500 text-xs rounded-full">승인됨</span>
      ) : (
        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs rounded-full">대기중</span>
      );
    }

    const styles: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-500",
      confirmed: "bg-indigo-500/20 text-indigo-500",
      completed: "bg-green-500/20 text-green-500",
      cancelled: "bg-red-500/20 text-red-500",
      refunded: "bg-orange-500/20 text-orange-500",
    };
    const labels: Record<string, string> = {
      pending: "대기중",
      confirmed: "확정",
      completed: "완료",
      cancelled: "취소",
      refunded: "환불",
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || ""}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdminUser) {
    const errorInfo = middlewareError === "config"
      ? {
          icon: (
            <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
          iconBg: "bg-orange-500/20",
          title: "관리자 설정 필요",
          description: "ADMIN_EMAILS 환경변수가 설정되지 않았습니다. Vercel 대시보드에서 환경변수를 확인해주세요.",
        }
      : middlewareError === "unauthenticated" || !user
      ? {
          icon: (
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ),
          iconBg: "bg-blue-500/20",
          title: "관리자 로그인이 필요합니다",
          description: "관리자 페이지에 접근하려면 먼저 로그인해주세요.",
        }
      : {
          icon: (
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          iconBg: "bg-red-500/20",
          title: "관리자 권한이 필요합니다",
          description: user
            ? `현재 로그인된 계정(${user.email})에는 관리자 권한이 없습니다.`
            : "관리자만 접근할 수 있는 페이지입니다.",
        };

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card-bg border border-card-border rounded-2xl p-8 text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${errorInfo.iconBg} flex items-center justify-center`}>
            {errorInfo.icon}
          </div>
          <h2 className="text-2xl font-bold mb-2">{errorInfo.title}</h2>
          <p className="text-muted mb-6">{errorInfo.description}</p>
          <div className="flex flex-col gap-3">
            {(middlewareError === "unauthenticated" || !user) && (
              <Link
                href="/login?redirect=/admin"
                className="inline-block px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium"
              >
                로그인하기
              </Link>
            )}
            <Link
              href="/"
              className={`inline-block px-6 py-2.5 rounded-full font-medium ${
                middlewareError === "unauthenticated" || !user
                  ? "border border-card-border text-muted hover:text-foreground"
                  : "bg-gradient-to-r from-primary to-primary-dark text-white"
              }`}
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-muted text-sm">관리자 데이터 로딩 중...</p>
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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <span className="text-white text-sm font-bold">A</span>
              </div>
              <span className="font-bold">커피챗 Admin</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">{user.email}</span>
            <Link href="/" className="text-sm text-primary hover:underline">
              사이트로 이동
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">관리자 대시보드</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <div className="bg-card-bg border border-card-border rounded-xl p-4">
            <p className="text-xs text-muted mb-1">총 멘토</p>
            <p className="text-2xl font-bold text-primary">{stats.totalMentors}</p>
          </div>
          <div className="bg-card-bg border border-card-border rounded-xl p-4">
            <p className="text-xs text-muted mb-1">승인 대기</p>
            <p className="text-2xl font-bold text-yellow-500">{stats.pendingMentors}</p>
          </div>
          <div className="bg-card-bg border border-card-border rounded-xl p-4">
            <p className="text-xs text-muted mb-1">총 상담</p>
            <p className="text-2xl font-bold text-accent">{stats.totalConsultations}</p>
          </div>
          <div className="bg-card-bg border border-card-border rounded-xl p-4">
            <p className="text-xs text-muted mb-1">대기중 상담</p>
            <p className="text-2xl font-bold text-orange-500">{stats.pendingConsultations}</p>
          </div>
          <div className="bg-card-bg border border-card-border rounded-xl p-4">
            <p className="text-xs text-muted mb-1">페이지뷰</p>
            <p className="text-2xl font-bold text-green-500">{stats.totalPageViews}</p>
          </div>
          <div className="bg-card-bg border border-card-border rounded-xl p-4">
            <p className="text-xs text-muted mb-1">세션</p>
            <p className="text-2xl font-bold text-blue-500">{stats.totalSessions}</p>
          </div>
          <div className="bg-card-bg border border-card-border rounded-xl p-4">
            <p className="text-xs text-muted mb-1">검증 대기</p>
            <p className="text-2xl font-bold text-indigo-500">{stats.pendingVerifications}</p>
          </div>
          <div className="bg-card-bg border border-card-border rounded-xl p-4">
            <p className="text-xs text-muted mb-1">분쟁</p>
            <p className="text-2xl font-bold text-red-500">{stats.disputeCount}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-card-border overflow-x-auto">
          {[
            { id: "overview" as TabType, label: "개요" },
            { id: "mentors" as TabType, label: `멘토 관리 ${stats.pendingMentors > 0 ? `(${stats.pendingMentors})` : ""}` },
            { id: "consultations" as TabType, label: "상담 관리" },
            { id: "analytics" as TabType, label: "분석" },
            { id: "user_analytics" as TabType, label: "유저 분석" },
            { id: "verification" as TabType, label: `멘토 검증 ${stats.pendingVerifications > 0 ? `(${stats.pendingVerifications})` : ""}` },
            { id: "bookings" as TabType, label: "예약 관리" },
            { id: "disputes" as TabType, label: `분쟁 관리 ${stats.disputeCount > 0 ? `(${stats.disputeCount})` : ""}` },
            { id: "settlements" as TabType, label: "정산 관리" },
            { id: "surveys" as TabType, label: "품질 설문" },
            { id: "feedback" as TabType, label: `피드백 ${feedbackList.length > 0 ? `(${feedbackList.filter(f => f.status === "new").length || ""})` : ""}`.trim() },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Actions */}
            {stats.pendingMentors > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                    <div>
                      <p className="font-medium">승인 대기중인 멘토가 있습니다</p>
                      <p className="text-sm text-muted">{stats.pendingMentors}명의 멘토가 승인을 기다리고 있습니다</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("mentors")}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-yellow-600"
                  >
                    확인하기
                  </button>
                </div>
              </div>
            )}

            {stats.pendingVerifications > 0 && (
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                    <div>
                      <p className="font-medium">검증 대기중인 멘토가 있습니다</p>
                      <p className="text-sm text-muted">{stats.pendingVerifications}명의 멘토가 검증을 기다리고 있습니다</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("verification")}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-indigo-600"
                  >
                    확인하기
                  </button>
                </div>
              </div>
            )}

            {stats.disputeCount > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                    <div>
                      <p className="font-medium">해결 대기중인 분쟁이 있습니다</p>
                      <p className="text-sm text-muted">{stats.disputeCount}건의 분쟁이 관리자 결정을 기다리고 있습니다</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("disputes")}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-red-600"
                  >
                    확인하기
                  </button>
                </div>
              </div>
            )}

            {/* Daily Chart */}
            <div className="bg-card-bg border border-card-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">일별 트래픽 (최근 7일)</h2>
              {dailyStats.length > 0 ? (
                <div className="space-y-2">
                  {dailyStats.map((day) => (
                    <div key={day.date} className="flex items-center gap-4">
                      <span className="w-24 text-sm text-muted">{new Date(day.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}</span>
                      <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent"
                          style={{
                            width: `${Math.min(100, (day.views / Math.max(...dailyStats.map((d) => d.views), 1)) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="w-20 text-sm text-right">{day.views} 뷰</span>
                      <span className="w-20 text-sm text-right text-muted">{day.unique_sessions} 세션</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-8">데이터가 없습니다.</p>
              )}
            </div>
          </div>
        )}

        {/* Mentors Tab */}
        {activeTab === "mentors" && (
          <div className="space-y-4">
            {/* Filter */}
            <div className="flex gap-2">
              {[
                { value: "all" as const, label: "전체" },
                { value: "pending" as const, label: "대기중" },
                { value: "approved" as const, label: "승인됨" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setMentorFilter(f.value)}
                  className={`px-4 py-2 rounded-full text-sm cursor-pointer transition-colors ${
                    mentorFilter === f.value
                      ? "bg-primary text-white"
                      : "bg-card-bg border border-card-border text-muted hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Mentor List */}
            <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">멘토</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">회사/직책</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">경력</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">상태</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">등록일</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMentors.map((mentor) => (
                    <tr key={mentor.id} className="border-t border-card-border">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{mentor.name}</p>
                          <p className="text-xs text-muted">{mentor.user_email || "이메일 없음"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{mentor.company}</p>
                        <p className="text-xs text-muted">{mentor.role}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">{mentor.experience}</td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(mentor.is_approved ? "approved" : "", "mentor")}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">
                        {new Date(mentor.created_at).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {!mentor.is_approved ? (
                            <button
                              onClick={() => handleApproveMentor(mentor.id, true)}
                              disabled={updatingMentorId === mentor.id}
                              className="px-3 py-1 bg-green-500 text-white rounded text-xs cursor-pointer hover:bg-green-600 disabled:opacity-50"
                            >
                              {updatingMentorId === mentor.id ? "..." : "승인"}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApproveMentor(mentor.id, false)}
                              disabled={updatingMentorId === mentor.id}
                              className="px-3 py-1 bg-yellow-500 text-white rounded text-xs cursor-pointer hover:bg-yellow-600 disabled:opacity-50"
                            >
                              {updatingMentorId === mentor.id ? "..." : "보류"}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteMentor(mentor.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded text-xs cursor-pointer hover:bg-red-600"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredMentors.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted">
                        {mentorFilter === "pending" ? "대기중인 멘토가 없습니다." : "멘토가 없습니다."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Consultations Tab */}
        {activeTab === "consultations" && (
          <div className="space-y-4">
            {/* Filter */}
            <div className="flex gap-2">
              {[
                { value: "all" as const, label: "전체" },
                { value: "pending" as const, label: "대기중" },
                { value: "confirmed" as const, label: "확정" },
                { value: "completed" as const, label: "완료" },
                { value: "cancelled" as const, label: "취소/환불" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setConsultFilter(f.value)}
                  className={`px-4 py-2 rounded-full text-sm cursor-pointer transition-colors ${
                    consultFilter === f.value
                      ? "bg-primary text-white"
                      : "bg-card-bg border border-card-border text-muted hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Consultation List */}
            <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">신청자</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">멘토</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">관심 분야</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">상태</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">신청일</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConsultations.map((consult) => (
                    <tr key={consult.id} className="border-t border-card-border">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{consult.user_name}</p>
                          <p className="text-xs text-muted">{consult.user_email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{consult.mentor_name || "미지정"}</td>
                      <td className="px-4 py-3 text-sm">{consult.interest || "-"}</td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(consult.status, "consult")}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">
                        {new Date(consult.created_at).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {paymentMap[consult.id] &&
                          paymentMap[consult.id].status === "completed" &&
                          (consult.status === "completed" || consult.status === "confirmed") ? (
                          <button
                            onClick={() => setRefundTarget({
                              consultationId: consult.id,
                              paymentId: paymentMap[consult.id].id,
                              amount: paymentMap[consult.id].amount,
                              userName: consult.user_name,
                            })}
                            className="px-3 py-1 bg-red-500 text-white rounded text-xs cursor-pointer hover:bg-red-600"
                          >
                            환불
                          </button>
                        ) : paymentMap[consult.id]?.status === "refunded" ? (
                          <span className="text-xs text-purple-500">환불됨</span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  {filteredConsultations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted">
                        상담 신청이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card-bg border border-card-border rounded-xl p-4">
                <p className="text-xs text-muted mb-1">총 페이지뷰</p>
                <p className="text-2xl font-bold text-primary">{stats.totalPageViews.toLocaleString()}</p>
              </div>
              <div className="bg-card-bg border border-card-border rounded-xl p-4">
                <p className="text-xs text-muted mb-1">총 세션</p>
                <p className="text-2xl font-bold text-accent">{stats.totalSessions.toLocaleString()}</p>
              </div>
              <div className="bg-card-bg border border-card-border rounded-xl p-4">
                <p className="text-xs text-muted mb-1">평균 페이지/세션</p>
                <p className="text-2xl font-bold text-green-500">
                  {stats.totalSessions > 0
                    ? (stats.totalPageViews / stats.totalSessions).toFixed(1)
                    : "0"}
                </p>
              </div>
              <div className="bg-card-bg border border-card-border rounded-xl p-4">
                <p className="text-xs text-muted mb-1">상담 전환율</p>
                <p className="text-2xl font-bold text-blue-500">
                  {stats.totalSessions > 0
                    ? ((stats.totalConsultations / stats.totalSessions) * 100).toFixed(1)
                    : "0"}%
                </p>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Top Pages */}
              <div className="bg-card-bg border border-card-border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">인기 페이지 (Top 10)</h3>
                {pageStats.length > 0 ? (
                  <div className="space-y-3">
                    {pageStats.map((page, idx) => (
                      <div key={page.path} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{page.path}</p>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-accent"
                              style={{
                                width: `${(page.views / (pageStats[0]?.views || 1)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-muted">{page.views.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center py-8">데이터가 없습니다.</p>
                )}
              </div>

              {/* Top Actions */}
              <div className="bg-card-bg border border-card-border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">사용자 클릭 분석 (Top 10)</h3>
                {clickStats.length > 0 ? (
                  <div className="space-y-3">
                    {clickStats.map((click, idx) => (
                      <div key={click.target} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{click.target}</p>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-gradient-to-r from-accent to-primary"
                              style={{
                                width: `${(click.clicks / (clickStats[0]?.clicks || 1)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-muted">{click.clicks.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center py-8">데이터가 없습니다.</p>
                )}
              </div>
            </div>

            {/* Daily Traffic Chart */}
            <div className="bg-card-bg border border-card-border rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">일별 트래픽 (최근 7일)</h3>
              {dailyStats.length > 0 ? (
                <div className="space-y-2">
                  {dailyStats.map((day) => (
                    <div key={day.date} className="flex items-center gap-4">
                      <span className="w-28 text-sm text-muted">{new Date(day.date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}</span>
                      <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent"
                          style={{
                            width: `${Math.min(100, (day.views / Math.max(...dailyStats.map((d) => d.views), 1)) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="w-20 text-sm text-right">{day.views} 뷰</span>
                      <span className="w-20 text-sm text-right text-muted">{day.unique_sessions} 세션</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-8">데이터가 없습니다.</p>
              )}
            </div>
          </div>
        )}

        {/* =============================================
            v2: Mentor Verification Tab
            ============================================= */}
        {activeTab === "verification" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">멘토 검증 대기 목록</h2>
              <span className="text-sm text-muted">
                {pendingVerifications.length}건 대기중
              </span>
            </div>

            <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">멘토</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">회사</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">인증 이메일</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">인증 방법</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">경력 서류</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">검증 상태</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">신청일</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingVerifications.map((mentor) => (
                    <tr key={mentor.id} className="border-t border-card-border">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{mentor.name}</p>
                          <p className="text-xs text-muted">{mentor.user_email || "이메일 없음"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{mentor.company}</p>
                        <p className="text-xs text-muted">{mentor.role}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {mentor.verified_company || <span className="text-muted">-</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-500">
                          {getVerificationMethodLabel(mentor.verification_method)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {mentor.document_url ? (
                          <button
                            onClick={async () => {
                              try {
                                const token = await getAuthToken();
                                if (!token) { showToast("인증 오류", "error"); return; }
                                const res = await fetch("/api/verification/document-url", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({ storagePath: mentor.document_url }),
                                });
                                const data = await res.json();
                                if (res.ok && data.signedUrl) {
                                  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
                                } else {
                                  showToast(data.error || "서류 열기 실패", "error");
                                }
                              } catch {
                                showToast("서류 열기 중 오류 발생", "error");
                              }
                            }}
                            className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors cursor-pointer"
                          >
                            서류 보기
                          </button>
                        ) : (
                          <span className="text-xs text-muted">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-500">
                          대기중
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">
                        {new Date(mentor.created_at).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleVerifyMentor(mentor.id, "approve")}
                            disabled={verifyingMentorId === mentor.id}
                            className="px-3 py-1 bg-green-500 text-white rounded text-xs cursor-pointer hover:bg-green-600 disabled:opacity-50 transition-colors"
                          >
                            {verifyingMentorId === mentor.id ? "..." : "승인"}
                          </button>
                          <button
                            onClick={() => handleVerifyMentor(mentor.id, "reject")}
                            disabled={verifyingMentorId === mentor.id}
                            className="px-3 py-1 bg-red-500 text-white rounded text-xs cursor-pointer hover:bg-red-600 disabled:opacity-50 transition-colors"
                          >
                            {verifyingMentorId === mentor.id ? "..." : "거절"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingVerifications.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted">
                        검증 대기중인 멘토가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =============================================
            v2: Bookings Tab
            ============================================= */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            {/* Booking Stats Summary */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-card-bg border border-card-border rounded-xl p-4">
                <p className="text-xs text-muted mb-1">총 예약</p>
                <p className="text-2xl font-bold text-primary">{bookingStats.totalBookings.toLocaleString()}</p>
              </div>
              <div className="bg-card-bg border border-card-border rounded-xl p-4">
                <p className="text-xs text-muted mb-1">총 매출</p>
                <p className="text-2xl font-bold text-green-500">{bookingStats.totalRevenue.toLocaleString()}원</p>
              </div>
              <div className="bg-card-bg border border-card-border rounded-xl p-4">
                <p className="text-xs text-muted mb-1">대기중</p>
                <p className="text-2xl font-bold text-yellow-500">{bookingStats.pendingCount}</p>
              </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "all" as const, label: "전체" },
                { value: "pending" as const, label: "대기중" },
                { value: "paid" as const, label: "결제완료" },
                { value: "confirmed" as const, label: "확정" },
                { value: "completed" as const, label: "완료" },
                { value: "cancelled" as const, label: "취소" },
                { value: "refunded" as const, label: "환불됨" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => { setBookingFilter(f.value); setBookingPage(1); }}
                  className={`px-4 py-2 rounded-full text-sm cursor-pointer transition-colors ${
                    bookingFilter === f.value
                      ? "bg-primary text-white"
                      : "bg-card-bg border border-card-border text-muted hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Booking List */}
            <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">멘티</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">멘토</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">상품</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">예약일시</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">금액</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">상태</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-muted">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBookings.map((booking) => (
                    <tr key={booking.id} className="border-t border-card-border">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{booking.mentee_name || "알 수 없음"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{booking.mentor_name || "알 수 없음"}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {getProductLabel(booking.product_type)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">
                        {booking.scheduled_at
                          ? new Date(booking.scheduled_at).toLocaleString("ko-KR", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {(booking.amount || 0).toLocaleString()}원
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getBookingStatusBadge(booking.status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(booking.status === "pending" || booking.status === "paid") && (
                          <button
                            onClick={async () => {
                              if (!confirm("이 예약을 취소하시겠습니까?")) return;
                              try {
                                const token = await getAuthToken();
                                if (!token) { showToast("인증 오류", "error"); return; }
                                const res = await fetch("/api/booking/cancel", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                  body: JSON.stringify({ bookingId: booking.id, reason: "관리자 취소" }),
                                });
                                if (res.ok) {
                                  showToast("예약이 취소되었습니다.", "success");
                                  fetchAllData();
                                } else {
                                  const data = await res.json();
                                  showToast(data.error || "취소 실패", "error");
                                }
                              } catch { showToast("취소 중 오류가 발생했습니다.", "error"); }
                            }}
                            className="px-3 py-1 bg-red-500/20 text-red-500 rounded text-xs hover:bg-red-500/30"
                          >
                            취소
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {paginatedBookings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted">
                        예약이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalBookingPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setBookingPage(p => Math.max(1, p - 1))}
                  disabled={bookingPage === 1}
                  className="px-3 py-1 border border-card-border rounded text-sm cursor-pointer hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  이전
                </button>
                <span className="text-sm text-muted">
                  {bookingPage} / {totalBookingPages}
                </span>
                <button
                  onClick={() => setBookingPage(p => Math.min(totalBookingPages, p + 1))}
                  disabled={bookingPage === totalBookingPages}
                  className="px-3 py-1 border border-card-border rounded text-sm cursor-pointer hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        )}

        {/* =============================================
            v2: Disputes Tab
            ============================================= */}
        {activeTab === "disputes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">분쟁 관리</h2>
              <span className="text-sm text-muted">
                {disputes.length}건의 분쟁
              </span>
            </div>

            {disputes.length === 0 ? (
              <div className="bg-card-bg border border-card-border rounded-xl p-8 text-center">
                <p className="text-muted">현재 해결 대기중인 분쟁이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {disputes.map((dispute) => (
                  <div key={dispute.confirmation.id} className="bg-card-bg border border-card-border rounded-xl p-6">
                    {/* Dispute Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-semibold text-lg">
                          {dispute.mentor_name} &harr; {dispute.mentee_name}
                        </p>
                        <p className="text-sm text-muted mt-1">
                          {getProductLabel(dispute.product_type)} &middot;{" "}
                          {dispute.booking.scheduled_at
                            ? new Date(dispute.booking.scheduled_at).toLocaleString("ko-KR", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "일시 미정"}
                          {" "}&middot; {(dispute.booking.amount || 0).toLocaleString()}원
                        </p>
                      </div>
                      <span className="px-3 py-1 text-xs rounded-full bg-red-500/20 text-red-500 font-medium">
                        분쟁
                      </span>
                    </div>

                    {/* Both parties' confirmations */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-secondary rounded-lg p-4">
                        <p className="text-xs text-muted mb-1 font-medium">멘토 확인</p>
                        <p className="text-sm font-medium">
                          {getConfirmationLabel(dispute.confirmation.mentor_confirmed)}
                        </p>
                        {dispute.confirmation.mentor_note && (
                          <p className="text-xs text-muted mt-2">
                            &ldquo;{dispute.confirmation.mentor_note}&rdquo;
                          </p>
                        )}
                        {dispute.confirmation.mentor_confirmed_at && (
                          <p className="text-xs text-muted mt-1">
                            {new Date(dispute.confirmation.mentor_confirmed_at).toLocaleString("ko-KR")}
                          </p>
                        )}
                      </div>
                      <div className="bg-secondary rounded-lg p-4">
                        <p className="text-xs text-muted mb-1 font-medium">멘티 확인</p>
                        <p className="text-sm font-medium">
                          {getConfirmationLabel(dispute.confirmation.mentee_confirmed)}
                        </p>
                        {dispute.confirmation.mentee_note && (
                          <p className="text-xs text-muted mt-2">
                            &ldquo;{dispute.confirmation.mentee_note}&rdquo;
                          </p>
                        )}
                        {dispute.confirmation.mentee_confirmed_at && (
                          <p className="text-xs text-muted mt-1">
                            {new Date(dispute.confirmation.mentee_confirmed_at).toLocaleString("ko-KR")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Resolution Actions */}
                    {disputeResolution?.confirmationId === dispute.confirmation.id ? (
                      <div className="border-t border-card-border pt-4">
                        <p className="text-sm font-medium mb-3">최종 상태를 선택하세요:</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { value: "completed" as const, label: "정상 완료", style: "bg-green-500 hover:bg-green-600" },
                            { value: "mentee_noshow" as const, label: "멘티 노쇼", style: "bg-orange-500 hover:bg-orange-600" },
                            { value: "mentor_noshow" as const, label: "멘토 노쇼", style: "bg-red-500 hover:bg-red-600" },
                            { value: "disputed" as const, label: "분쟁 유지", style: "bg-gray-500 hover:bg-gray-600" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleResolveDispute(dispute.confirmation.id, option.value)}
                              disabled={resolvingDisputeId === dispute.confirmation.id}
                              className={`px-4 py-2 ${option.style} text-white rounded-lg text-sm cursor-pointer disabled:opacity-50 transition-colors`}
                            >
                              {resolvingDisputeId === dispute.confirmation.id ? "처리중..." : option.label}
                            </button>
                          ))}
                          <button
                            onClick={() => setDisputeResolution(null)}
                            className="px-4 py-2 border border-card-border rounded-lg text-sm cursor-pointer hover:border-primary transition-colors"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-card-border pt-4">
                        <button
                          onClick={() => setDisputeResolution({
                            confirmationId: dispute.confirmation.id,
                            finalStatus: "completed",
                          })}
                          className="px-4 py-2 bg-primary text-white rounded-lg text-sm cursor-pointer hover:bg-primary-dark transition-colors"
                        >
                          분쟁 해결하기
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =============================================
            v2: Settlements Tab
            ============================================= */}
        {activeTab === "settlements" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">정산 관리</h2>
              <span className="text-sm text-muted">
                {adminSettlements.length}건
              </span>
            </div>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "all" as const, label: "전체" },
                { value: "pending" as const, label: "대기중" },
                { value: "processing" as const, label: "처리중" },
                { value: "completed" as const, label: "완료" },
                { value: "failed" as const, label: "실패" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setSettlementFilter(f.value)}
                  className={`px-4 py-2 rounded-full text-sm cursor-pointer transition-colors ${
                    settlementFilter === f.value
                      ? "bg-primary text-white"
                      : "bg-card-bg border border-card-border text-muted hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">멘토</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">정산 기간</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">총 매출</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">수수료</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">정산액</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">상태</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {adminSettlements
                    .filter(s => settlementFilter === "all" || s.status === settlementFilter)
                    .map((settlement) => {
                      const statusStyles: Record<string, string> = {
                        pending: "bg-yellow-500/20 text-yellow-500",
                        processing: "bg-blue-500/20 text-blue-500",
                        completed: "bg-green-500/20 text-green-500",
                        failed: "bg-red-500/20 text-red-500",
                      };
                      const statusLabels: Record<string, string> = {
                        pending: "대기중",
                        processing: "처리중",
                        completed: "완료",
                        failed: "실패",
                      };

                      return (
                        <tr key={settlement.id} className="border-t border-card-border">
                          <td className="px-4 py-3 text-sm font-medium">{settlement.mentor_name}</td>
                          <td className="px-4 py-3 text-sm text-muted">
                            {new Date(settlement.period_start).toLocaleDateString("ko-KR")} ~{" "}
                            {new Date(settlement.period_end).toLocaleDateString("ko-KR")}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {settlement.total_amount.toLocaleString()}원
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-muted">
                            -{settlement.platform_fee.toLocaleString()}원
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-primary">
                            {settlement.settlement_amount.toLocaleString()}원
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 text-xs rounded-full ${statusStyles[settlement.status] || ""}`}>
                              {statusLabels[settlement.status] || settlement.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {settlement.status === "pending" && (
                                <button
                                  onClick={async () => {
                                    if (!confirm("정산 상태를 변경하시겠습니까?")) return;
                                    setProcessingSettlementId(settlement.id);
                                    try {
                                      const token = await getAuthToken();
                                      if (!token) { showToast("인증이 필요합니다.", "error"); return; }
                                      const res = await fetch("/api/settlement/process", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                                        body: JSON.stringify({ settlementId: settlement.id, action: "process" }),
                                      });
                                      const result = await res.json();
                                      if (res.ok) {
                                        setAdminSettlements(prev => prev.map(s =>
                                          s.id === settlement.id ? { ...s, status: "processing" as const } : s
                                        ));
                                        showToast("처리 시작됨", "success");
                                      } else {
                                        showToast(result.error || "정산 처리 시작 실패", "error");
                                      }
                                    } catch {
                                      showToast("정산 처리 중 오류가 발생했습니다.", "error");
                                    } finally {
                                      setProcessingSettlementId(null);
                                    }
                                  }}
                                  disabled={processingSettlementId === settlement.id}
                                  className="px-2 py-1 bg-blue-500 text-white rounded text-xs cursor-pointer hover:bg-blue-600 disabled:opacity-50"
                                >
                                  처리
                                </button>
                              )}
                              {settlement.status === "processing" && (
                                <button
                                  onClick={async () => {
                                    if (!confirm("정산 상태를 변경하시겠습니까?")) return;
                                    setProcessingSettlementId(settlement.id);
                                    try {
                                      const token = await getAuthToken();
                                      if (!token) { showToast("인증이 필요합니다.", "error"); return; }
                                      const res = await fetch("/api/settlement/process", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                                        body: JSON.stringify({ settlementId: settlement.id, action: "complete" }),
                                      });
                                      const result = await res.json();
                                      if (res.ok) {
                                        setAdminSettlements(prev => prev.map(s =>
                                          s.id === settlement.id ? { ...s, status: "completed" as const, settled_at: new Date().toISOString() } : s
                                        ));
                                        showToast("정산 완료", "success");
                                      } else {
                                        showToast(result.error || "정산 완료 처리 실패", "error");
                                      }
                                    } catch {
                                      showToast("정산 완료 처리 중 오류가 발생했습니다.", "error");
                                    } finally {
                                      setProcessingSettlementId(null);
                                    }
                                  }}
                                  disabled={processingSettlementId === settlement.id}
                                  className="px-2 py-1 bg-green-500 text-white rounded text-xs cursor-pointer hover:bg-green-600 disabled:opacity-50"
                                >
                                  완료
                                </button>
                              )}
                              {(settlement.status === "pending" || settlement.status === "processing") && (
                                <button
                                  onClick={async () => {
                                    if (!confirm("정산 상태를 변경하시겠습니까?")) return;
                                    setProcessingSettlementId(settlement.id);
                                    try {
                                      const token = await getAuthToken();
                                      if (!token) { showToast("인증이 필요합니다.", "error"); return; }
                                      const res = await fetch("/api/settlement/process", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                                        body: JSON.stringify({ settlementId: settlement.id, action: "fail", failureReason: "관리자 실패 처리" }),
                                      });
                                      const result = await res.json();
                                      if (res.ok) {
                                        setAdminSettlements(prev => prev.map(s =>
                                          s.id === settlement.id ? { ...s, status: "failed" as const } : s
                                        ));
                                        showToast("실패 처리됨", "success");
                                      } else {
                                        showToast(result.error || "실패 처리 중 오류", "error");
                                      }
                                    } catch {
                                      showToast("실패 처리 중 오류가 발생했습니다.", "error");
                                    } finally {
                                      setProcessingSettlementId(null);
                                    }
                                  }}
                                  disabled={processingSettlementId === settlement.id}
                                  className="px-2 py-1 bg-red-500 text-white rounded text-xs cursor-pointer hover:bg-red-600 disabled:opacity-50"
                                >
                                  실패
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {adminSettlements.filter(s => settlementFilter === "all" || s.status === settlementFilter).length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted">
                        정산 내역이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Surveys Tab */}
        {activeTab === "surveys" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">품질 설문 관리</h2>
            {surveys.length === 0 ? (
              <div className="bg-card-bg border border-card-border rounded-xl p-8 text-center">
                <p className="text-muted">아직 제출된 설문이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {surveys.map((survey: any) => (
                  <div key={survey.id} className="bg-card-bg border border-card-border rounded-xl p-5">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-xs text-muted">
                        {new Date(survey.created_at).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {[
                        { label: "준비도", value: survey.mentee_preparedness },
                        { label: "목표 명확성", value: survey.goal_clarity },
                        { label: "소통 태도", value: survey.communication_attitude },
                        { label: "전반적 만족도", value: survey.overall_satisfaction },
                      ].map((item) => (
                        <div key={item.label} className="bg-secondary rounded-lg p-3 text-center">
                          <p className="text-xs text-muted mb-1">{item.label}</p>
                          <p className={`text-lg font-bold ${item.value >= 4 ? "text-green-500" : item.value >= 3 ? "text-primary" : "text-red-500"}`}>
                            {item.value}/5
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                      <div>
                        <p className="text-xs text-muted mb-1">진행 상태</p>
                        <p className="font-medium">{survey.session_progress}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted mb-1">추천 다음 단계</p>
                        <p className="font-medium">{survey.recommended_next_step}</p>
                      </div>
                    </div>
                    {survey.admin_note && (
                      <div className="mt-3 pt-3 border-t border-card-border">
                        <p className="text-xs text-muted mb-1">추가 메모</p>
                        <p className="text-sm">{survey.admin_note}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === "feedback" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">피드백 관리</h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-card-bg border border-card-border rounded-xl p-4">
                <p className="text-xs text-muted mb-1">전체</p>
                <p className="text-2xl font-bold">{feedbackStats.total}</p>
              </div>
              <div className="bg-card-bg border border-card-border rounded-xl p-4">
                <p className="text-xs text-muted mb-1">오류 제보</p>
                <p className="text-2xl font-bold text-red-400">{feedbackStats.bug}</p>
              </div>
              <div className="bg-card-bg border border-card-border rounded-xl p-4">
                <p className="text-xs text-muted mb-1">기능 제안</p>
                <p className="text-2xl font-bold text-blue-400">{feedbackStats.feature}</p>
              </div>
              <div className="bg-card-bg border border-card-border rounded-xl p-4">
                <p className="text-xs text-muted mb-1">의견/기타</p>
                <p className="text-2xl font-bold text-muted">{feedbackStats.opinion}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-card-bg border border-card-border rounded-xl p-4">
                <p className="text-xs text-muted mb-1">새로운</p>
                <p className="text-2xl font-bold text-yellow-500">{feedbackStats.new}</p>
              </div>
              <div className="bg-card-bg border border-card-border rounded-xl p-4">
                <p className="text-xs text-muted mb-1">처리중</p>
                <p className="text-2xl font-bold text-blue-500">{feedbackStats.in_progress}</p>
              </div>
              <div className="bg-card-bg border border-card-border rounded-xl p-4">
                <p className="text-xs text-muted mb-1">해결</p>
                <p className="text-2xl font-bold text-green-500">{feedbackStats.resolved}</p>
              </div>
              <div className="bg-card-bg border border-card-border rounded-xl p-4">
                <p className="text-xs text-muted mb-1">닫힘</p>
                <p className="text-2xl font-bold text-muted">{feedbackStats.closed}</p>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 flex-wrap">
              {([
                { value: "all", label: "전체" },
                { value: "bug", label: "오류" },
                { value: "feature", label: "기능제안" },
                { value: "opinion", label: "의견" },
                { value: "new", label: "새로운" },
                { value: "in_progress", label: "처리중" },
              ] as const).map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFeedbackFilter(filter.value)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer ${
                    feedbackFilter === filter.value
                      ? "bg-primary text-white border-primary"
                      : "border-card-border text-muted hover:text-foreground hover:border-primary"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Feedback List */}
            {filteredFeedback.length === 0 ? (
              <div className="bg-card-bg border border-card-border rounded-xl p-8 text-center">
                <p className="text-muted">해당 조건의 피드백이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFeedback.map((feedback) => (
                  <div key={feedback.id} className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
                    {/* Summary row */}
                    <button
                      onClick={() => {
                        if (expandedFeedbackId === feedback.id) {
                          setExpandedFeedbackId(null);
                          setFeedbackAdminNote("");
                        } else {
                          setExpandedFeedbackId(feedback.id);
                          setFeedbackAdminNote(feedback.admin_note || "");
                        }
                      }}
                      className="w-full px-5 py-4 text-left cursor-pointer hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            {getFeedbackTypeBadge(feedback.type)}
                            {getFeedbackStatusBadge(feedback.status)}
                            <span className="text-xs text-muted">
                              {new Date(feedback.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-sm text-foreground truncate">{feedback.message}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
                            {feedback.page_url && (
                              <span className="truncate max-w-[200px]">{feedback.page_url}</span>
                            )}
                            {feedback.user_id && <span>회원</span>}
                            {feedback.contact_info && <span>{feedback.contact_info}</span>}
                          </div>
                        </div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`w-4 h-4 text-muted transition-transform flex-shrink-0 ${expandedFeedbackId === feedback.id ? "rotate-180" : ""}`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {expandedFeedbackId === feedback.id && (
                      <div className="px-5 pb-5 border-t border-card-border pt-4 space-y-4">
                        {/* Full message */}
                        <div>
                          <p className="text-xs text-muted mb-1">전체 메시지</p>
                          <p className="text-sm text-foreground whitespace-pre-wrap bg-secondary rounded-lg p-3">{feedback.message}</p>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-muted mb-0.5">페이지</p>
                            <p className="text-foreground">{feedback.page_url || "-"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted mb-0.5">연락처</p>
                            <p className="text-foreground">{feedback.contact_info || "-"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted mb-0.5">사용자 ID</p>
                            <p className="text-foreground text-xs font-mono">{feedback.user_id || "비회원"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted mb-0.5">상태</p>
                            <p>{getFeedbackStatusBadge(feedback.status)}</p>
                          </div>
                        </div>

                        {/* Admin note */}
                        <div>
                          <label className="text-xs text-muted mb-1 block">관리자 메모</label>
                          <textarea
                            value={feedbackAdminNote}
                            onChange={(e) => setFeedbackAdminNote(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 bg-secondary border border-card-border rounded-lg text-sm text-foreground resize-none"
                            placeholder="관리자 메모를 입력하세요..."
                          />
                          <button
                            onClick={() => handleUpdateFeedback(feedback.id, undefined, feedbackAdminNote)}
                            disabled={updatingFeedbackId === feedback.id}
                            className="mt-2 px-3 py-1.5 text-xs bg-secondary border border-card-border rounded-lg hover:border-primary transition-colors cursor-pointer disabled:opacity-50"
                          >
                            메모 저장
                          </button>
                        </div>

                        {/* Status change buttons */}
                        <div>
                          <p className="text-xs text-muted mb-2">상태 변경</p>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => handleUpdateFeedback(feedback.id, "in_progress")}
                              disabled={updatingFeedbackId === feedback.id || feedback.status === "in_progress"}
                              className="px-3 py-1.5 text-xs bg-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-500/30 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              진행중
                            </button>
                            <button
                              onClick={() => handleUpdateFeedback(feedback.id, "resolved")}
                              disabled={updatingFeedbackId === feedback.id || feedback.status === "resolved"}
                              className="px-3 py-1.5 text-xs bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              해결
                            </button>
                            <button
                              onClick={() => handleUpdateFeedback(feedback.id, "closed")}
                              disabled={updatingFeedbackId === feedback.id || feedback.status === "closed"}
                              className="px-3 py-1.5 text-xs bg-gray-500/20 text-muted rounded-lg hover:bg-gray-500/30 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              닫기
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =============================================
            User Analytics Tab (activity_logs)
            ============================================= */}
        {activeTab === "user_analytics" && (
          <div className="space-y-6">
            {/* Date range filter */}
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">유저 행동 분석</h2>
              <div className="flex gap-2 ml-auto">
                {[
                  { value: 1, label: "오늘" },
                  { value: 7, label: "7일" },
                  { value: 30, label: "30일" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setUserAnalyticsDays(opt.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      userAnalyticsDays === opt.value
                        ? "bg-primary text-white"
                        : "bg-secondary text-muted hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {userAnalyticsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : !userAnalytics ? (
              <div className="bg-card-bg border border-card-border rounded-xl p-8 text-center">
                <p className="text-muted">데이터가 없습니다. activity_logs 테이블이 생성되어야 합니다.</p>
              </div>
            ) : (
              <>
                {/* Overview cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-card-bg border border-card-border rounded-xl p-4">
                    <p className="text-xs text-muted mb-1">총 이벤트</p>
                    <p className="text-2xl font-bold text-primary">{userAnalytics.totalEvents.toLocaleString()}</p>
                  </div>
                  <div className="bg-card-bg border border-card-border rounded-xl p-4">
                    <p className="text-xs text-muted mb-1">고유 유저</p>
                    <p className="text-2xl font-bold text-accent">{userAnalytics.uniqueUsers.toLocaleString()}</p>
                  </div>
                  <div className="bg-card-bg border border-card-border rounded-xl p-4">
                    <p className="text-xs text-muted mb-1">가장 활발한 페이지</p>
                    <p className="text-lg font-bold text-green-500 truncate">{userAnalytics.mostActivePage || "-"}</p>
                  </div>
                </div>

                {/* Events by category */}
                <div className="bg-card-bg border border-card-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">카테고리별 이벤트</h3>
                  {Object.keys(userAnalytics.eventsByCategory).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(userAnalytics.eventsByCategory)
                        .sort(([, a], [, b]) => b - a)
                        .map(([category, count]) => {
                          const maxCount = Math.max(...Object.values(userAnalytics.eventsByCategory));
                          const colors: Record<string, string> = {
                            page_view: "from-blue-500 to-blue-400",
                            button_click: "from-green-500 to-green-400",
                            form_submit: "from-purple-500 to-purple-400",
                            form_step: "from-amber-500 to-amber-400",
                            auth: "from-indigo-500 to-indigo-400",
                            booking: "from-pink-500 to-pink-400",
                            error: "from-red-500 to-red-400",
                          };
                          const colorClass = colors[category] || "from-primary to-accent";
                          return (
                            <div key={category} className="flex items-center gap-3">
                              <span className="w-28 text-sm font-medium truncate">{category}</span>
                              <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className={`h-full bg-gradient-to-r ${colorClass} rounded-full`}
                                  style={{ width: `${Math.max(4, (count / maxCount) * 100)}%` }}
                                />
                              </div>
                              <span className="w-16 text-sm text-right text-muted">{count.toLocaleString()}</span>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="text-muted text-center py-4">데이터가 없습니다.</p>
                  )}
                </div>

                {/* Two column: Top Pages + Hourly Distribution */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Top Pages */}
                  <div className="bg-card-bg border border-card-border rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">페이지별 이벤트 (Top 10)</h3>
                    {Object.keys(userAnalytics.eventsByPage).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(userAnalytics.eventsByPage)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 10)
                          .map(([page, count], idx) => {
                            const maxCount = Object.values(userAnalytics.eventsByPage).sort((a, b) => b - a)[0] || 1;
                            return (
                              <div key={page} className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                                  {idx + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{page}</p>
                                  <div className="h-2 bg-secondary rounded-full overflow-hidden mt-1">
                                    <div
                                      className="h-full bg-gradient-to-r from-primary to-accent"
                                      style={{ width: `${(count / maxCount) * 100}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="text-sm text-muted">{count.toLocaleString()}</span>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <p className="text-muted text-center py-4">데이터가 없습니다.</p>
                    )}
                  </div>

                  {/* Hourly Distribution */}
                  <div className="bg-card-bg border border-card-border rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">시간대별 활동</h3>
                    {userAnalytics.eventsByHour.some((v) => v > 0) ? (
                      <div className="flex items-end gap-1 h-40">
                        {userAnalytics.eventsByHour.map((count, hour) => {
                          const maxHour = Math.max(...userAnalytics.eventsByHour, 1);
                          const heightPct = Math.max(2, (count / maxHour) * 100);
                          return (
                            <div key={hour} className="flex-1 flex flex-col items-center gap-1">
                              <div
                                className="w-full bg-gradient-to-t from-primary to-accent rounded-t"
                                style={{ height: `${heightPct}%` }}
                                title={`${hour}시: ${count}건`}
                              />
                              {hour % 4 === 0 && (
                                <span className="text-xs text-muted">{hour}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-muted text-center py-4">데이터가 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* Mentor Apply Funnel */}
                {userAnalytics.funnelData && (
                  <div className="bg-card-bg border border-card-border rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">멘토 지원 퍼널</h3>
                    <div className="space-y-3">
                      {[
                        { label: "페이지 조회", value: userAnalytics.funnelData.pageViews },
                        { label: "Step 1 (기본정보)", value: userAnalytics.funnelData.step1 },
                        { label: "Step 2 (프로필)", value: userAnalytics.funnelData.step2 },
                        { label: "Step 3 (시간설정)", value: userAnalytics.funnelData.step3 },
                        { label: "제출 완료", value: userAnalytics.funnelData.submitted },
                      ].map((item, idx, arr) => {
                        const maxVal = arr[0]?.value || 1;
                        const widthPct = maxVal > 0 ? Math.max(4, (item.value / maxVal) * 100) : 4;
                        const prevVal = idx > 0 ? arr[idx - 1].value : null;
                        const dropRate = prevVal && prevVal > 0
                          ? Math.round(((prevVal - item.value) / prevVal) * 100)
                          : null;
                        return (
                          <div key={item.label} className="flex items-center gap-3">
                            <span className="w-32 text-sm font-medium">{item.label}</span>
                            <div className="flex-1 h-8 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-accent flex items-center justify-end pr-2 rounded-full"
                                style={{ width: `${widthPct}%` }}
                              >
                                {item.value > 0 && (
                                  <span className="text-xs font-bold text-white">{item.value}</span>
                                )}
                              </div>
                            </div>
                            <span className="w-16 text-sm text-right">
                              {item.value}
                            </span>
                            {dropRate !== null && dropRate > 0 && (
                              <span className="w-16 text-xs text-red-500 text-right">
                                -{dropRate}%
                              </span>
                            )}
                            {dropRate !== null && dropRate === 0 && (
                              <span className="w-16 text-xs text-green-500 text-right">
                                0%
                              </span>
                            )}
                            {dropRate === null && (
                              <span className="w-16" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recent activity log */}
                <div className="bg-card-bg border border-card-border rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">최근 활동 로그</h3>
                  {userAnalytics.recentEvents.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-card-border">
                            <th className="text-left py-2 pr-4 text-muted font-medium">시간</th>
                            <th className="text-left py-2 pr-4 text-muted font-medium">유저</th>
                            <th className="text-left py-2 pr-4 text-muted font-medium">카테고리</th>
                            <th className="text-left py-2 pr-4 text-muted font-medium">액션</th>
                            <th className="text-left py-2 text-muted font-medium">페이지</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userAnalytics.recentEvents.map((event) => (
                            <tr key={event.id} className="border-b border-card-border/50 hover:bg-secondary/30">
                              <td className="py-2 pr-4 whitespace-nowrap text-muted">
                                {new Date(event.created_at).toLocaleString("ko-KR", {
                                  month: "numeric",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                              <td className="py-2 pr-4 whitespace-nowrap">
                                {event.user_id ? (
                                  <span className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded">
                                    {event.user_id.slice(0, 8)}...
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted">비회원</span>
                                )}
                              </td>
                              <td className="py-2 pr-4">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  event.category === "page_view"
                                    ? "bg-blue-500/10 text-blue-500"
                                    : event.category === "button_click"
                                    ? "bg-green-500/10 text-green-500"
                                    : event.category === "form_submit"
                                    ? "bg-purple-500/10 text-purple-500"
                                    : event.category === "form_step"
                                    ? "bg-amber-500/10 text-amber-500"
                                    : event.category === "auth"
                                    ? "bg-indigo-500/10 text-indigo-500"
                                    : event.category === "booking"
                                    ? "bg-pink-500/10 text-pink-500"
                                    : "bg-secondary text-muted"
                                }`}>
                                  {event.category}
                                </span>
                              </td>
                              <td className="py-2 pr-4 font-medium">{event.action}</td>
                              <td className="py-2 text-muted truncate max-w-[200px]">{event.page || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-muted text-center py-4">최근 활동이 없습니다.</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchAllData}
            className="px-6 py-3 border border-card-border rounded-lg text-sm hover:border-primary hover:text-primary transition-colors cursor-pointer"
          >
            데이터 새로고침
          </button>
        </div>
      </main>

      {/* Refund Modal */}
      {refundTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card-bg border border-card-border rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">환불 처리</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted mb-1">신청자</p>
                <p className="font-medium">{refundTarget.userName}</p>
              </div>
              <div>
                <p className="text-sm text-muted mb-1">환불 금액</p>
                <p className="text-xl font-bold text-red-500">
                  {refundTarget.amount.toLocaleString()}원
                </p>
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">환불 사유</label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="환불 사유를 입력해주세요"
                  className="w-full px-4 py-2 bg-secondary border border-card-border rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setRefundTarget(null); setRefundReason(""); }}
                className="flex-1 px-4 py-2 border border-card-border rounded-lg text-sm cursor-pointer hover:border-primary transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleRefund}
                disabled={refundLoading}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm cursor-pointer hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {refundLoading ? "처리중..." : "환불 확정"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
