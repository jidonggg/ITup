/**
 * 카카오 알림톡 템플릿 정의
 *
 * 주의: 실제 카카오 비즈니스 채널에 등록된 템플릿과 동일해야 합니다.
 * 템플릿 코드는 카카오 비즈니스 채널에서 승인받은 코드를 사용해야 합니다.
 */

// =============================================
// 템플릿 타입 정의
// =============================================

export type AlimtalkTemplateCode =
  | "booking_confirmed"
  | "session_reminder_24h"
  | "session_reminder_1h"
  | "review_request";

export interface AlimtalkTemplateVariable {
  key: string;
  description: string;
  required: boolean;
}

export interface AlimtalkTemplate {
  code: AlimtalkTemplateCode;
  name: string;
  description: string;
  content: string;
  variables: AlimtalkTemplateVariable[];
  buttons?: AlimtalkButton[];
}

export interface AlimtalkButton {
  type: "WL" | "AL" | "DS" | "BK" | "MD" | "BC";
  name: string;
  linkMobile?: string;
  linkPc?: string;
}

// =============================================
// 변수 데이터 타입
// =============================================

export interface BookingConfirmedVariables {
  menteeName: string;
  mentorName: string;
  mentorCompany: string;
  productName: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  bookingId: string;
}

export interface SessionReminderVariables {
  recipientName: string;
  counterpartName: string;
  productName: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  meetingLink?: string;
}

export interface ReviewRequestVariables {
  menteeName: string;
  mentorName: string;
  mentorCompany: string;
  productName: string;
  completedDate: string;
  bookingId: string;
}

export type AlimtalkVariables =
  | BookingConfirmedVariables
  | SessionReminderVariables
  | ReviewRequestVariables;

// =============================================
// 템플릿 정의
// =============================================

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://itup.vercel.app";

