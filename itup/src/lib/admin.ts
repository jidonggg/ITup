// 관리자 이메일 목록 - 환경변수에서 로드 (쉼표로 구분)
// 예: ADMIN_EMAILS=admin1@example.com,admin2@example.com
// 보안: NEXT_PUBLIC_ 접두사 사용 금지 (클라이언트 번들에 노출됨)
const getAdminEmails = (): string[] => {
  const envEmails = process.env.ADMIN_EMAILS;
  if (envEmails) {
    return envEmails.split(",").map(email => email.trim().toLowerCase());
  }
  // 환경변수 미설정 시 빈 배열 (관리자 없음)
  return [];
};

export const ADMIN_EMAILS = getAdminEmails();

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
