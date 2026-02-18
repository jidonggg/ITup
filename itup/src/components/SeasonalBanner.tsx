"use client";

import { useState, useEffect } from "react";
import { getActiveSeasonalCode, type DiscountCode } from "@/lib/discount/codes";

function formatDate(date: Date): string {
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export default function SeasonalBanner() {
  const [activeCode, setActiveCode] = useState<DiscountCode | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const code = getActiveSeasonalCode();
    if (!code) return;

    const storageKey = `seasonalBannerDismissed-${code.code}`;
    if (sessionStorage.getItem(storageKey)) return;

    setActiveCode(code);
  }, []);

  if (!activeCode || dismissed) return null;

  const handleDismiss = () => {
    const storageKey = `seasonalBannerDismissed-${activeCode.code}`;
    sessionStorage.setItem(storageKey, "true");
    setDismissed(true);
  };

  return (
    <div className="w-full bg-gradient-to-r from-primary/10 to-accent/10 border-b border-primary/20 py-2.5 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center relative">
        <p className="text-primary font-medium text-sm text-center">
          {activeCode.displayName}! 코드{" "}
          <span className="font-bold">{activeCode.code}</span>로{" "}
          {activeCode.percentage}% 할인 ({formatDate(activeCode.validUntil!)}
          까지)
        </p>
        <button
          onClick={handleDismiss}
          className="absolute right-0 text-primary/60 hover:text-primary transition-colors cursor-pointer"
          aria-label="배너 닫기"
        >
          <svg
            className="w-4 h-4"
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
      </div>
    </div>
  );
}
