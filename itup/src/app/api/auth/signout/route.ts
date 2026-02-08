import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url), {
    status: 302,
  });

  // 요청에 있는 모든 Supabase 쿠키를 응답에서 삭제
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.delete(cookie.name);
    }
  }

  return response;
}

export async function POST(request: NextRequest) {
  return GET(request);
}
