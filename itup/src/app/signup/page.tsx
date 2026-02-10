"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import PasswordStrength from "@/components/PasswordStrength";

export default function SignupPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/");
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("모든 필드를 입력해주세요.");
      return;
    }

    // 이름 길이 검사
    if (name.trim().length < 2) {
      setError("이름은 2자 이상 입력해주세요.");
      return;
    }

    // 이메일 형식 검사
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("올바른 이메일 형식이 아니에요.");
      return;
    }

    if (password.length < 8) {
      setError("비밀번호는 최소 8자 이상이어야 해요.");
      return;
    }

    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      setError("비밀번호는 영문과 숫자를 모두 포함해야 해요.");
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않아요.");
      return;
    }

    if (!isSupabaseConfigured()) {
      setError("서비스 연결에 문제가 있어요.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        const msg = signUpError.message;
        if (msg.includes("already registered")) {
          setError("이미 가입된 이메일입니다.");
        } else if (msg.includes("rate limit") || msg.includes("too many")) {
          setError("잠시 후 다시 시도해주세요.");
        } else if (msg.includes("valid email")) {
          setError("올바른 이메일 형식이 아니에요.");
        } else if (msg.includes("password")) {
          setError("비밀번호 조건을 확인해주세요.");
        } else {
          setError("회원가입에 실패했어요. 다시 시도해주세요.");
        }
        return;
      }

      setIsSuccess(true);
    } catch {
      setError("회원가입 중 오류가 발생했어요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!isSupabaseConfigured() || !email) return;

    setIsResending(true);
    setResendMessage("");

    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (resendError) {
        setResendMessage("재발송에 실패했어요. 잠시 후 다시 시도해주세요.");
      } else {
        setResendMessage("인증 메일을 다시 발송했어요!");
      }
    } catch {
      setResendMessage("재발송 중 오류가 발생했어요.");
    } finally {
      setIsResending(false);
    }
  };

  // Google 로그인 (개발 중)
  const handleGoogleLogin = () => {
    setError("Google 로그인은 현재 개발 중이에요. 곧 이용 가능합니다.");
  };

  // 카카오 로그인 (사업자 등록 심사 중)
  const handleKakaoLogin = () => {
    setError("카카오 로그인은 현재 사업자 등록 심사 중이에요. 승인 후 이용 가능합니다.");
  };

  // 네이버 로그인 (준비 중 — Supabase Custom OIDC Provider 설정 필요)
  const handleNaverLogin = () => {
    setError("네이버 로그인은 준비 중이에요. 다른 방법으로 가입해주세요.");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card-bg border border-card-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">이메일을 확인해주세요</h2>
          <p className="text-muted mb-6">
            {email}로 인증 메일을 발송했어요.<br />
            메일의 링크를 클릭하여 가입을 완료해주세요.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/login"
              className="inline-block px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium"
            >
              로그인 페이지로
            </Link>
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="text-sm text-muted hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
            >
              {isResending ? "발송 중..." : "인증 메일 재발송"}
            </button>
            {resendMessage && (
              <p className="text-sm text-muted">{resendMessage}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-white text-2xl">☕</span>
          </div>
          <span className="text-2xl font-bold">커피챗</span>
        </Link>

        {/* Signup Form */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-center mb-2">회원가입</h1>
          <p className="text-muted text-center mb-6">
            커피챗에서 멘토를 만나보세요
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="signup-name" className="block text-sm font-medium mb-1.5">이름</label>
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                autoComplete="name"
                className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium mb-1.5">이메일</label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                autoComplete="email"
                className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium mb-1.5">비밀번호</label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8자 이상, 영문+숫자 포함"
                autoComplete="new-password"
                className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
              />
              <PasswordStrength password={password} />
            </div>

            <div>
              <label htmlFor="signup-confirm-password" className="block text-sm font-medium mb-1.5">비밀번호 확인</label>
              <input
                id="signup-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                autoComplete="new-password"
                className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
              />
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
                  처리 중...
                </span>
              ) : (
                "회원가입"
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
            <button
              onClick={handleKakaoLogin}
              className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              style={{ backgroundColor: "#FEE500", color: "#000000" }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.87 5.33 4.67 6.73l-.95 3.53c-.08.29.24.54.5.39l4.2-2.78c.52.05 1.05.08 1.58.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
              </svg>
              카카오로 시작하기
            </button>

            <button
              onClick={handleNaverLogin}
              className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              style={{ backgroundColor: "#03C75A", color: "#FFFFFF" }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
              </svg>
              네이버로 시작하기
            </button>

            <button
              onClick={handleGoogleLogin}
              className="w-full py-3 border border-card-border rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-secondary transition-colors cursor-pointer"
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
            </button>
          </div>

          <p className="text-center text-muted text-sm mt-6">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              로그인
            </Link>
          </p>
        </div>

        <p className="text-center text-muted text-xs mt-4">
          가입하면{" "}
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
