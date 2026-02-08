import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const response = NextResponse.json({ success: true });

  // Supabase SSR 인증 쿠키 모두 삭제 (sb-*-auth-token 패턴)
  for (const cookie of allCookies) {
    if (cookie.name.startsWith("sb-") && cookie.name.includes("auth-token")) {
      response.cookies.set(cookie.name, "", {
        expires: new Date(0),
        path: "/",
      });
    }
  }

  return response;
}
