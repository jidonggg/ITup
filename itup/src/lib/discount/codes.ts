import { FIRST_BOOKING_DISCOUNT } from "@/lib/constants";

export interface DiscountCode {
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
  isSeasonal?: boolean;
  displayName?: string;
}

export const DISCOUNT_CODES: DiscountCode[] = [
  {
    code: FIRST_BOOKING_DISCOUNT.CODE,
    percentage: FIRST_BOOKING_DISCOUNT.PERCENTAGE,
    description: FIRST_BOOKING_DISCOUNT.DESCRIPTION,
    minAmount: FIRST_BOOKING_DISCOUNT.MIN_AMOUNT,
    maxDiscount: FIRST_BOOKING_DISCOUNT.MAX_DISCOUNT,
    validFrom: null,
    validUntil: null,
    usageLimit: null,
    firstTimeOnly: true,
    requiresFreeTrial: true,
  },
  // WELCOME20은 레퍼럴 시스템에서만 발급 (퍼널 잠식 방지)
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
    isSeasonal: true,
    displayName: "채용 시즌 할인",
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
    isSeasonal: true,
    displayName: "하반기 채용 시즌 할인",
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
    isSeasonal: true,
    displayName: "연말 특별 할인",
  },
];

/** 현재 활성화된 시즌 할인 코드 반환 */
export function getActiveSeasonalCode(): DiscountCode | undefined {
  const now = new Date();
  return DISCOUNT_CODES.find(
    (dc) => dc.isSeasonal && dc.validFrom && dc.validUntil && now >= dc.validFrom && now <= dc.validUntil
  );
}

export function findDiscountCode(code: string): DiscountCode | undefined {
  return DISCOUNT_CODES.find(
    (dc) => dc.code.toUpperCase() === code.toUpperCase()
  );
}

export function isDiscountCodeActive(dc: DiscountCode): boolean {
  const now = new Date();
  if (dc.validFrom && now < dc.validFrom) return false;
  if (dc.validUntil && now > dc.validUntil) return false;
  return true;
}

export function calculateDiscountAmount(dc: DiscountCode, amount: number): number {
  let discount = Math.floor((amount * dc.percentage) / 100);
  if (dc.maxDiscount !== null) {
    discount = Math.min(discount, dc.maxDiscount);
  }
  return discount;
}
