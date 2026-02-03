import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// TossPayments API 시크릿 키 (미설정 시 결제 처리 차단)
const TOSS_SECRET_KEY = process.env.TOSS_PAYMENTS_SECRET_KEY;

// 상품 가격 (서버에서 검증용)
const PRODUCT_PRICES: Record<string, number> = {
  COFFEE: 15000,
  RESUME: 39000,
  INTERVIEW: 59000,
};

// 번들 가격 (서버에서 검증용)
const BUNDLE_PRICES: Record<string, number> = {
  BUNDLE_STARTER: 39000,
  BUNDLE_ALLINONE: 79000,
  BUNDLE_FULL: 99000,
};

// 플랫폼 수수료율 (단계별: 0%→15%→20%→25%)
// 현재 런칭 초기 → 15%
const PLATFORM_COMMISSION_RATE = 0.15;

// 서버사이드 Supabase 클라이언트
function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// orderId 프리픽스 추출 (BUNDLE_STARTER, BUNDLE_ALLINONE, BUNDLE_FULL, COFFEE, RESUME, INTERVIEW)
function getOrderPrefix(orderId: string): string {
  const parts = orderId.split("_");
  // 번들: BUNDLE_STARTER_xxx, BUNDLE_ALLINONE_xxx, BUNDLE_FULL_xxx
  if (parts[0] === "BUNDLE" && parts.length > 2) {
    return `${parts[0]}_${parts[1]}`;
  }
  // 상품: COFFEE_xxx, RESUME_xxx, INTERVIEW_xxx
  return parts[0].toUpperCase();
}

// orderId에서 userId 추출
function getUserIdFromOrder(orderId: string): string | null {
  const parts = orderId.split("_");
  // 번들: BUNDLE_TYPE_userId_ts_rand (index 2)
  if (parts[0] === "BUNDLE" && parts.length > 4) {
    return parts[2];
  }
  // 상품: TYPE_userId_ts_rand (index 1)
  if (parts.length > 3) {
    return parts[1];
  }
  return null;
}

// 사용자 인증 검증
async function verifyUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  const serviceSupabase = getServiceSupabase();
  if (!serviceSupabase) return null;

  const { data: { user }, error } = await serviceSupabase.auth.getUser(token);
  if (error || !user) return null;

  return user;
}

