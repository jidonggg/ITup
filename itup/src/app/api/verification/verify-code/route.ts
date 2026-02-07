import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVerificationCode, deleteVerificationCode } from "@/lib/verification-store";
import { verifyCodeLimiter } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const { email, code, mentorId } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "이메일과 인증 코드가 필요합니다." },
        { status: 400 }
      );
    }

    // Rate limit — 5 req / 5min per email
    const { success: allowed, retryAfterMs } = verifyCodeLimiter.check(email.toLowerCase());
    if (!allowed) {
      return NextResponse.json(
        { error: "너무 많은 시도입니다. 5분 후에 다시 시도해주세요." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
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

      // mentorId와 인증 이메일 도메인의 연관성 검증
      const { data: mentor } = await supabase
        .from("mentors")
        .select("id, company_email")
        .eq("id", mentorId)
        .single();

      if (!mentor) {
        return NextResponse.json(
          { error: "멘토 정보를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      // 인증 요청된 이메일과 멘토가 등록한 회사 이메일의 도메인이 일치하는지 확인
      const requestedDomain = email.split("@")[1]?.toLowerCase();
      const mentorEmailDomain = mentor.company_email?.split("@")[1]?.toLowerCase();
      if (mentorEmailDomain && requestedDomain !== mentorEmailDomain) {
        return NextResponse.json(
          { error: "멘토 등록 시 사용한 회사 이메일과 일치하지 않습니다." },
          { status: 403 }
        );
      }

      await supabase
        .from("mentors")
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          verification_method: "email",
          verified_company: requestedDomain,
          verification_status: "verified" as const,
        })
        .eq("id", mentorId);
    }

    return NextResponse.json({
      success: true,
      message: "인증이 완료되었습니다.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "인증 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
