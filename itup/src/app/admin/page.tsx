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
  const [activeTab, setActiveTab] = useState<"overview" | "pages" | "events" | "realtime">("overview");

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
        <div className="flex gap-2 mb-6 border-b border-card-border">
          {(["overview", "pages", "events", "realtime"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === tab
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab === "overview" && "개요"}
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
