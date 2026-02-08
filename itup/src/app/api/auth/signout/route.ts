import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const headers = new Headers();
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 1. Supabase 서버에 세션 무효화 요청 (refresh token 폐기)
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // 쿠키 삭제는 아래에서 수동으로 처리
          },
        },
      });
      await supabase.auth.signOut();
    } catch {
      // 무시 - 쿠키 삭제로 대체
    }
  }

  // 2. 서버에서 Set-Cookie 헤더로 모든 sb-* 쿠키 삭제 (HttpOnly 포함)
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      // HttpOnly 쿠키 삭제용
      headers.append(
        "Set-Cookie",
        `${cookie.name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; Secure; SameSite=Lax`
      );
      // non-HttpOnly 쿠키 삭제용 (같은 이름이지만 다른 속성으로 설정된 경우 대비)
      headers.append(
        "Set-Cookie",
        `${cookie.name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; SameSite=Lax`
      );
    }
  }

  // 3. HTML 응답: 클라이언트에서 localStorage/document.cookie 정리 후 리디렉트
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>로그아웃</title></head>
<body>
<script>
try {
  // localStorage에서 Supabase 관련 데이터 삭제
  for (var i = localStorage.length - 1; i >= 0; i--) {
    var key = localStorage.key(i);
    if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
      localStorage.removeItem(key);
    }
  }
} catch(e) {}
try {
  // sessionStorage에서 Supabase 관련 데이터 삭제
  for (var j = sessionStorage.length - 1; j >= 0; j--) {
    var skey = sessionStorage.key(j);
    if (skey && (skey.startsWith('sb-') || skey.includes('supabase'))) {
      sessionStorage.removeItem(skey);
    }
  }
} catch(e) {}
try {
  // document.cookie로 접근 가능한 쿠키 삭제
  document.cookie.split(';').forEach(function(c) {
    var name = c.trim().split('=')[0];
    if (name.startsWith('sb-')) {
      document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0;';
      document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; Secure;';
    }
  });
} catch(e) {}
window.location.replace('/');
</script>
</body></html>`;

  return new NextResponse(html, { status: 200, headers });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
