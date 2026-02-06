"use client";

import { useState, useRef, useEffect, ReactNode } from "react";

interface CollapsibleSectionProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  /** Default expanded state */
  defaultExpanded?: boolean;
  /** Badge/count to show */
  badge?: string | number;
}

export default function CollapsibleSection({
  title,
  icon,
  children,
  defaultExpanded = false,
  badge,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(
    defaultExpanded ? undefined : 0
  );

  useEffect(() => {
    if (!contentRef.current) return;

    if (isExpanded) {
      const height = contentRef.current.scrollHeight;
      setContentHeight(height);
      // After animation, set to undefined for natural height
      const timer = setTimeout(() => setContentHeight(undefined), 300);
      return () => clearTimeout(timer);
    } else {
      // First set to current height, then to 0
      setContentHeight(contentRef.current.scrollHeight);
      requestAnimationFrame(() => {
        setContentHeight(0);
      });
    }
  }, [isExpanded]);

  return (
    <div className="bg-card-bg border border-card-border rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-secondary/30 transition-colors active:bg-secondary/50 min-h-[56px]"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <span className="text-primary shrink-0">{icon}</span>
          )}
          <span className="font-semibold text-foreground truncate">{title}</span>
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

      {/* Content */}
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ height: contentHeight }}
      >
        <div className="px-5 pb-5">
          {children}
        </div>
      </div>
    </div>
  );
}
