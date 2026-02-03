import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_EMAILS } from "@/lib/admin";

const TOSS_SECRET_KEY = process.env.TOSS_PAYMENTS_SECRET_KEY;

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

  const token = authHeader.split(" ")[1];
  const supabase = getServiceSupabase();

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { error: "Invalid token", status: 401 };
  }

  if (!ADMIN_EMAILS.includes(user.email?.toLowerCase() || "")) {
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

  if (!TOSS_SECRET_KEY) {
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

  // 2. TossPayments 환불 API 호출
  const refundAmount = cancelAmount || payment.amount;

  try {
    const tossResponse = await fetch(
      `https://api.tosspayments.com/v1/payments/${payment.payment_key}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(TOSS_SECRET_KEY + ":").toString("base64")}`,
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
      return NextResponse.json(
        { error: `환불 처리 실패: ${tossError.message || "알 수 없는 오류"}` },
        { status: 500 }
      );
    }

    // 3. DB 업데이트 — payments
    const isPartial = cancelAmount && cancelAmount < payment.amount;
    const newStatus = isPartial ? "partial_refunded" : "refunded";

    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: newStatus,
        refund_reason: reason || "관리자 환불 처리",
        refunded_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    if (updateError) {
      return NextResponse.json(
        { error: "환불은 완료되었으나 기록 업데이트에 실패했어요. 수동 확인이 필요합니다." },
        { status: 500 }
      );
    }

    // 4. DB 업데이트 — consultations (전액 환불 시 취소 처리)
    if (!isPartial && payment.consultation_id) {
      const { error: consultError } = await supabase
        .from("consultations")
        .update({ status: "cancelled" })
        .eq("id", payment.consultation_id);

      if (consultError) {
      }
    }

    return NextResponse.json({
      success: true,
      message: isPartial ? "부분 환불이 완료됐어요." : "전액 환불이 완료됐어요.",
      refundAmount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "환불 처리 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}
