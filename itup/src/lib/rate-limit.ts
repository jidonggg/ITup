/**
 * In-memory rate limiter for serverless functions.
 *
 * Vercel Serverless 환경:
 * - 각 함수 인스턴스마다 독립 메모리 (인스턴스 간 공유 안 됨)
 * - Cold start 시 캐시 초기화됨
 * - Soft launch / 저트래픽 앱에서 방어 계층으로 적합
 * - Vercel WAF rate limiting 규칙과 함께 사용 권장
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  limit: number;
  windowMs: number;
  maxKeys?: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly maxKeys: number;

  constructor(config: RateLimitConfig) {
    this.limit = config.limit;
    this.windowMs = config.windowMs;
    this.maxKeys = config.maxKeys ?? 500;
  }

  check(key: string): {
    success: boolean;
    remaining: number;
    retryAfterMs: number;
  } {
    this.cleanup();
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return { success: true, remaining: this.limit - 1, retryAfterMs: 0 };
    }

    if (entry.count < this.limit) {
      entry.count++;
      return {
        success: true,
        remaining: this.limit - entry.count,
        retryAfterMs: 0,
      };
    }

    return {
      success: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    };
  }

  private cleanup(): void {
    if (this.store.size <= this.maxKeys) return;

    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }

    if (this.store.size > this.maxKeys) {
      const excess = this.store.size - this.maxKeys;
      const keys = this.store.keys();
      for (let i = 0; i < excess; i++) {
        const { value } = keys.next();
        if (value) this.store.delete(value);
      }
    }
  }
}

/** /api/business/inquiry — 5 req / 60s per IP */
export const inquiryLimiter = new RateLimiter({
  limit: 5,
  windowMs: 60 * 1000,
});

/** /api/verification/send-code — 3 req / 5min per email */
export const verificationLimiter = new RateLimiter({
  limit: 3,
  windowMs: 5 * 60 * 1000,
});

/** /api/verification/verify-code — 5 req / 5min per email */
export const verifyCodeLimiter = new RateLimiter({
  limit: 5,
  windowMs: 5 * 60 * 1000,
});

/** /api/analytics/duration — 30 req / 60s per session */
export const analyticsLimiter = new RateLimiter({
  limit: 30,
  windowMs: 60 * 1000,
  maxKeys: 1000,
});

/** /api/notification/alimtalk — 10 req / 60s per phone number */
export const alimtalkLimiter = new RateLimiter({
  limit: 10,
  windowMs: 60 * 1000,
  maxKeys: 500,
});

/** /api/payment/confirm — 5 req / 60s per user */
export const paymentConfirmLimiter = new RateLimiter({
  limit: 5,
  windowMs: 60 * 1000,
});

/** /api/payment/refund — 5 req / 60s per admin */
export const paymentRefundLimiter = new RateLimiter({
  limit: 5,
  windowMs: 60 * 1000,
});

/** /api/booking/cancel — 5 req / 60s per user */
export const bookingCancelLimiter = new RateLimiter({
  limit: 5,
  windowMs: 60 * 1000,
});

/** /api/free-trial/book — 3 req / 60s per user */
export const freeTrialBookLimiter = new RateLimiter({
  limit: 3,
  windowMs: 60 * 1000,
});

/** /api/discount/validate — 10 req / 60s per IP */
export const discountValidateLimiter = new RateLimiter({
  limit: 10,
  windowMs: 60 * 1000,
});

/** /api/mentor/bank-account — 10 req / 60s per user */
export const bankAccountLimiter = new RateLimiter({
  limit: 10,
  windowMs: 60 * 1000,
});

/** /api/email/* — 10 req / 60s per IP */
export const emailLimiter = new RateLimiter({
  limit: 10,
  windowMs: 60 * 1000,
});

/** /api/admin/* — 30 req / 60s per admin */
export const adminLimiter = new RateLimiter({
  limit: 30,
  windowMs: 60 * 1000,
});

/** /api/subscription/cancel — 5 req / 60s per user */
export const subscriptionCancelLimiter = new RateLimiter({
  limit: 5,
  windowMs: 60 * 1000,
});

/** /api/settlement/* — 10 req / 60s per admin */
export const settlementLimiter = new RateLimiter({
  limit: 10,
  windowMs: 60 * 1000,
});

export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers);
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return headers.get("x-real-ip") ?? "unknown";
}
