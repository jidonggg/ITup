import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { sanitizeInput, isValidLength } from "@/lib/validation";
import { getClientIp } from "@/lib/rate-limit";

const VALID_TYPES = ["bug", "feature", "opinion"] as const;
const VALID_STATUSES = ["new", "in_progress", "resolved", "closed"] as const;
const MIN_MESSAGE_LENGTH = 5;
const MAX_MESSAGE_LENGTH = 1000;

// Simple rate limiter for feedback: 5 per minute per IP
const feedbackRateMap = new Map<string, { count: number; resetAt: number }>();
function checkFeedbackRate(ip: string): boolean {
  const now = Date.now();
  const entry = feedbackRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    feedbackRateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count < 5) {
    entry.count++;
    return true;
  }
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!checkFeedbackRate(ip)) {
      return NextResponse.json(
        { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { type, message, page_url, contact_info } = body;

    // Validate type
    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "유효하지 않은 피드백 유형입니다." },
        { status: 400 }
      );
    }

    // Validate message
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "메시지를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!isValidLength(message, MIN_MESSAGE_LENGTH, MAX_MESSAGE_LENGTH)) {
      return NextResponse.json(
        { error: `메시지는 ${MIN_MESSAGE_LENGTH}자 이상 ${MAX_MESSAGE_LENGTH}자 이하로 입력해주세요.` },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get user if logged in
    let userId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // Not logged in — that's fine
    }

    const feedbackData = {
      user_id: userId,
      type,
      message: sanitizeInput(message.trim()),
      page_url: page_url ? sanitizeInput(String(page_url).slice(0, 500)) : null,
      contact_info: contact_info ? sanitizeInput(String(contact_info).slice(0, 200)) : null,
      status: "new" as const,
      admin_note: null,
    };

    try {
      const { error } = await supabase
        .from("user_feedback")
        .insert(feedbackData);

      if (error) {
        // Table might not exist — log as backup
        console.warn("[Feedback] Supabase insert failed:", error.message);
        console.log("[Feedback] Fallback log:", JSON.stringify(feedbackData));
        // Still return success to user so they don't worry
        return NextResponse.json({ success: true, fallback: true });
      }
    } catch (dbError) {
      console.warn("[Feedback] DB error:", dbError);
      console.log("[Feedback] Fallback log:", JSON.stringify(feedbackData));
      return NextResponse.json({ success: true, fallback: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Feedback] POST error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Admin check via auth header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse filters
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    const typeFilter = searchParams.get("type");

    try {
      let query = supabase
        .from("user_feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter && VALID_STATUSES.includes(statusFilter as typeof VALID_STATUSES[number])) {
        query = query.eq("status", statusFilter);
      }

      if (typeFilter && VALID_TYPES.includes(typeFilter as typeof VALID_TYPES[number])) {
        query = query.eq("type", typeFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.warn("[Feedback] GET query failed:", error.message);
        return NextResponse.json({ data: [], error: error.message });
      }

      return NextResponse.json({ data: data || [] });
    } catch (dbError) {
      console.warn("[Feedback] GET DB error:", dbError);
      return NextResponse.json({ data: [] });
    }
  } catch (error) {
    console.error("[Feedback] GET error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Admin check
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, admin_note } = body;

    if (!id) {
      return NextResponse.json({ error: "ID가 필요합니다." }, { status: 400 });
    }

    const updateData: Record<string, string> = {};

    if (status && VALID_STATUSES.includes(status)) {
      updateData.status = status;
    }

    if (admin_note !== undefined) {
      updateData.admin_note = typeof admin_note === "string" ? sanitizeInput(admin_note.slice(0, 1000)) : "";
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "업데이트할 내용이 없습니다." }, { status: 400 });
    }

    try {
      const { error } = await supabase
        .from("user_feedback")
        .update(updateData)
        .eq("id", id);

      if (error) {
        console.warn("[Feedback] PATCH error:", error.message);
        return NextResponse.json({ error: "업데이트에 실패했습니다." }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.warn("[Feedback] PATCH DB error:", dbError);
      return NextResponse.json({ error: "업데이트에 실패했습니다." }, { status: 500 });
    }
  } catch (error) {
    console.error("[Feedback] PATCH error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
