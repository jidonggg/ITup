/**
 * 카카오 서비스 통합 모듈
 *
 * 알림톡 및 기타 카카오 비즈니스 서비스 연동을 제공합니다.
 */

// 알림톡 클라이언트
export {
  sendAlimtalk,
  sendBookingConfirmedAlimtalk,
  sendSessionReminder24hAlimtalk,
  sendSessionReminder1hAlimtalk,
  sendReviewRequestAlimtalk,
  isAlimtalkConfigured,
  getAlimtalkConfig,
  type SendAlimtalkParams,
  type SendAlimtalkResult,
} from "./alimtalk";

// 알림톡 템플릿
export {
  ALIMTALK_TEMPLATES,
  getTemplate,
  renderTemplate,
  renderButtonLinks,
  validateVariables,
  type AlimtalkTemplateCode,
  type AlimtalkTemplate,
  type AlimtalkButton,
  type AlimtalkVariables,
  type BookingConfirmedVariables,
  type SessionReminderVariables,
  type ReviewRequestVariables,
} from "./templates";
