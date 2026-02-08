import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin";
import { getTossAuthHeader, isTossConfigured, TOSS_API_BASE } from "@/lib/payment/toss";
import { paymentRefundLimiter } from "@/lib/rate-limit";

function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase configuration missing");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Unauthorized", status: 401 };
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return { error: "Unauthorized", status: 401 };
  }

  const supabase = getServiceSupabase();

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { error: "Invalid token", status: 401 };
  }

  if (!isAdmin(user.email)) {
    console.warn(`[SECURITY] Unauthorized refund attempt by: ${user.email}`);
    return { error: "Forbidden - Admin access required", status: 403 };
  }

  return { user };
}

// POST: 환불 처리
export async function POST(request: NextRequest) {
  const adminCheck = await verifyAdmin(request);
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  // Rate limiting
  const { success: allowed } = paymentRefundLimiter.check(adminCheck.user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "요청이 너무 많아요. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  if (!isTossConfigured()) {
    return NextResponse.json(
      { error: "결제 시스템이 설정되지 않았어요." },
      { status: 503 }
    );
  }

  const body = await request.json();
  const { paymentId, reason, cancelAmount } = body;

  if (!paymentId) {
    return NextResponse.json(
      { error: "paymentId는 필수예요." },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();

  // 1. 결제 정보 조회
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (paymentError || !payment) {
    return NextResponse.json(
      { error: "결제 정보를 찾을 수 없어요." },
      { status: 404 }
    );
  }

  if (payment.status === "refunded") {
    return NextResponse.json(
      { error: "이미 환불된 결제예요." },
      { status: 400 }
    );
  }

  if (payment.status !== "completed") {
    return NextResponse.json(
      { error: "완료된 결제만 환불할 수 있어요." },
      { status: 400 }
    );
  }

  if (!payment.payment_key) {
    return NextResponse.json(
      { error: "결제 키가 없어서 환불할 수 없어요." },
      { status: 400 }
    );
  }

  // 2. 환불 금액 검증
  const refundAmount = cancelAmount || payment.amount;

  if (typeof refundAmount !== "number" || refundAmount <= 0) {
    return NextResponse.json(
      { error: "환불 금액은 0보다 커야 해요." },
      { status: 400 }
    );
  }

  // 이미 부분 환불된 금액 확인 (누적 환불 금액 검증)
  const alreadyRefunded = payment.refunded_amount || 0;
  const remainingRefundable = payment.amount - alreadyRefunded;

  if (refundAmount > remainingRefundable) {
    return NextResponse.json(
      { error: `환불 가능 금액(${remainingRefundable}원)을 초과할 수 없어요. (총 결제: ${payment.amount}원, 기 환불: ${alreadyRefunded}원)` },
      { status: 400 }
    );
  }

  // 3. TossPayments 환불 API 호출

  try {
    const tossResponse = await fetch(
      `${TOSS_API_BASE}/${payment.payment_key}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: getTossAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cancelReason: reason || "관리자 환불 처리",
          ...(cancelAmount ? { cancelAmount: refundAmount } : {}),
        }),
      }
    );

    if (!tossResponse.ok) {
      const tossError = await tossResponse.json();
      console.error("[payment/refund] TossPayments error:", { code: tossError.code, message: tossError.message, paymentId });
      return NextResponse.json(
        { error: "환불 처리에 실패했어요. 다시 시도해주세요." },
        { status: 500 }
      );
    }

    // 3. DB 업데이트 — payments
    const totalRefunded = alreadyRefunded + refundAmount;
    const isFullRefund = totalRefunded >= payment.amount;
    const newStatus = isFullRefund ? "refunded" : "partial_refunded";

    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: newStatus,
        refund_reason: reason || "관리자 환불 처리",
        refunded_at: new Date().toISOString(),
        refunded_amount: totalRefunded,
      })
      .eq("id", paymentId);

    if (updateError) {
      return NextResponse.json(
        { error: "환불은 완료되었으나 기록 업데이트에 실패했어요. 수동 확인이 필요합니다." },
        { status: 500 }
      );
    }

    // 4. DB 업데이트 — consultations (전액 환불 시 취소 처리)
    if (isFullRefund && payment.consultation_id) {
      const { error: consultError } = await supabase
        .from("consultations")
        .update({ status: "cancelled" })
        .eq("id", payment.consultation_id);

      if (consultError) {
      }
    }

    return NextResponse.json({
      success: true,
      message: isFullRefund ? "전액 환불이 완료됐어요." : "부분 환불이 완료됐어요.",
      refundAmount,
      totalRefunded,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "환불 처리 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
