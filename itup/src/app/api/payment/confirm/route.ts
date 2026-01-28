import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// TossPayments API 시크릿 키
const TOSS_SECRET_KEY = process.env.TOSS_PAYMENTS_SECRET_KEY || "";

// 서버사이드 Supabase 클라이언트
function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
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
    const supabase = getServiceSupabase();

    if (supabase) {
      // 사용자 ID 추출 (orderId 형식: PLAN_userId_timestamp)
      const orderParts = orderId.split("_");
      const planType = orderParts[0]; // BASIC, PRO, PREMIUM
      const userId = orderParts.length > 2 ? orderParts[1] : null;

      // payments 테이블에 저장
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          user_id: userId,
          order_id: orderId,
          payment_key: paymentKey,
          amount: Number(amount),
          status: "completed",
          plan_type: planType.toLowerCase(),
          payment_method: tossResult.method || "card",
          approved_at: tossResult.approvedAt,
          receipt_url: tossResult.receipt?.url,
          raw_response: tossResult,
        });

      if (paymentError) {
        console.error("Payment save error:", paymentError);
        // 결제는 성공했으므로 에러 로그만 남기고 진행
      }

      // 구독 정보 업데이트 (선택적)
      if (userId && planType) {
        const subscriptionEndDate = new Date();
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

        await supabase
          .from("subscriptions")
          .upsert({
            user_id: userId,
            plan_type: planType.toLowerCase(),
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
