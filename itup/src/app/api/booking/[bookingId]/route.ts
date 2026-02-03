import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// =============================================
// GET /api/booking/[bookingId]
// 예약 상세 조회 (멘토 + 상품 정보 포함)
// =============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  try {
    const { bookingId } = await params;

    if (!bookingId || typeof bookingId !== "string") {
      return NextResponse.json(
        { error: "유효하지 않은 bookingId예요." },
        { status: 400 },
      );
    }

    // 1. Authenticate the user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "로그인이 필요해요." },
        { status: 401 },
      );
    }

    // 2. Fetch the booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "예약을 찾을 수 없어요." },
        { status: 404 },
      );
    }

    // 3. Verify the user is either the mentee or the mentor
    let isMentee = false;
    let isMentor = false;

    if (booking.mentee_id === user.id) {
      isMentee = true;
    }

    // Check if the current user is the mentor
    const { data: mentorRecord } = await supabase
      .from("mentors")
      .select("user_id")
      .eq("id", booking.mentor_id)
      .single();

    if (mentorRecord && mentorRecord.user_id === user.id) {
      isMentor = true;
    }

    if (!isMentee && !isMentor) {
      return NextResponse.json(
        { error: "이 예약을 조회할 권한이 없어요." },
        { status: 403 },
      );
    }

    // 4. Fetch mentor info
    const { data: mentor } = await supabase
      .from("mentors")
      .select(
        "id, name, company, role, position, profile_image_url, is_verified, rating, sessions, reviews",
      )
      .eq("id", booking.mentor_id)
      .single();

    // 5. Fetch product info (if product_id exists)
    let product = null;
    if (booking.product_id) {
      const { data: productData } = await supabase
        .from("products")
        .select("id, type, title, description, duration_minutes, price")
        .eq("id", booking.product_id)
        .single();

      product = productData;
    }

    // 6. Return the booking with related data
    return NextResponse.json({
      booking,
      mentor: mentor || null,
      product: product || null,
    });
  } catch {
    return NextResponse.json(
      { error: "서버 오류가 발생했어요." },
      { status: 500 },
    );
  }
}
