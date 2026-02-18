"use client";

import { useState } from "react";

interface EmailContactButtonProps {
  email: string;
  label?: string;
  className?: string;
  variant?: "button" | "link";
}

export default function EmailContactButton({
  email,
  label = "이메일 문의하기",
  className,
  variant = "button",
}: EmailContactButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    // 1) 먼저 mailto 시도
    const mailtoWindow = window.open(`mailto:${email}`, "_self");

    // 2) 클립보드에 복사 (mailto가 안 열릴 경우 대비)
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // clipboard API 실패 시 fallback
      const textarea = document.createElement("textarea");
      textarea.value = email;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }

    // mailto window cleanup
    if (mailtoWindow) {
      setTimeout(() => mailtoWindow.close(), 500);
    }
  };

  if (variant === "link") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={className || "text-primary hover:underline cursor-pointer"}
      >
        {copied ? "복사됨!" : email}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        className ||
        "inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-dark transition-colors cursor-pointer"
      }
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
      {copied ? "이메일 주소 복사됨!" : label}
    </button>
  );
}
