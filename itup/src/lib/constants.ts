import type { ProductType } from "@/lib/supabase/types";

// =============================================
// v2 비즈니스 로직 상수
// =============================================

// 상품 가격 제한 (멘토가 직접 설정)
export const PRICE_LIMITS: Record<ProductType, { min: number; max: number }> = {
  coffee_chat: { min: 10000, max: 100000 },
  document_review: { min: 20000, max: 200000 },
  mock_interview: { min: 30000, max: 300000 },
  free_trial: { min: 0, max: 0 },
} as const;

// 상품 권장 가격
export const RECOMMENDED_PRICES: Record<ProductType, number> = {
  coffee_chat: 50000,
  document_review: 70000,
  mock_interview: 100000,
  free_trial: 0,
} as const;

// 상품 기본 정보
export const PRODUCT_INFO: Record<ProductType, { name: string; icon: string; duration: number; description: string }> = {
  coffee_chat: {
    name: "커피챗",
    icon: "coffee",
    duration: 30,
    description: "커리어, 회사, 업계 전반 상담",
  },
  document_review: {
    name: "서류 리뷰",
    icon: "document",
    duration: 30,
    description: "이력서, 포트폴리오 피드백",
  },
  mock_interview: {
    name: "모의 면접",
    icon: "target",
    duration: 60,
    description: "실전 면접 시뮬레이션 + 피드백",
  },
  free_trial: {
    name: "무료 체험",
    icon: "gift",
    duration: 15,
    description: "15분 무료 멘토링 체험",
  },
} as const;

// 무료 체험 제한
export const FREE_TRIAL_LIMIT = 1;

// 첫 유료 예약 할인 코드
export const FIRST_BOOKING_DISCOUNT = {
  CODE: "FIRST10",
  PERCENTAGE: 10,
  DESCRIPTION: "첫 유료 예약 10% 할인",
  MIN_AMOUNT: 10000,
  MAX_DISCOUNT: 50000,
  OFFER_DURATION_HOURS: 48,
} as const;

// 플랫폼 수수료율
export const PLATFORM_FEE_RATE = 0.15; // 15%

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

// 노쇼 자동 판정 기준 (분)
export const NOSHOW_THRESHOLD_MINUTES = 10;

// 수수료 단계별 요율 (누적 정산 금액 기준)
export const COMMISSION_TIERS = [
  { min: 0, max: 1000000, rate: 0.15, label: "기본 (15%)" },
  { min: 1000000, max: 5000000, rate: 0.12, label: "실버 (12%)" },
  { min: 5000000, max: 20000000, rate: 0.10, label: "골드 (10%)" },
  { min: 20000000, max: Infinity, rate: 0.08, label: "플래티넘 (8%)" },
] as const;

// 한국 은행 목록
export const KOREAN_BANKS = [
  { code: "004", name: "KB국민은행" },
  { code: "088", name: "신한은행" },
  { code: "020", name: "우리은행" },
  { code: "081", name: "하나은행" },
  { code: "011", name: "NH농협은행" },
  { code: "003", name: "IBK기업은행" },
  { code: "023", name: "SC제일은행" },
  { code: "027", name: "씨티은행" },
  { code: "032", name: "부산은행" },
  { code: "031", name: "대구은행" },
  { code: "039", name: "경남은행" },
  { code: "034", name: "광주은행" },
  { code: "035", name: "제주은행" },
  { code: "037", name: "전북은행" },
  { code: "090", name: "카카오뱅크" },
  { code: "092", name: "토스뱅크" },
  { code: "089", name: "케이뱅크" },
] as const;

// 정산 규정
export const SETTLEMENT = {
  MIN_AMOUNT: 10000,        // 최소 정산 금액
  DISPUTE_PERIOD_DAYS: 7,   // 분쟁 기간 (일)
  SETTLEMENT_DAY: 1,        // 매주 월요일
  PAYMENT_DAYS: 3,          // 정산일로부터 3영업일 내 입금
} as const;

// 자동 완료 처리
export const AUTO_COMPLETE_HOURS = 24; // 24시간 무응답 시 자동 완료

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
