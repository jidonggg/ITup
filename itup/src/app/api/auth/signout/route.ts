import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // 서버에서 Supabase 세션 무효화 시도
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseServiceKey) {
    try {
      // refresh token 찾아서 서버에서 세션 revoke
      const authCookie = allCookies.find(
        (c) => c.name.startsWith("sb-") && c.name.includes("auth-token")
      );
      if (authCookie?.value) {
        try {
          const parsed = JSON.parse(
            Buffer.from(authCookie.value, "base64").toString("utf-8")
          );
          if (parsed?.refresh_token) {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);
            await supabase.auth.admin.signOut(parsed.refresh_token, "global");
          }
        } catch {
          // JSON 파싱 실패 시 무시 (청크 쿠키일 수 있음)
        }
      }
    } catch {
      // 서버 세션 무효화 실패해도 쿠키 삭제는 진행
    }
  }

  // 홈으로 리다이렉트 + 모든 Supabase 인증 쿠키 삭제
  const response = NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_SITE_URL || "https://coffeechat-kr.vercel.app"));

  for (const cookie of allCookies) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.set(cookie.name, "", {
        expires: new Date(0),
        path: "/",
        maxAge: 0,
      });
    }
  }

  return response;
}

// POST도 동일하게 처리
export async function POST() {
  return GET();
}
