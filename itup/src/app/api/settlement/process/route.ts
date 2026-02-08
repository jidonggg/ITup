import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { calculateSettlement } from "@/lib/settlement/calculate";
import { settlementLimiter } from "@/lib/rate-limit";

// 유효한 상태 전이 맵
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["processing", "failed"],
  processing: ["completed", "failed"],
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Admin auth check
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Rate limiting
    const { success: rateLimitOk } = settlementLimiter.check(user.id);
    if (!rateLimitOk) {
      return NextResponse.json({ error: "요청이 너무 많아요." }, { status: 429 });
    }

    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "action이 필요합니다." }, { status: 400 });
    }

    if (action === "create") {
      const {
        mentorId,
        periodStart,
        periodEnd,
        bookingIds,
        bankAccountId,
      } = body;

      if (!mentorId) {
        return NextResponse.json({ error: "멘토 ID가 필요합니다." }, { status: 400 });
      }

      if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
        return NextResponse.json({ error: "정산 대상 예약이 필요합니다." }, { status: 400 });
      }

      // 서버에서 직접 예약 금액 조회하여 재계산 (클라이언트 값 무시)
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("id, amount")
        .eq("mentor_id", mentorId)
        .eq("status", "completed")
        .in("id", bookingIds);

      if (bookingsError || !bookings || bookings.length === 0) {
        return NextResponse.json({ error: "정산 대상 예약을 찾을 수 없습니다." }, { status: 400 });
      }

      // 서버에서 금액 재계산
      const serverTotalAmount = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
      if (serverTotalAmount <= 0) {
        return NextResponse.json({ error: "정산 금액이 0원 이하입니다." }, { status: 400 });
      }

      // 이중 정산 방지: 이미 정산에 포함된 예약인지 확인
      const { data: existingWithBookings } = await supabase
        .from("settlements")
        .select("id, booking_ids, status")
        .in("status", ["pending", "processing", "completed"]);

      if (existingWithBookings) {
        const alreadySettled = existingWithBookings.some((s) => {
          const settled = s.booking_ids as string[] | null;
          return settled?.some((bid: string) => bookingIds.includes(bid));
        });
        if (alreadySettled) {
          return NextResponse.json(
            { error: "이미 정산에 포함된 예약이 있습니다." },
            { status: 409 }
          );
        }
      }

      // 멘토 누적 수익 조회 (수수료율 결정용)
      const { data: existingSettlements } = await supabase
        .from("settlements")
        .select("settlement_amount")
        .eq("mentor_id", mentorId)
        .eq("status", "completed");

      const cumulativeEarnings = (existingSettlements || []).reduce(
        (sum, s) => sum + (s.settlement_amount || 0), 0
      );

      const calc = calculateSettlement(serverTotalAmount, cumulativeEarnings);

      const { data: settlement, error } = await supabase
        .from("settlements")
        .insert({
          mentor_id: mentorId,
          bank_account_id: bankAccountId || null,
          period_start: periodStart,
          period_end: periodEnd,
          booking_ids: bookingIds,
          total_amount: calc.totalAmount,
          platform_fee: calc.platformFee,
          settlement_amount: calc.settlementAmount,
          commission_rate: calc.commissionRate,
          status: "pending",
          processed_by: user.id,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: "정산 생성에 실패했습니다." }, { status: 500 });
      }

      return NextResponse.json({ settlement });
    }

    // create 이외의 action은 settlementId 필수
    const { settlementId } = body;
    if (!settlementId) {
      return NextResponse.json({ error: "settlementId가 필요합니다." }, { status: 400 });
    }

    // 현재 상태 조회 (bank_account_id 포함)
    const { data: current, error: fetchError } = await supabase
      .from("settlements")
      .select("status, bank_account_id")
      .eq("id", settlementId)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: "정산 레코드를 찾을 수 없습니다." }, { status: 404 });
    }

    // 상태 전이 맵
    const targetStatus: Record<string, string> = {
      process: "processing",
      complete: "completed",
      fail: "failed",
    };

    const newStatus = targetStatus[action];
    if (!newStatus) {
      return NextResponse.json({ error: "잘못된 action입니다." }, { status: 400 });
    }

    // 상태 전이 유효성 검증
    const allowed = VALID_TRANSITIONS[current.status];
    if (!allowed || !allowed.includes(newStatus)) {
      return NextResponse.json(
        { error: `'${current.status}' 상태에서 '${newStatus}'로 변경할 수 없습니다.` },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      status: newStatus,
      processed_by: user.id,
    };

    if (action === "complete") {
      // 정산 완료 시 입금 계좌 검증
      if (!current.bank_account_id) {
        return NextResponse.json(
          { error: "입금 계좌가 등록되지 않아 정산을 완료할 수 없습니다." },
          { status: 400 }
        );
      }
      updateData.settled_at = new Date().toISOString();
    }

    if (action === "fail") {
      updateData.failure_reason = body.failureReason || "관리자에 의해 실패 처리";
    }

    const { error, count } = await supabase
      .from("settlements")
      .update(updateData)
      .eq("id", settlementId)
      .eq("status", current.status);

    if (error) {
      console.error(`[settlement/process] 상태 변경 실패 (${settlementId}):`, error);
      return NextResponse.json({ error: "상태 변경에 실패했습니다." }, { status: 500 });
    }

    // 낙관적 잠금: 동시 요청으로 이미 상태가 변경된 경우
    if (count === 0) {
      return NextResponse.json(
        { error: "이미 다른 요청에 의해 상태가 변경되었습니다. 새로고침 후 다시 시도해주세요." },
        { status: 409 }
      );
    }

    console.log(`[settlement/process] 정산 상태 변경: ${settlementId} ${current.status}→${newStatus} by ${user.email}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[settlement/process] Error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
