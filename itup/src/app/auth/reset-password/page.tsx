"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [redirectTimer, setRedirectTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      if (!isSupabaseConfigured()) {
        setError("현재 비밀번호 재설정 기능을 사용할 수 없습니다.");
        setIsChecking(false);
        return;
      }

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setIsValidSession(true);
      } else {
        setError("유효하지 않거나 만료된 링크입니다. 비밀번호 찾기를 다시 시도해주세요.");
      }
      setIsChecking(false);
    };

    checkSession();
  }, []);

  // Cleanup redirect timer on unmount
  useEffect(() => {
    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [redirectTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      setError("비밀번호는 영문과 숫자를 모두 포함해야 합니다.");
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError("비밀번호 변경에 실패했습니다. 다시 시도해주세요.");
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setIsLoading(false);

      // 3초 후 홈으로 이동
      const timer = setTimeout(() => {
        router.push("/");
      }, 3000);
      setRedirectTimer(timer);
    } catch {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card-bg border border-card-border rounded-2xl p-6 md:p-8">
        {isSuccess ? (
          /* 성공 화면 */
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">비밀번호가 변경되었습니다</h3>
            <p className="text-muted mb-6 text-sm">
              새 비밀번호로 로그인할 수 있습니다.
              <br />
              잠시 후 홈으로 이동합니다...
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium"
            >
              홈으로 이동
            </Link>
          </div>
        ) : !isValidSession ? (
          /* 잘못된 세션 */
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">링크가 만료되었습니다</h3>
            <p className="text-muted mb-6 text-sm">{error}</p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium"
            >
              홈으로 이동
            </Link>
          </div>
        ) : (
          /* 비밀번호 변경 폼 */
          <>
            <div className="flex items-center gap-2 mb-6">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-white text-xl">☕</span>
                </div>
                <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  커피챗
                </span>
              </Link>
            </div>

            <h2 className="text-2xl font-bold mb-2">새 비밀번호 설정</h2>
            <p className="text-muted text-sm mb-6">
              새로운 비밀번호를 입력해주세요.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm">
                  {error}
                </div>
              )}

              {/* 새 비밀번호 */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8자 이상, 영문+숫자 포함"
                  required
                  className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                  className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    변경 중...
                  </span>
                ) : (
                  "비밀번호 변경"
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
