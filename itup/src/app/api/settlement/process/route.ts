import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

// 유효한 상태 전이 맵
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["processing"],
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

    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "action이 필요합니다." }, { status: 400 });
    }

    if (action === "create") {
      // create는 settlementId 불필요
      const {
        mentorId,
        periodStart,
        periodEnd,
        bookingIds,
        totalAmount,
        platformFee,
        settlementAmount,
        commissionRate,
        bankAccountId,
      } = body;

      if (!mentorId || !totalAmount) {
        return NextResponse.json({ error: "필수 정보가 누락되었습니다." }, { status: 400 });
      }

      const { data: settlement, error } = await supabase
        .from("settlements")
        .insert({
          mentor_id: mentorId,
          bank_account_id: bankAccountId || null,
          period_start: periodStart,
          period_end: periodEnd,
          booking_ids: bookingIds || [],
          total_amount: totalAmount,
          platform_fee: platformFee,
          settlement_amount: settlementAmount,
          commission_rate: commissionRate,
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

    const { error } = await supabase
      .from("settlements")
      .update(updateData)
      .eq("id", settlementId);

    if (error) {
      return NextResponse.json({ error: "상태 변경에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
