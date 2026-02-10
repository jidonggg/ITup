import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function isSupabaseCookie(name: string): boolean {
  return name.startsWith("sb-") || name.startsWith("supabase.");
}

export async function GET(request: NextRequest) {
  // 클라이언트에서 모든 쿠키 + 스토리지 삭제 후 홈으로 이동
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>로그아웃</title></head>
<body>
<script>
try {
  document.cookie.split(';').forEach(function(c) {
    var name = c.trim().split('=')[0];
    if (name) {
      document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0;';
      document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; Secure;';
    }
  });
} catch(e) {}
try { localStorage.clear(); } catch(e) {}
try { sessionStorage.clear(); } catch(e) {}
window.location.replace('/');
</script>
</body></html>`;

  const response = new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });

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
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, {
                ...options,
                maxAge: 0,
              });
            });
          },
        },
      });
      await supabase.auth.signOut();
    } catch {
      // 무시
    }
  }

  // 2. 요청의 모든 Supabase 쿠키를 서버에서 강제 삭제
  for (const cookie of request.cookies.getAll()) {
    if (isSupabaseCookie(cookie.name)) {
      response.cookies.set(cookie.name, "", {
        path: "/",
        maxAge: 0,
        sameSite: "lax",
        secure: true,
      });
    }
  }

  return response;
}

export async function POST(request: NextRequest) {
  return GET(request);
}
