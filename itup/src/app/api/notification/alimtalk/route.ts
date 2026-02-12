/**
 * 카카오 알림톡 발송 API
 *
 * POST /api/notification/alimtalk
 *
 * 지원하는 알림 타입:
 *   - booking_confirmed: 예약 확정 알림
 *   - session_reminder_24h: 세션 리마인더 (24시간 전)
 *   - session_reminder_1h: 세션 리마인더 (1시간 전)
 *   - review_request: 후기 작성 요청
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sendAlimtalk,
  isAlimtalkConfigured,
  type SendAlimtalkResult,
} from "@/lib/kakao/alimtalk";
import { type AlimtalkTemplateCode } from "@/lib/kakao/templates";
import { safeCompare } from "@/lib/security";

// =============================================
// 설정
// =============================================

const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

// Rate limiting: 동일 수신자에게 동일 템플릿 발송 제한 (1분 내 중복 방지)
const recentSends = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1분
const MAX_KEYS = 1000;

// =============================================
// 헬퍼 함수
// =============================================

/**
 * 서비스용 Supabase 클라이언트
 */
function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * 인증 검증: 내부 API 시크릿 또는 인증된 사용자 토큰 필요
 */
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

/**
 * 중복 발송 체크 (Rate limiting)
 */
function checkDuplicateSend(phone: string, templateCode: string): boolean {
  const key = `${phone}:${templateCode}`;
  const now = Date.now();

  // 오래된 항목 정리
  if (recentSends.size > MAX_KEYS) {
    for (const [k, timestamp] of recentSends) {
      if (now - timestamp > RATE_LIMIT_WINDOW_MS) {
        recentSends.delete(k);
      }
    }
  }

  const lastSent = recentSends.get(key);
  if (lastSent && now - lastSent < RATE_LIMIT_WINDOW_MS) {
    return true; // 중복
  }

  recentSends.set(key, now);
  return false;
}

/**
 * 날짜 포맷팅 (한국어)
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

/**
 * 시간 포맷팅
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// =============================================
// 요청 타입 정의
// =============================================

type NotificationType =
  | "booking_confirmed"
  | "session_reminder_24h"
  | "session_reminder_1h"
  | "review_request";

interface AlimtalkRequestBody {
  type: NotificationType;
  bookingId?: string;
  recipientPhone?: string;
  variables?: Record<string, string | number>;
}

// =============================================
// API 핸들러
// =============================================

export async function POST(request: NextRequest) {
  try {
    // 인증 검증
    const isAuthorized = await verifyAuth(request);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "인증되지 않은 요청입니다." },
        { status: 401 }
      );
    }

    // 알림톡 설정 확인
    if (!isAlimtalkConfigured()) {
      console.warn("[Alimtalk API] 카카오 알림톡 설정 미완료 - 개발 모드");
      // 개발 모드에서는 성공으로 처리
      return NextResponse.json({
        success: true,
        message: "알림톡 설정 미완료 (개발 모드)",
        messageId: `dev-${Date.now()}`,
      });
    }

    let body: AlimtalkRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 요청 형식입니다." },
        { status: 400 },
      );
    }
    const { type, bookingId, recipientPhone, variables } = body;

    if (!type) {
      return NextResponse.json(
        { success: false, error: "알림 타입이 필요합니다." },
        { status: 400 }
      );
    }

    // bookingId가 있으면 예약 정보 조회 후 발송
    if (bookingId) {
      return await handleBookingBasedNotification(type, bookingId);
    }

    // 직접 변수 전달 방식
    if (recipientPhone && variables) {
      return await handleDirectNotification(type, recipientPhone, variables);
    }

    return NextResponse.json(
      {
        success: false,
        error: "bookingId 또는 (recipientPhone, variables) 조합이 필요합니다.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Alimtalk API] 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 예약 기반 알림 처리
 */
