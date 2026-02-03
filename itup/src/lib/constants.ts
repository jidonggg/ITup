import type { ProductType } from "@/lib/supabase/types";

// =============================================
// v2 비즈니스 로직 상수
// =============================================

// 상품 가격 제한 (멘토가 직접 설정)
export const PRICE_LIMITS: Record<ProductType, { min: number; max: number }> = {
  coffee_chat: { min: 10000, max: 100000 },
  document_review: { min: 20000, max: 200000 },
  mock_interview: { min: 30000, max: 300000 },
} as const;

// 상품 권장 가격
export const RECOMMENDED_PRICES: Record<ProductType, number> = {
  coffee_chat: 50000,
  document_review: 70000,
  mock_interview: 100000,
} as const;

// 상품 기본 정보
export const PRODUCT_INFO: Record<ProductType, { name: string; icon: string; duration: number; description: string }> = {
  coffee_chat: {
    name: "커피챗",
    icon: "☕",
    duration: 30,
    description: "커리어, 회사, 업계 전반 상담",
  },
  document_review: {
    name: "서류 리뷰",
    icon: "📄",
    duration: 30,
    description: "이력서, 포트폴리오 피드백",
  },
  mock_interview: {
    name: "모의 면접",
    icon: "🎯",
    duration: 60,
    description: "실전 면접 시뮬레이션 + 피드백",
  },
} as const;

// 레거시 가격 (기존 상품 호환)
export const PRICES = {
  COFFEE_CHAT: 15000,
  RESUME_REVIEW: 39000,
  MOCK_INTERVIEW: 59000,
  STARTER_BUNDLE: 39000,
  ALLINONE_BUNDLE: 79000,
  FULL_BUNDLE: 99000,
} as const;

// 플랫폼 수수료율
export const PLATFORM_FEE_RATE = 0.15; // 15%

// 레거시 호환
export const COMMISSION_RATE = PLATFORM_FEE_RATE;

// 환불 정책
export const REFUND_POLICY = {
  mentee: {
    before_48h: { rate: 100, description: "전액 환불" },
    before_24h: { rate: 50, description: "50% 환불" },
    within_24h: { rate: 0, description: "환불 불가" },
    noshow: { rate: 0, description: "환불 불가 + 노쇼 기록" },
  },
  mentor: {
    before_24h: { rate: 100, description: "전액 환불" },
    within_24h: { rate: 100, description: "전액 환불 + 경고" },
    noshow: { rate: 100, description: "전액 환불 + 강력 경고 + 쿠폰" },
  },
} as const;

// 노쇼 패널티
export const NOSHOW_PENALTY = {
  mentee: {
    warning: 1,       // 1회: 경고
    suspension: 2,    // 2회: 2주간 예약 제한
    ban: 3,           // 3회: 계정 이용 정지
  },
  mentor: {
    warning: 1,       // 1회: 경고 + 프로필 경고 표시 (7일)
    suspension: 2,    // 2회: 2주간 신규 예약 중지
    ban: 3,           // 3회: 멘토 자격 박탈
  },
} as const;

// 정산 규정
export const SETTLEMENT = {
  MIN_AMOUNT: 10000,        // 최소 정산 금액
  DISPUTE_PERIOD_DAYS: 7,   // 분쟁 기간 (일)
  SETTLEMENT_DAY: 1,        // 매주 월요일
  PAYMENT_DAYS: 3,          // 정산일로부터 3영업일 내 입금
} as const;

// 자동 완료 처리
export const AUTO_COMPLETE_HOURS = 48; // 48시간 무응답 시 자동 완료

// 후기 작성 기한 (일)
export const REVIEW_DEADLINE_DAYS = 7;

// 직군 목록
export const JOB_TYPES = [
  { value: "client", label: "클라이언트 개발" },
  { value: "server", label: "서버 개발" },
  { value: "planner", label: "기획" },
  { value: "artist", label: "아트" },
  { value: "other", label: "기타" },
] as const;

// 엔진 목록
export const ENGINE_TYPES = [
  { value: "unity", label: "Unity" },
  { value: "unreal", label: "Unreal Engine" },
  { value: "other", label: "기타/없음" },
] as const;

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
  MIN_REVIEW_LENGTH: 10,
  MAX_REVIEW_LENGTH: 500,
  MIN_FEEDBACK_LENGTH: 10,
  MAX_FEEDBACK_LENGTH: 1000,
  MIN_INTRO_LENGTH: 10,
  PHONE_REGEX: /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/,
  PASSWORD_REGEX: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
} as const;

// 기간 상수 (ms)
export const DURATIONS = {
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
  ONE_MONTH: 30 * 24 * 60 * 60 * 1000,
} as const;
