// 가격 상수
export const PRICES = {
  DEFAULT_CONSULT: 50000,
  BASIC_PLAN: 99000,
  STANDARD_PLAN: 199000,
  PREMIUM_PLAN: 399000,
} as const;

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
  MIN_PASSWORD_LENGTH: 6,
  MAX_BIO_LENGTH: 500,
  MAX_NAME_LENGTH: 50,
  PHONE_REGEX: /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/,
} as const;

// 기간 상수 (ms)
export const DURATIONS = {
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
  ONE_MONTH: 30 * 24 * 60 * 60 * 1000,
} as const;
