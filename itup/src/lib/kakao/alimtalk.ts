/**
 * 카카오 알림톡 API 클라이언트
 *
 * 카카오 비즈니스 채널을 통한 알림톡 발송을 처리합니다.
 * 환경변수:
 *   - KAKAO_ALIMTALK_API_KEY: 카카오 API 키
 *   - KAKAO_SENDER_KEY: 발신 프로필 키 (비즈니스 채널)
 *   - KAKAO_ALIMTALK_API_URL: API 엔드포인트 (기본값: 카카오 공식 API)
 */

import {
  type AlimtalkTemplateCode,
  type AlimtalkButton,
  getTemplate,
  renderTemplate,
  renderButtonLinks,
  validateVariables,
} from "./templates";

// =============================================
// 타입 정의
// =============================================

export interface SendAlimtalkParams {
  templateCode: AlimtalkTemplateCode;
  recipientPhone: string;
  variables: Record<string, string | number>;
}

export interface SendAlimtalkResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}

interface KakaoAlimtalkRequest {
  senderKey: string;
  templateCode: string;
  recipientNo: string;
  message: string;
  buttons?: Array<{
    type: string;
    name: string;
    linkMobile?: string;
    linkPc?: string;
  }>;
}

interface KakaoAlimtalkResponse {
  code: number;
  message: string;
  data?: {
    messageId: string;
  };
}

// =============================================
// 설정
// =============================================

const KAKAO_API_KEY = process.env.KAKAO_ALIMTALK_API_KEY;
const KAKAO_SENDER_KEY = process.env.KAKAO_SENDER_KEY;
const KAKAO_API_URL =
  process.env.KAKAO_ALIMTALK_API_URL ||
  "https://api-alimtalk.kakao.com/v2/sender/send";

// 재시도 설정
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// =============================================
// 유틸리티 함수
// =============================================

/**
 * 전화번호 정규화 (하이픈 제거, 국가 코드 추가)
 */
function normalizePhoneNumber(phone: string): string {
  // 하이픈, 공백 제거
  let normalized = phone.replace(/[-\s]/g, "");

  // +82로 시작하면 그대로 사용
  if (normalized.startsWith("+82")) {
    return normalized;
  }

  // 82로 시작하면 +82로 변환
  if (normalized.startsWith("82")) {
    return `+${normalized}`;
  }

  // 0으로 시작하면 +82로 변환
  if (normalized.startsWith("0")) {
    return `+82${normalized.slice(1)}`;
  }

  // 기타 (이미 정규화된 경우)
  return normalized;
}

/**
 * 전화번호 유효성 검증
 */
function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  // 한국 휴대폰 번호: +82 10 XXXX XXXX
  return /^\+82(10|11|16|17|18|19)\d{7,8}$/.test(normalized);
}

/**
 * 지연 함수 (재시도용)
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================
// 에러 메시지 (한국어)
// =============================================

const ERROR_MESSAGES: Record<string, string> = {
  MISSING_CONFIG: "알림톡 설정이 누락되었습니다. 관리자에게 문의하세요.",
  INVALID_TEMPLATE: "유효하지 않은 템플릿 코드입니다.",
  MISSING_VARIABLES: "필수 변수가 누락되었습니다.",
  INVALID_PHONE: "유효하지 않은 전화번호 형식입니다.",
  API_ERROR: "알림톡 발송 중 오류가 발생했습니다.",
  RATE_LIMITED: "일시적으로 발송이 제한되었습니다. 잠시 후 다시 시도해주세요.",
  NETWORK_ERROR: "네트워크 오류가 발생했습니다.",
};

// =============================================
// 메인 발송 함수
// =============================================

/**
 * 알림톡 발송
 */
