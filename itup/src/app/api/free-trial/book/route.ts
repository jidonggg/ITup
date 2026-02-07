import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { FREE_TRIAL_LIMIT } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Bearer token 인증
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "인증에 실패했습니다." }, { status: 401 });
    }

    const body = await request.json();
    const { mentorId, scheduledAt, menteeIntro, menteeGoal } = body;

    if (!mentorId || !scheduledAt) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 1. Verify mentee hasn't already used free trial (payment_method 기준)
    const { data: existingTrials } = await supabase
      .from("bookings")
      .select("id")
      .eq("mentee_id", user.id)
      .eq("payment_method", "free_trial")
      .not("status", "eq", "cancelled");

    if (existingTrials && existingTrials.length >= FREE_TRIAL_LIMIT) {
      return NextResponse.json(
        { error: "무료 체험은 1회만 가능합니다." },
        { status: 400 }
      );
    }

    // 2. Verify mentor exists, is approved, and is active
    const { data: mentor, error: mentorError } = await supabase
      .from("mentors")
      .select("id, name, is_approved, is_active")
      .eq("id", mentorId)
      .eq("is_approved", true)
      .eq("is_active", true)
      .single();

    if (mentorError || !mentor) {
      return NextResponse.json(
        { error: "멘토를 찾을 수 없거나 현재 활동 중이 아닙니다." },
        { status: 404 }
      );
    }

    // 3. Check for duplicate booking at the same time slot
    const scheduledDate = new Date(scheduledAt);
    const scheduledEnd = new Date(scheduledDate.getTime() + 15 * 60 * 1000); // 15분 세션

    const { data: existingBookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("mentor_id", mentorId)
      .not("status", "in", '("cancelled","rejected")')
      .gte("scheduled_at", scheduledDate.toISOString())
      .lt("scheduled_at", scheduledEnd.toISOString());

    if (existingBookings && existingBookings.length > 0) {
      return NextResponse.json(
        { error: "이미 해당 시간에 예약이 있습니다. 다른 시간을 선택해주세요." },
        { status: 409 }
      );
    }

    // 4. Create booking: amount=0, status=confirmed, payment_method=free_trial
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        mentee_id: user.id,
        mentor_id: mentorId,
        product_id: null,
        scheduled_at: scheduledAt,
        status: "confirmed",
        mentee_intro: menteeIntro || null,
        mentee_goal: menteeGoal || null,
        meeting_link: null,
        attached_files: [],
        payment_key: null,
        order_id: `FREE_${user.id}_${Date.now()}`,
        amount: 0,
        payment_method: "free_trial",
        paid_at: new Date().toISOString(),
        cancelled_at: null,
        cancelled_by: null,
        cancel_reason: null,
      })
      .select()
      .single();

    if (bookingError) {
      return NextResponse.json(
        { error: "예약 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    // 멘토에게 새 예약 이메일 알림 발송 (비동기, 에러 무시)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl && booking.id) {
      fetch(`${siteUrl}/api/email/booking-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-secret": process.env.INTERNAL_API_SECRET || "",
        },
        body: JSON.stringify({
          type: "new_booking",
          bookingId: booking.id,
        }),
      }).catch((e) => console.error("[무료체험 이메일 알림 실패]", e));
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        mentor_name: mentor.name,
        scheduled_at: scheduledAt,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
