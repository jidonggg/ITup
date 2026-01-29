import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// TossPayments API 시크릿 키
const TOSS_SECRET_KEY = process.env.TOSS_PAYMENTS_SECRET_KEY || "";

// 구독 플랜 가격 (서버에서 검증용)
const PLAN_PRICES: Record<string, number> = {
  BASIC: 59000,
  STANDARD: 129000,
};

// 서버사이드 Supabase 클라이언트
function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// orderId 프리픽스 추출
function getOrderPrefix(orderId: string): string {
  return orderId.split("_")[0].toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentKey, orderId, amount } = body;

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    const prefix = getOrderPrefix(orderId);

    // consultationId 추출 (URL 쿼리에서 전달됨)
    const url = new URL(request.url);
    const consultationId = url.searchParams.get("consultationId");

    // 1. 결제 금액 서버 검증
    let expectedAmount: number | null = null;

    if (prefix === "CONSULT") {
      // 상담 결제: DB에서 expected_amount 조회
      if (supabase && consultationId && consultationId !== "local") {
        const { data: consultation } = await supabase
          .from("consultations")
          .select("expected_amount")
          .eq("id", consultationId)
          .single();
        expectedAmount = consultation?.expected_amount ?? null;
      }
      if (!expectedAmount) {
        console.error(`Cannot verify CONSULT amount: no consultation found for ${consultationId}`);
        return NextResponse.json(
          { error: "상담 정보를 찾을 수 없어요." },
          { status: 400 }
        );
      }
    } else if (PLAN_PRICES[prefix]) {
      expectedAmount = PLAN_PRICES[prefix];
    } else {
      console.error(`Unknown order type: ${orderId}`);
      return NextResponse.json(
        { error: "알 수 없는 주문 유형이에요." },
        { status: 400 }
      );
    }

    if (Number(amount) !== expectedAmount) {
      console.error(`Amount mismatch: expected ${expectedAmount}, got ${amount}`);
      return NextResponse.json(
        { error: "결제 금액이 일치하지 않아요." },
        { status: 400 }
      );
    }

    // 2. 결제 중복 확인 (payment_key)
    if (supabase) {
      const { data: existingPayment } = await supabase
        .from("payments")
        .select("id")
        .eq("payment_key", paymentKey)
        .single();

      if (existingPayment) {
        return NextResponse.json(
          { error: "이미 처리된 결제입니다." },
          { status: 400 }
        );
      }
    }

    // TossPayments 결제 승인 API 호출
    const encryptedSecretKey = Buffer.from(TOSS_SECRET_KEY + ":").toString("base64");

    const tossResponse = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${encryptedSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: Number(amount),
      }),
    });

    const tossResult = await tossResponse.json();

    if (!tossResponse.ok) {
      console.error("TossPayments error:", tossResult);
      return NextResponse.json(
        {
          error: tossResult.message || "Payment confirmation failed",
          code: tossResult.code,
        },
        { status: tossResponse.status }
      );
    }

    // 결제 성공 - DB에 저장
    if (supabase) {
      const orderParts = orderId.split("_");

      // userId 추출 (형식: TYPE_userId_timestamp_random)
      const userId = orderParts.length > 3 ? orderParts[1] : null;

      // payments 테이블에 저장
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .insert({
          user_id: userId,
          consultation_id: consultationId && consultationId !== "local" ? consultationId : null,
          order_id: orderId,
          payment_key: paymentKey,
          amount: Number(amount),
          status: "completed",
          plan_type: prefix.toLowerCase(),
          payment_method: tossResult.method || "card",
          approved_at: tossResult.approvedAt,
          receipt_url: tossResult.receipt?.url,
          raw_response: tossResult,
        })
        .select("id")
        .single();

      if (paymentError) {
        console.error("Payment save error:", paymentError);
      }

      // 상담 결제인 경우: 상담 상태를 confirmed로 업데이트
      if (prefix === "CONSULT" && consultationId && consultationId !== "local") {
        const { error: consultError } = await supabase
          .from("consultations")
          .update({
            status: "confirmed",
            payment_id: paymentData?.id || null,
          })
          .eq("id", consultationId);

        if (consultError) {
          console.error("Consultation update error:", consultError);
        }

        // 멘토에게 이메일 알림 발송 (비동기)
        fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/email/notify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "consultation_confirmed",
            data: { consultationId },
          }),
        }).catch(console.error);
      }

      // 구독 플랜 결제인 경우: 구독 정보 업데이트
      if (["BASIC", "STANDARD"].includes(prefix) && userId) {
        const subscriptionEndDate = new Date();
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

        await supabase
          .from("subscriptions")
          .upsert({
            user_id: userId,
            plan_type: prefix.toLowerCase(),
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: subscriptionEndDate.toISOString(),
          }, {
            onConflict: "user_id",
          });
      }
    }

    return NextResponse.json({
      success: true,
      orderId: tossResult.orderId,
      amount: tossResult.totalAmount,
      method: tossResult.method,
      approvedAt: tossResult.approvedAt,
    });

  } catch (error) {
    console.error("Payment confirmation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
