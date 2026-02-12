import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTossAuthHeader, isTossConfigured, TOSS_API_BASE } from "@/lib/payment/toss";
import { paymentConfirmLimiter } from "@/lib/rate-limit";

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

// orderId에서 userId 추출 + UUID 형식 검증
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getUserIdFromOrder(orderId: string): string | null {
  const parts = orderId.split("_");
  let userId: string | null = null;
  // 번들: BUNDLE_TYPE_userId_ts_rand (index 2)
  if (parts[0] === "BUNDLE" && parts.length > 4) {
    userId = parts[2];
  }
  // 상품: TYPE_userId_ts_rand (index 1)
  else if (parts.length > 3) {
    userId = parts[1];
  }
  // UUID 형식 검증
  if (userId && !UUID_REGEX.test(userId)) {
    return null;
  }
  return userId;
}

// 사용자 인증 검증
async function verifyUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  const serviceSupabase = getServiceSupabase();
  if (!serviceSupabase) return null;

  const { data: { user }, error } = await serviceSupabase.auth.getUser(token);
  if (error || !user) return null;

  return user;
}

export async function POST(request: NextRequest) {
  try {
    if (!isTossConfigured()) {
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

    // Rate limiting
    const { success: allowed, retryAfterMs } = paymentConfirmLimiter.check(user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: "요청이 너무 많아요. 잠시 후 다시 시도해주세요." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
      );
    }

    let body: { paymentKey?: string; orderId?: string; amount?: number; };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "유효하지 않은 요청 형식이에요." },
        { status: 400 },
      );
    }
    const { paymentKey, orderId, amount } = body;

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // 입력값 길이 검증
    if (typeof paymentKey !== "string" || paymentKey.length > 200) {
      return NextResponse.json({ error: "유효하지 않은 paymentKey" }, { status: 400 });
    }
    if (typeof orderId !== "string" || orderId.length > 200) {
      return NextResponse.json({ error: "유효하지 않은 orderId" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const prefix = getOrderPrefix(orderId);

    // orderId의 userId와 인증된 사용자 일치 검증 (파싱 실패 시에도 차단)
    const orderUserId = getUserIdFromOrder(orderId);
    if (!orderUserId || orderUserId !== user.id) {
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
      // 상품 결제: DB에서 expected_amount 조회 + 소유권 검증
      if (supabase && consultationId && consultationId !== "local") {
        const { data: consultation } = await supabase
          .from("consultations")
          .select("expected_amount, user_id")
          .eq("id", consultationId)
          .single();

        // consultation 소유권 검증
        if (consultation && consultation.user_id !== user.id) {
          return NextResponse.json(
            { error: "본인의 상담 건만 결제할 수 있어요." },
            { status: 403 }
          );
        }

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

    // 2. 결제 중복 확인 (payment_key, order_id 각각 별도 쿼리 - 인젝션 방지)
    if (supabase) {
      const [{ data: byKey }, { data: byOrder }] = await Promise.all([
        supabase
          .from("payments")
          .select("id")
          .eq("payment_key", paymentKey)
          .limit(1)
          .maybeSingle(),
        supabase
          .from("payments")
          .select("id")
          .eq("order_id", orderId)
          .limit(1)
          .maybeSingle(),
      ]);

      if (byKey || byOrder) {
        return NextResponse.json(
          { error: "이미 처리된 결제입니다." },
          { status: 400 }
        );
      }
    }

    // TossPayments 결제 승인 API 호출
    const tossResponse = await fetch(`${TOSS_API_BASE}/confirm`, {
      method: "POST",
      headers: {
        "Authorization": getTossAuthHeader(),
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
      console.error("[payment/confirm] TossPayments error:", tossResult.code, tossResult.message);
      return NextResponse.json(
        { error: "결제 승인에 실패했어요. 다시 시도해주세요." },
        { status: 400 }
      );
    }

    // Toss 응답의 실제 결제 금액 검증 (서버에서 확인한 금액과 일치하는지)
    if (tossResult.totalAmount !== expectedAmount) {
      console.error(
        "[payment/confirm] Toss 금액 불일치:",
        { expected: expectedAmount, actual: tossResult.totalAmount, orderId }
      );
      // 금액 불일치 시 결제 취소
      try {
        await fetch(`${TOSS_API_BASE}/${paymentKey}/cancel`, {
          method: "POST",
          headers: {
            "Authorization": getTossAuthHeader(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cancelReason: "서버 검증 금액 불일치로 인한 자동 취소",
          }),
        });
      } catch {
        console.error("[CRITICAL] 금액 불일치 결제 취소 실패:", { paymentKey, orderId });
      }
      return NextResponse.json(
        { error: "결제 금액 검증에 실패했어요. 결제가 취소되었습니다." },
        { status: 400 }
      );
    }

    // 결제 성공 - DB에 저장 (Toss 확인 금액 사용)
    if (supabase) {
      const userId = getUserIdFromOrder(orderId);

      // product_type / bundle_type 결정
      const productType = isProductOrder ? prefix.toLowerCase() : null;
      const bundleType = isBundleOrder ? prefix.replace("BUNDLE_", "").toLowerCase() : null;

      // 수수료 계산 (런칭 초기 15%) - Toss 확인 금액 기준
      const confirmedAmount = tossResult.totalAmount;
      const platformFee = Math.round(confirmedAmount * PLATFORM_COMMISSION_RATE);
      const mentorAmount = confirmedAmount - platformFee;

      // payments 테이블에 저장
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .insert({
          user_id: userId,
          consultation_id: consultationId && consultationId !== "local" ? consultationId : null,
          order_id: orderId,
          payment_key: paymentKey,
          amount: confirmedAmount,
          platform_fee: platformFee,
          mentor_amount: mentorAmount,
          status: "completed",
          product_type: productType,
          bundle_type: bundleType,
          payment_method: tossResult.method || "card",
          approved_at: tossResult.approvedAt,
          receipt_url: tossResult.receipt?.url,
          raw_response: {
            orderId: tossResult.orderId,
            totalAmount: tossResult.totalAmount,
            method: tossResult.method,
            approvedAt: tossResult.approvedAt,
            status: tossResult.status,
          },
        })
        .select("id")
        .single();

      if (paymentError) {
        // DB 저장 실패 시 재시도 (최대 2회)
        let dbRetrySuccess = false;
        for (let attempt = 1; attempt <= 2; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          const { error: retryError } = await supabase
            .from("payments")
            .insert({
              user_id: userId,
              consultation_id: consultationId && consultationId !== "local" ? consultationId : null,
              order_id: orderId,
              payment_key: paymentKey,
              amount: confirmedAmount,
              platform_fee: platformFee,
              mentor_amount: mentorAmount,
              status: "completed",
              product_type: productType,
              bundle_type: bundleType,
              payment_method: tossResult.method || "card",
              approved_at: tossResult.approvedAt,
              receipt_url: tossResult.receipt?.url,
              raw_response: {
                orderId: tossResult.orderId,
                totalAmount: tossResult.totalAmount,
                method: tossResult.method,
                approvedAt: tossResult.approvedAt,
                status: tossResult.status,
              },
            })
            .select("id")
            .single();
          if (!retryError) {
            dbRetrySuccess = true;
            break;
          }
          console.error(`[payment/confirm] DB 저장 재시도 ${attempt}/2 실패:`, retryError.message);
        }

        if (!dbRetrySuccess) {
          // 재시도 모두 실패 → TossPayments 결제 자동 취소 (보상 트랜잭션)
          let cancelSuccess = false;
          try {
            const cancelResponse = await fetch(`${TOSS_API_BASE}/${paymentKey}/cancel`, {
              method: "POST",
              headers: {
                "Authorization": getTossAuthHeader(),
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                cancelReason: "DB 저장 실패로 인한 자동 취소",
              }),
            });
            cancelSuccess = cancelResponse.ok;
          } catch {
            cancelSuccess = false;
          }

          if (!cancelSuccess) {
            // 자동 취소도 실패 → 수동 처리 필요 기록 + 관리자 알림
            console.error(
              `[CRITICAL] 결제 승인 후 DB 저장 실패 & 자동 취소도 실패. 수동 처리 필요!`,
              { paymentKey, orderId, amount, userId }
            );

            // 관리자 긴급 알림 (비동기)
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
            if (siteUrl) {
              fetch(`${siteUrl}/api/email/notify`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-api-secret": process.env.INTERNAL_API_SECRET || "",
                },
                body: JSON.stringify({
                  type: "consultation_request",
                  data: {
                    mentorId: null,
                    menteeName: `[CRITICAL] 결제 오류 - paymentKey: ${paymentKey}`,
                    menteeEmail: `orderId: ${orderId}, amount: ${amount}`,
                  },
                }),
              }).catch(() => {});
            }

            return NextResponse.json(
              { error: "결제 처리 중 오류가 발생했어요. 고객센터에 문의해주세요." },
              { status: 500 }
            );
          }

          return NextResponse.json(
            { error: "결제 처리 중 오류가 발생했어요. 결제가 자동 취소되었으니 다시 시도해주세요." },
            { status: 500 }
          );
        }
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
          console.error("[payment/confirm] 상담 상태 업데이트 실패:", consultError.message);
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
          }).catch((e) => console.error("[결제확인-상담확정 이메일 실패]", e));

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
            }).catch((e) => console.error("[결제확인-상담요청 이메일 실패]", e));
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
