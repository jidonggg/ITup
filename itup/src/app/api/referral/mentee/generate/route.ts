import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SITE_CONFIG } from "@/lib/site-config";

// =============================================
// Referral Code Generation
// Format: REF + 6 random alphanumeric chars (e.g., REFAB3K9M)
// =============================================

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "REF";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function buildReferralUrl(code: string): string {
  const baseUrl = SITE_CONFIG.url.replace(/\/$/, "");
  return `${baseUrl}/refer/${code}`;
}

export async function POST() {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // Try to fetch existing referral code from DB
    try {
      const { data: existing, error: fetchError } = await supabase
        .from("mentee_referrals")
        .select("code, invited_count, earned_credits")
        .eq("user_id", user.id)
        .single();

      // If existing referral code found, return it
      if (!fetchError && existing) {
        return NextResponse.json({
          code: existing.code,
          referralUrl: buildReferralUrl(existing.code),
          invitedCount: existing.invited_count ?? 0,
          earnedCredits: existing.earned_credits ?? 0,
        });
      }

      // Generate a new code and insert
      const code = generateCode();

      const { data: inserted, error: insertError } = await supabase
        .from("mentee_referrals")
        .insert({
          user_id: user.id,
          code,
          invited_count: 0,
          earned_credits: 0,
          created_at: new Date().toISOString(),
        })
        .select("code, invited_count, earned_credits")
        .single();

      if (insertError) {
        // Unique constraint violation — code collision, retry once
        if (insertError.code === "23505") {
          const retryCode = generateCode();
          const { data: retryInserted, error: retryError } = await supabase
            .from("mentee_referrals")
            .insert({
              user_id: user.id,
              code: retryCode,
              invited_count: 0,
              earned_credits: 0,
              created_at: new Date().toISOString(),
            })
            .select("code, invited_count, earned_credits")
            .single();

          if (retryError || !retryInserted) {
            // Fallback: return generated code without DB persistence
            return NextResponse.json({
              code: retryCode,
              referralUrl: buildReferralUrl(retryCode),
              invitedCount: 0,
              earnedCredits: 0,
              fallback: true,
            });
          }

          return NextResponse.json({
            code: retryInserted.code,
            referralUrl: buildReferralUrl(retryInserted.code),
            invitedCount: retryInserted.invited_count ?? 0,
            earnedCredits: retryInserted.earned_credits ?? 0,
          });
        }

        // Table might not exist (42P01) or other schema errors — fallback
        const fallbackCode = generateCode();
        return NextResponse.json({
          code: fallbackCode,
          referralUrl: buildReferralUrl(fallbackCode),
          invitedCount: 0,
          earnedCredits: 0,
          fallback: true,
        });
      }

      if (!inserted) {
        const fallbackCode = generateCode();
        return NextResponse.json({
          code: fallbackCode,
          referralUrl: buildReferralUrl(fallbackCode),
          invitedCount: 0,
          earnedCredits: 0,
          fallback: true,
        });
      }

      return NextResponse.json({
        code: inserted.code,
        referralUrl: buildReferralUrl(inserted.code),
        invitedCount: inserted.invited_count ?? 0,
        earnedCredits: inserted.earned_credits ?? 0,
      });
    } catch {
      // DB table may not exist — generate code without persistence
      const fallbackCode = generateCode();
      return NextResponse.json({
        code: fallbackCode,
        referralUrl: buildReferralUrl(fallbackCode),
        invitedCount: 0,
        earnedCredits: 0,
        fallback: true,
      });
    }
  } catch {
    return NextResponse.json(
      { error: "추천 코드 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
