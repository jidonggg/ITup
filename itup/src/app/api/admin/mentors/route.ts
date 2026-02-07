import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_EMAILS } from "@/lib/admin";
import { getYearsFromExperience } from "@/lib/pricing/tiers";

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

  if (!ADMIN_EMAILS.includes(user.email?.toLowerCase() || "")) {
    return { error: "Forbidden - Admin access required", status: 403 };
  }

  return { user };
}

// GET: 멘토 목록 조회
export async function GET(request: NextRequest) {
  const adminCheck = await verifyAdmin(request);
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  const supabase = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // "pending" | "approved" | "all"

  let query = supabase.from("mentors").select("*").order("created_at", { ascending: false });

  if (status === "pending") {
    query = query.eq("is_approved", false);
  } else if (status === "approved") {
    query = query.eq("is_approved", true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mentors: data });
}

// PATCH: 멘토 승인/거절
export async function PATCH(request: NextRequest) {
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

  const supabase = getServiceSupabase();

  if (action === "approve") {
    // 승인 전 경력 최소 조건 검증
    const { data: mentor } = await supabase
      .from("mentors")
      .select("experience")
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Mentor approved" });
  }

  if (action === "reject") {
    const { error } = await supabase
      .from("mentors")
      .update({ is_approved: false })
      .eq("id", mentorId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Mentor rejected" });
  }

  // 멘토 검증 승인 (verification_status 업데이트)
  if (action === "verify_approve") {
    // 멘토 정보 조회
    const { data: mentor } = await supabase
      .from("mentors")
      .select("user_id, name")
      .eq("id", mentorId)
      .single();

    const { error } = await supabase
      .from("mentors")
      .update({
        verification_status: "verified",
        is_approved: true,
        verified_at: new Date().toISOString(),
      })
      .eq("id", mentorId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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
      return NextResponse.json({ error: error.message }, { status: 500 });
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
}

// DELETE: 멘토 삭제
export async function DELETE(request: NextRequest) {
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

  const { error } = await supabase
    .from("mentors")
    .delete()
    .eq("id", mentorId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Mentor deleted" });
}
