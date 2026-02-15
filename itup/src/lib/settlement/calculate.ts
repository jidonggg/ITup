import { COMMISSION_TIERS, PLATFORM_FEE_RATE } from "@/lib/constants";

// 파운딩 멘토 무수수료 기간 (3개월)
const FOUNDING_MENTOR_FREE_MONTHS = 3;

export interface SettlementCalculation {
  totalAmount: number;
  platformFee: number;
  settlementAmount: number;
  commissionRate: number;
  commissionLabel: string;
}

/**
 * 파운딩 멘토 무수수료 기간 여부 확인
 * @param mentorCreatedAt 멘토 등록일 (ISO string)
 */
export function isFoundingMentorActive(mentorCreatedAt: string): boolean {
  const createdDate = new Date(mentorCreatedAt);
  if (isNaN(createdDate.getTime())) return false;

  const freeUntil = new Date(createdDate);
  freeUntil.setMonth(freeUntil.getMonth() + FOUNDING_MENTOR_FREE_MONTHS);

  return new Date() < freeUntil;
}

/**
 * Get the commission rate based on cumulative earnings
 * @param isFoundingMentor 파운딩 멘토 무수수료 적용 여부
 */
export function getCommissionRate(
  cumulativeEarnings: number,
  isFoundingMentor: boolean = false
): {
  rate: number;
  label: string;
} {
  // 파운딩 멘토: 0% 수수료
  if (isFoundingMentor) {
    return { rate: 0, label: "파운딩 멘토 (0%)" };
  }

  // 음수 또는 유효하지 않은 값은 기본 등급 적용
  if (!Number.isFinite(cumulativeEarnings) || cumulativeEarnings < 0) {
    return { rate: PLATFORM_FEE_RATE, label: "기본 (15%)" };
  }

  for (const tier of COMMISSION_TIERS) {
    // max가 Infinity인 경우를 포함하여 경계값 처리
    if (cumulativeEarnings >= tier.min && cumulativeEarnings < tier.max) {
      return { rate: tier.rate, label: tier.label };
    }
  }

  // 마지막 tier (플래티넘) 반환 - 모든 조건 통과 시
  const lastTier = COMMISSION_TIERS[COMMISSION_TIERS.length - 1];
  return { rate: lastTier.rate, label: lastTier.label };
}

/**
 * Calculate settlement amounts for a given set of booking totals
 * @param isFoundingMentor 파운딩 멘토 무수수료 적용 여부
 */
export function calculateSettlement(
  totalBookingAmount: number,
  cumulativeEarnings: number = 0,
  isFoundingMentor: boolean = false
): SettlementCalculation {
  const { rate, label } = getCommissionRate(cumulativeEarnings, isFoundingMentor);

  const platformFee = Math.round(totalBookingAmount * rate);
  const settlementAmount = totalBookingAmount - platformFee;

  return {
    totalAmount: totalBookingAmount,
    platformFee,
    settlementAmount,
    commissionRate: rate,
    commissionLabel: label,
  };
}

/**
 * Format currency in Korean Won
 */
export function formatKRW(amount: number): string {
  if (!Number.isFinite(amount)) return "0원";
  return amount.toLocaleString("ko-KR") + "원";
}
