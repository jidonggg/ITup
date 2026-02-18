import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// =============================================
// Referral Reward Claim
// Called when a referred user makes their first purchase.
// Awards 5,000 KRW credit to the referrer.
// =============================================

const REFERRAL_CREDIT_AMOUNT = 5000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralCode } = body;

    // Input validation
    if (!referralCode || typeof referralCode !== "string") {
      return NextResponse.json(
        { error: "추천 코드가 필요합니다." },
        { status: 400 }
      );
    }

    // Sanitize input
    const code = referralCode.trim().toUpperCase();
    if (code.length < 4 || code.length > 20) {
      return NextResponse.json(
        { error: "유효하지 않은 추천 코드입니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Authenticate the request (should be called by server or authenticated context)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // body에서 받지 않고 인증된 사용자 ID 강제 사용
    const referredUserId = user.id;

    try {
      // Find the referral record by code
      const { data: referral, error: findError } = await supabase
        .from("mentee_referrals")
        .select("id, user_id, code, invited_count, earned_credits")
        .eq("code", code)
        .single();

      if (findError || !referral) {
        return NextResponse.json(
          { error: "유효하지 않은 추천 코드입니다." },
          { status: 404 }
        );
      }

      // Prevent self-referral
      if (referral.user_id === referredUserId) {
        return NextResponse.json(
          { error: "자기 자신을 추천할 수 없습니다." },
          { status: 400 }
        );
      }

      // Check if this referred user already claimed (prevent double-claiming)
      let duplicateChecked = false;
      try {
        const { data: existingClaim, error: claimError } = await supabase
          .from("referral_claims")
          .select("id")
          .eq("referral_id", referral.id)
          .eq("referred_user_id", referredUserId)
          .single();

        if (!claimError) {
          duplicateChecked = true;
        }

        if (existingClaim) {
          return NextResponse.json(
            { error: "이미 처리된 추천입니다." },
            { status: 409 }
          );
        }
      } catch {
        // referral_claims table may not exist — fallback to bookings check below
      }

      // Fallback: referral_claims 테이블이 없으면 bookings 테이블로 이미 사용 여부 체크
      if (!duplicateChecked) {
        try {
          const { data: existingBooking } = await supabase
            .from("bookings")
            .select("id")
            .eq("mentee_id", referredUserId)
            .eq("referral_code", code)
            .not("status", "eq", "cancelled")
            .limit(1);

          if (existingBooking && existingBooking.length > 0) {
            return NextResponse.json(
              { error: "이미 처리된 추천입니다." },
              { status: 409 }
            );
          }
        } catch {
          // bookings 테이블에 referral_code 컬럼이 없을 수 있음 — 계속 진행
        }
      }

      // Record the claim
      try {
        await supabase.from("referral_claims").insert({
          referral_id: referral.id,
          referred_user_id: referredUserId,
          credit_amount: REFERRAL_CREDIT_AMOUNT,
          created_at: new Date().toISOString(),
        });
      } catch {
        // referral_claims table may not exist — proceed without recording
      }

      // Update referrer's stats: increment invited_count and add credit
      const newInvitedCount = (referral.invited_count ?? 0) + 1;
      const newEarnedCredits = (referral.earned_credits ?? 0) + REFERRAL_CREDIT_AMOUNT;

      const { error: updateError } = await supabase
        .from("mentee_referrals")
        .update({
          invited_count: newInvitedCount,
          earned_credits: newEarnedCredits,
          updated_at: new Date().toISOString(),
        })
        .eq("id", referral.id);

      if (updateError) {
        return NextResponse.json(
          { error: "크레딧 적립 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        referrerId: referral.user_id,
        creditAmount: REFERRAL_CREDIT_AMOUNT,
        totalCredits: newEarnedCredits,
        totalInvited: newInvitedCount,
      });
    } catch {
      // DB table may not exist
      return NextResponse.json(
        { error: "추천 프로그램이 아직 준비 중입니다. 잠시 후 다시 시도해주세요." },
        { status: 503 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "추천 보상 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
