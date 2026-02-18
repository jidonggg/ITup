import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * 관리자 전용: 경력 인증 서류 열람 (Signed URL 발급)
 *
 * POST /api/verification/document-url
 * Body: { storagePath: "verification-documents/userId/timestamp.ext" }
 */

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.substring(7);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) return null;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 사용자 확인
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  // 관리자 권한 확인
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;

  return { user, supabase };
}

export async function POST(request: NextRequest) {
  try {
    const result = await verifyAdmin(request);
    if (!result) {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    const { supabase } = result;
    const { storagePath } = await request.json();

    if (!storagePath || typeof storagePath !== "string") {
      return NextResponse.json(
        { error: "올바른 파일 경로가 필요합니다." },
        { status: 400 }
      );
    }

    // storagePath 형식: "verification-documents/userId/timestamp.ext"
    const parts = storagePath.split("/");
    if (parts.length < 3 || parts[0] !== "verification-documents") {
      return NextResponse.json(
        { error: "유효하지 않은 파일 경로입니다." },
        { status: 400 }
      );
    }

    const bucketName = parts[0];
    const filePath = parts.slice(1).join("/");

    // Signed URL 생성 (1시간 유효)
    const { data, error: signedError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 60 * 60);

    if (signedError || !data?.signedUrl) {
      console.error("[document-url] Signed URL 생성 실패:", signedError?.message);
      return NextResponse.json(
        { error: "서류를 열 수 없습니다. 파일이 존재하지 않을 수 있습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
    });
  } catch (error) {
    console.error("[document-url] 처리 오류:", error);
    return NextResponse.json(
      { error: "서류 열기 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
