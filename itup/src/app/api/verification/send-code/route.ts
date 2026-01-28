import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// 인증 코드 임시 저장 (메모리, 5분 TTL)
// 프로덕션에서는 Redis 사용 권장
const verificationCodes = new Map<string, { code: string; expires: number }>();

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
    const { email, mentorId } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "이메일이 필요합니다." }, { status: 400 });
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
    const expires = Date.now() + 5 * 60 * 1000; // 5분

    // 메모리에 임시 저장 (키: 이메일)
    verificationCodes.set(email, { code, expires });

    // 5분 후 자동 삭제
    setTimeout(() => {
      verificationCodes.delete(email);
    }, 5 * 60 * 1000);

    // 이메일 발송
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "ITup <noreply@itup.vercel.app>",
        to: email,
        subject: "[ITup] 멘토 인증 코드",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8B5CF6;">ITup 멘토 인증</h2>
            <p>안녕하세요, ITup 멘토 인증을 위한 코드입니다.</p>
            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #8B5CF6;">
                ${code}
              </span>
            </div>
            <p style="color: #6B7280; font-size: 14px;">
              - 이 코드는 5분간 유효합니다.<br>
              - 본인이 요청하지 않은 경우 이 이메일을 무시하세요.
            </p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">
            <p style="color: #9CA3AF; font-size: 12px;">
              이 이메일은 ITup 멘토 인증을 위해 발송되었습니다.
            </p>
          </div>
        `,
      });
    } else {
      // 개발 환경: 콘솔에 코드 출력
      console.log(`[DEV] Verification code for ${email}: ${code}`);
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

// 코드 검증용 export (verify-code에서 사용)
export { verificationCodes };
