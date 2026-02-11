import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTossAuthHeader, isTossConfigured, TOSS_API_BASE } from "@/lib/payment/toss";
import { subscriptionCancelLimiter } from "@/lib/rate-limit";

// =============================================
// POST /api/subscription/cancel
// 사용자 구독(예약) 취소 + TossPayments 환불
// =============================================

const HOURS_48 = 48 * 60 * 60 * 1000;
const HOURS_24 = 24 * 60 * 60 * 1000;

/**
 * 환불 비율 계산
 * - 48시간 전: 전액 환불 (100%)
 * - 24~48시간: 50% 환불
 * - 24시간 이내: 환불 불가 (0%)
 */
function calculateRefundRate(scheduledAt: string): number {
  const now = Date.now();
  const scheduledTime = new Date(scheduledAt).getTime();
  const timeUntilSession = scheduledTime - now;

  if (timeUntilSession > HOURS_48) return 100;
  if (timeUntilSession >= HOURS_24) return 50;
  return 0;
}

export async function POST(request: NextRequest) {
  try {
    // 1. 요청 파싱
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

    if (reason && reason.length > 500) {
      return NextResponse.json(
        { error: "취소 사유는 500자 이내로 작성해주세요." },
        { status: 400 },
      );
    }

    // 2. 사용자 인증
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

    // Rate limiting
    const { success: allowed } = subscriptionCancelLimiter.check(user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: "요청이 너무 많아요. 잠시 후 다시 시도해주세요." },
        { status: 429 },
      );
    }

    // 3. 예약 조회
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

    // 4. 본인 확인 (멘티만 이 API로 취소 가능)
    if (booking.mentee_id !== user.id) {
      return NextResponse.json(
        { error: "본인의 예약만 취소할 수 있어요." },
        { status: 403 },
      );
    }

    // 5. 취소 가능 상태 확인
    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "이미 취소된 예약이에요." },
        { status: 400 },
      );
    }

    if (booking.status === "refunded") {
      return NextResponse.json(
        { error: "이미 환불된 예약이에요." },
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

    // 6. 환불 금액 계산
    const refundRate = calculateRefundRate(booking.scheduled_at);
    const refundAmount = Math.round((booking.amount * refundRate) / 100);
    const now = new Date().toISOString();

    // 7. TossPayments 환불 처리 (유료 예약 & 환불 금액 > 0)
    if (refundAmount > 0 && booking.amount > 0) {
      if (!isTossConfigured()) {
        return NextResponse.json(
          { error: "결제 시스템이 설정되지 않았어요." },
          { status: 503 },
        );
      }

      // payment_key 조회
      const { data: payment } = await supabase
        .from("payments")
        .select("payment_key, status")
        .eq("order_id", booking.order_id)
        .eq("status", "completed")
        .maybeSingle();

      if (payment?.payment_key) {
        try {
          const tossResponse = await fetch(
            `${TOSS_API_BASE}/${payment.payment_key}/cancel`,
            {
              method: "POST",
              headers: {
                "Authorization": getTossAuthHeader(),
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                cancelReason: reason || "사용자 구독 취소",
                cancelAmount: refundAmount,
              }),
            },
          );

          if (!tossResponse.ok) {
            const tossError = await tossResponse.json();
            console.error("[subscription/cancel] TossPayments error:", {
              code: tossError.code,
              message: tossError.message,
              bookingId,
            });
            return NextResponse.json(
              { error: "환불 처리에 실패했어요. 다시 시도해주세요." },
              { status: 502 },
            );
          }

          // payments 테이블 상태 업데이트
          const newPaymentStatus = refundAmount >= booking.amount ? "refunded" : "partial_refunded";
          await supabase
            .from("payments")
            .update({
              status: newPaymentStatus,
              refund_reason: reason || "사용자 구독 취소",
              refunded_at: now,
              refunded_amount: refundAmount,
            })
            .eq("payment_key", payment.payment_key);
        } catch (e) {
          console.error("[subscription/cancel] 환불 예외:", { bookingId }, e);
          return NextResponse.json(
            { error: "환불 처리 중 오류가 발생했어요." },
            { status: 502 },
          );
        }
      }
    }

    // 8. booking 상태 업데이트
    const updateData: Record<string, unknown> = {
      status: "cancelled",
      cancelled_at: now,
      cancelled_by: "mentee",
      cancel_reason: reason || null,
      refund_amount: refundAmount,
    };

    if (refundAmount > 0) {
      updateData.refunded_at = now;
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", bookingId)
      .in("status", cancellableStatuses);

    if (updateError) {
      console.error("[subscription/cancel] booking 업데이트 실패:", updateError.message);
      return NextResponse.json(
        { error: "취소 처리 중 오류가 발생했어요." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      refund_amount: refundAmount,
      refund_rate: refundRate,
      message:
        refundAmount > 0
          ? `취소가 완료되었어요. 환불 금액: ${refundAmount.toLocaleString()}원 (${refundRate}%)`
          : "취소가 완료되었어요. 환불 규정에 따라 환불이 불가합니다.",
    });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했어요." },
      { status: 500 },
    );
  }
}
