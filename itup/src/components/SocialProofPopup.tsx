"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─────────────────────────────────────────────
// Sample notification data (MVP — no API needed)
// ─────────────────────────────────────────────
const SAMPLE_NOTIFICATIONS = [
  { name: "김OO", action: "커피챗을 예약", mentor: "대기업 기획자 멘토", time: "2분 전" },
  { name: "이OO", action: "서류 리뷰를 예약", mentor: "이메일 인증 현직 프로그래머", time: "5분 전" },
  { name: "박OO", action: "모의면접을 완료", mentor: "대기업 아트 디렉터", time: "8분 전" },
  { name: "최OO", action: "커피챗을 예약", mentor: "인증된 시니어 기획자", time: "3분 전" },
  { name: "정OO", action: "서류 리뷰를 예약", mentor: "이메일 인증 현직 개발자", time: "6분 전" },
] as const;

const SESSION_KEY = "socialProofDismissed";
const INITIAL_DELAY = 5000;       // 5s before first notification
const DISPLAY_DURATION = 5000;    // each notification visible for 5s
const CYCLE_INTERVAL = 8000;      // 8s between notification starts
const MAX_NOTIFICATIONS = 5;      // max per session

export default function SocialProofPopup() {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const shownCount = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Check sessionStorage on mount ────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY) === "true") {
      setIsDismissed(true);
    }
  }, []);

  // ── Show a single notification ───────────────
  const showNotification = useCallback((index: number) => {
    setCurrentIndex(index);
    // Trigger slide-in on next frame
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Hide after DISPLAY_DURATION
    timerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, DISPLAY_DURATION);
  }, []);

  // ── Notification cycle logic ─────────────────
  useEffect(() => {
    if (isDismissed) return;

    let initialTimer: ReturnType<typeof setTimeout>;
    let cycleTimer: ReturnType<typeof setInterval>;

    // Start after initial delay
    initialTimer = setTimeout(() => {
      showNotification(0);
      shownCount.current = 1;

      // Cycle through remaining notifications
      cycleTimer = setInterval(() => {
        if (shownCount.current >= MAX_NOTIFICATIONS) {
          clearInterval(cycleTimer);
          return;
        }
        const nextIndex = shownCount.current % SAMPLE_NOTIFICATIONS.length;
        showNotification(nextIndex);
        shownCount.current += 1;
      }, CYCLE_INTERVAL);
    }, INITIAL_DELAY);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(cycleTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDismissed, showNotification]);

  // ── Dismiss handler ──────────────────────────
  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SESSION_KEY, "true");
    }
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // Don't render anything if dismissed or before first notification
  if (isDismissed || currentIndex < 0) return null;

  const notification = SAMPLE_NOTIFICATIONS[currentIndex];

  return (
    <div
      className={`
        fixed bottom-4 left-4 z-50 max-w-xs w-full
        transition-all duration-300 ease-out
        ${isVisible
          ? "opacity-100 translate-x-0"
          : "opacity-0 -translate-x-full pointer-events-none"
        }
      `}
      role="status"
      aria-live="polite"
    >
      <div className="bg-card-bg border border-card-border rounded-xl shadow-lg p-4 flex items-start gap-3">
        {/* Avatar circle */}
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-snug">
            <span className="font-semibold">{notification.name}</span>
            님이{" "}
            <span className="font-medium text-primary">{notification.action}</span>
            했어요
          </p>
          <p className="text-xs text-muted mt-0.5">
            {notification.mentor} &middot; {notification.time}
          </p>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="flex-shrink-0 p-0.5 text-muted hover:text-foreground transition-colors duration-150 cursor-pointer"
          aria-label="알림 닫기"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
