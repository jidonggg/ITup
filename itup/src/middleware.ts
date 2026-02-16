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

    // 무한 리다이렉트 방지: 이미 알려진 에러 파라미터가 있으면 통과
    // 주의: 빈 문자열이나 임의 값은 허용하지 않음 (우회 공격 방지)
    const KNOWN_ERRORS = ["config", "unauthenticated", "forbidden"];
    const existingError = request.nextUrl.searchParams.get("error");
    if (existingError && KNOWN_ERRORS.includes(existingError)) {
      return await updateSession(request);
    }

    // 환경변수 미설정 시 → 클라이언트에서 에러 메시지 표시하도록 통과
    if (!supabaseUrl || !supabaseAnonKey || ADMIN_EMAILS.length === 0) {
      const url = new URL("/admin", request.url);
      url.searchParams.set("error", "config");
      return NextResponse.redirect(url);
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

    if (!user?.email) {
      // 로그인되지 않은 사용자 → 클라이언트에서 로그인 안내 표시하도록 통과
      const url = new URL("/admin", request.url);
      url.searchParams.set("error", "unauthenticated");
      return NextResponse.redirect(url);
    }

    if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      // 관리자가 아닌 사용자 → 클라이언트에서 권한 없음 안내 표시하도록 통과
      const url = new URL("/admin", request.url);
      url.searchParams.set("error", "forbidden");
      return NextResponse.redirect(url);
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
