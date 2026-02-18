"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

type FeedbackType = "bug" | "feature" | "opinion";

const FEEDBACK_TYPES: { value: FeedbackType; label: string; color: string; activeColor: string }[] = [
  { value: "bug", label: "오류 제보", color: "text-red-400 border-red-400/30", activeColor: "bg-red-500/20 text-red-400 border-red-500" },
  { value: "feature", label: "기능 제안", color: "text-blue-400 border-blue-400/30", activeColor: "bg-blue-500/20 text-blue-400 border-blue-500" },
  { value: "opinion", label: "의견/기타", color: "text-muted border-card-border", activeColor: "bg-secondary text-foreground border-primary" },
];

const MAX_MESSAGE_LENGTH = 1000;
const MIN_MESSAGE_LENGTH = 5;

export default function FeedbackButton() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [type, setType] = useState<FeedbackType>("bug");
  const [pageUrl, setPageUrl] = useState("");
  const [message, setMessage] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const isAdminPage = pathname?.startsWith("/admin");

  // Animate in after mount
  useEffect(() => {
    if (isAdminPage) return;
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, [isAdminPage]);

  // Set page URL when modal opens
  useEffect(() => {
    if (isOpen) {
      setPageUrl(window.location.pathname);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Hide on admin pages (after all hooks)
  if (isAdminPage) {
    return null;
  }

  const resetForm = () => {
    setType("bug");
    setMessage("");
    setContactInfo("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (message.trim().length < MIN_MESSAGE_LENGTH) {
      showToast("메시지를 5자 이상 입력해주세요.", "warning");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message: message.trim(),
          page_url: pageUrl,
          contact_info: contactInfo.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "피드백 전송에 실패했습니다.");
      }

      showToast("피드백이 전송되었습니다. 감사합니다!", "success");
      resetForm();
      setIsOpen(false);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "피드백 전송에 실패했습니다. 잠시 후 다시 시도해주세요.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed right-4 bottom-4 z-50 w-12 h-12 rounded-full bg-primary text-white shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer ${
          isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"
        }`}
        aria-label="피드백 보내기"
        title="피드백 보내기"
      >
        {/* Chat/Megaphone Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <line x1="9" y1="9" x2="15" y2="9" />
          <line x1="12" y1="6" x2="12" y2="12" />
        </svg>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div
            ref={modalRef}
            className="bg-card-bg border border-card-border rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-card-border">
              <h2 className="text-lg font-bold text-foreground">피드백 보내기</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary transition-colors cursor-pointer"
                aria-label="닫기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Type Selector */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">유형</label>
                <div className="flex gap-2">
                  {FEEDBACK_TYPES.map((ft) => (
                    <button
                      key={ft.value}
                      type="button"
                      onClick={() => setType(ft.value)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-all cursor-pointer ${
                        type === ft.value ? ft.activeColor : ft.color + " hover:bg-secondary"
                      }`}
                    >
                      {ft.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Page URL */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">페이지</label>
                <input
                  type="text"
                  value={pageUrl}
                  onChange={(e) => setPageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-card-border rounded-lg text-sm text-foreground placeholder:text-muted"
                  placeholder="현재 페이지 URL"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  내용 <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_MESSAGE_LENGTH) {
                      setMessage(e.target.value);
                    }
                  }}
                  rows={4}
                  className="w-full px-3 py-2 bg-secondary border border-card-border rounded-lg text-sm text-foreground placeholder:text-muted resize-none"
                  placeholder="오류 내용, 개선 아이디어, 의견 등을 자유롭게 작성해주세요."
                  required
                />
                <p className="text-xs text-muted mt-1 text-right">
                  {message.length}/{MAX_MESSAGE_LENGTH}
                </p>
              </div>

              {/* Contact Info */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  연락처 <span className="text-muted text-xs">(선택)</span>
                </label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-card-border rounded-lg text-sm text-foreground placeholder:text-muted"
                  placeholder="이메일 또는 전화번호 (회신을 원하시면 입력)"
                />
              </div>

              {/* User info hint */}
              {user && (
                <p className="text-xs text-muted">
                  로그인된 계정으로 전송됩니다.
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || message.trim().length < MIN_MESSAGE_LENGTH}
                className="w-full py-3 bg-primary text-white rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
              >
                {isSubmitting ? "전송 중..." : "피드백 보내기"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
