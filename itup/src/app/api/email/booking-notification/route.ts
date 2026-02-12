import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/sender";
import {
  newBookingForMentorTemplate,
  bookingConfirmedForMenteeTemplate,
  sessionReminder24hTemplate,
  sessionReminder1hTemplate,
  reviewRequestTemplate,
  feedbackReceivedTemplate,
} from "@/lib/email/templates";
import { SITE_CONFIG } from "@/lib/site-config";
import { emailLimiter, getClientIp } from "@/lib/rate-limit";
import { safeCompare } from "@/lib/security";

// 내부 API 시크릿 (서버-서버 통신용)
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;
const SITE_URL = SITE_CONFIG.url;

// 지원하는 알림 타입
type NotificationType =
  | "new_booking"
  | "confirmed"
  | "reminder_24h"
  | "reminder_1h"
  | "review_request"
  | "feedback_received";

// 서버사이드 Supabase 클라이언트
function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// 인증 검증: 내부 API 시크릿 또는 인증된 사용자 토큰 필요
// NOTE: 예약 알림은 멘토/멘티 모두 트리거 가능하므로 인증된 사용자라면 허용합니다.
// 실제 이메일 발송 대상은 bookingId 기반으로 서버에서 조회하므로,
// 인증된 사용자가 임의의 주소로 이메일을 보낼 수는 없습니다.
async function verifyAuth(request: NextRequest): Promise<boolean> {
  // 1. 내부 API 시크릿 확인 (서버-서버 통신)
  const apiSecret = request.headers.get("x-api-secret");
  if (INTERNAL_API_SECRET && apiSecret && safeCompare(apiSecret, INTERNAL_API_SECRET)) {
    return true;
  }

  // 2. 인증된 사용자 세션 토큰 확인
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const supabase = getServiceSupabase();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser(token);
      if (user) {
        return true;
      }
    }
  }

  return false;
}

