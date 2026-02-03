import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { analyticsLimiter } from "@/lib/rate-limit";

function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, duration, session_id } = body;

    if (!path || !session_id || typeof duration !== "number" || duration < 1) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Rate limit — 30 req / 60s per session
    const { success: allowed } = analyticsLimiter.check(session_id);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "DB not configured" }, { status: 500 });
    }

    // 가장 최근 페이지뷰의 duration 업데이트
    const { data } = await supabase
      .from("page_views")
      .select("id")
      .eq("session_id", session_id)
      .eq("path", path)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      await supabase
        .from("page_views")
        .update({ duration_seconds: duration })
        .eq("id", data.id);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
