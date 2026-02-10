"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useModalClose, useBodyScrollLock } from "@/hooks/useModal";
import { useAnalytics } from "@/contexts/AnalyticsContext";
import PasswordStrength from "@/components/PasswordStrength";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function SignupModal({ isOpen, onClose, onSwitchToLogin }: SignupModalProps) {
  const { signUp } = useAuth();
  const { trackEvent } = useAnalytics();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useModalClose(isOpen, onClose);
  useBodyScrollLock(isOpen);

  // 모달 오픈 추적
  useEffect(() => {
    if (isOpen) {
      trackEvent("modal", "회원가입모달_오픈");
    }
  }, [isOpen, trackEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 이름 유효성 검사
    if (!name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }

    if (name.trim().length < 2) {
      setError("이름은 2자 이상 입력해주세요.");
      return;
    }

    // 이메일 유효성 검사
    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("올바른 이메일 형식이 아니에요.");
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않아요.");
      return;
    }

    if (password.length < 8) {
      setError("비밀번호는 최소 8자 이상이어야 해요.");
      return;
    }

    // 비밀번호 복잡성 검사: 영문 + 숫자 필수
    if (!/(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
      setError("비밀번호는 영문과 숫자를 모두 포함해야 해요.");
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password, name);

    if (error) {
      trackEvent("auth", "회원가입_실패", { reason: error.message });
      if (error.message.includes("already registered")) {
        setError("이미 등록된 이메일입니다.");
      } else {
        setError("회원가입 중 오류가 발생했어요. 다시 시도해주세요.");
      }
      setIsLoading(false);
      return;
    }

    trackEvent("auth", "회원가입_성공");
    setIsLoading(false);
    setIsSuccess(true);
  };

  const handleClose = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setIsSuccess(false);
    onClose();
  };

  // 카카오 로그인 (사업자 등록 심사 중)
  const handleKakaoLogin = () => {
    setError("카카오 로그인은 현재 사업자 등록 심사 중이에요. 승인 후 이용 가능합니다.");
  };

  // 네이버 로그인 (준비 중 — Supabase Custom OIDC Provider 설정 필요)
  const handleNaverLogin = () => {
    setError("네이버 로그인은 준비 중이에요. 다른 방법으로 가입해주세요.");
  };

  // Google 로그인 (개발 중)
  const handleGoogleLogin = () => {
    setError("Google 로그인은 현재 개발 중이에요. 곧 이용 가능합니다.");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="회원가입">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-card-bg border border-card-border rounded-2xl shadow-[0_25px_80px_-12px_rgba(160,113,79,0.25)] animate-[modalIn_0.3s_ease-out]">
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
          {isSuccess ? (
            /* 성공 화면 */
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">회원가입 완료!</h3>
              <p className="text-muted mb-6">
                이메일 인증 후 로그인해주세요.
              </p>
              <button
                onClick={onSwitchToLogin}
                className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium cursor-pointer"
              >
                로그인하기
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-2">회원가입</h2>
              <p className="text-muted text-sm mb-6">
                커피챗에서 멘토링을 시작해보세요
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div role="alert" className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm">
                    {error}
                  </div>
                )}

                {/* 이름 */}
                <div>
                  <label htmlFor="modal-signup-name" className="block text-sm font-medium mb-1.5">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="modal-signup-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동"
                    required
                    autoComplete="name"
                    className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* 이메일 */}
                <div>
                  <label htmlFor="modal-signup-email" className="block text-sm font-medium mb-1.5">
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="modal-signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    required
                    autoComplete="email"
                    className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* 비밀번호 */}
                <div>
                  <label htmlFor="modal-signup-password" className="block text-sm font-medium mb-1.5">
                    비밀번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="modal-signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8자 이상, 영문+숫자 포함"
                    required
                    autoComplete="new-password"
                    className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
                  />
                  <PasswordStrength password={password} />
                </div>

                {/* 비밀번호 확인 */}
                <div>
                  <label htmlFor="modal-signup-confirm-password" className="block text-sm font-medium mb-1.5">
                    비밀번호 확인 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="modal-signup-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호를 다시 입력하세요"
                    required
                    autoComplete="new-password"
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
                      처리 중...
                    </span>
                  ) : (
                    "회원가입"
                  )}
                </button>
              </form>

              {/* 소셜 로그인 구분선 */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-card-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card-bg text-muted">또는</span>
                </div>
              </div>

              {/* 소셜 로그인 버튼들 */}
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

              {/* 로그인 링크 */}
              <div className="mt-6 text-center text-sm text-muted">
                이미 계정이 있으신가요?{" "}
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