export const ALIMTALK_TEMPLATES: Record<AlimtalkTemplateCode, AlimtalkTemplate> = {
  booking_confirmed: {
    code: "booking_confirmed",
    name: "예약 확정 알림",
    description: "멘토가 예약을 확정했을 때 멘티에게 발송",
    content: `[커피챗] 예약이 확정되었습니다!

안녕하세요, #{menteeName}님!

#{mentorName} 멘토님(#{mentorCompany})과의 멘토링 예약이 확정되었습니다.

[예약 정보]
- 상품: #{productName}
- 일시: #{scheduledDate} #{scheduledTime}
- 시간: #{duration}분

예약 상세 내용은 마이페이지에서 확인하실 수 있습니다.
세션 시간에 맞춰 준비해 주세요!`,
    variables: [
      { key: "menteeName", description: "멘티 이름", required: true },
      { key: "mentorName", description: "멘토 이름", required: true },
      { key: "mentorCompany", description: "멘토 소속", required: true },
      { key: "productName", description: "상품명", required: true },
      { key: "scheduledDate", description: "예약 날짜", required: true },
      { key: "scheduledTime", description: "예약 시간", required: true },
      { key: "duration", description: "진행 시간(분)", required: true },
      { key: "bookingId", description: "예약 ID", required: true },
    ],
    buttons: [
      {
        type: "WL",
        name: "예약 상세 보기",
        linkMobile: `${SITE_URL}/mypage/bookings/#{bookingId}`,
        linkPc: `${SITE_URL}/mypage/bookings/#{bookingId}`,
      },
    ],
  },

  session_reminder_24h: {
    code: "session_reminder_24h",
    name: "세션 리마인더 (24시간 전)",
    description: "멘토링 세션 24시간 전 알림",
    content: `[커피챗] 내일 멘토링이 예정되어 있습니다!

안녕하세요, #{recipientName}님!

내일 예정된 멘토링 세션을 알려드립니다.

[세션 정보]
- 상대방: #{counterpartName}님
- 상품: #{productName}
- 일시: #{scheduledDate} #{scheduledTime}
- 시간: #{duration}분

[준비사항]
- 조용하고 안정적인 인터넷 환경 확보
- 카메라/마이크 사전 테스트
- 질문 사항 미리 정리

세션에 늦지 않도록 준비해 주세요!`,
    variables: [
      { key: "recipientName", description: "수신자 이름", required: true },
      { key: "counterpartName", description: "상대방 이름", required: true },
      { key: "productName", description: "상품명", required: true },
      { key: "scheduledDate", description: "예약 날짜", required: true },
      { key: "scheduledTime", description: "예약 시간", required: true },
      { key: "duration", description: "진행 시간(분)", required: true },
      { key: "meetingLink", description: "미팅 링크", required: false },
    ],
    buttons: [
      {
        type: "WL",
        name: "일정 확인하기",
        linkMobile: `${SITE_URL}/mypage`,
        linkPc: `${SITE_URL}/mypage`,
      },
    ],
  },

  session_reminder_1h: {
    code: "session_reminder_1h",
    name: "세션 리마인더 (1시간 전)",
    description: "멘토링 세션 1시간 전 알림",
    content: `[커피챗] 1시간 후 멘토링이 시작됩니다!

안녕하세요, #{recipientName}님!

#{counterpartName}님과의 멘토링이 1시간 후에 시작됩니다.

[세션 정보]
- 상대방: #{counterpartName}님
- 시작 시간: #{scheduledTime}

지금 바로 준비를 시작해 주세요!`,
    variables: [
      { key: "recipientName", description: "수신자 이름", required: true },
      { key: "counterpartName", description: "상대방 이름", required: true },
      { key: "scheduledTime", description: "예약 시간", required: true },
      { key: "meetingLink", description: "미팅 링크", required: false },
    ],
    buttons: [
      {
        type: "WL",
        name: "미팅 참여하기",
        linkMobile: "#{meetingLink}",
        linkPc: "#{meetingLink}",
      },
    ],
  },

  review_request: {
    code: "review_request",
    name: "후기 작성 요청",
    description: "세션 완료 후 멘티에게 리뷰 요청",
    content: `[커피챗] 멘토링은 어떠셨나요?

안녕하세요, #{menteeName}님!

#{mentorName} 멘토님(#{mentorCompany})과의 #{productName} 세션이 완료되었습니다.

소중한 후기를 남겨주시면 다른 멘티분들께 큰 도움이 됩니다!

리뷰 작성은 2~3분이면 충분합니다.
감사합니다!`,
    variables: [
      { key: "menteeName", description: "멘티 이름", required: true },
      { key: "mentorName", description: "멘토 이름", required: true },
      { key: "mentorCompany", description: "멘토 소속", required: true },
      { key: "productName", description: "상품명", required: true },
      { key: "completedDate", description: "완료 날짜", required: true },
      { key: "bookingId", description: "예약 ID", required: true },
    ],
    buttons: [
      {
        type: "WL",
        name: "리뷰 작성하기",
        linkMobile: `${SITE_URL}/mypage/bookings/#{bookingId}/review`,
        linkPc: `${SITE_URL}/mypage/bookings/#{bookingId}/review`,
      },
    ],
  },
};

// =============================================
// 템플릿 헬퍼 함수
// =============================================

/**
 * 템플릿 코드로 템플릿 조회
 */
export function getTemplate(code: AlimtalkTemplateCode): AlimtalkTemplate | null {
  return ALIMTALK_TEMPLATES[code] || null;
}

/**
 * 템플릿 내용에 변수 치환
 */
export function renderTemplate(
  template: AlimtalkTemplate,
  variables: Record<string, string | number>
): string {
  let content = template.content;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `#{${key}}`;
    content = content.replace(new RegExp(placeholder, "g"), String(value));
  }

  return content;
}

/**
 * 버튼 링크에 변수 치환
 */
export function renderButtonLinks(
  buttons: AlimtalkButton[],
  variables: Record<string, string | number>
): AlimtalkButton[] {
  return buttons.map((button) => {
    let linkMobile = button.linkMobile || "";
    let linkPc = button.linkPc || "";

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `#{${key}}`;
      linkMobile = linkMobile.replace(new RegExp(placeholder, "g"), String(value));
      linkPc = linkPc.replace(new RegExp(placeholder, "g"), String(value));
    }

    return {
      ...button,
      linkMobile,
      linkPc,
    };
  });
}

/**
 * 필수 변수 검증
 */
export function validateVariables(
  template: AlimtalkTemplate,
  variables: Record<string, string | number>
): { valid: boolean; missingKeys: string[] } {
  const missingKeys: string[] = [];

  for (const variable of template.variables) {
    if (variable.required && !(variable.key in variables)) {
      missingKeys.push(variable.key);
    }
  }

  return {
    valid: missingKeys.length === 0,
    missingKeys,
  };
}
