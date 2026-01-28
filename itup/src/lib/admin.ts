// 관리자 이메일 목록 - 환경변수에서 로드 (쉼표로 구분)
// 예: ADMIN_EMAILS=admin1@example.com,admin2@example.com
const getAdminEmails = (): string[] => {
  const envEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS;
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
