import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { calculateSettlement } from "@/lib/settlement/calculate";
import { SETTLEMENT } from "@/lib/constants";

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
    const { mentorId, periodStart, periodEnd } = body;

    if (!mentorId || !periodStart || !periodEnd) {
      return NextResponse.json({ error: "mentorId, periodStart, periodEnd가 필요합니다." }, { status: 400 });
    }

    // Get completed bookings in the period that haven't been settled
    const disputeEndDate = new Date(periodEnd);
    disputeEndDate.setDate(disputeEndDate.getDate() - SETTLEMENT.DISPUTE_PERIOD_DAYS);

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, amount, mentor_amount")
      .eq("mentor_id", mentorId)
      .eq("status", "completed")
      .gte("scheduled_at", periodStart)
      .lte("scheduled_at", disputeEndDate.toISOString());

    if (bookingsError) {
      return NextResponse.json({ error: "예약 조회에 실패했습니다." }, { status: 500 });
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        message: "해당 기간에 정산 대상 예약이 없습니다.",
        calculation: null,
      });
    }

    // Filter out already-settled bookings
    const { data: existingSettlements } = await supabase
      .from("settlements")
      .select("booking_ids")
      .eq("mentor_id", mentorId)
      .not("status", "eq", "failed");

    const settledBookingIds = new Set(
      (existingSettlements || []).flatMap(s => s.booking_ids || [])
    );

    const unsettledBookings = bookings.filter(b => !settledBookingIds.has(b.id));

    if (unsettledBookings.length === 0) {
      return NextResponse.json({
        message: "모든 예약이 이미 정산되었습니다.",
        calculation: null,
      });
    }

    const totalAmount = unsettledBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    // Get cumulative earnings for commission tier
    const { data: cumulativeData } = await supabase
      .from("settlements")
      .select("settlement_amount")
      .eq("mentor_id", mentorId)
      .eq("status", "completed");

    const cumulativeEarnings = (cumulativeData || []).reduce(
      (sum, s) => sum + (s.settlement_amount || 0), 0
    );

    const calculation = calculateSettlement(totalAmount, cumulativeEarnings);

    if (calculation.settlementAmount < SETTLEMENT.MIN_AMOUNT) {
      return NextResponse.json({
        message: `최소 정산 금액(${SETTLEMENT.MIN_AMOUNT.toLocaleString()}원) 미만입니다.`,
        calculation,
        bookingIds: unsettledBookings.map(b => b.id),
      });
    }

    return NextResponse.json({
      calculation,
      bookingIds: unsettledBookings.map(b => b.id),
      bookingCount: unsettledBookings.length,
      periodStart,
      periodEnd,
    });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
