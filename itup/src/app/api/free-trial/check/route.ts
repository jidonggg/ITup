import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FREE_TRIAL_LIMIT } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Bearer token 인증
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      // 비로그인 → 배너는 보여주되, 실제 예약 시 인증 필요
      return NextResponse.json({ eligible: true, used: 0, limit: FREE_TRIAL_LIMIT });
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ eligible: false }, { status: 401 });
    }

    // payment_method = "free_trial"로 정확히 판별
    const { data: freeTrialBookings, error } = await supabase
      .from("bookings")
      .select("id")
      .eq("mentee_id", user.id)
      .eq("payment_method", "free_trial")
      .not("status", "eq", "cancelled");

    if (error) {
      // Fail-Closed: 에러 시 자격 없음 처리
      return NextResponse.json({ eligible: false });
    }

    const freeTrialCount = freeTrialBookings?.length || 0;
    const eligible = freeTrialCount < FREE_TRIAL_LIMIT;

    return NextResponse.json({
      eligible,
      used: freeTrialCount,
      limit: FREE_TRIAL_LIMIT,
    });
  } catch {
    // Fail-Closed
    return NextResponse.json({ eligible: false });
  }
}
