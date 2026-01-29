import { PRICES } from "@/lib/constants";
import type { ProductType } from "@/lib/payment/types";

export type MentorTier = "junior" | "senior" | "lead";

export interface TierInfo {
  id: MentorTier;
  name: string;
  badge: string;
  multiplier: number;
}

export const MENTOR_TIERS: Record<MentorTier, TierInfo> = {
  junior: { id: "junior", name: "주니어", badge: "🌱", multiplier: 1.0 },
  senior: { id: "senior", name: "시니어", badge: "⭐", multiplier: 1.3 },
  lead: { id: "lead", name: "리드", badge: "👑", multiplier: 1.6 },
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

// 베이스 가격 (주니어 = 1.0x)
const BASE_PRICES: Record<ProductType, number> = {
  coffee: PRICES.COFFEE_CHAT,
  resume: PRICES.RESUME_REVIEW,
  interview: PRICES.MOCK_INTERVIEW,
};

export function getTieredPrice(productType: ProductType, experience?: string): number {
  const basePrice = BASE_PRICES[productType];
  if (!experience) return basePrice;
  const tier = getTierInfo(experience);
  return Math.round((basePrice * tier.multiplier) / 1000) * 1000;
}
