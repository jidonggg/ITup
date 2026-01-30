import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/sender";
import {
  consultationRequestTemplate,
  consultationConfirmedTemplate,
  mentorApprovedTemplate,
} from "@/lib/email/templates";

// 내부 API 시크릿 (서버-서버 통신용)
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://itup.vercel.app";

// 서버사이드 Supabase 클라이언트
function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// 인증 검증: 관리자 토큰, 인증된 사용자 토큰, 또는 내부 API 시크릿 필요
async function verifyAuth(request: NextRequest): Promise<boolean> {
  // 1. 내부 API 시크릿 확인 (서버-서버 통신)
  const apiSecret = request.headers.get("x-api-secret");
  if (INTERNAL_API_SECRET && apiSecret === INTERNAL_API_SECRET) {
    return true;
  }

  // 2. 인증된 사용자 세션 토큰 확인 (관리자 또는 멘토)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const supabase = getServiceSupabase();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        return true;
      }
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    // 인증 검증
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: "type and data are required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    switch (type) {
      case "consultation_request": {
        // 상담 신청 시 멘토에게 알림
        const { mentorId, menteeName, menteeEmail, menteePhone, interest, preferredTime, message } = data;

        if (!mentorId) {
          return NextResponse.json({ success: true, message: "No mentor specified" });
        }

        // 멘토 정보 조회
        if (supabase) {
          const { data: mentor } = await supabase
            .from("mentors")
            .select("name, user_id")
            .eq("id", mentorId)
            .single();

          if (mentor) {
            // 멘토의 이메일 조회
            const { data: profile } = await supabase
              .from("profiles")
              .select("email")
              .eq("id", mentor.user_id)
              .single();

            if (profile?.email) {
              const template = consultationRequestTemplate({
                mentorName: mentor.name,
                menteeName,
                menteeEmail,
                menteePhone,
                interest,
                preferredTime,
                message,
                siteUrl: SITE_URL,
              });

              const result = await sendEmail({ to: profile.email, template });
              return NextResponse.json({ success: result.success, messageId: result.messageId });
            }
          }
        }

        return NextResponse.json({ success: true, message: "Email skipped - no mentor email found" });
      }

      case "consultation_confirmed": {
        // 상담 확정 시 멘티에게 알림
        const { consultationId } = data;

        if (!consultationId || !supabase) {
          return NextResponse.json({ success: true, message: "Skipped" });
        }

        // 상담 정보 조회
        const { data: consultation } = await supabase
          .from("consultations")
          .select("user_name, user_email, mentor_id")
          .eq("id", consultationId)
          .single();

        if (consultation?.user_email && consultation.mentor_id) {
          // 멘토 정보 조회
          const { data: mentor } = await supabase
            .from("mentors")
            .select("name, company")
            .eq("id", consultation.mentor_id)
            .single();

          if (mentor) {
            const template = consultationConfirmedTemplate({
              menteeName: consultation.user_name,
              mentorName: mentor.name,
              mentorCompany: mentor.company,
              siteUrl: SITE_URL,
            });

            const result = await sendEmail({ to: consultation.user_email, template });
            return NextResponse.json({ success: result.success, messageId: result.messageId });
          }
        }

        return NextResponse.json({ success: true, message: "Email skipped" });
      }

      case "mentor_approved": {
        // 멘토 승인 시 멘토에게 알림
        const { mentorId } = data;

        if (!mentorId || !supabase) {
          return NextResponse.json({ success: true, message: "Skipped" });
        }

        // 멘토 정보 조회
        const { data: mentor } = await supabase
          .from("mentors")
          .select("name, user_id")
          .eq("id", mentorId)
          .single();

        if (mentor) {
          // 멘토의 이메일 조회
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", mentor.user_id)
            .single();

          if (profile?.email) {
            const template = mentorApprovedTemplate({
              mentorName: mentor.name,
              siteUrl: SITE_URL,
            });

            const result = await sendEmail({ to: profile.email, template });
            return NextResponse.json({ success: result.success, messageId: result.messageId });
          }
        }

        return NextResponse.json({ success: true, message: "Email skipped" });
      }

      default:
        return NextResponse.json(
          { error: "Unknown notification type" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Email notification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
