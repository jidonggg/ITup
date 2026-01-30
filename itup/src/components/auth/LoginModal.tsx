"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useModalClose, useBodyScrollLock } from "@/hooks/useModal";
import { useAnalytics } from "@/contexts/AnalyticsContext";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
  onSwitchToForgotPassword: () => void;
}

export default function LoginModal({ isOpen, onClose, onSwitchToSignup, onSwitchToForgotPassword }: LoginModalProps) {
  const { signIn } = useAuth();
  const { trackEvent } = useAnalytics();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useModalClose(isOpen, onClose);
  useBodyScrollLock(isOpen);

  // 모달 오픈 추적
  useEffect(() => {
    if (isOpen) {
      trackEvent("modal", "로그인모달_오픈");
    }
  }, [isOpen, trackEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      trackEvent("auth", "로그인_실패");
      setError("이메일 또는 비밀번호가 올바르지 않아요.");
      setIsLoading(false);
      return;
    }

    trackEvent("auth", "로그인_성공");
    setIsLoading(false);
    onClose();
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setError("");
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
      <div className="relative w-full max-w-md bg-card-bg border border-card-border rounded-2xl shadow-[0_25px_80px_-12px_rgba(160,113,79,0.25)] animate-[modalIn_0.3s_ease-out]">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-muted hover:text-foreground transition-colors cursor-pointer"
          aria-label="닫기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-2">로그인</h2>
          <p className="text-muted text-sm mb-6">
            계정에 로그인하여 멘토링을 시작하세요
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm">
                {error}
              </div>
            )}

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-medium mb-1.5">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium">비밀번호</label>
                <button
                  type="button"
                  onClick={onSwitchToForgotPassword}
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  비밀번호를 잊으셨나요?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
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

          {/* 회원가입 링크 */}
          <div className="mt-6 text-center text-sm text-muted">
            계정이 없으신가요?{" "}
            <button
              onClick={onSwitchToSignup}
              className="text-primary hover:underline cursor-pointer"
            >
              회원가입
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
