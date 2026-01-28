import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/sender";
import {
  consultationRequestTemplate,
  consultationConfirmedTemplate,
  mentorApprovedTemplate,
} from "@/lib/email/templates";

// 서버사이드 Supabase 클라이언트
function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  try {
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
