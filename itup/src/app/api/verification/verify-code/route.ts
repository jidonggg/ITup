import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 인증 코드 저장소 (send-code와 공유)
// 주의: Serverless 환경에서는 메모리 공유 불가, Redis 필요
const verificationCodes = new Map<string, { code: string; expires: number }>();

export async function POST(request: NextRequest) {
  try {
    const { email, code, mentorId } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "이메일과 인증 코드가 필요합니다." },
        { status: 400 }
      );
    }

    // 저장된 코드 확인
    const stored = verificationCodes.get(email);

    if (!stored) {
      return NextResponse.json(
        { error: "인증 코드가 만료되었거나 존재하지 않습니다." },
        { status: 400 }
      );
    }

    // 만료 확인
    if (Date.now() > stored.expires) {
      verificationCodes.delete(email);
      return NextResponse.json(
        { error: "인증 코드가 만료되었습니다. 다시 요청해주세요." },
        { status: 400 }
      );
    }

    // 코드 검증
    if (stored.code !== code) {
      return NextResponse.json(
        { error: "인증 코드가 일치하지 않습니다." },
        { status: 400 }
      );
    }

    // 검증 성공 - 즉시 코드 삭제 (개인정보 보호)
    verificationCodes.delete(email);

    // Supabase에 인증 상태 저장
    if (mentorId && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      await supabase
        .from("mentors")
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          verification_method: "email",
          verified_company: email.split("@")[1],
        })
        .eq("id", mentorId);
    }

    return NextResponse.json({
      success: true,
      message: "인증이 완료되었습니다.",
    });
  } catch (error) {
    console.error("Verify code error:", error);
    return NextResponse.json(
      { error: "인증 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
