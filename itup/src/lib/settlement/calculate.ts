import { COMMISSION_TIERS, PLATFORM_FEE_RATE } from "@/lib/constants";

export interface SettlementCalculation {
  totalAmount: number;
  platformFee: number;
  settlementAmount: number;
  commissionRate: number;
  commissionLabel: string;
}

/**
 * Get the commission rate based on cumulative earnings
 */
export function getCommissionRate(cumulativeEarnings: number): {
  rate: number;
  label: string;
} {
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
 */
export function calculateSettlement(
  totalBookingAmount: number,
  cumulativeEarnings: number = 0
): SettlementCalculation {
  const { rate, label } = getCommissionRate(cumulativeEarnings);

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
  return amount.toLocaleString("ko-KR") + "원";
}
