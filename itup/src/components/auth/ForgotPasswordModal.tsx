"use client";

import { useState, useEffect } from "react";
import { useModalClose, useBodyScrollLock } from "@/hooks/useModal";
import { useAnalytics } from "@/contexts/AnalyticsContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  onSwitchToLogin,
}: ForgotPasswordModalProps) {
  const { trackEvent } = useAnalytics();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useModalClose(isOpen, onClose);
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) {
      trackEvent("modal", "비밀번호찾기모달_오픈");
    }
  }, [isOpen, trackEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("올바른 이메일 형식이 아닙니다.");
      return;
    }

    setIsLoading(true);

    if (!isSupabaseConfigured()) {
      setError("현재 비밀번호 재설정 기능을 사용할 수 없습니다.");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        trackEvent("auth", "비밀번호찾기_실패");
        setError("비밀번호 재설정 이메일 전송에 실패했습니다.");
        setIsLoading(false);
        return;
      }

      trackEvent("auth", "비밀번호찾기_성공");
      setIsLoading(false);
      setIsSubmitted(true);
    } catch {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setError("");
    setIsSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card-bg border border-card-border rounded-2xl shadow-[0_25px_80px_-12px_rgba(139,92,246,0.4)] animate-[modalIn_0.3s_ease-out]">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-muted hover:text-foreground transition-colors cursor-pointer"
          aria-label="닫기"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="p-6 md:p-8">
          {isSubmitted ? (
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">이메일을 확인해주세요</h3>
              <p className="text-muted mb-6 text-sm">
                <span className="text-primary font-medium">{email}</span>으로
                <br />
                비밀번호 재설정 링크를 보냈습니다.
              </p>
              <p className="text-muted text-xs mb-6">
                이메일이 도착하지 않았다면 스팸함을 확인해주세요.
              </p>
              <button
                onClick={onSwitchToLogin}
                className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium cursor-pointer"
              >
                로그인으로 돌아가기
              </button>
            </div>
          ) : (
            /* 폼 화면 */
            <>
              <h2 className="text-2xl font-bold mb-2">비밀번호 찾기</h2>
              <p className="text-muted text-sm mb-6">
                가입한 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm">
                    {error}
                  </div>
                )}

                {/* 이메일 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    이메일
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
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
                      전송 중...
                    </span>
                  ) : (
                    "재설정 링크 보내기"
                  )}
                </button>
              </form>

              {/* 로그인 링크 */}
              <div className="mt-6 text-center text-sm text-muted">
                비밀번호가 기억나셨나요?{" "}
                <button
                  onClick={onSwitchToLogin}
                  className="text-primary hover:underline cursor-pointer"
                >
                  로그인
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
