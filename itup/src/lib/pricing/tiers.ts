import { RECOMMENDED_PRICES } from "@/lib/constants";
import type { ProductType } from "@/lib/payment/types";

export type MentorTier = "junior" | "senior" | "lead";

export interface TierInfo {
  id: MentorTier;
  name: string;
  badge: string;
  multiplier: number;
}

export const MENTOR_TIERS: Record<MentorTier, TierInfo> = {
  junior: { id: "junior", name: "주니어", badge: "seedling", multiplier: 1.0 },
  senior: { id: "senior", name: "시니어", badge: "star", multiplier: 1.5 },
  lead: { id: "lead", name: "리드", badge: "crown", multiplier: 2.0 },
};

// 구조형("3-5년") 또는 자유형("8년") 경력 문자열에서 연차 추출
// 멘토 등록 최소 조건: 3년차 이상
const EXPERIENCE_YEAR_MAP: Record<string, number> = {
  "3-5년": 3,
  "5-7년": 5,
  "7-10년": 7,
  "10년 이상": 10,
};

export function getYearsFromExperience(experience: string): number {
  if (EXPERIENCE_YEAR_MAP[experience] !== undefined) {
    return EXPERIENCE_YEAR_MAP[experience];
  }
  const match = experience.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export function getMentorTier(experience: string): MentorTier {
  const years = getYearsFromExperience(experience);
  if (years >= 10) return "lead";
  if (years >= 5) return "senior";
  return "junior";
}

export function getTierInfo(experience: string): TierInfo {
  return MENTOR_TIERS[getMentorTier(experience)];
}

// 베이스 가격 (주니어 = 1.0x, 권장 가격 기준)
const BASE_PRICES: Record<ProductType, number> = {
  coffee: RECOMMENDED_PRICES.coffee_chat,
  resume: RECOMMENDED_PRICES.document_review,
  interview: RECOMMENDED_PRICES.mock_interview,
};

// 상품별 티어 직접 가격 지정 (배수 계산 대신 사용)
const PRODUCT_TIER_PRICES: Partial<Record<ProductType, Record<MentorTier, number>>> = {
  coffee: { junior: 15000, senior: 20000, lead: 30000 },
};

// 상품별 최소 티어 요건 (PaymentProductType + InsertableProductType 모두 지원)
export const PRODUCT_MIN_TIER: Record<string, MentorTier> = {
  interview: "senior",      // PaymentProductType
  mock_interview: "senior", // InsertableProductType (DB)
};

const TIER_ORDER: MentorTier[] = ["junior", "senior", "lead"];

export function isProductAvailableForTier(productType: string, tier: MentorTier): boolean {
  const minTier = PRODUCT_MIN_TIER[productType];
  if (!minTier) return true;
  return TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(minTier);
}

export function getTieredPrice(productType: ProductType, experience?: string): number {
  const basePrice = BASE_PRICES[productType];
  if (!experience) return basePrice;
  const tier = getTierInfo(experience);
  const override = PRODUCT_TIER_PRICES[productType]?.[tier.id];
  if (override !== undefined) return override;
  return Math.round((basePrice * tier.multiplier) / 1000) * 1000;
}
