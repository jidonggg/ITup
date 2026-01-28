"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/admin";
import { Mentor, Consultation } from "@/lib/supabase/types";

type TabType = "overview" | "mentors" | "consultations" | "analytics";

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

interface Stats {
  totalMentors: number;
  pendingMentors: number;
  totalConsultations: number;
  pendingConsultations: number;
  totalPageViews: number;
  totalSessions: number;
}

export default function AdminPage() {
  const { user, isInitialized } = useAuth();
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
  });

  // Mentors
  const [mentors, setMentors] = useState<MentorWithEmail[]>([]);
  const [mentorFilter, setMentorFilter] = useState<"all" | "pending" | "approved">("all");
  const [updatingMentorId, setUpdatingMentorId] = useState<string | null>(null);

  // Consultations
  const [consultations, setConsultations] = useState<(Consultation & { mentor_name?: string })[]>([]);
  const [consultFilter, setConsultFilter] = useState<"all" | "pending" | "confirmed" | "completed">("all");

  // Daily stats
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);

  // Analytics data
  const [pageStats, setPageStats] = useState<PageStats[]>([]);
  const [clickStats, setClickStats] = useState<ClickStats[]>([]);

  useEffect(() => {
    if (!isInitialized) return;
    if (!user || !isAdmin(user.email)) {
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
        .select("target");

      if (clickData) {
        const clickCounts: Record<string, number> = {};
        clickData.forEach((ev) => {
          const target = ev.target || "unknown";
          clickCounts[target] = (clickCounts[target] || 0) + 1;
        });

        const clickStatsList = Object.entries(clickCounts)
          .map(([target, clicks]) => ({ target, clicks }))
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, 10);

        setClickStats(clickStatsList);
      }
    } catch (error) {
      console.error("Admin fetch error:", error);
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
      setMentors(prev => prev.map(m =>
        m.id === mentorId ? { ...m, is_approved: approve } : m
      ));
      setStats(prev => ({
        ...prev,
        pendingMentors: prev.pendingMentors + (approve ? -1 : 1),
      }));

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
        }).catch(console.error);
      }
    } catch (error) {
      console.error("Error:", error);
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
      console.error("Error:", error);
      showToast("오류가 발생했습니다.", "error");
    }
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
      confirmed: "bg-blue-500/20 text-blue-500",
      completed: "bg-green-500/20 text-green-500",
      cancelled: "bg-red-500/20 text-red-500",
    };
    const labels: Record<string, string> = {
      pending: "대기중",
      confirmed: "확정",
      completed: "완료",
      cancelled: "취소",
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || ""}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !isAdmin(user.email)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">접근 권한 없음</h1>
          <p className="text-muted mb-4">관리자만 접근할 수 있습니다.</p>
          <Link href="/" className="text-primary hover:underline">
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
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
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-card-border">
          {[
            { id: "overview" as TabType, label: "개요" },
            { id: "mentors" as TabType, label: `멘토 관리 ${stats.pendingMentors > 0 ? `(${stats.pendingMentors})` : ""}` },
            { id: "consultations" as TabType, label: "상담 관리" },
            { id: "analytics" as TabType, label: "분석" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
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
                    </tr>
                  ))}
                  {filteredConsultations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted">
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
    </div>
  );
}
