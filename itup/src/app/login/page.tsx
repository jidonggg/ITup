"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { LogoIcon } from "@/components/icons";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // URL에서 에러 메시지 처리 (OAuth 콜백 등에서 전달)
  useEffect(() => {
    const errorFromUrl = searchParams.get("error");
    if (errorFromUrl) {
      setError(decodeURIComponent(errorFromUrl));
      // URL에서 에러 파라미터만 제거 (redirect 등 다른 파라미터는 보존)
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      const remaining = newUrl.searchParams.toString();
      window.history.replaceState({}, "", newUrl.pathname + (remaining ? `?${remaining}` : ""));
    }
  }, [searchParams]);

  // Redirect destination from query param (e.g. /login?redirect=/mypage)
  // Only allow relative paths to prevent open redirect attacks
  function isValidRedirect(url: string): boolean {
    if (!url.startsWith('/')) return false;
    if (url.startsWith('//')) return false;
    try {
      const parsed = new URL(url, 'http://localhost');
      return parsed.host === 'localhost';
    } catch { return false; }
  }
  const rawRedirect = searchParams.get("redirect") || "/";
  const redirectTo = isValidRedirect(rawRedirect) ? rawRedirect : "/";

  useEffect(() => {
    if (!authLoading && user) {
      router.push(redirectTo);
    }
  }, [authLoading, user, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    if (!isSupabaseConfigured()) {
      setError("서비스 연결에 문제가 있어요.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        const msg = signInError.message;
        if (msg.includes("Invalid login")) {
          setError("이메일 또는 비밀번호가 올바르지 않아요.");
        } else if (msg.includes("Email not confirmed")) {
          setError("이메일 인증이 완료되지 않았어요. 메일함을 확인해주세요.");
        } else if (msg.includes("rate limit") || msg.includes("too many")) {
          setError("잠시 후 다시 시도해주세요.");
        } else {
          setError("로그인에 실패했어요. 다시 시도해주세요.");
        }
        return;
      }

      router.push(redirectTo);
    } catch {
      setError("로그인 중 오류가 발생했어요.");
    } finally {
      setIsLoading(false);
    }
  };

  // Google 로그인 (개발 중) - unused handler removed

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <LogoIcon className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold">커피챗</span>
        </Link>

        {/* Login Form */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-center mb-2">로그인</h1>
          <p className="text-muted text-center mb-6">
            커피챗 계정으로 로그인하세요
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="block text-sm font-medium mb-1.5">이메일</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                autoComplete="email"
                className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium mb-1.5">비밀번호</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex justify-end">
              <Link
                href="/auth/reset-password"
                className="text-sm text-primary hover:underline"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  로그인 중...
                </span>
              ) : (
                "로그인"
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-card-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card-bg text-muted">또는</span>
            </div>
          </div>

          <div className="space-y-3">
            <div
              className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 opacity-50 cursor-not-allowed relative"
              style={{ backgroundColor: "#FEE500", color: "#000000" }}
              aria-disabled="true"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.87 5.33 4.67 6.73l-.95 3.53c-.08.29.24.54.5.39l4.2-2.78c.52.05 1.05.08 1.58.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
              </svg>
              카카오로 계속하기
              <span className="absolute right-3 px-2 py-0.5 bg-black/20 text-xs rounded-full">준비 중</span>
            </div>

            <div
              className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 opacity-50 cursor-not-allowed relative"
              style={{ backgroundColor: "#03C75A", color: "#FFFFFF" }}
              aria-disabled="true"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
              </svg>
              네이버로 계속하기
              <span className="absolute right-3 px-2 py-0.5 bg-black/20 text-xs rounded-full">준비 중</span>
            </div>

            <div
              className="w-full py-3 border border-card-border rounded-xl font-medium flex items-center justify-center gap-2 opacity-50 cursor-not-allowed relative"
              aria-disabled="true"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google로 계속하기
              <span className="absolute right-3 px-2 py-0.5 bg-black/20 text-xs rounded-full">준비 중</span>
            </div>
          </div>

          <p className="text-center text-muted text-sm mt-6">
            아직 계정이 없으신가요?{" "}
            <Link href="/signup" className="text-primary hover:underline font-medium">
              회원가입
            </Link>
          </p>
        </div>

        <p className="text-center text-muted text-xs mt-4">
          로그인하면{" "}
          <Link href="/terms" className="underline">
            이용약관
          </Link>
          과{" "}
          <Link href="/privacy" className="underline">
            개인정보처리방침
          </Link>
          에 동의하는 것으로 간주돼요.
        </p>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
