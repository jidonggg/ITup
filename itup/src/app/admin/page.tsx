"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface PageViewStats {
  path: string;
  view_count: number;
  avg_duration: number;
}

interface EventStats {
  event_name: string;
  event_type: string;
  count: number;
}

interface DailyStats {
  date: string;
  views: number;
  unique_sessions: number;
}

interface RecentPageView {
  id: string;
  path: string;
  created_at: string;
  duration_seconds: number;
  session_id: string;
}

// 사용자 여정 분석용
interface UserJourney {
  session_id: string;
  device_type: string;
  browser: string;
  started_at: string;
  pages: { path: string; time: string; duration: number }[];
  events: { name: string; type: string; time: string }[];
  first_action: string;
  total_duration: number;
  page_count: number;
}

// 퍼널 분석용
interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
}

// 첫 행동 통계
interface FirstActionStats {
  action: string;
  count: number;
  percentage: number;
}

export default function AdminPage() {
  const { user, isInitialized } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPageViews: 0,
    totalSessions: 0,
    totalEvents: 0,
    avgDuration: 0,
  });
  const [pageViewStats, setPageViewStats] = useState<PageViewStats[]>([]);
  const [eventStats, setEventStats] = useState<EventStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [recentViews, setRecentViews] = useState<RecentPageView[]>([]);
  const [userJourneys, setUserJourneys] = useState<UserJourney[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);
  const [firstActionStats, setFirstActionStats] = useState<FirstActionStats[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<UserJourney | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "pages" | "events" | "realtime" | "users" | "funnel">("overview");

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) return;

    fetchAnalytics();
  }, [isInitialized, user]);

  const fetchAnalytics = async () => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      // 총 페이지뷰
      const { count: totalViews } = await supabase
        .from("page_views")
        .select("*", { count: "exact", head: true });

      // 총 세션
      const { count: totalSessions } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true });

      // 총 이벤트
      const { count: totalEvents } = await supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true });

      // 평균 체류시간
      const { data: durationData } = await supabase
        .from("page_views")
        .select("duration_seconds")
        .gt("duration_seconds", 0);

      const avgDuration = durationData?.length
        ? Math.round(durationData.reduce((sum, d) => sum + d.duration_seconds, 0) / durationData.length)
        : 0;

      setStats({
        totalPageViews: totalViews || 0,
        totalSessions: totalSessions || 0,
        totalEvents: totalEvents || 0,
        avgDuration,
      });

      // 페이지별 통계
      const { data: pageData } = await supabase
        .from("page_views")
        .select("path, duration_seconds");

      if (pageData) {
        const pathStats: Record<string, { count: number; totalDuration: number }> = {};
        pageData.forEach((pv) => {
          if (!pathStats[pv.path]) {
            pathStats[pv.path] = { count: 0, totalDuration: 0 };
          }
          pathStats[pv.path].count++;
          pathStats[pv.path].totalDuration += pv.duration_seconds || 0;
        });

        const pageViewStatsList = Object.entries(pathStats)
          .map(([path, data]) => ({
            path,
            view_count: data.count,
            avg_duration: data.count > 0 ? Math.round(data.totalDuration / data.count) : 0,
          }))
          .sort((a, b) => b.view_count - a.view_count);

        setPageViewStats(pageViewStatsList);
      }

      // 이벤트 통계
      const { data: eventData } = await supabase
        .from("analytics_events")
        .select("event_type, event_name");

      if (eventData) {
        const eventCounts: Record<string, { type: string; count: number }> = {};
        eventData.forEach((ev) => {
          const key = `${ev.event_type}:${ev.event_name}`;
          if (!eventCounts[key]) {
            eventCounts[key] = { type: ev.event_type, count: 0 };
          }
          eventCounts[key].count++;
        });

        const eventStatsList = Object.entries(eventCounts)
          .map(([key, data]) => ({
            event_name: key.split(":")[1],
            event_type: data.type,
            count: data.count,
          }))
          .sort((a, b) => b.count - a.count);

        setEventStats(eventStatsList);
      }

      // 최근 7일 일별 통계
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

      // 최근 페이지뷰
      const { data: recentData } = await supabase
        .from("page_views")
        .select("id, path, created_at, duration_seconds, session_id")
        .order("created_at", { ascending: false })
        .limit(20);

      if (recentData) {
        setRecentViews(recentData);
      }

      // 사용자 여정 분석 (최근 50개 세션)
      const { data: sessionsData } = await supabase
        .from("sessions")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50);

      if (sessionsData) {
        const journeys: UserJourney[] = [];

        for (const session of sessionsData) {
          // 해당 세션의 페이지뷰
          const { data: sessionPages } = await supabase
            .from("page_views")
            .select("path, created_at, duration_seconds")
            .eq("session_id", session.id)
            .order("created_at", { ascending: true });

          // 해당 세션의 이벤트
          const { data: sessionEvents } = await supabase
            .from("analytics_events")
            .select("event_name, event_type, created_at")
            .eq("session_id", session.id)
            .order("created_at", { ascending: true });

          const pages = (sessionPages || []).map(p => ({
            path: p.path,
            time: new Date(p.created_at).toLocaleTimeString("ko-KR"),
            duration: p.duration_seconds || 0,
          }));

          const events = (sessionEvents || []).map(e => ({
            name: e.event_name,
            type: e.event_type,
            time: new Date(e.created_at).toLocaleTimeString("ko-KR"),
          }));

          // 첫 행동 결정
          let firstAction = "페이지 방문만";
          if (events.length > 0) {
            const firstEvent = events[0];
            if (firstEvent.type === "click") {
              firstAction = `클릭: ${firstEvent.name}`;
            } else if (firstEvent.type === "submit") {
              firstAction = `제출: ${firstEvent.name}`;
            } else {
              firstAction = `${firstEvent.type}: ${firstEvent.name}`;
            }
          }

          const totalDuration = pages.reduce((sum, p) => sum + p.duration, 0);

          journeys.push({
            session_id: session.id,
            device_type: session.device_type || "unknown",
            browser: session.browser || "unknown",
            started_at: session.started_at,
            pages,
            events,
            first_action: firstAction,
            total_duration: totalDuration,
            page_count: pages.length,
          });
        }

        setUserJourneys(journeys);

        // 첫 행동 통계
        const firstActionCounts: Record<string, number> = {};
        journeys.forEach(j => {
          firstActionCounts[j.first_action] = (firstActionCounts[j.first_action] || 0) + 1;
        });

        const totalJourneys = journeys.length || 1;
        const firstStats = Object.entries(firstActionCounts)
          .map(([action, count]) => ({
            action,
            count,
            percentage: Math.round((count / totalJourneys) * 100),
          }))
          .sort((a, b) => b.count - a.count);

        setFirstActionStats(firstStats);
      }

      // 퍼널 분석
      // 1. 메인 방문 → 2. 멘토 페이지 방문 → 3. 상담 신청 클릭 → 4. 상담 신청 완료
      const { data: allPageViews } = await supabase
        .from("page_views")
        .select("session_id, path");

      const { data: allEvents } = await supabase
        .from("analytics_events")
        .select("session_id, event_name, event_type");

      if (allPageViews) {
        const sessionPaths: Record<string, Set<string>> = {};
        const sessionEvents: Record<string, Set<string>> = {};

        allPageViews.forEach(pv => {
          if (!sessionPaths[pv.session_id]) sessionPaths[pv.session_id] = new Set();
          sessionPaths[pv.session_id].add(pv.path);
        });

        (allEvents || []).forEach(ev => {
          if (!sessionEvents[ev.session_id]) sessionEvents[ev.session_id] = new Set();
          sessionEvents[ev.session_id].add(`${ev.event_type}:${ev.event_name}`);
        });

        const totalSessions = Object.keys(sessionPaths).length || 1;

        // 각 퍼널 단계 계산
        let step1 = 0; // 메인 페이지 방문
        let step2 = 0; // 멘토 페이지 or 멘토 목록 방문
        let step3 = 0; // 상담 모달 오픈 (클릭 이벤트)
        let step4 = 0; // 상담 신청 완료 (submit 이벤트)

        Object.keys(sessionPaths).forEach(sessionId => {
          const paths = sessionPaths[sessionId];
          const events = sessionEvents[sessionId] || new Set();

          // Step 1: 메인 방문
          if (paths.has("/") || paths.has("/home")) {
            step1++;
          }

          // Step 2: 멘토 관련 페이지 방문
          const visitedMentor = Array.from(paths).some(p =>
            p.includes("/mentors") || p.includes("/mentor")
          );
          if (visitedMentor) {
            step2++;
          }

          // Step 3: 상담 모달 오픈
          const clickedConsult = Array.from(events).some(e =>
            e.includes("상담") || e.includes("consult") || e.includes("modal")
          );
          if (clickedConsult) {
            step3++;
          }

          // Step 4: 상담 신청 완료
          const submittedConsult = Array.from(events).some(e =>
            e.includes("submit:") && (e.includes("상담") || e.includes("consult"))
          );
          if (submittedConsult) {
            step4++;
          }
        });

        setFunnelData([
          { name: "메인 페이지 방문", count: step1, percentage: Math.round((step1 / totalSessions) * 100) },
          { name: "멘토 페이지 탐색", count: step2, percentage: Math.round((step2 / totalSessions) * 100) },
          { name: "상담 신청 클릭", count: step3, percentage: Math.round((step3 / totalSessions) * 100) },
          { name: "상담 신청 완료", count: step4, percentage: Math.round((step4 / totalSessions) * 100) },
        ]);
      }

    } catch (error) {
      console.error("Analytics fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">접근 권한 없음</h1>
          <p className="text-muted mb-4">운영자 페이지는 로그인이 필요합니다.</p>
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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white text-sm">*</span>
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
        <h1 className="text-3xl font-bold mb-8">운영자 대시보드</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card-bg border border-card-border rounded-xl p-6">
            <p className="text-sm text-muted mb-1">총 페이지뷰</p>
            <p className="text-3xl font-bold text-primary">{stats.totalPageViews.toLocaleString()}</p>
          </div>
          <div className="bg-card-bg border border-card-border rounded-xl p-6">
            <p className="text-sm text-muted mb-1">총 세션</p>
            <p className="text-3xl font-bold text-accent">{stats.totalSessions.toLocaleString()}</p>
          </div>
          <div className="bg-card-bg border border-card-border rounded-xl p-6">
            <p className="text-sm text-muted mb-1">총 이벤트</p>
            <p className="text-3xl font-bold text-green-500">{stats.totalEvents.toLocaleString()}</p>
          </div>
          <div className="bg-card-bg border border-card-border rounded-xl p-6">
            <p className="text-sm text-muted mb-1">평균 체류시간</p>
            <p className="text-3xl font-bold text-yellow-500">{stats.avgDuration}초</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-card-border overflow-x-auto">
          {(["overview", "users", "funnel", "pages", "events", "realtime"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab === "overview" && "개요"}
              {tab === "users" && "사용자 여정"}
              {tab === "funnel" && "퍼널 분석"}
              {tab === "pages" && "페이지별"}
              {tab === "events" && "이벤트"}
              {tab === "realtime" && "실시간"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-8">
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
                            width: `${Math.min(100, (day.views / Math.max(...dailyStats.map((d) => d.views))) * 100)}%`,
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

            {/* Top Pages */}
            <div className="bg-card-bg border border-card-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">인기 페이지 TOP 5</h2>
              {pageViewStats.length > 0 ? (
                <div className="space-y-3">
                  {pageViewStats.slice(0, 5).map((page, idx) => (
                    <div key={page.path} className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {idx + 1}
                      </span>
                      <span className="flex-1 font-mono text-sm">{page.path}</span>
                      <span className="text-sm">{page.view_count} 뷰</span>
                      <span className="text-sm text-muted">{page.avg_duration}초</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-8">데이터가 없습니다.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "pages" && (
          <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">페이지</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">조회수</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">평균 체류시간</th>
                </tr>
              </thead>
              <tbody>
                {pageViewStats.map((page) => (
                  <tr key={page.path} className="border-t border-card-border">
                    <td className="px-4 py-3 font-mono text-sm">{page.path}</td>
                    <td className="px-4 py-3 text-right">{page.view_count}</td>
                    <td className="px-4 py-3 text-right text-muted">{page.avg_duration}초</td>
                  </tr>
                ))}
                {pageViewStats.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted">
                      데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "events" && (
          <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">이벤트 타입</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">이벤트명</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">횟수</th>
                </tr>
              </thead>
              <tbody>
                {eventStats.map((event, idx) => (
                  <tr key={idx} className="border-t border-card-border">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        event.event_type === "click" ? "bg-blue-500/20 text-blue-500" :
                        event.event_type === "submit" ? "bg-green-500/20 text-green-500" :
                        "bg-gray-500/20 text-gray-500"
                      }`}>
                        {event.event_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{event.event_name}</td>
                    <td className="px-4 py-3 text-right">{event.count}</td>
                  </tr>
                ))}
                {eventStats.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted">
                      데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "realtime" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">최근 페이지뷰</h2>
              <button
                onClick={fetchAnalytics}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors cursor-pointer"
              >
                새로고침
              </button>
            </div>
            <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">시간</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">페이지</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">체류시간</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">세션</th>
                  </tr>
                </thead>
                <tbody>
                  {recentViews.map((view) => (
                    <tr key={view.id} className="border-t border-card-border">
                      <td className="px-4 py-3 text-sm text-muted">
                        {new Date(view.created_at).toLocaleTimeString("ko-KR")}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">{view.path}</td>
                      <td className="px-4 py-3 text-right">{view.duration_seconds || "-"}초</td>
                      <td className="px-4 py-3 text-xs text-muted font-mono">
                        {view.session_id.slice(0, 12)}...
                      </td>
                    </tr>
                  ))}
                  {recentViews.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted">
                        데이터가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 사용자 여정 탭 */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* 첫 행동 통계 */}
            <div className="bg-card-bg border border-card-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">첫 행동 분석</h2>
              <p className="text-sm text-muted mb-4">사용자가 사이트 방문 후 처음으로 취한 행동</p>
              {firstActionStats.length > 0 ? (
                <div className="space-y-3">
                  {firstActionStats.slice(0, 10).map((stat, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent">
                        {idx + 1}
                      </span>
                      <span className="flex-1 text-sm">{stat.action}</span>
                      <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent"
                          style={{ width: `${stat.percentage}%` }}
                        />
                      </div>
                      <span className="w-16 text-right text-sm">{stat.count}명</span>
                      <span className="w-12 text-right text-sm text-muted">{stat.percentage}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-8">데이터가 없습니다.</p>
              )}
            </div>

            {/* 사용자 여정 목록 */}
            <div className="bg-card-bg border border-card-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">세션별 사용자 여정 (최근 50개)</h2>
              <p className="text-sm text-muted mb-4">각 세션의 페이지 방문 순서와 행동을 확인합니다</p>

              <div className="space-y-2">
                {userJourneys.map((journey) => (
                  <div
                    key={journey.session_id}
                    className={`border border-card-border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedJourney?.session_id === journey.session_id
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-secondary/50"
                    }`}
                    onClick={() => setSelectedJourney(
                      selectedJourney?.session_id === journey.session_id ? null : journey
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                          journey.device_type === "mobile" ? "bg-blue-500/20" :
                          journey.device_type === "tablet" ? "bg-purple-500/20" :
                          "bg-green-500/20"
                        }`}>
                          {journey.device_type === "mobile" ? "📱" :
                           journey.device_type === "tablet" ? "📟" : "💻"}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {journey.browser} / {journey.device_type}
                          </p>
                          <p className="text-xs text-muted">
                            {new Date(journey.started_at).toLocaleString("ko-KR")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          <span className="text-primary font-medium">{journey.page_count}</span> 페이지
                        </p>
                        <p className="text-xs text-muted">{journey.total_duration}초 체류</p>
                      </div>
                    </div>

                    {/* 펼쳐진 상세 정보 */}
                    {selectedJourney?.session_id === journey.session_id && (
                      <div className="mt-4 pt-4 border-t border-card-border">
                        <div className="mb-3">
                          <p className="text-xs text-muted mb-1">첫 행동</p>
                          <p className="text-sm font-medium text-accent">{journey.first_action}</p>
                        </div>

                        <div className="mb-3">
                          <p className="text-xs text-muted mb-2">페이지 방문 순서</p>
                          <div className="flex flex-wrap gap-2">
                            {journey.pages.map((page, idx) => (
                              <div key={idx} className="flex items-center gap-1">
                                <span className="px-2 py-1 bg-secondary rounded text-xs font-mono">
                                  {page.path}
                                </span>
                                {idx < journey.pages.length - 1 && (
                                  <span className="text-muted">→</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {journey.events.length > 0 && (
                          <div>
                            <p className="text-xs text-muted mb-2">발생 이벤트</p>
                            <div className="flex flex-wrap gap-2">
                              {journey.events.map((event, idx) => (
                                <span
                                  key={idx}
                                  className={`px-2 py-1 rounded text-xs ${
                                    event.type === "click" ? "bg-blue-500/20 text-blue-400" :
                                    event.type === "submit" ? "bg-green-500/20 text-green-400" :
                                    "bg-gray-500/20 text-gray-400"
                                  }`}
                                >
                                  {event.type}: {event.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="text-xs text-muted mt-3">
                          세션 ID: {journey.session_id}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                {userJourneys.length === 0 && (
                  <p className="text-muted text-center py-8">데이터가 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 퍼널 분석 탭 */}
        {activeTab === "funnel" && (
          <div className="space-y-6">
            <div className="bg-card-bg border border-card-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-2">전환 퍼널</h2>
              <p className="text-sm text-muted mb-6">
                사용자가 메인 페이지에서 상담 신청까지 도달하는 과정
              </p>

              {funnelData.length > 0 ? (
                <div className="space-y-4">
                  {funnelData.map((step, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                            {idx + 1}
                          </span>
                          <span className="font-medium">{step.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-primary">{step.count}</span>
                          <span className="text-sm text-muted ml-2">({step.percentage}%)</span>
                        </div>
                      </div>
                      <div className="h-8 bg-secondary rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                          style={{ width: `${Math.max(step.percentage, 2)}%` }}
                        />
                      </div>
                      {idx < funnelData.length - 1 && (
                        <div className="flex items-center justify-center my-2">
                          <div className="flex items-center gap-2 text-sm text-muted">
                            <span>↓</span>
                            {funnelData[idx + 1] && step.count > 0 && (
                              <span className="text-yellow-500">
                                {Math.round((funnelData[idx + 1].count / step.count) * 100)}% 전환
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-8">데이터가 없습니다.</p>
              )}
            </div>

            {/* 퍼널 인사이트 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card-bg border border-card-border rounded-xl p-6">
                <h3 className="font-semibold mb-3">주요 이탈 구간</h3>
                {funnelData.length >= 2 && (
                  <div className="space-y-2">
                    {funnelData.slice(0, -1).map((step, idx) => {
                      const nextStep = funnelData[idx + 1];
                      const dropRate = step.count > 0
                        ? Math.round(((step.count - nextStep.count) / step.count) * 100)
                        : 0;
                      return (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-muted">
                            {step.name} → {nextStep.name}
                          </span>
                          <span className={`font-medium ${dropRate > 50 ? "text-red-500" : dropRate > 30 ? "text-yellow-500" : "text-green-500"}`}>
                            {dropRate}% 이탈
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-card-bg border border-card-border rounded-xl p-6">
                <h3 className="font-semibold mb-3">개선 제안</h3>
                <ul className="space-y-2 text-sm text-muted">
                  {funnelData.length >= 2 && funnelData[1].percentage < 50 && (
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500">•</span>
                      <span>멘토 페이지 접근성 개선 필요 (현재 {funnelData[1].percentage}%)</span>
                    </li>
                  )}
                  {funnelData.length >= 3 && funnelData[2].percentage < 30 && (
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500">•</span>
                      <span>상담 신청 CTA 버튼 가시성 개선 (현재 {funnelData[2].percentage}%)</span>
                    </li>
                  )}
                  {funnelData.length >= 4 && funnelData[3].percentage < 10 && (
                    <li className="flex items-start gap-2">
                      <span className="text-red-500">•</span>
                      <span>상담 신청 폼 간소화 필요 (완료율 {funnelData[3].percentage}%)</span>
                    </li>
                  )}
                  {funnelData.every(f => f.percentage >= 30) && (
                    <li className="flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      <span>전환율 양호! 현재 상태 유지</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchAnalytics}
            className="px-6 py-3 border border-card-border rounded-lg text-sm hover:border-primary hover:text-primary transition-colors cursor-pointer"
          >
            데이터 새로고침
          </button>
        </div>
      </main>
    </div>
  );
}
