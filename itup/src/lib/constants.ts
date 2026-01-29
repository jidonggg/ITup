// 상품 가격 상수
export const PRICES = {
  COFFEE_CHAT: 15000,
  RESUME_REVIEW: 39000,
  MOCK_INTERVIEW: 59000,
  STARTER_BUNDLE: 39000,
  ALLINONE_BUNDLE: 79000,
  FULL_BUNDLE: 99000,
} as const;

// 플랫폼 수수료율 (단계별: 0%→15%→20%→25%)
// 현재 런칭 초기 → 15%
export const COMMISSION_RATE = 0.15;

// 타임아웃 상수 (ms)
export const TIMEOUTS = {
  TOAST_DURATION: 4000,
  HERO_SLIDE_INTERVAL: 4000,
  COUNT_UP_DURATION: 2000,
  AUTH_TIMEOUT: 5000,
  REDIRECT_DELAY: 3000,
  FORM_SUBMIT_DELAY: 1500,
} as const;

// 페이지네이션 상수
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MENTORS_PAGE_SIZE: 12,
  ADMIN_PAGE_SIZE: 20,
} as const;

// 유효성 검사 상수
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_BIO_LENGTH: 500,
  MAX_NAME_LENGTH: 50,
  PHONE_REGEX: /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/,
  // 비밀번호: 최소 8자, 영문+숫자 필수
  PASSWORD_REGEX: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
} as const;

// 기간 상수 (ms)
export const DURATIONS = {
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
  ONE_MONTH: 30 * 24 * 60 * 60 * 1000,
} as const;
