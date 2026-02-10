import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/lib/supabase/middleware";

// 서버사이드 관리자 이메일 목록
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function middleware(request: NextRequest) {
  // 로그아웃 경로는 세션 갱신 건너뛰기 (미들웨어가 토큰을 다시 살리는 것 방지)
  if (request.nextUrl.pathname === "/api/auth/signout") {
    return NextResponse.next();
  }

  // /admin 경로 서버사이드 권한 체크
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || ADMIN_EMAILS.length === 0) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // 읽기 전용 - 세션 갱신은 updateSession에서 처리
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (
      !user?.email ||
      !ADMIN_EMAILS.includes(user.email.toLowerCase())
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
