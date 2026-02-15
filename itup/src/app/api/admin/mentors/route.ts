import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/admin";
import { getYearsFromExperience } from "@/lib/pricing/tiers";
import { adminLimiter } from "@/lib/rate-limit";

const MIN_MENTOR_EXPERIENCE_YEARS = 3;

// 서버사이드 Supabase 클라이언트 (service role)
function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Service unavailable: database not configured");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// 사용자 인증 및 관리자 확인
async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Unauthorized", status: 401 };
  }

  const token = authHeader.substring(7);
  const supabase = getServiceSupabase();

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { error: "Invalid token", status: 401 };
  }

  if (!isAdmin(user.email)) {
    return { error: "Forbidden - Admin access required", status: 403 };
  }

  // Rate limiting
  const { success: allowed } = adminLimiter.check(user.id);
  if (!allowed) {
    return { error: "요청이 너무 많아요. 잠시 후 다시 시도해주세요.", status: 429 };
  }

  return { user };
}

// GET: 멘토 목록 조회
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if ("error" in adminCheck) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // status 파라미터 검증
    const validStatuses = ["pending", "approved", "all", null];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "유효하지 않은 status 값입니다." }, { status: 400 });
    }

    let query = supabase.from("mentors").select("*").order("created_at", { ascending: false });

    if (status === "pending") {
      query = query.eq("is_approved", false);
    } else if (status === "approved") {
      query = query.eq("is_approved", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[admin/mentors] DB error:", error.message);
      return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 });
    }

    return NextResponse.json({ mentors: data });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// PATCH: 멘토 승인/거절
