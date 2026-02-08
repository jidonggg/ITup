/**
 * Auto-Complete Unconfirmed Sessions
 *
 * GET /api/cron/auto-complete
 *
 * 세션 종료 후 일정 시간(AUTO_COMPLETE_HOURS) 동안
 * 양측 모두 확인하지 않은 세션을 자동으로 "completed"로 처리합니다.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { AUTO_COMPLETE_HOURS } from "@/lib/constants";

const CRON_SECRET = process.env.CRON_SECRET;

function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${CRON_SECRET}` && CRON_SECRET) {
    return true;
  }
  return false;
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }

  const now = new Date();
  const cutoffTime = new Date(now.getTime() - AUTO_COMPLETE_HOURS * 60 * 60 * 1000);

  try {
    // 1. session_confirmations가 있지만 양측 모두 미확인인 경우
    const { data: unconfirmedWithRecord, error: err1 } = await supabase
      .from("session_confirmations")
      .select("id, booking_id")
      .is("mentor_confirmed", null)
      .is("mentee_confirmed", null)
      .is("final_status", null)
      .lt("created_at", cutoffTime.toISOString())
      .limit(500);

    let autoCompletedCount = 0;

    if (unconfirmedWithRecord && unconfirmedWithRecord.length > 0) {
      for (const sc of unconfirmedWithRecord) {
        // session_confirmations 자동 완료 처리
        const { error: updateErr } = await supabase
          .from("session_confirmations")
          .update({
            final_status: "completed",
            resolved_at: now.toISOString(),
            resolved_by: "system_auto_complete",
          })
          .eq("id", sc.id);

        if (!updateErr) {
          // booking 상태도 completed로 업데이트
          const { error: bookingErr } = await supabase
            .from("bookings")
            .update({ status: "completed" })
            .eq("id", sc.booking_id)
            .in("status", ["confirmed", "paid"]);

          if (bookingErr) {
            console.error(`[auto-complete] booking 업데이트 실패 (${sc.booking_id}):`, bookingErr);
          }

          autoCompletedCount++;
        } else {
          console.error(`[auto-complete] session_confirmation 업데이트 실패 (${sc.id}):`, updateErr);
        }
      }
    }

    // 2. session_confirmations 레코드가 없지만 세션 시간이 지난 confirmed/paid 예약
    const { data: noRecordBookings, error: err2 } = await supabase
      .from("bookings")
      .select("id")
      .in("status", ["confirmed", "paid"])
      .lt("scheduled_at", cutoffTime.toISOString())
      .limit(500);

    let createdAndCompletedCount = 0;

    if (noRecordBookings && noRecordBookings.length > 0) {
      for (const booking of noRecordBookings) {
        // 이미 session_confirmations가 있는지 확인
        const { data: existing } = await supabase
          .from("session_confirmations")
          .select("id")
          .eq("booking_id", booking.id)
          .maybeSingle();

        if (!existing) {
          // session_confirmations 생성 + 자동 완료
          await supabase.from("session_confirmations").insert({
            booking_id: booking.id,
            final_status: "completed",
            resolved_at: now.toISOString(),
            resolved_by: "system_auto_complete",
          });

          await supabase
            .from("bookings")
            .update({ status: "completed" })
            .eq("id", booking.id);

          createdAndCompletedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      autoCompletedCount,
      createdAndCompletedCount,
      cutoffTime: cutoffTime.toISOString(),
      processedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("[auto-complete cron] Error:", error);
    return NextResponse.json(
      { error: "Auto-complete processing failed" },
      { status: 500 }
    );
  }
}
