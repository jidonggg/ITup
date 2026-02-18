import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Generate a deterministic referral code from a mentor's user ID.
 * Used as fallback when the mentor_referrals table does not exist yet.
 */
function generateDeterministicCode(userId: string): string {
  // Take characters from the user ID to build a stable 5-char suffix
  const cleaned = userId.replace(/-/g, "").toUpperCase();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // exclude ambiguous 0/O, 1/I
  let code = "";
  for (let i = 0; i < 5; i++) {
    const charCode = cleaned.charCodeAt((i * 7) % cleaned.length);
    code += chars[charCode % chars.length];
  }
  return `MREF${code}`;
}

/**
 * Generate a random referral code (MREF + 5 random chars).
 */
function generateRandomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 5; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `MREF${suffix}`;
}

// GET: Return existing referral code for the mentor, or generate a new one
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // --- Auth ---
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // --- Mentor check ---
    const { data: mentor, error: mentorError } = await supabase
      .from("mentors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (mentorError || !mentor) {
      return NextResponse.json(
        { error: "멘토 정보를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // --- Try mentor_referrals table ---
    try {
      // Check for existing referral code
      const { data: existing, error: selectError } = await supabase
        .from("mentor_referrals")
        .select("code, invited_count, approved_count")
        .eq("mentor_id", mentor.id)
        .single();

      if (selectError && selectError.code !== "PGRST116") {
        // PGRST116 = no rows found — any other error means table may not exist
        throw selectError;
      }

      if (existing) {
        const referralUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://coffeechat.it.kr"}/mentor/recruit?ref=${existing.code}`;
        return NextResponse.json({
          code: existing.code,
          referralUrl,
          stats: {
            invited: existing.invited_count ?? 0,
            approved: existing.approved_count ?? 0,
          },
        });
      }

      // No existing code — create one
      let code = generateRandomCode();

      // Collision check (up to 3 attempts)
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data: collision } = await supabase
          .from("mentor_referrals")
          .select("id")
          .eq("code", code)
          .single();

        if (!collision) break;
        code = generateRandomCode();
      }

      const { data: inserted, error: insertError } = await supabase
        .from("mentor_referrals")
        .insert({
          mentor_id: mentor.id,
          user_id: user.id,
          code,
          invited_count: 0,
          approved_count: 0,
        })
        .select("code, invited_count, approved_count")
        .single();

      if (insertError) {
        throw insertError;
      }

      const referralUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://coffeechat.it.kr"}/mentor/recruit?ref=${inserted.code}`;
      return NextResponse.json({
        code: inserted.code,
        referralUrl,
        stats: {
          invited: inserted.invited_count ?? 0,
          approved: inserted.approved_count ?? 0,
        },
      });
    } catch {
      // Table does not exist or other DB error — fallback to deterministic code
      const code = generateDeterministicCode(user.id);
      const referralUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://coffeechat.it.kr"}/mentor/recruit?ref=${code}`;

      return NextResponse.json({
        code,
        referralUrl,
        stats: {
          invited: 0,
          approved: 0,
        },
      });
    }
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
