import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FIRST_BOOKING_DISCOUNT } from "@/lib/constants";
import { discountValidateLimiter, getClientIp } from "@/lib/rate-limit";

// =============================================
// Discount Code Configuration
// =============================================

interface DiscountCode {
  code: string;
  percentage: number;
  description: string;
  minAmount: number;
  maxDiscount: number | null;
  validFrom: Date | null;
  validUntil: Date | null;
  usageLimit: number | null;
  firstTimeOnly: boolean;
  requiresFreeTrial: boolean;
}

// Available discount codes
const DISCOUNT_CODES: DiscountCode[] = [
  {
    code: FIRST_BOOKING_DISCOUNT.CODE,
    percentage: FIRST_BOOKING_DISCOUNT.PERCENTAGE,
    description: FIRST_BOOKING_DISCOUNT.DESCRIPTION,
    minAmount: FIRST_BOOKING_DISCOUNT.MIN_AMOUNT,
    maxDiscount: FIRST_BOOKING_DISCOUNT.MAX_DISCOUNT,
    validFrom: null, // No start date restriction
    validUntil: null, // No end date restriction
    usageLimit: null, // Unlimited uses globally
    firstTimeOnly: true, // Only for users who haven't made a paid booking
    requiresFreeTrial: true, // Must have completed a free trial
  },
  {
    code: "WELCOME20",
    percentage: 20,
    description: "신규 회원 20% 할인",
    minAmount: 30000,
    maxDiscount: 100000,
    validFrom: null,
    validUntil: null,
    usageLimit: null,
    firstTimeOnly: true,
    requiresFreeTrial: false,
  },
  {
    code: "HIRING2026",
    percentage: 15,
    description: "채용 시즌 15% 할인",
    minAmount: 20000,
    maxDiscount: 80000,
    validFrom: new Date("2026-03-01T00:00:00+09:00"),
    validUntil: new Date("2026-04-30T23:59:59+09:00"),
    usageLimit: null,
    firstTimeOnly: false,
    requiresFreeTrial: false,
  },
  {
    code: "HIRING2026F",
    percentage: 15,
    description: "하반기 채용 시즌 15% 할인",
    minAmount: 20000,
    maxDiscount: 80000,
    validFrom: new Date("2026-09-01T00:00:00+09:00"),
    validUntil: new Date("2026-10-31T23:59:59+09:00"),
    usageLimit: null,
    firstTimeOnly: false,
    requiresFreeTrial: false,
  },
  {
    code: "YEAREND2026",
    percentage: 20,
    description: "연말 특별 20% 할인",
    minAmount: 20000,
    maxDiscount: 100000,
    validFrom: new Date("2026-12-01T00:00:00+09:00"),
    validUntil: new Date("2026-12-31T23:59:59+09:00"),
    usageLimit: null,
    firstTimeOnly: false,
    requiresFreeTrial: false,
  },
];

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

    // Increment usage count
    usageCounts.set(discountCode.code, (usageCounts.get(discountCode.code) || 0) + 1);

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
  // Return available discount codes (public info only)
  const publicCodes = DISCOUNT_CODES.map((code) => ({
    code: code.code,
    percentage: code.percentage,
    description: code.description,
    minAmount: code.minAmount,
    maxDiscount: code.maxDiscount,
    firstTimeOnly: code.firstTimeOnly,
    requiresFreeTrial: code.requiresFreeTrial,
  }));

  return NextResponse.json({ codes: publicCodes });
}
