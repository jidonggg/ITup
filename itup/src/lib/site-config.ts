// =============================================
// 커피챗 — 사이트 설정
// =============================================

// 사이트 기본 정보
export const SITE_CONFIG = {
  // 사이트 이름
  name: "커피챗",
  nameEn: "CoffeeChat",

  // 사이트 설명
  description: "현직 게임 개발자와 1:1 멘토링으로 게임 업계 취업과 커리어 성장을 도와드립니다.",
  shortDescription: "게임 업계 멘토링 플랫폼",

  // URL (환경변수 우선, 없으면 기본값 사용)
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://coffeechat-kr.vercel.app",

  // 공개 연락처용 이메일 (환경변수 우선, 페이지에 표시되는 이메일)
  contactEmail: {
    support: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@itup.kr",
    privacy: process.env.NEXT_PUBLIC_PRIVACY_EMAIL || "privacy@itup.kr",
  },

  // 발신용 이메일 (Resend 등 이메일 서비스용)
  email: {
    support: "onboarding@resend.dev",
    noreply: "onboarding@resend.dev",
    privacy: "onboarding@resend.dev",
    admin: (process.env.ADMIN_EMAILS?.split(",")[0]?.trim()) || "admin@itup.kr",
  },

  // 소셜/연락처
  social: {
    // 추후 추가 가능
  },

  // 회사 정보 (개인정보처리방침 등에 사용)
  company: {
    name: "커피챗",
    representative: "대표자명",
    address: "주소",
  },
};

// 표시용 도메인 (프로토콜 제외, OG 이미지 등에서 사용)
export function getDisplayDomain(): string {
  return SITE_CONFIG.url.replace(/^https?:\/\//, "");
}

// 이메일 발신자 형식
export function getEmailFrom(type: "support" | "noreply" = "noreply"): string {
  const email = type === "support" ? SITE_CONFIG.email.support : SITE_CONFIG.email.noreply;
  return `${SITE_CONFIG.name} <${email}>`;
}

// 전체 URL 생성
export function getFullUrl(path: string): string {
  const base = SITE_CONFIG.url.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
