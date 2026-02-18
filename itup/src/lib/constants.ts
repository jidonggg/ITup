import type { ProductType, InsertableProductType } from "@/lib/supabase/types";

// =============================================
// v2 비즈니스 로직 상수
// =============================================

/** Product types accepted by the Supabase products table check constraint */
export const DB_PRODUCT_TYPES: readonly InsertableProductType[] = ["coffee_chat", "mock_interview"] as const;

// 상품 가격 제한 (멘토가 직접 설정)
export const PRICE_LIMITS: Record<ProductType, { min: number; max: number }> = {
  coffee_chat: { min: 10000, max: 50000 },
  document_review: { min: 25000, max: 120000 },
  mock_interview: { min: 50000, max: 250000 },
  free_trial: { min: 0, max: 0 },
} as const;

// 상품 권장 가격 (주니어 기준 베이스)
export const RECOMMENDED_PRICES: Record<ProductType, number> = {
  coffee_chat: 15000,
  document_review: 40000,
  mock_interview: 80000,
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
    duration: 45,
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

// 수수료 단계별 요율 (누적 완료 건수 기준)
export const COMMISSION_TIERS = [
  { min: 0, max: 10, rate: 0.15, label: "기본 (15%)" },
  { min: 10, max: 50, rate: 0.12, label: "실버 (12%)" },
  { min: 50, max: 200, rate: 0.10, label: "골드 (10%)" },
  { min: 200, max: Infinity, rate: 0.08, label: "플래티넘 (8%)" },
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
  MAX_CUSTOM_QUESTIONS: 5,
  MAX_CUSTOM_QUESTION_LENGTH: 200,
  PHONE_REGEX: /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/,
  PASSWORD_REGEX: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
} as const;

// 상품 유형별 멘티 사전 질문 목록
export const PREDEFINED_MENTEE_QUESTIONS: Record<Exclude<ProductType, "free_trial">, string[]> = {
  coffee_chat: [
    "현재 회사에서의 하루 일과가 어떻게 되나요?",
    "이 직무를 선택하게 된 계기가 궁금합니다",
    "게임 업계 취업을 위해 가장 중요한 것은 무엇인가요?",
    "포트폴리오에서 가장 중요하게 보는 점이 뭔가요?",
    "현재 연봉/복지 수준이 어느 정도인가요?",
    "이직을 고려할 때 가장 중요한 기준은 무엇인가요?",
  ],
  document_review: [
    "제 이력서에서 가장 약한 부분이 어디인가요?",
    "게임 업계에 맞는 자기소개서 구성은 어떻게 해야 하나요?",
    "포트폴리오에서 개선할 점이 있나요?",
    "지원 회사에 맞춤형 서류 작성 팁이 있나요?",
    "경력 기술서에서 어필할 수 있는 부분이 있나요?",
  ],
  mock_interview: [
    "실제 면접에서 자주 나오는 질문이 궁금합니다",
    "기술 면접 준비는 어떻게 해야 할까요?",
    "면접에서 인상 깊었던 답변 사례가 있나요?",
    "지원하는 직무에서 중요하게 보는 역량은 무엇인가요?",
    "면접 때 피해야 할 실수가 있나요?",
  ],
};

// 기간 상수 (ms)
export const DURATIONS = {
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
  ONE_MONTH: 30 * 24 * 60 * 60 * 1000,
} as const;

// 만족 보증 정책
export const SATISFACTION_GUARANTEE = {
  RATING_THRESHOLD: 3,        // 이 별점 이하 시 보증 적용
  CREDIT_PERCENTAGE: 100,     // 크레딧 100% 환급
  CLAIM_DEADLINE_HOURS: 48,   // 세션 완료 후 48시간 이내 신청
  MAX_CLAIMS_PER_USER: 2,     // 사용자당 최대 2회
  DESCRIPTION: "상담 만족도 3점 이하 시, 48시간 이내 신청하면 100% 크레딧으로 돌려드립니다.",
} as const;

// 멘토 상담 스타일 태그
export const MENTORING_STYLES = [
  { value: "practical", label: "실전형", description: "바로 적용 가능한 실전 위주" },
  { value: "empathetic", label: "공감형", description: "경청과 공감 중심" },
  { value: "analytical", label: "분석형", description: "체계적으로 분석하고 정리" },
  { value: "direct", label: "직진형", description: "핵심만 짚어주는 스타일" },
  { value: "coaching", label: "코칭형", description: "질문으로 스스로 답을 찾도록" },
  { value: "storytelling", label: "경험공유형", description: "본인 경험 사례 중심" },
] as const;

export type MentoringStyleValue = typeof MENTORING_STYLES[number]["value"];
export const MAX_MENTORING_STYLES = 3;
