import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function isSupabaseCookie(name: string): boolean {
  return name.startsWith("sb-") || name.startsWith("supabase.");
}

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
          setAll(cookiesToSet) {
            // Supabase signOut이 설정하는 삭제 쿠키를 응답 헤더에 반영
            cookiesToSet.forEach(({ name, value, options }) => {
              const parts = [`${name}=${value}`, `Path=${options?.path || "/"}`];
              if (options?.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
              if (options?.sameSite) parts.push(`SameSite=${options.sameSite}`);
              headers.append("Set-Cookie", parts.join("; "));
            });
          },
        },
      });
      await supabase.auth.signOut();
    } catch {
      // 무시 - 수동 쿠키 삭제로 대체
    }
  }

  // 2. 모든 Supabase 관련 쿠키를 Set-Cookie 헤더로 강제 삭제
  // 쿠키 이름: "supabase.auth.token", "supabase.auth.token.0", "sb-*" 등
  for (const cookie of request.cookies.getAll()) {
    if (isSupabaseCookie(cookie.name)) {
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
  for (var i = localStorage.length - 1; i >= 0; i--) {
    var key = localStorage.key(i);
    if (key && (key.startsWith('sb-') || key.startsWith('supabase.') || key.includes('supabase'))) {
      localStorage.removeItem(key);
    }
  }
} catch(e) {}
try {
  for (var j = sessionStorage.length - 1; j >= 0; j--) {
    var skey = sessionStorage.key(j);
    if (skey && (skey.startsWith('sb-') || skey.startsWith('supabase.') || skey.includes('supabase'))) {
      sessionStorage.removeItem(skey);
    }
  }
} catch(e) {}
try {
  document.cookie.split(';').forEach(function(c) {
    var name = c.trim().split('=')[0];
    if (name.startsWith('sb-') || name.startsWith('supabase.')) {
      document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0;';
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
