import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { saveVerificationCode } from "@/lib/verification-store";

// 게임 회사 도메인 목록
const GAME_COMPANY_DOMAINS = [
  "nexon.com", "nexon.co.kr",
  "netmarble.com", "netmarble.net",
  "krafton.com", "pubg.com",
  "ncsoft.com", "ncsoft.net",
  "smilegate.com",
  "pearl-abyss.com", "pearlabyss.com",
  "kakaogames.com",
  "devsisters.com",
  "supercell.com",
  "riot.com", "riotgames.com",
  "blizzard.com", "activision.com",
  "ea.com",
  "ubisoft.com",
  "epicgames.com",
  "unity.com", "unity3d.com",
  "unrealengine.com",
  "cygames.co.jp",
  "mihoyo.com", "hoyoverse.com",
  "nhn.com", "nhnent.com",
  "wemade.com",
  "webzen.com",
  "gamevil.com", "com2us.com",
  "neowiz.com",
  "hanbitsoft.com",
  "gravity.co.kr",
  "lineplus.com", "linecorp.com",
];

// Rate limiting (메모리 기반, 프로덕션에서는 Redis 권장)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 3; // 5분당 최대 3회
const RATE_LIMIT_WINDOW = 5 * 60 * 1000;

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(email);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(email, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

function isValidCompanyEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;

  return GAME_COMPANY_DOMAINS.some(
    (companyDomain) => domain === companyDomain || domain.endsWith(`.${companyDomain}`)
  );
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "이메일이 필요합니다." }, { status: 400 });
    }

    // Rate limiting 체크
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { error: "너무 많은 요청입니다. 5분 후에 다시 시도해주세요." },
        { status: 429 }
      );
    }

    // 회사 이메일 도메인 검증
    if (!isValidCompanyEmail(email)) {
      return NextResponse.json(
        { error: "게임 회사 이메일만 인증 가능합니다." },
        { status: 400 }
      );
    }

    // 인증 코드 생성
    const code = generateCode();

    // 공유 저장소에 저장 (Supabase 또는 메모리)
    await saveVerificationCode(email, code);

    // 이메일 발송
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "커피챗 <noreply@itup.kr>",
        to: email,
        subject: "[커피챗] 멘토 인증 코드",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #A0714F;">커피챗 멘토 인증</h2>
            <p>안녕하세요, 커피챗 멘토 인증을 위한 코드입니다.</p>
            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #A0714F;">
                ${code}
              </span>
            </div>
            <p style="color: #6B7280; font-size: 14px;">
              - 이 코드는 5분간 유효합니다.<br>
              - 본인이 요청하지 않은 경우 이 이메일을 무시하세요.
            </p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
            <p style="color: #9CA3AF; font-size: 12px;">
              이 이메일은 커피챗 멘토 인증을 위해 발송되었습니다.
            </p>
          </div>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      message: "인증 코드가 발송되었습니다.",
    });
  } catch (error) {
    console.error("Send verification code error:", error);
    return NextResponse.json(
      { error: "인증 코드 발송에 실패했습니다." },
      { status: 500 }
    );
  }
}
