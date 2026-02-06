import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// =============================================
// POST /api/booking/cancel
// 예약 취소 + 환불 처리
// =============================================

const HOURS_48 = 48 * 60 * 60 * 1000;
const HOURS_24 = 24 * 60 * 60 * 1000;

/**
 * Calculate refund rate based on who cancels and when.
 *
 * Mentee cancellation:
 *   - More than 48h before scheduled_at  -> 100%
 *   - 24-48h before                      -> 100%
 *   - Less than 24h                      -> 0%
 *
 * Mentor cancellation:
 *   - Any time                           -> 100% (+ warning to mentor)
 */
function calculateRefundRate(
  cancelledBy: "mentee" | "mentor",
  scheduledAt: string,
): number {
  if (cancelledBy === "mentor") {
    return 100;
  }

  const now = Date.now();
  const scheduledTime = new Date(scheduledAt).getTime();
  const timeUntilSession = scheduledTime - now;

  if (timeUntilSession > HOURS_48) {
    return 100;
  }
  if (timeUntilSession > HOURS_24) {
    return 100;
  }
  return 0;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    let body: { bookingId?: string; reason?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "유효하지 않은 요청 형식이에요." },
        { status: 400 },
      );
    }

    const { bookingId, reason } = body;

    if (!bookingId || typeof bookingId !== "string") {
      return NextResponse.json(
        { error: "bookingId는 필수예요." },
        { status: 400 },
      );
    }

    if (reason !== undefined && typeof reason !== "string") {
      return NextResponse.json(
        { error: "reason은 문자열이어야 해요." },
        { status: 400 },
      );
    }

    // 2. Authenticate the user via Supabase server client
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "로그인이 필요해요." },
        { status: 401 },
      );
    }

    // 3. Fetch the booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "예약을 찾을 수 없어요." },
        { status: 404 },
      );
    }

    // 4. Verify the user is either the mentee or the mentor
    //    We need to look up the mentor's user_id from the mentors table.
    let cancelledBy: "mentee" | "mentor";

    if (booking.mentee_id === user.id) {
      cancelledBy = "mentee";
    } else {
      // Check if the current user is the mentor
      const { data: mentor } = await supabase
        .from("mentors")
        .select("user_id")
        .eq("id", booking.mentor_id)
        .single();

      if (mentor && mentor.user_id === user.id) {
        cancelledBy = "mentor";
      } else {
        return NextResponse.json(
          { error: "이 예약을 취소할 권한이 없어요." },
          { status: 403 },
        );
      }
    }

    // 5. Validate the booking can be cancelled
    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "이미 취소된 예약이에요." },
        { status: 400 },
      );
    }

    if (booking.status === "completed") {
      return NextResponse.json(
        { error: "완료된 예약은 취소할 수 없어요." },
        { status: 400 },
      );
    }

    const cancellableStatuses = ["pending", "paid", "confirmed"];
    if (!cancellableStatuses.includes(booking.status)) {
      return NextResponse.json(
        { error: "현재 상태에서는 취소할 수 없어요." },
        { status: 400 },
      );
    }

    // 6. Calculate refund
    const refundRate = calculateRefundRate(cancelledBy, booking.scheduled_at);
    const refundAmount = Math.round((booking.amount * refundRate) / 100);
    const now = new Date().toISOString();

    // 7. Update booking status to "cancelled"
    const updateData: Record<string, unknown> = {
      status: "cancelled",
      cancelled_at: now,
      cancelled_by: cancelledBy,
      cancel_reason: reason || null,
      refund_amount: refundAmount,
    };

    if (refundAmount > 0) {
      updateData.refunded_at = now;
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", bookingId);

    if (updateError) {
      return NextResponse.json(
        { error: "예약 취소 처리 중 오류가 발생했어요." },
        { status: 500 },
      );
    }

    // 8. If mentor cancels, insert a noshow_record as warning
    if (cancelledBy === "mentor") {
      const { data: mentor } = await supabase
        .from("mentors")
        .select("id")
        .eq("id", booking.mentor_id)
        .single();

      if (mentor) {
        await supabase.from("noshow_records").insert({
          user_id: user.id,
          booking_id: bookingId,
          noshow_type: "mentor_noshow" as const,
        });
      }
    }

    // 9. Return success response
    return NextResponse.json({
      success: true,
      refund_amount: refundAmount,
      refund_rate: refundRate,
    });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했어요." },
      { status: 500 },
    );
  }
}
