import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin";

// =============================================
// PATCH /api/admin/disputes
// 관리자 분쟁 해결 API (서버사이드)
// =============================================

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  const supabase = getServiceSupabase();
  if (!supabase) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user?.email) return null;

  if (!isAdmin(user.email)) return null;

  return user;
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const body = await request.json();
    const { confirmationId, finalStatus, bookingId } = body;

    if (!confirmationId || !finalStatus) {
      return NextResponse.json({ error: "confirmationId와 finalStatus는 필수입니다." }, { status: 400 });
    }

    const validStatuses = ["completed", "mentee_noshow", "mentor_noshow", "disputed"];
    if (!validStatuses.includes(finalStatus)) {
      return NextResponse.json({ error: "유효하지 않은 상태입니다." }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "DB 연결 실패" }, { status: 503 });
    }

    // 1. session_confirmations 업데이트
    // [H11] 분쟁 유지(disputed) 시에는 resolved_at/resolved_by를 설정하지 않음
    const updateData: Record<string, unknown> = {
      final_status: finalStatus,
    };
    if (finalStatus !== "disputed") {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = admin.id;
    }
    const { error: scError } = await supabase
      .from("session_confirmations")
      .update(updateData)
      .eq("id", confirmationId);

    if (scError) {
      return NextResponse.json({ error: "분쟁 해결 처리 중 오류가 발생했습니다." }, { status: 500 });
    }

    // 2. booking 상태 업데이트 (완료/노쇼 판정 시)
    if (bookingId && (finalStatus === "completed" || finalStatus === "mentor_noshow" || finalStatus === "mentee_noshow")) {
      if (finalStatus === "mentor_noshow") {
        // [C5] 멘토 노쇼 시 환불 처리 - booking을 cancelled로 설정
        // TODO: 실제 PG 환불 트리거 연동 필요
        await supabase
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("id", bookingId);
      } else {
        await supabase
          .from("bookings")
          .update({ status: "completed" })
          .eq("id", bookingId);
      }
    }

    // 3. 노쇼 판정 시 noshow_records에 기록
    if (bookingId && (finalStatus === "mentor_noshow" || finalStatus === "mentee_noshow")) {
      const { data: booking } = await supabase
        .from("bookings")
        .select("mentor_id, mentee_id, mentors(user_id)")
        .eq("id", bookingId)
        .single();

      if (booking) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mentorData = (booking as any).mentors as { user_id: string } | null;
        const noshowUserId = finalStatus === "mentor_noshow"
          ? mentorData?.user_id
          : booking.mentee_id;

        if (noshowUserId) {
          await supabase.from("noshow_records").insert({
            user_id: noshowUserId,
            booking_id: bookingId,
            noshow_type: finalStatus,
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: "분쟁이 해결되었습니다." });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
