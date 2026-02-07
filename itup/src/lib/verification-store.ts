// 인증 코드 저장소
// Supabase 설정 시 DB 사용, 미설정 시 메모리 사용 (개발용)

import { createClient } from "@supabase/supabase-js";

interface VerificationCode {
  code: string;
  expires: number;
  email: string;
}

// 메모리 저장소 (개발 환경 또는 Supabase 미설정 시)
const memoryStore = new Map<string, VerificationCode>();

// Supabase 클라이언트 (서버 사이드)
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key);
}

// 인증 코드 저장
export async function saveVerificationCode(email: string, code: string, ttlMs: number = 5 * 60 * 1000): Promise<void> {
  const expires = Date.now() + ttlMs;
  const supabase = getSupabase();

  if (supabase) {
    // Supabase에 저장 (verification_codes 테이블 필요)
    try {
      // 기존 코드 삭제
      await supabase
        .from("verification_codes")
        .delete()
        .eq("email", email);

      // 새 코드 저장
      await supabase
        .from("verification_codes")
        .insert({
          email,
          code,
          expires_at: new Date(expires).toISOString(),
        });
    } catch (error) {
      memoryStore.set(email, { code, expires, email });
    }
  } else {
    // 메모리에 저장 (개발 환경 — 서버리스 인스턴스 간 공유 안 됨)
    if (process.env.NODE_ENV === "production") {
      console.warn("[verification-store] Supabase 미설정 — 메모리 저장소 사용 중 (인스턴스 간 공유 안 됨)");
    }
    memoryStore.set(email, { code, expires, email });

    // TTL 후 자동 삭제
    setTimeout(() => {
      memoryStore.delete(email);
    }, ttlMs);
  }
}

// 인증 코드 조회
export async function getVerificationCode(email: string): Promise<VerificationCode | null> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("verification_codes")
        .select("*")
        .eq("email", email)
        .single();

      if (error || !data) return null;

      return {
        code: data.code,
        expires: new Date(data.expires_at).getTime(),
        email: data.email,
      };
    } catch (error) {
      return memoryStore.get(email) || null;
    }
  } else {
    return memoryStore.get(email) || null;
  }
}

// 인증 코드 삭제
export async function deleteVerificationCode(email: string): Promise<void> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      await supabase
        .from("verification_codes")
        .delete()
        .eq("email", email);
    } catch (error) {
      console.error("[verification-store] 인증 코드 삭제 실패:", error);
    }
  }

  // 메모리에서도 삭제 (fallback 용)
  memoryStore.delete(email);
}

// 만료된 코드 정리 (Supabase 사용 시 cron job으로 실행 권장)
export async function cleanupExpiredCodes(): Promise<void> {
  const supabase = getSupabase();

  if (supabase) {
    await supabase
      .from("verification_codes")
      .delete()
      .lt("expires_at", new Date().toISOString());
  }

  // 메모리 정리
  const now = Date.now();
  for (const [email, data] of memoryStore.entries()) {
    if (data.expires < now) {
      memoryStore.delete(email);
    }
  }
}
