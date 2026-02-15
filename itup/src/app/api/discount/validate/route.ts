import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DISCOUNT_CODES, type DiscountCode } from "@/lib/discount/codes";
import { discountValidateLimiter, getClientIp } from "@/lib/rate-limit";

// =============================================
// Usage Tracking (in-memory; resets on cold start)
// TODO: Replace with Redis for production persistence
// =============================================
const usageCounts = new Map<string, number>();

// =============================================
// API Route
// =============================================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const { success: allowed } = discountValidateLimiter.check(ip);
    if (!allowed) {
      return NextResponse.json(
        { valid: false, error: "요청이 너무 많아요. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { code, amount } = body;

    if (!code || typeof code !== "string" || code.length > 50) {
      return NextResponse.json(
        { valid: false, error: "할인 코드를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== "number" || amount < 0) {
      return NextResponse.json(
        { valid: false, error: "유효한 금액이 필요합니다." },
        { status: 400 }
      );
    }

    // Find the discount code
    const discountCode = DISCOUNT_CODES.find(
      (dc) => dc.code.toUpperCase() === code.toUpperCase()
    );

    if (!discountCode) {
      return NextResponse.json(
        { valid: false, error: "유효하지 않은 할인 코드입니다." },
        { status: 400 }
      );
    }

    // Check validity dates
    const now = new Date();
    if (discountCode.validFrom && now < discountCode.validFrom) {
      return NextResponse.json(
        { valid: false, error: "아직 사용할 수 없는 할인 코드입니다." },
        { status: 400 }
      );
    }
    if (discountCode.validUntil && now > discountCode.validUntil) {
      return NextResponse.json(
        { valid: false, error: "만료된 할인 코드입니다." },
        { status: 400 }
      );
    }

    // Check usage limit
    if (discountCode.usageLimit !== null) {
      const currentUsage = usageCounts.get(discountCode.code) || 0;
      if (currentUsage >= discountCode.usageLimit) {
        return NextResponse.json(
          { valid: false, error: "이 할인 코드의 사용 횟수가 초과되었습니다." },
          { status: 400 }
        );
      }
    }

    // Check minimum amount
    if (amount < discountCode.minAmount) {
      return NextResponse.json(
        {
          valid: false,
          error: `최소 주문 금액은 ${discountCode.minAmount.toLocaleString()}원입니다.`,
        },
        { status: 400 }
      );
    }

    // 인증 필수: 할인코드 검증은 로그인 사용자만 가능
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { valid: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    const userId = user?.id || null;

    if (!userId) {
      return NextResponse.json(
        { valid: false, error: "인증에 실패했습니다." },
        { status: 401 }
      );
    }

    // Check if user has completed a free trial (for FIRST10)
    if (discountCode.requiresFreeTrial) {
      const { data: freeTrialBookings } = await supabase
        .from("bookings")
        .select("id")
        .eq("mentee_id", userId)
        .eq("payment_method", "free_trial")
        .eq("status", "completed")
        .limit(1);

      if (!freeTrialBookings || freeTrialBookings.length === 0) {
        return NextResponse.json(
          {
            valid: false,
            error: "이 할인 코드는 무료 체험을 완료한 사용자만 사용할 수 있습니다.",
          },
          { status: 400 }
        );
      }
    }

    // Check if user has already made a paid booking (for firstTimeOnly codes)
    if (discountCode.firstTimeOnly) {
      const { data: paidBookings } = await supabase
        .from("bookings")
        .select("id")
        .eq("mentee_id", userId)
        .neq("payment_method", "free_trial")
        .not("status", "eq", "cancelled")
        .gt("amount", 0)
        .limit(1);

      if (paidBookings && paidBookings.length > 0) {
        return NextResponse.json(
          {
            valid: false,
            error: "이 할인 코드는 첫 유료 예약에만 사용할 수 있습니다.",
          },
          { status: 400 }
        );
      }
    }

    // Calculate discount amount
    let discountAmount = Math.floor((amount * discountCode.percentage) / 100);

    // Apply max discount cap
    if (discountCode.maxDiscount !== null) {
      discountAmount = Math.min(discountAmount, discountCode.maxDiscount);
    }

    const finalAmount = amount - discountAmount;

    // NOTE: Usage count is NOT incremented here (validation only).
    // Actual usage tracking should happen at payment confirmation time.

    return NextResponse.json({
      valid: true,
      code: discountCode.code,
      percentage: discountCode.percentage,
      description: discountCode.description,
      discountAmount,
      originalAmount: amount,
      finalAmount,
    });
  } catch {
    return NextResponse.json(
      { valid: false, error: "할인 코드 확인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return available discount info (descriptions only, codes hidden)
  const now = new Date();
  const publicCodes = DISCOUNT_CODES
    .filter((dc) => {
      if (dc.validFrom && now < dc.validFrom) return false;
      if (dc.validUntil && now > dc.validUntil) return false;
      return true;
    })
    .map((dc) => ({
      percentage: dc.percentage,
      description: dc.description,
      minAmount: dc.minAmount,
      maxDiscount: dc.maxDiscount,
      firstTimeOnly: dc.firstTimeOnly,
      requiresFreeTrial: dc.requiresFreeTrial,
    }));

  return NextResponse.json({ codes: publicCodes });
}