// 날짜 포맷팅 (한국어)
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function POST(request: NextRequest) {
  try {
    // 인증 검증
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const ip = getClientIp(request);
    const { success: allowed } = emailLimiter.check(ip);
    if (!allowed) {
      return NextResponse.json({ error: "요청이 너무 많아요." }, { status: 429 });
    }

    let body: { type?: NotificationType; bookingId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }
    const { type, bookingId } = body;

    if (!type || !bookingId) {
      return NextResponse.json(
        { error: "type and bookingId are required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { success: true, message: "Database not configured" }
      );
    }

    // 예약 정보 조회 (관련 정보 모두 가져오기)
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // 멘토 정보 조회
    const { data: mentor, error: mentorError } = await supabase
      .from("mentors")
      .select("id, name, company, position, user_id")
      .eq("id", booking.mentor_id)
      .single();

    if (mentorError || !mentor) {
      return NextResponse.json(
        { success: true, message: "Mentor not found, skipping email" }
      );
    }

    // 멘토 이메일 조회
    const { data: mentorProfile } = await supabase
      .from("profiles")
      .select("email, name")
      .eq("id", mentor.user_id)
      .single();

    // 멘티 정보 조회
    let menteeProfile = null;
    if (booking.mentee_id) {
      const { data } = await supabase
        .from("profiles")
        .select("email, name")
        .eq("id", booking.mentee_id)
        .single();
      menteeProfile = data;
    }

    // 상품 정보 조회
    let product = null;
    if (booking.product_id) {
      const { data } = await supabase
        .from("products")
        .select("title, duration_minutes, type")
        .eq("id", booking.product_id)
        .single();
      product = data;
    }

    const scheduledAt = formatDateTime(booking.scheduled_at);
    const productName = product?.title || "멘토링 세션";
    const duration = product?.duration_minutes || 30;

    switch (type) {
      case "new_booking": {
        // 멘토에게 새 예약 알림
        if (!mentorProfile?.email) {
          return NextResponse.json({
            success: true,
            message: "Mentor email not found",
          });
        }

        const template = newBookingForMentorTemplate({
          mentorName: mentor.name,
          menteeName: menteeProfile?.name || "멘티",
          productName,
          scheduledAt,
          duration,
          price: booking.amount,
          bookingId,
          siteUrl: SITE_URL,
        });

        const result = await sendEmail({ to: mentorProfile.email, template });
        return NextResponse.json({
          success: result.success,
          messageId: result.messageId,
        });
      }

      case "confirmed": {
        // 멘티에게 예약 확정 알림
        if (!menteeProfile?.email) {
          return NextResponse.json({
            success: true,
            message: "Mentee email not found",
          });
        }

        const template = bookingConfirmedForMenteeTemplate({
          menteeName: menteeProfile.name || "멘티",
          mentorName: mentor.name,
          mentorCompany: mentor.company,
          mentorPosition: mentor.position || "",
          productName,
          scheduledAt,
          duration,
          meetingLink: booking.meeting_link || undefined,
          bookingId,
          siteUrl: SITE_URL,
        });

        const result = await sendEmail({ to: menteeProfile.email, template });
        return NextResponse.json({
          success: result.success,
          messageId: result.messageId,
        });
      }

      case "reminder_24h": {
        // 24시간 전 리마인더 (멘토, 멘티 모두에게)
        const results: { mentor?: boolean; mentee?: boolean } = {};

        // 멘토에게
        if (mentorProfile?.email) {
          const mentorTemplate = sessionReminder24hTemplate({
            recipientName: mentor.name,
            recipientRole: "mentor",
            counterpartName: menteeProfile?.name || "멘티",
            productName,
            scheduledAt,
            duration,
            meetingLink: booking.meeting_link || undefined,
            bookingId,
            siteUrl: SITE_URL,
          });
          const mentorResult = await sendEmail({
            to: mentorProfile.email,
            template: mentorTemplate,
          });
          results.mentor = mentorResult.success;
        }

        // 멘티에게
        if (menteeProfile?.email) {
          const menteeTemplate = sessionReminder24hTemplate({
            recipientName: menteeProfile.name || "멘티",
            recipientRole: "mentee",
            counterpartName: mentor.name,
            productName,
            scheduledAt,
            duration,
            meetingLink: booking.meeting_link || undefined,
            bookingId,
            siteUrl: SITE_URL,
          });
          const menteeResult = await sendEmail({
            to: menteeProfile.email,
            template: menteeTemplate,
          });
          results.mentee = menteeResult.success;
        }

        return NextResponse.json({ success: true, results });
      }

      case "reminder_1h": {
        // 1시간 전 리마인더 (멘토, 멘티 모두에게)
        const results: { mentor?: boolean; mentee?: boolean } = {};

        // 멘토에게
        if (mentorProfile?.email) {
          const mentorTemplate = sessionReminder1hTemplate({
            recipientName: mentor.name,
            recipientRole: "mentor",
            counterpartName: menteeProfile?.name || "멘티",
            scheduledAt,
            meetingLink: booking.meeting_link || undefined,
            siteUrl: SITE_URL,
          });
          const mentorResult = await sendEmail({
            to: mentorProfile.email,
            template: mentorTemplate,
          });
          results.mentor = mentorResult.success;
        }

        // 멘티에게
        if (menteeProfile?.email) {
          const menteeTemplate = sessionReminder1hTemplate({
            recipientName: menteeProfile.name || "멘티",
            recipientRole: "mentee",
            counterpartName: mentor.name,
            scheduledAt,
            meetingLink: booking.meeting_link || undefined,
            siteUrl: SITE_URL,
          });
          const menteeResult = await sendEmail({
            to: menteeProfile.email,
            template: menteeTemplate,
          });
          results.mentee = menteeResult.success;
        }

        return NextResponse.json({ success: true, results });
      }

      case "review_request": {
        // 멘티에게 리뷰 요청
        if (!menteeProfile?.email) {
          return NextResponse.json({
            success: true,
            message: "Mentee email not found",
          });
        }

        const template = reviewRequestTemplate({
          menteeName: menteeProfile.name || "멘티",
          mentorName: mentor.name,
          mentorCompany: mentor.company,
          productName,
          completedAt: formatDateTime(new Date().toISOString()),
          bookingId,
          siteUrl: SITE_URL,
        });

        const result = await sendEmail({ to: menteeProfile.email, template });
        return NextResponse.json({
          success: result.success,
          messageId: result.messageId,
        });
      }

      case "feedback_received": {
        // 멘티에게 피드백 도착 알림
        if (!menteeProfile?.email) {
          return NextResponse.json({
            success: true,
            message: "Mentee email not found",
          });
        }

        // 피드백 내용 조회
        const { data: feedback } = await supabase
          .from("mentor_feedbacks")
          .select("content")
          .eq("booking_id", bookingId)
          .single();

        const feedbackPreview = feedback?.content || "";

        const template = feedbackReceivedTemplate({
          menteeName: menteeProfile.name || "멘티",
          mentorName: mentor.name,
          mentorCompany: mentor.company,
          productName,
          feedbackPreview,
          bookingId,
          siteUrl: SITE_URL,
        });

        const result = await sendEmail({ to: menteeProfile.email, template });
        return NextResponse.json({
          success: result.success,
          messageId: result.messageId,
        });
      }

      default:
        return NextResponse.json(
          { error: "Unknown notification type" },
          { status: 400 }
        );
    }
  } catch (error) {
    // 에러 발생해도 메인 플로우 중단하지 않음
    console.error("[booking-notification] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
