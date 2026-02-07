// =============================================
// TossPayments 공통 유틸리티
// =============================================

const TOSS_SECRET_KEY = process.env.TOSS_PAYMENTS_SECRET_KEY;

export const TOSS_API_BASE = "https://api.tosspayments.com/v1/payments";

/**
 * TossPayments API 인증 헤더 생성
 */
export function getTossAuthHeader(): string {
  if (!TOSS_SECRET_KEY) {
    throw new Error("TOSS_PAYMENTS_SECRET_KEY가 설정되지 않았습니다.");
  }
  return `Basic ${Buffer.from(TOSS_SECRET_KEY + ":").toString("base64")}`;
}

/**
 * TossPayments Secret Key 존재 여부 확인
 */
export function isTossConfigured(): boolean {
  return Boolean(TOSS_SECRET_KEY);
}
