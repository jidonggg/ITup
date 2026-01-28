// 관리자 이메일 목록 - 여기에 본인 이메일 추가
export const ADMIN_EMAILS = [
  "jidongs45@gmail.com", // 메인 관리자
  // 추가 관리자 이메일...
];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
