"use client";

import Link from "next/link";

// ─────────────────────────────────────────────
// SmartUpsell — contextual next-product recommendation after payment
// ─────────────────────────────────────────────

interface SmartUpsellProps {
  currentProduct?: string; // "coffee" | "resume" | "interview" or orderId prefix like "COFFEE-" etc.
}

interface Recommendation {
  title: string;
  description: string;
  cta: string;
  link: string;
  /** Icon key used to render the appropriate SVG */
  icon: "document" | "target" | "coffee" | "chat";
}

const s = { strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

/** Determine the next recommended product based on the current purchase */
function getRecommendation(currentProduct?: string): Recommendation {
  const normalized = (currentProduct ?? "").toLowerCase();

  // Coffee chat → recommend document review
  if (normalized.includes("coffee")) {
    return {
      title: "다음 단계: 서류를 완벽하게 준비하세요",
      description: "현직자가 이력서와 포트폴리오를 꼼꼼히 봐드려요",
      cta: "서류 리뷰 예약하기",
      link: "/mentors",
      icon: "document",
    };
  }

  // Document review → recommend mock interview
  if (
    normalized.includes("resume") ||
    normalized.includes("document")
  ) {
    return {
      title: "이제 면접을 정복할 차례!",
      description: "실전처럼 면접을 연습하고 즉석 피드백을 받아보세요",
      cta: "모의면접 예약하기",
      link: "/mentors",
      icon: "target",
    };
  }

  // Mock interview → recommend another mentor coffee chat
  if (
    normalized.includes("interview") ||
    normalized.includes("mock")
  ) {
    return {
      title: "다른 시각도 들어보세요",
      description: "다른 회사 현직자의 이야기를 들으며 시야를 넓혀보세요",
      cta: "멘토 둘러보기",
      link: "/mentors",
      icon: "chat",
    };
  }

  // Default → recommend coffee chat
  return {
    title: "현직자와 커리어 이야기를 나눠보세요",
    description: "가볍게 시작하는 30분 커피챗",
    cta: "커피챗 예약하기",
    link: "/mentors",
    icon: "coffee",
  };
}

/** Inline SVG icons — consistent with the project icon system (2px stroke, round caps) */
function RecommendationIcon({ type, className = "w-6 h-6" }: { type: Recommendation["icon"]; className?: string }) {
  switch (type) {
    case "document":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path {...s} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
          <path {...s} d="M14 2v6h6" />
          <path {...s} d="M8 13h8" />
          <path {...s} d="M8 17h6" />
        </svg>
      );
    case "target":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" {...s} />
          <circle cx="12" cy="12" r="6" {...s} />
          <circle cx="12" cy="12" r="2" {...s} />
        </svg>
      );
    case "coffee":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path {...s} d="M6 1h8a2 2 0 012 2v3a2 2 0 01-2 2h-4l-2 2V8H6a2 2 0 01-2-2V3a2 2 0 012-2z" />
          <path {...s} d="M4 11h12v6a4 4 0 01-4 4H8a4 4 0 01-4-4v-6z" />
          <path {...s} d="M16 12h1.5a2.5 2.5 0 010 5H16" />
        </svg>
      );
    case "chat":
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path {...s} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
          <path {...s} d="M8 10h.01" />
          <path {...s} d="M12 10h.01" />
          <path {...s} d="M16 10h.01" />
        </svg>
      );
  }
}

export default function SmartUpsell({ currentProduct }: SmartUpsellProps) {
  const rec = getRecommendation(currentProduct);

  return (
    <div className="relative bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-6 overflow-hidden">
      {/* "추천" badge — top-right corner */}
      <span className="absolute top-4 right-4 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
        추천
      </span>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Left side — icon + text */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Icon container */}
          <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <RecommendationIcon type={rec.icon} className="w-5 h-5 text-primary" />
          </div>

          {/* Title + description */}
          <div className="min-w-0">
            <h3 className="font-bold text-lg text-foreground leading-snug pr-16 sm:pr-0">
              {rec.title}
            </h3>
            <p className="text-muted text-sm mt-1 leading-relaxed">
              {rec.description}
            </p>
          </div>
        </div>

        {/* CTA button */}
        <Link
          href={rec.link}
          className="shrink-0 inline-flex items-center gap-2 bg-primary text-white rounded-full px-6 py-2.5 font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 hover:-translate-y-0.5"
        >
          {rec.cta}
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path {...s} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
