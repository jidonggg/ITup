import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

// ---------------------------------------------------------------------------
// GET /api/analytics/stats
// Admin-only endpoint returning aggregated user activity analytics
//
// Query params:
//   days     — number of days to look back (default: 7)
//   category — filter by event category (optional)
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    // Admin check via auth token
    const supabase = await createClient();

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const days = Math.min(
      Math.max(parseInt(searchParams.get("days") || "7", 10) || 7, 1),
      90
    );
    const categoryFilter = searchParams.get("category") || null;

    const since = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000
    ).toISOString();

    // Fetch events from activity_logs
    try {
      let query = supabase
        .from("activity_logs")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(5000);

      if (categoryFilter) {
        query = query.eq("category", categoryFilter);
      }

      const { data: events, error: fetchError } = await query;

      if (fetchError) {
        // Table may not exist
        return NextResponse.json({
          totalEvents: 0,
          uniqueUsers: 0,
          mostActivePage: null,
          eventsByCategory: {},
          eventsByPage: {},
          eventsByHour: Array(24).fill(0),
          recentEvents: [],
          funnelData: null,
        });
      }

      const allEvents = events || [];

      // --- Aggregations ---

      // Total events
      const totalEvents = allEvents.length;

      // Unique users (non-null user_ids)
      const uniqueUserIds = new Set(
        allEvents.map((e) => e.user_id).filter(Boolean)
      );
      const uniqueUsers = uniqueUserIds.size;

      // Events by category
      const eventsByCategory: Record<string, number> = {};
      for (const e of allEvents) {
        eventsByCategory[e.category] =
          (eventsByCategory[e.category] || 0) + 1;
      }

      // Events by page
      const eventsByPage: Record<string, number> = {};
      for (const e of allEvents) {
        if (e.page) {
          eventsByPage[e.page] = (eventsByPage[e.page] || 0) + 1;
        }
      }

      // Most active page
      const sortedPages = Object.entries(eventsByPage).sort(
        ([, a], [, b]) => b - a
      );
      const mostActivePage = sortedPages[0]?.[0] ?? null;

      // Events by hour (0-23)
      const eventsByHour = Array(24).fill(0) as number[];
      for (const e of allEvents) {
        const hour = new Date(e.created_at).getHours();
        eventsByHour[hour]++;
      }

      // Recent events (last 50)
      const recentEvents = allEvents.slice(0, 50).map((e) => ({
        id: e.id,
        user_id: e.user_id,
        category: e.category,
        action: e.action,
        label: e.label,
        page: e.page,
        metadata: e.metadata,
        created_at: e.created_at,
      }));

      // Funnel data: mentor apply flow
      const mentorApplyEvents = allEvents.filter(
        (e) => e.page === "/mentor/apply" || e.action?.startsWith("mentor_apply_")
      );
      const funnelData = {
        pageViews: mentorApplyEvents.filter(
          (e) => e.category === "page_view"
        ).length,
        step1: mentorApplyEvents.filter(
          (e) => e.action === "mentor_apply_step" && e.metadata?.step === 1
        ).length,
        step2: mentorApplyEvents.filter(
          (e) => e.action === "mentor_apply_step" && e.metadata?.step === 2
        ).length,
        step3: mentorApplyEvents.filter(
          (e) => e.action === "mentor_apply_step" && e.metadata?.step === 3
        ).length,
        submitted: mentorApplyEvents.filter(
          (e) => e.action === "mentor_apply_submit"
        ).length,
      };

      return NextResponse.json({
        totalEvents,
        uniqueUsers,
        mostActivePage,
        eventsByCategory,
        eventsByPage,
        eventsByHour,
        recentEvents,
        funnelData,
      });
    } catch {
      // Table does not exist — return empty data
      return NextResponse.json({
        totalEvents: 0,
        uniqueUsers: 0,
        mostActivePage: null,
        eventsByCategory: {},
        eventsByPage: {},
        eventsByHour: Array(24).fill(0),
        recentEvents: [],
        funnelData: null,
      });
    }
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
