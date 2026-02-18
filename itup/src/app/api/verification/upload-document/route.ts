import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { documentUploadLimiter } from "@/lib/rate-limit";

// 허용 파일 타입
const ALLOWED_TYPES = ["image/png", "image/jpeg", "application/pdf"];

// 최대 파일 크기 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 스토리지 버킷 이름
const BUCKET_NAME = "verification-documents";

/**
 * 사용자 인증 검증
 */
async function verifyUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.substring(7);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) return null;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

/**
 * 파일 확장자를 MIME 타입으로부터 추출
 */
function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "application/pdf": "pdf",
  };
  return map[mimeType] || "bin";
}

export async function POST(request: NextRequest) {
  try {
    // 인증 필수
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // Rate limit
    const { success: allowed, retryAfterMs } = documentUploadLimiter.check(
      user.id
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
          },
        }
      );
    }

    // FormData 파싱
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "파일이 필요합니다." },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "PDF, JPG, PNG 형식의 파일만 업로드 가능합니다." },
        { status: 400 }
      );
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 10MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    // Supabase Service Client 생성
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "서비스 설정 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 버킷 존재 여부 확인 및 생성
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(
        BUCKET_NAME,
        {
          public: false,
          fileSizeLimit: MAX_FILE_SIZE,
          allowedMimeTypes: ALLOWED_TYPES,
        }
      );

      if (createError) {
        console.error(
          "[upload-document] 버킷 생성 실패:",
          createError.message
        );
        return NextResponse.json(
          { error: "파일 저장소 설정 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }
    }

    // 파일명 생성: userId/timestamp.ext
    const ext = getExtension(file.type);
    const timestamp = Date.now();
    const filePath = `${user.id}/${timestamp}.${ext}`;

    // 파일 업로드
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error(
        "[upload-document] 업로드 실패:",
        uploadError.message
      );
      return NextResponse.json(
        { error: "파일 업로드에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    // Signed URL 생성 (관리자 열람용, 7일 유효)
    const { data: signedData, error: signedError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 7 * 24 * 60 * 60);

    if (signedError) {
      console.error(
        "[upload-document] Signed URL 생성 실패:",
        signedError.message
      );
    }

    // 저장 경로 반환 (DB에 저장할 값)
    const storagePath = `${BUCKET_NAME}/${filePath}`;

    return NextResponse.json({
      success: true,
      storagePath,
      signedUrl: signedData?.signedUrl || null,
      message: "파일이 성공적으로 업로드되었습니다.",
    });
  } catch (error) {
    console.error("[upload-document] 처리 오류:", error);
    return NextResponse.json(
      { error: "파일 업로드 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
