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
