import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";
  // Open redirect 방지: 상대 경로만 허용
  function isSafeRedirect(url: string): boolean {
    if (!url.startsWith("/")) return false;
    if (url.startsWith("//")) return false;
    // /\ 패턴 차단 (일부 브라우저에서 프로토콜 상대 URL로 해석 가능)
    if (/^\/[\\]/.test(url)) return false;
    try {
      const parsed = new URL(url, "http://localhost");
      return parsed.host === "localhost";
    } catch { return false; }
  }
  const next = isSafeRedirect(rawNext) ? rawNext : "/";
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // OAuth 에러 파라미터가 있는 경우 (예: 사용자가 취소함)
  if (errorParam) {
    const errorMsg = errorDescription || errorParam;
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorMsg)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    // 코드 교환 실패 시 에러 메시지와 함께 리다이렉트
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("인증에 실패했습니다. 다시 시도해주세요.")}`
    );
  }

  // code가 없는 경우 - 잘못된 접근
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("잘못된 인증 요청입니다.")}`
  );
}
