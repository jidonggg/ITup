import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
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
