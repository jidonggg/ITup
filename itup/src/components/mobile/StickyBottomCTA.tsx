"use client";

import { useEffect, useState, useRef, ReactNode } from "react";

interface StickyBottomCTAProps {
  children: ReactNode;
  /** Show on all screens or only mobile */
  mobileOnly?: boolean;
  /** Additional classes */
  className?: string;
  /** Show/hide based on scroll direction */
  hideOnScrollDown?: boolean;
  /** Show a subtle shadow */
  showShadow?: boolean;
}

export default function StickyBottomCTA({
  children,
  mobileOnly = true,
  className = "",
  hideOnScrollDown = false,
  showShadow = true,
}: StickyBottomCTAProps) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (!hideOnScrollDown) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY.current && currentScrollY > 100;

      setIsVisible(!isScrollingDown);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hideOnScrollDown]);

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-40
        bg-card-bg/95 backdrop-blur-md
        border-t border-card-border
        transition-transform duration-300 ease-out
        ${isVisible ? "translate-y-0" : "translate-y-full"}
        ${showShadow ? "shadow-[0_-4px_20px_rgba(0,0,0,0.08)]" : ""}
        pb-[env(safe-area-inset-bottom)]
        ${mobileOnly ? "lg:hidden" : ""}
        ${className}
      `}
    >
      <div className="px-4 py-3">
        {children}
      </div>
    </div>
  );
}