export async function sendAlimtalk(
  params: SendAlimtalkParams
): Promise<SendAlimtalkResult> {
  const { templateCode, recipientPhone, variables } = params;

  // 1. 설정 확인
  if (!KAKAO_API_KEY || !KAKAO_SENDER_KEY) {
    console.warn("[Alimtalk] API 설정 누락 - 개발 모드로 처리");
    // 개발 모드: API 키가 없으면 성공으로 처리
    return {
      success: true,
      messageId: `dev-mode-${Date.now()}`,
    };
  }

  // 2. 템플릿 조회
  const template = getTemplate(templateCode);
  if (!template) {
    console.error(`[Alimtalk] 잘못된 템플릿 코드: ${templateCode}`);
    return {
      success: false,
      error: ERROR_MESSAGES.INVALID_TEMPLATE,
      errorCode: "INVALID_TEMPLATE",
    };
  }

  // 3. 변수 검증
  const validation = validateVariables(template, variables);
  if (!validation.valid) {
    console.error(
      `[Alimtalk] 필수 변수 누락: ${validation.missingKeys.join(", ")}`
    );
    return {
      success: false,
      error: `${ERROR_MESSAGES.MISSING_VARIABLES}: ${validation.missingKeys.join(", ")}`,
      errorCode: "MISSING_VARIABLES",
    };
  }

  // 4. 전화번호 검증 및 정규화
  if (!isValidPhoneNumber(recipientPhone)) {
    console.error(`[Alimtalk] 잘못된 전화번호: ${recipientPhone}`);
    return {
      success: false,
      error: ERROR_MESSAGES.INVALID_PHONE,
      errorCode: "INVALID_PHONE",
    };
  }
  const normalizedPhone = normalizePhoneNumber(recipientPhone);

  // 5. 메시지 렌더링
  const message = renderTemplate(template, variables);
  const buttons = template.buttons
    ? renderButtonLinks(template.buttons, variables)
    : undefined;

  // 6. API 요청 본문 생성
  const requestBody: KakaoAlimtalkRequest = {
    senderKey: KAKAO_SENDER_KEY,
    templateCode: template.code,
    recipientNo: normalizedPhone,
    message,
    buttons: buttons?.map((btn) => ({
      type: btn.type,
      name: btn.name,
      linkMobile: btn.linkMobile,
      linkPc: btn.linkPc,
    })),
  };

  // 7. API 호출 (재시도 포함)
  return await sendWithRetry(requestBody);
}

/**
 * 재시도 로직이 포함된 API 호출
 */
async function sendWithRetry(
  requestBody: KakaoAlimtalkRequest,
  attempt: number = 1
): Promise<SendAlimtalkResult> {
  try {
    const response = await fetch(KAKAO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Secret-Key": KAKAO_API_KEY!,
      },
      body: JSON.stringify(requestBody),
    });

    // Rate limiting 처리
    if (response.status === 429) {
      if (attempt <= MAX_RETRIES) {
        console.warn(`[Alimtalk] Rate limited, 재시도 ${attempt}/${MAX_RETRIES}`);
        await delay(RETRY_DELAY_MS * attempt);
        return sendWithRetry(requestBody, attempt + 1);
      }
      return {
        success: false,
        error: ERROR_MESSAGES.RATE_LIMITED,
        errorCode: "RATE_LIMITED",
      };
    }

    const result: KakaoAlimtalkResponse = await response.json();

    // 성공
    if (response.ok && result.code === 0) {
      console.log(`[Alimtalk] 발송 성공: ${result.data?.messageId}`);
      return {
        success: true,
        messageId: result.data?.messageId,
      };
    }

    // 실패
    console.error(`[Alimtalk] API 오류: ${result.code} - ${result.message}`);
    return {
      success: false,
      error: result.message || ERROR_MESSAGES.API_ERROR,
      errorCode: String(result.code),
    };
  } catch (error) {
    // 네트워크 오류 시 재시도
    if (attempt <= MAX_RETRIES) {
      console.warn(`[Alimtalk] 네트워크 오류, 재시도 ${attempt}/${MAX_RETRIES}`);
      await delay(RETRY_DELAY_MS * attempt);
      return sendWithRetry(requestBody, attempt + 1);
    }

    console.error("[Alimtalk] 발송 실패:", error);
    return {
      success: false,
      error: ERROR_MESSAGES.NETWORK_ERROR,
      errorCode: "NETWORK_ERROR",
    };
  }
}