export async function POST(request: NextRequest) {
  try {
    if (!TOSS_SECRET_KEY) {
      return NextResponse.json(
        { error: "결제 시스템이 설정되지 않았어요." },
        { status: 503 }
      );
    }

    // 사용자 인증 검증
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요해요." },
        { status: 401 }
      );
    }

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

    // orderId의 userId와 인증된 사용자 일치 검증
    const orderUserId = getUserIdFromOrder(orderId);
    if (orderUserId && orderUserId !== user.id) {
      return NextResponse.json(
        { error: "결제 요청자와 로그인 사용자가 일치하지 않아요." },
        { status: 403 }
      );
    }

    // consultationId 추출 (URL 쿼리에서 전달됨)
    const url = new URL(request.url);
    const consultationId = url.searchParams.get("consultationId");

    // 1. 결제 금액 서버 검증
    let expectedAmount: number | null = null;
    const isProductOrder = !!PRODUCT_PRICES[prefix];
    const isBundleOrder = !!BUNDLE_PRICES[prefix];

    if (isProductOrder) {
      // 상품 결제: DB에서 expected_amount 조회 (더 안전)
      if (supabase && consultationId && consultationId !== "local") {
        const { data: consultation } = await supabase
          .from("consultations")
          .select("expected_amount")
          .eq("id", consultationId)
          .single();
        expectedAmount = consultation?.expected_amount ?? null;
      }
      if (!expectedAmount) {
        // DB 조회 실패 시 상수로 폴백
        expectedAmount = PRODUCT_PRICES[prefix];
      }
    } else if (isBundleOrder) {
      expectedAmount = BUNDLE_PRICES[prefix];
    } else {
      return NextResponse.json(
        { error: "알 수 없는 주문 유형이에요." },
        { status: 400 }
      );
    }

    if (Number(amount) !== expectedAmount) {
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
        .limit(1)
        .maybeSingle();

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
      const userId = getUserIdFromOrder(orderId);

      // product_type / bundle_type 결정
      const productType = isProductOrder ? prefix.toLowerCase() : null;
      const bundleType = isBundleOrder ? prefix.replace("BUNDLE_", "").toLowerCase() : null;

      // 수수료 계산 (런칭 초기 15%)
      const platformFee = Math.round(Number(amount) * PLATFORM_COMMISSION_RATE);
      const mentorAmount = Number(amount) - platformFee;

      // payments 테이블에 저장
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .insert({
          user_id: userId,
          consultation_id: consultationId && consultationId !== "local" ? consultationId : null,
          order_id: orderId,
          payment_key: paymentKey,
          amount: Number(amount),
          platform_fee: platformFee,
          mentor_amount: mentorAmount,
          status: "completed",
          product_type: productType,
          bundle_type: bundleType,
          payment_method: tossResult.method || "card",
          approved_at: tossResult.approvedAt,
          receipt_url: tossResult.receipt?.url,
          raw_response: tossResult,
        })
        .select("id")
        .single();

      if (paymentError) {
        return NextResponse.json(
          { error: "결제는 완료되었으나 기록 저장에 실패했어요. 고객센터에 문의해주세요." },
          { status: 500 }
        );
      }

      // 상품 결제인 경우: 상담 상태를 confirmed로 업데이트
      if (isProductOrder && consultationId && consultationId !== "local") {
        const { error: consultError } = await supabase
          .from("consultations")
          .update({
            status: "confirmed",
            payment_id: paymentData?.id || null,
          })
          .eq("id", consultationId);

        if (consultError) {
        }

        // 이메일 알림 발송 (비동기)
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
        if (siteUrl) {
          const notifyHeaders = {
            "Content-Type": "application/json",
            "x-api-secret": process.env.INTERNAL_API_SECRET || "",
          };

          // 1. 멘티에게 상담 확정 알림
          fetch(`${siteUrl}/api/email/notify`, {
            method: "POST",
            headers: notifyHeaders,
            body: JSON.stringify({
              type: "consultation_confirmed",
              data: { consultationId },
            }),
          }).catch(() => {});

          // 2. 멘토에게 새 상담 신청 알림
          const { data: consultInfo } = await supabase
            .from("consultations")
            .select("mentor_id, user_name, user_email, user_phone, interest, preferred_time, message")
            .eq("id", consultationId)
            .single();

          if (consultInfo?.mentor_id) {
            fetch(`${siteUrl}/api/email/notify`, {
              method: "POST",
              headers: notifyHeaders,
              body: JSON.stringify({
                type: "consultation_request",
                data: {
                  mentorId: consultInfo.mentor_id,
                  menteeName: consultInfo.user_name,
                  menteeEmail: consultInfo.user_email,
                  menteePhone: consultInfo.user_phone,
                  interest: consultInfo.interest,
                  preferredTime: consultInfo.preferred_time,
                  message: consultInfo.message,
                },
              }),
            }).catch(() => {});
          }
        }
      }

      // 번들 결제인 경우: consultation 1건 생성 (bundle_type 기록)
      if (isBundleOrder && userId) {
        await supabase.from("consultations").insert({
          user_id: userId,
          user_name: tossResult.customerName || "",
          user_phone: "",
          user_email: tossResult.customerEmail || "",
          product_type: null,
          interest: null,
          preferred_time: null,
          message: `${prefix.replace("BUNDLE_", "")} 번들 구매`,
          expected_amount: Number(amount),
          payment_id: paymentData?.id || null,
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