async function handleBookingBasedNotification(
  type: NotificationType,
  bookingId: string
): Promise<NextResponse> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({
      success: true,
      message: "데이터베이스 미설정",
    });
  }

  // 예약 정보 조회
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    return NextResponse.json(
      { success: false, error: "예약을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  // 멘토 정보 조회
  const { data: mentor } = await supabase
    .from("mentors")
    .select("id, name, company, position, user_id")
    .eq("id", booking.mentor_id)
    .single();

  if (!mentor) {
    return NextResponse.json({
      success: true,
      message: "멘토 정보 없음, 발송 생략",
    });
  }

  // 멘토 프로필 (연락처 포함) 조회
  const { data: mentorProfile } = await supabase
    .from("profiles")
    .select("email, name, phone")
    .eq("id", mentor.user_id)
    .single();

  // 멘티 프로필 조회
  let menteeProfile: { email?: string; name?: string; phone?: string } | null =
    null;
  if (booking.mentee_id) {
    const { data } = await supabase
      .from("profiles")
      .select("email, name, phone")
      .eq("id", booking.mentee_id)
      .single();
    menteeProfile = data;
  }

  // 상품 정보 조회
  let product: { title?: string; duration_minutes?: number } | null = null;
  if (booking.product_id) {
    const { data } = await supabase
      .from("products")
      .select("title, duration_minutes")
      .eq("id", booking.product_id)
      .single();
    product = data;
  }

  const scheduledDate = formatDate(booking.scheduled_at);
  const scheduledTime = formatTime(booking.scheduled_at);
  const productName = product?.title || "멘토링 세션";
  const duration = product?.duration_minutes || 30;

  let result: SendAlimtalkResult;

  switch (type) {
    case "booking_confirmed": {
      // 멘티에게 예약 확정 알림
      if (!menteeProfile?.phone) {
        return NextResponse.json({
          success: true,
          message: "멘티 연락처 없음, 발송 생략",
        });
      }

      // 중복 발송 체크
      if (checkDuplicateSend(menteeProfile.phone, type)) {
        return NextResponse.json({
          success: true,
          message: "중복 발송 방지 (1분 내 동일 알림)",
        });
      }

      result = await sendAlimtalk({
        templateCode: "booking_confirmed",
        recipientPhone: menteeProfile.phone,
        variables: {
          menteeName: menteeProfile.name || "멘티",
          mentorName: mentor.name,
          mentorCompany: mentor.company || "",
          productName,
          scheduledDate,
          scheduledTime,
          duration,
          bookingId,
        },
      });
      break;
    }

    case "session_reminder_24h": {
      // 멘토, 멘티 모두에게 발송
      const results: { mentor?: SendAlimtalkResult; mentee?: SendAlimtalkResult } =
        {};

      // 멘토에게
      if (mentorProfile?.phone) {
        if (!checkDuplicateSend(mentorProfile.phone, type)) {
          results.mentor = await sendAlimtalk({
            templateCode: "session_reminder_24h",
            recipientPhone: mentorProfile.phone,
            variables: {
              recipientName: mentor.name,
              counterpartName: menteeProfile?.name || "멘티",
              productName,
              scheduledDate,
              scheduledTime,
              duration,
              ...(booking.meeting_link && { meetingLink: booking.meeting_link }),
            },
          });
        }
      }

      // 멘티에게
      if (menteeProfile?.phone) {
        if (!checkDuplicateSend(menteeProfile.phone, type)) {
          results.mentee = await sendAlimtalk({
            templateCode: "session_reminder_24h",
            recipientPhone: menteeProfile.phone,
            variables: {
              recipientName: menteeProfile.name || "멘티",
              counterpartName: mentor.name,
              productName,
              scheduledDate,
              scheduledTime,
              duration,
              ...(booking.meeting_link && { meetingLink: booking.meeting_link }),
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        results,
      });
    }

    case "session_reminder_1h": {
      // 멘토, 멘티 모두에게 발송
      const results: { mentor?: SendAlimtalkResult; mentee?: SendAlimtalkResult } =
        {};

      // 멘토에게
      if (mentorProfile?.phone) {
        if (!checkDuplicateSend(mentorProfile.phone, type)) {
          results.mentor = await sendAlimtalk({
            templateCode: "session_reminder_1h",
            recipientPhone: mentorProfile.phone,
            variables: {
              recipientName: mentor.name,
              counterpartName: menteeProfile?.name || "멘티",
              scheduledTime,
              ...(booking.meeting_link && { meetingLink: booking.meeting_link }),
            },
          });
        }
      }

      // 멘티에게
      if (menteeProfile?.phone) {
        if (!checkDuplicateSend(menteeProfile.phone, type)) {
          results.mentee = await sendAlimtalk({
            templateCode: "session_reminder_1h",
            recipientPhone: menteeProfile.phone,
            variables: {
              recipientName: menteeProfile.name || "멘티",
              counterpartName: mentor.name,
              scheduledTime,
              ...(booking.meeting_link && { meetingLink: booking.meeting_link }),
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        results,
      });
    }

    case "review_request": {
      // 멘티에게 리뷰 요청
      if (!menteeProfile?.phone) {
        return NextResponse.json({
          success: true,
          message: "멘티 연락처 없음, 발송 생략",
        });
      }

      // 중복 발송 체크
      if (checkDuplicateSend(menteeProfile.phone, type)) {
        return NextResponse.json({
          success: true,
          message: "중복 발송 방지 (1분 내 동일 알림)",
        });
      }

      result = await sendAlimtalk({
        templateCode: "review_request",
        recipientPhone: menteeProfile.phone,
        variables: {
          menteeName: menteeProfile.name || "멘티",
          mentorName: mentor.name,
          mentorCompany: mentor.company || "",
          productName,
          completedDate: formatDate(new Date().toISOString()),
          bookingId,
        },
      });
      break;
    }

    default:
      return NextResponse.json(
        { success: false, error: "지원하지 않는 알림 타입입니다." },
        { status: 400 }
      );
  }

  return NextResponse.json({
    success: result.success,
    messageId: result.messageId,
    error: result.error,
  });
}

/**
 * 직접 변수 전달 방식 알림 처리
 */
async function handleDirectNotification(
  type: NotificationType,
  recipientPhone: string,
  variables: Record<string, string | number>
): Promise<NextResponse> {
  // 중복 발송 체크
  if (checkDuplicateSend(recipientPhone, type)) {
    return NextResponse.json({
      success: true,
      message: "중복 발송 방지 (1분 내 동일 알림)",
    });
  }

  const result = await sendAlimtalk({
    templateCode: type as AlimtalkTemplateCode,
    recipientPhone,
    variables,
  });

  return NextResponse.json({
    success: result.success,
    messageId: result.messageId,
    error: result.error,
  });
}

// =============================================
// GET: 상태 확인
// =============================================

export async function GET(request: NextRequest) {
  // 인증 검증
  const isAuthorized = await verifyAuth(request);
  if (!isAuthorized) {
    return NextResponse.json(
      { success: false, error: "인증되지 않은 요청입니다." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    configured: isAlimtalkConfigured(),
    supportedTemplates: [
      "booking_confirmed",
      "session_reminder_24h",
      "session_reminder_1h",
      "review_request",
    ],
  });
}
