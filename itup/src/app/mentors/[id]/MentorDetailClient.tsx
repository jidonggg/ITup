"use client";

import { useState, useRef, ReactNode, useSyncExternalStore } from "react";

interface MentorDetailClientProps {
  sectionType: "bio" | "products" | "reviews";
  title: string;
  icon?: ReactNode;
  badge?: number;
  defaultExpanded?: boolean;
  children: ReactNode;
}

// Hook to safely check window width on client
function useIsMobile() {
  const getSnapshot = () => typeof window !== "undefined" && window.innerWidth < 768;
  const getServerSnapshot = () => false;
  const subscribe = (callback: () => void) => {
    window.addEventListener("resize", callback);
    return () => window.removeEventListener("resize", callback);
  };
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default function MentorDetailClient({
  title,
  icon,
  badge,
  defaultExpanded = false,
  children,
}: MentorDetailClientProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // On desktop, always show expanded
  if (!isMobile) {
    return (
      <section className="bg-card-bg border border-card-border rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          {icon}
          {title}
          {badge !== undefined && (
            <span className="text-sm font-normal text-muted">
              ({badge}개)
            </span>
          )}
        </h2>
        {children}
      </section>
    );
  }

  return (
    <section className="bg-card-bg border border-card-border rounded-2xl overflow-hidden mb-4">
      {/* Header - clickable on mobile */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-4 flex items-center justify-between gap-3 text-left hover:bg-secondary/30 transition-colors active:bg-secondary/50 min-h-[56px]"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <span className="font-semibold text-foreground text-sm">{title}</span>
          {badge !== undefined && (
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full shrink-0">
              {badge}
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-muted shrink-0 transition-transform duration-300 ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content - using CSS-only animation with grid */}
      <div
        ref={contentRef}
        className={`
          grid transition-[grid-template-rows] duration-300 ease-out
          ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}
        `}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