// =============================================
// 편의 함수 (특정 알림 타입별)
// =============================================

/**
 * 예약 확정 알림 발송
 */
export async function sendBookingConfirmedAlimtalk(params: {
  recipientPhone: string;
  menteeName: string;
  mentorName: string;
  mentorCompany: string;
  productName: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  bookingId: string;
}): Promise<SendAlimtalkResult> {
  return sendAlimtalk({
    templateCode: "booking_confirmed",
    recipientPhone: params.recipientPhone,
    variables: {
      menteeName: params.menteeName,
      mentorName: params.mentorName,
      mentorCompany: params.mentorCompany,
      productName: params.productName,
      scheduledDate: params.scheduledDate,
      scheduledTime: params.scheduledTime,
      duration: params.duration,
      bookingId: params.bookingId,
    },
  });
}

/**
 * 세션 리마인더 (24시간 전) 알림 발송
 */
export async function sendSessionReminder24hAlimtalk(params: {
  recipientPhone: string;
  recipientName: string;
  counterpartName: string;
  productName: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  meetingLink?: string;
}): Promise<SendAlimtalkResult> {
  return sendAlimtalk({
    templateCode: "session_reminder_24h",
    recipientPhone: params.recipientPhone,
    variables: {
      recipientName: params.recipientName,
      counterpartName: params.counterpartName,
      productName: params.productName,
      scheduledDate: params.scheduledDate,
      scheduledTime: params.scheduledTime,
      duration: params.duration,
      ...(params.meetingLink && { meetingLink: params.meetingLink }),
    },
  });
}

/**
 * 세션 리마인더 (1시간 전) 알림 발송
 */
export async function sendSessionReminder1hAlimtalk(params: {
  recipientPhone: string;
  recipientName: string;
  counterpartName: string;
  scheduledTime: string;
  meetingLink?: string;
}): Promise<SendAlimtalkResult> {
  return sendAlimtalk({
    templateCode: "session_reminder_1h",
    recipientPhone: params.recipientPhone,
    variables: {
      recipientName: params.recipientName,
      counterpartName: params.counterpartName,
      scheduledTime: params.scheduledTime,
      ...(params.meetingLink && { meetingLink: params.meetingLink }),
    },
  });
}

/**
 * 후기 작성 요청 알림 발송
 */
export async function sendReviewRequestAlimtalk(params: {
  recipientPhone: string;
  menteeName: string;
  mentorName: string;
  mentorCompany: string;
  productName: string;
  completedDate: string;
  bookingId: string;
}): Promise<SendAlimtalkResult> {
  return sendAlimtalk({
    templateCode: "review_request",
    recipientPhone: params.recipientPhone,
    variables: {
      menteeName: params.menteeName,
      mentorName: params.mentorName,
      mentorCompany: params.mentorCompany,
      productName: params.productName,
      completedDate: params.completedDate,
      bookingId: params.bookingId,
    },
  });
}

// =============================================
// 상태 확인 함수
// =============================================

/**
 * 알림톡 서비스 설정 상태 확인
 */
export function isAlimtalkConfigured(): boolean {
  return Boolean(KAKAO_API_KEY && KAKAO_SENDER_KEY);
}

/**
 * 알림톡 설정 정보 반환 (디버깅용)
 */
export function getAlimtalkConfig(): {
  configured: boolean;
  hasApiKey: boolean;
  hasSenderKey: boolean;
} {
  return {
    configured: isAlimtalkConfigured(),
    hasApiKey: Boolean(KAKAO_API_KEY),
    hasSenderKey: Boolean(KAKAO_SENDER_KEY),
  };
}
