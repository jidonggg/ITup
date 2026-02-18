"use client";

import { useState, useCallback, useEffect } from "react";

// ─────────────────────────────────────────────
// Kakao SDK global type
// ─────────────────────────────────────────────
declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      Share: {
        sendDefault: (params: {
          objectType: string;
          content: {
            title: string;
            description: string;
            imageUrl?: string;
            link: { mobileWebUrl: string; webUrl: string };
          };
          buttons?: Array<{
            title: string;
            link: { mobileWebUrl: string; webUrl: string };
          }>;
        }) => void;
      };
    };
  }
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

export default function ShareButtons({
  url,
  title,
  description = "",
  className = "",
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [hasKakao, setHasKakao] = useState(false);

  // Check Kakao SDK availability on client
  useEffect(() => {
    if (typeof window !== "undefined" && window.Kakao) {
      setHasKakao(true);
    }
  }, []);

  // ── Link Copy ──────────────────────────────
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  // ── KakaoTalk Share ────────────────────────
  const handleKakaoShare = useCallback(() => {
    if (!window.Kakao) return;
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description,
        link: {
          mobileWebUrl: url,
          webUrl: url,
        },
      },
      buttons: [
        {
          title: "자세히 보기",
          link: {
            mobileWebUrl: url,
            webUrl: url,
          },
        },
      ],
    });
  }, [url, title, description]);

  // ── X (Twitter) Share ──────────────────────
  const handleTwitterShare = useCallback(() => {
    const text = `${title}${description ? ` - ${description}` : ""}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
  }, [url, title, description]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Link Copy Button */}
      <div className="relative">
        <button
          type="button"
          onClick={handleCopyLink}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary text-muted hover:bg-primary hover:text-white transition-colors duration-200 cursor-pointer"
          aria-label="링크 복사"
          title="링크 복사"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
            />
          </svg>
        </button>

        {/* Copied toast */}
        {copied && (
          <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground text-background text-xs font-medium px-2.5 py-1 shadow-lg animate-fade-in">
            복사됨!
          </span>
        )}
      </div>

      {/* KakaoTalk Button — only when SDK is loaded */}
      {hasKakao && (
        <button
          type="button"
          onClick={handleKakaoShare}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary text-muted hover:bg-[#FEE500] hover:text-[#191919] transition-colors duration-200 cursor-pointer"
          aria-label="카카오톡으로 공유"
          title="카카오톡으로 공유"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67-.15.53-.96 3.4-.99 3.63 0 0-.02.17.09.24.11.06.24.01.24.01.32-.04 3.7-2.44 4.28-2.86.55.08 1.13.12 1.72.12 5.52 0 10-3.58 10-7.81C22 6.58 17.52 3 12 3z" />
          </svg>
        </button>
      )}

      {/* X (Twitter) Button */}
      <button
        type="button"
        onClick={handleTwitterShare}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary text-muted hover:bg-foreground hover:text-background transition-colors duration-200 cursor-pointer"
        aria-label="X(트위터)로 공유"
        title="X(트위터)로 공유"
      >
        <svg
          className="w-4.5 h-4.5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </button>
    </div>
  );
}
