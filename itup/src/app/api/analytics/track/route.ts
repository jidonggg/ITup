import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientIp } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// In-memory rate limiter for analytics tracking (100 events/minute per IP)
// Duplicated here to avoid coupling analytics with other rate limiters
// ---------------------------------------------------------------------------
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const LIMIT = 100;
const WINDOW_MS = 60 * 1000;
const MAX_KEYS = 2000;

function checkRateLimit(key: string): boolean {
  // Cleanup when store is too large
  if (store.size > MAX_KEYS) {
    const now = Date.now();
    for (const [k, v] of store) {
      if (now > v.resetAt) store.delete(k);
    }
  }

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count < LIMIT) {
    entry.count++;
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// POST /api/analytics/track
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const ip = getClientIp(request);
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }
    const { category, action, label, page, metadata, timestamp } = body as {
      category?: string;
      action?: string;
      label?: string;
      page?: string;
      metadata?: Record<string, unknown>;
      timestamp?: string;
    };

    // Basic validation
    if (!category || !action) {
      return NextResponse.json(
        { error: "category and action are required" },
        { status: 400 }
      );
    }

    const allowedCategories = [
      "page_view",
      "button_click",
      "form_submit",
      "form_step",
      "auth",
      "booking",
      "error",
    ];
    if (!allowedCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // Get user ID from session (optional — anonymous events are fine)
    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // Auth not available — continue without user
    }

    const userAgent = request.headers.get("user-agent") || "";

    // Store event in Supabase activity_logs table
    try {
      const supabase = await createClient();
      await supabase.from("activity_logs").insert({
        user_id: userId,
        category,
        action,
        label: label || null,
        page: page || null,
        metadata: metadata || null,
        user_agent: userAgent,
        ip_address: ip,
        created_at: timestamp || new Date().toISOString(),
      });
    } catch {
      // Table may not exist yet — fail silently
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[analytics/track] activity_logs table not available, event skipped"
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
