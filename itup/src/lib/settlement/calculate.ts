import { COMMISSION_TIERS, PLATFORM_FEE_RATE } from "@/lib/constants";

// 파운딩 멘토 무수수료 기간 (1개월)
const FOUNDING_MENTOR_FREE_MONTHS = 1;

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
 * Get the commission rate based on completed session count
 * @param completedSessions 누적 완료 건수
 * @param isFoundingMentor 파운딩 멘토 무수수료 적용 여부
 */
export function getCommissionRate(
  completedSessions: number,
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
  if (!Number.isFinite(completedSessions) || completedSessions < 0) {
    return { rate: PLATFORM_FEE_RATE, label: "기본 (15%)" };
  }

  for (const tier of COMMISSION_TIERS) {
    if (completedSessions >= tier.min && completedSessions < tier.max) {
      return { rate: tier.rate, label: tier.label };
    }
  }

  // 마지막 tier (플래티넘) 반환 - 모든 조건 통과 시
  const lastTier = COMMISSION_TIERS[COMMISSION_TIERS.length - 1];
  return { rate: lastTier.rate, label: lastTier.label };
}

/**
 * Calculate settlement amounts for a given set of booking totals
 * @param completedSessions 누적 완료 건수
 * @param isFoundingMentor 파운딩 멘토 무수수료 적용 여부
 */
export function calculateSettlement(
  totalBookingAmount: number,
  completedSessions: number = 0,
  isFoundingMentor: boolean = false
): SettlementCalculation {
  const { rate, label } = getCommissionRate(completedSessions, isFoundingMentor);

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
