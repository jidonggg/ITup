"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Mentor, Consultation, Booking, SessionConfirmation, ProductType, Settlement, SettlementStatus } from "@/lib/supabase/types";
import { PRODUCT_INFO, PAGINATION } from "@/lib/constants";

type TabType = "overview" | "mentors" | "consultations" | "analytics" | "verification" | "bookings" | "disputes" | "settlements";

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

export default function AdminPage() {
  const { user, profile, isInitialized } = useAuth();
  const { showToast } = useToast();
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

  useEffect(() => {
    if (!isInitialized) return;
    if (!user || profile?.role !== "admin") {
      setIsLoading(false);
      return;
    }

    fetchAllData();
  }, [isInitialized, user]);

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
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (dailyData) {
        const dailyCounts: Record<string, { views: number; sessions: Set<string> }> = {};
        dailyData.forEach((pv) => {
          const date = new Date(pv.created_at).toLocaleDateString("ko-KR");
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
        .select("path");

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
        .select("event_name");

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
        .eq("verification_status", "pending")
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
          .filter(b => b.status === "completed" || b.status === "confirmed" || b.status === "paid")
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

    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  // 서버 API를 통한 관리자 작업 (보안 강화)
  const getAuthToken = async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  };

  const handleApproveMentor = async (mentorId: string, approve: boolean) => {
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

      // 멘토 승인 시 이메일 알림 발송
      if (approve && token) {
        fetch("/api/email/notify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: "mentor_approved",
            data: { mentorId },
          }),
        }).catch((e) => console.error("[멘토승인 이메일 실패]", e));
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
      setMentors(prev => prev.filter(m => m.id !== mentorId));
      setStats(prev => ({
        ...prev,
        totalMentors: prev.totalMentors - 1,
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
        body: JSON.stringify({
          mentorId,
          action: action === "approve" ? "verify_approve" : "verify_reject",
        }),
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
          m.id === mentorId ? { ...m, verification_status: "verified" as const, is_approved: true } : m
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

      showToast("분쟁이 해결되었습니다.", "success");

      // Update local state
      setDisputes(prev => prev.filter(d => d.confirmation.id !== confirmationId));
      setStats(prev => ({
        ...prev,
        disputeCount: Math.max(0, prev.disputeCount - 1),
      }));
      setDisputeResolution(null);
    } catch {
      showToast("오류가 발생했습니다.", "error");
    } finally {
      setResolvingDisputeId(null);
    }
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
    return info ? `${info.icon} ${info.name}` : type;
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

  // TODO: 디버그 로그 - 관리자 페이지 접근 문제 해결 후 제거
  console.log("[AdminPage] auth state:", { userId: user?.id, profile, role: profile?.role, isInitialized, isLoading });

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || profile?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card-bg border border-card-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">접근 권한이 없어요</h2>
          <p className="text-muted mb-6">관리자만 접근할 수 있어요.</p>
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
            { id: "verification" as TabType, label: `멘토 검증 ${stats.pendingVerifications > 0 ? `(${stats.pendingVerifications})` : ""}` },
            { id: "bookings" as TabType, label: "예약 관리" },
            { id: "disputes" as TabType, label: `분쟁 관리 ${stats.disputeCount > 0 ? `(${stats.disputeCount})` : ""}` },
            { id: "settlements" as TabType, label: "정산 관리" },
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
                    <span className="text-2xl">⚠️</span>
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
                    <span className="text-2xl">🔍</span>
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
                    <span className="text-2xl">🚨</span>
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
                      <span className="w-24 text-sm text-muted">{day.date}</span>
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
                      <span className="w-28 text-sm text-muted">{day.date}</span>
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
                        {mentor.verified_email || <span className="text-muted">-</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-500">
                          {getVerificationMethodLabel(mentor.verification_method)}
                        </span>
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
                      <td colSpan={7} className="px-4 py-8 text-center text-muted">
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
                    </tr>
                  ))}
                  {paginatedBookings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted">
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
                                    setProcessingSettlementId(settlement.id);
                                    try {
                                      const token = await getAuthToken();
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
                                    setProcessingSettlementId(settlement.id);
                                    try {
                                      const token = await getAuthToken();
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
                                    setProcessingSettlementId(settlement.id);
                                    try {
                                      const token = await getAuthToken();
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
