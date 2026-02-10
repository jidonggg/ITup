// =============================================
// 공유 검증 유틸리티
// =============================================

/** 이메일 형식 검증 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** 비밀번호 검증 (8자 이상, 영문+숫자 포함) */
export function isValidPassword(password: string): boolean {
  return password.length >= 8 && /(?=.*[A-Za-z])(?=.*\d)/.test(password);
}

/** 한국 전화번호 검증 (01X-XXXX-XXXX) */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return /^01[016789]\d{7,8}$/.test(digits);
}

/** UUID v4 형식 검증 */
export function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/** HTML 태그 제거 (XSS 방지용 기본 sanitize) */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/** 문자열 길이 검증 */
export function isValidLength(value: string, min: number, max: number): boolean {
  const trimmed = value.trim();
  return trimmed.length >= min && trimmed.length <= max;
}

/** API 요청 본문 검증 헬퍼 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  body: T,
  fields: (keyof T)[]
): string | null {
  for (const field of fields) {
    const value = body[field];
    if (value === undefined || value === null || value === "") {
      return `${String(field)} 필드가 필요합니다.`;
    }
  }
  return null;
}
