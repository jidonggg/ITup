import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVerificationCode, deleteVerificationCode } from "@/lib/verification-store";

// Rate limiting (메모리 기반, 프로덕션에서는 Redis 권장)
const verifyRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const VERIFY_RATE_LIMIT = 10; // 5분당 최대 10회 시도
const VERIFY_RATE_LIMIT_WINDOW = 5 * 60 * 1000;

function checkVerifyRateLimit(email: string): boolean {
  const now = Date.now();
  const record = verifyRateLimitMap.get(email);

  if (!record || now > record.resetAt) {
    verifyRateLimitMap.set(email, { count: 1, resetAt: now + VERIFY_RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= VERIFY_RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const { email, code, mentorId } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "이메일과 인증 코드가 필요합니다." },
        { status: 400 }
      );
    }

    // Rate limiting 체크
    if (!checkVerifyRateLimit(email)) {
      return NextResponse.json(
        { error: "너무 많은 시도입니다. 5분 후에 다시 시도해주세요." },
        { status: 429 }
      );
    }

    // 공유 저장소에서 코드 조회
    const stored = await getVerificationCode(email);

    if (!stored) {
      return NextResponse.json(
        { error: "인증 코드가 만료되었거나 존재하지 않습니다." },
        { status: 400 }
      );
    }

    // 만료 확인
    if (Date.now() > stored.expires) {
      await deleteVerificationCode(email);
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
    await deleteVerificationCode(email);

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
