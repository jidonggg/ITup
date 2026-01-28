"use client";

import { useState } from "react";
import { useModalClose, useBodyScrollLock } from "@/hooks/useModal";
import { useToast } from "@/contexts/ToastContext";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorId: string;
  onVerified?: () => void;
}

type Step = "input" | "verify" | "success";

export default function VerificationModal({
  isOpen,
  onClose,
  mentorId,
  onVerified,
}: VerificationModalProps) {
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>("input");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useModalClose(isOpen, onClose);
  useBodyScrollLock(isOpen);

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError("회사 이메일을 입력해주세요.");
      return;
    }

    if (!email.includes("@")) {
      setError("올바른 이메일 형식이 아닙니다.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/verification/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mentorId }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error);
        return;
      }

      showToast("인증 코드가 발송되었습니다.", "success");
      setStep("verify");
    } catch (err) {
      setError("인증 코드 발송에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim() || code.length !== 6) {
      setError("6자리 인증 코드를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/verification/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, mentorId }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error);
        return;
      }

      setStep("success");
      showToast("인증이 완료되었습니다!", "success");
      onVerified?.();
    } catch (err) {
      setError("인증 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep("input");
    setEmail("");
    setCode("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card-bg border border-card-border rounded-2xl shadow-[0_25px_80px_-12px_rgba(139,92,246,0.4)]">
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
          {step === "success" ? (
            /* 성공 화면 */
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">인증 완료!</h3>
              <p className="text-muted mb-6">
                멘토 인증이 성공적으로 완료되었습니다.<br />
                이제 멘토 목록에서 인증 배지가 표시됩니다.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium cursor-pointer"
              >
                확인
              </button>
            </div>
          ) : step === "verify" ? (
            /* 코드 입력 화면 */
            <div>
              <h2 className="text-2xl font-bold mb-2">인증 코드 입력</h2>
              <p className="text-muted text-sm mb-6">
                <span className="text-primary">{email}</span>로 발송된<br />
                6자리 인증 코드를 입력해주세요.
              </p>

              <div className="mb-4">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCode(val);
                    setError(null);
                  }}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-4 bg-secondary border border-card-border rounded-xl text-center text-2xl font-bold tracking-[0.5em] focus:outline-none focus:border-primary"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm mb-4">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep("input");
                    setCode("");
                    setError(null);
                  }}
                  className="flex-1 py-3 border border-card-border rounded-xl font-medium hover:bg-secondary transition-colors cursor-pointer"
                >
                  이전
                </button>
                <button
                  onClick={handleVerifyCode}
                  disabled={isLoading || code.length !== 6}
                  className="flex-1 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? "확인 중..." : "인증하기"}
                </button>
              </div>

              <button
                onClick={handleSendCode}
                disabled={isLoading}
                className="w-full mt-3 py-2 text-sm text-muted hover:text-primary transition-colors cursor-pointer"
              >
                인증 코드 재발송
              </button>
            </div>
          ) : (
            /* 이메일 입력 화면 */
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold">멘토 인증</h2>
                  <p className="text-sm text-muted">회사 이메일로 인증해주세요</p>
                </div>
              </div>

              {/* 안내 문구 */}
              <div className="bg-secondary/50 rounded-xl p-4 mb-6 text-sm">
                <p className="font-medium mb-2">지원되는 회사 이메일</p>
                <p className="text-muted">
                  넥슨, 넷마블, 크래프톤, NC소프트, 스마일게이트, 펄어비스,
                  카카오게임즈, 데브시스터즈, 라이엇, 블리자드, EA, 유비소프트 등
                  주요 게임 회사 도메인
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5">
                  회사 이메일
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="name@company.com"
                  className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl focus:outline-none focus:border-primary"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm mb-4">{error}</p>
              )}

              <button
                onClick={handleSendCode}
                disabled={isLoading || !email.trim()}
                className="w-full py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? "발송 중..." : "인증 코드 발송"}
              </button>

              {/* 개인정보 보호 안내 */}
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-400">
                <p className="font-medium mb-1">개인정보 보호 안내</p>
                <p>
                  인증 코드는 검증 완료 즉시 폐기됩니다.<br />
                  인증 완료 여부만 기록되며, 이메일 주소는 저장되지 않습니다.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