export async function PATCH(request: NextRequest) {
  try {
  const adminCheck = await verifyAdmin(request);
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  const body = await request.json();
  const { mentorId, action } = body;

  if (!mentorId || !action) {
    return NextResponse.json(
      { error: "mentorId and action are required" },
      { status: 400 }
    );
  }

  // action 값 검증
  const validActions = ["approve", "reject", "verify_approve", "verify_reject"];
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  if (action === "approve") {
    // 승인 전 경력 최소 조건 검증
    const { data: mentor } = await supabase
      .from("mentors")
      .select("user_id, name, experience")
      .eq("id", mentorId)
      .single();

    if (!mentor) {
      return NextResponse.json(
        { error: "멘토를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const years = getYearsFromExperience(mentor.experience);
    if (years < MIN_MENTOR_EXPERIENCE_YEARS) {
      return NextResponse.json(
        { error: `경력 ${MIN_MENTOR_EXPERIENCE_YEARS}년 이상만 승인 가능합니다 (현재: ${mentor.experience})` },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("mentors")
      .update({ is_approved: true })
      .eq("id", mentorId);

    if (error) {
      console.error("[admin/mentors] DB error:", error.message);
      return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 });
    }

    // 승인 시 프로필 역할을 "mentor"로 설정
    if (mentor?.user_id) {
      await supabase
        .from("profiles")
        .update({ role: "mentor" })
        .eq("id", mentor.user_id);
    }

    // 승인 이메일 발송 (비동기)
    if (mentor?.user_id) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      if (siteUrl) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", mentor.user_id)
          .single();

        if (profile?.email) {
          fetch(`${siteUrl}/api/email/notify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-secret": process.env.INTERNAL_API_SECRET || "",
            },
            body: JSON.stringify({
              type: "mentor_approved",
              data: {
                mentorName: mentor.name,
                email: profile.email,
              },
            }),
          }).catch((e) => console.error("[멘토승인 이메일 실패]", e));
        }
      }
    }

    return NextResponse.json({ success: true, message: "Mentor approved" });
  }

  if (action === "reject") {
    // 멘토 정보 조회 (user_id 필요)
    const { data: rejectMentor } = await supabase
      .from("mentors")
      .select("user_id")
      .eq("id", mentorId)
      .single();

    const { error } = await supabase
      .from("mentors")
      .update({ is_approved: false })
      .eq("id", mentorId);

    if (error) {
      console.error("[admin/mentors] DB error:", error.message);
      return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 });
    }

    // 거절 시 프로필 역할을 "mentee"로 복원
    if (rejectMentor?.user_id) {
      await supabase
        .from("profiles")
        .update({ role: "mentee" })
        .eq("id", rejectMentor.user_id);
    }

    return NextResponse.json({ success: true, message: "Mentor rejected" });
  }

  // 멘토 검증 승인 (verification_status 업데이트)
  if (action === "verify_approve") {
    // 멘토 정보 조회
    const { data: mentor } = await supabase
      .from("mentors")
      .select("user_id, name, experience")
      .eq("id", mentorId)
      .single();

    if (!mentor) {
      return NextResponse.json(
        { error: "멘토를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 경력 최소 조건 검증
    const years = getYearsFromExperience(mentor.experience);
    if (years < MIN_MENTOR_EXPERIENCE_YEARS) {
      return NextResponse.json(
        { error: `경력 ${MIN_MENTOR_EXPERIENCE_YEARS}년 이상만 승인 가능합니다 (현재: ${mentor.experience})` },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("mentors")
      .update({
        verification_status: "verified",
        is_approved: true,
        verified_at: new Date().toISOString(),
      })
      .eq("id", mentorId);

    if (error) {
      console.error("[admin/mentors] DB error:", error.message);
      return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 });
    }

    // 승인 이메일 발송 (비동기)
    if (mentor?.user_id) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      if (siteUrl) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", mentor.user_id)
          .single();

        if (profile?.email) {
          fetch(`${siteUrl}/api/email/notify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-secret": process.env.INTERNAL_API_SECRET || "",
            },
            body: JSON.stringify({
              type: "mentor_approved",
              data: {
                mentorName: mentor.name,
                email: profile.email,
              },
            }),
          }).catch((e) => console.error("[멘토승인 이메일 실패]", e));
        }
      }
    }

    return NextResponse.json({ success: true, message: "Mentor verification approved" });
  }

  // 멘토 검증 거절
  if (action === "verify_reject") {
    const { reason } = body; // 거절 사유 (선택사항)

    // 멘토 정보 조회
    const { data: mentor } = await supabase
      .from("mentors")
      .select("user_id, name")
      .eq("id", mentorId)
      .single();

    const { error } = await supabase
      .from("mentors")
      .update({
        verification_status: "rejected",
        rejection_reason: reason || null,
      })
      .eq("id", mentorId);

    if (error) {
      console.error("[admin/mentors] DB error:", error.message);
      return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 });
    }

    // 거절 이메일 발송 (비동기)
    if (mentor?.user_id) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      if (siteUrl) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", mentor.user_id)
          .single();

        if (profile?.email) {
          fetch(`${siteUrl}/api/email/notify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-secret": process.env.INTERNAL_API_SECRET || "",
            },
            body: JSON.stringify({
              type: "mentor_rejected",
              data: {
                mentorName: mentor.name,
                email: profile.email,
                reason: reason || undefined,
              },
            }),
          }).catch((e) => console.error("[멘토거절 이메일 실패]", e));
        }
      }
    }

    return NextResponse.json({ success: true, message: "Mentor verification rejected" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// DELETE: 멘토 삭제
export async function DELETE(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if ("error" in adminCheck) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get("mentorId");

    if (!mentorId) {
      return NextResponse.json(
        { error: "mentorId is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // 삭제 전 user_id 조회 (role 복원용)
    const { data: deleteMentor } = await supabase
      .from("mentors")
      .select("user_id")
      .eq("id", mentorId)
      .single();

    const { error } = await supabase
      .from("mentors")
      .delete()
      .eq("id", mentorId);

    if (error) {
      console.error("[admin/mentors] DB error:", error.message);
      return NextResponse.json({ error: "처리 중 오류가 발생했습니다." }, { status: 500 });
    }

    // 삭제 시 프로필 역할을 "mentee"로 복원
    if (deleteMentor?.user_id) {
      await supabase
        .from("profiles")
        .update({ role: "mentee" })
        .eq("id", deleteMentor.user_id);
    }

    return NextResponse.json({ success: true, message: "Mentor deleted" });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
