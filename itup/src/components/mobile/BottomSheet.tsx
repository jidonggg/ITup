"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Height of the sheet: 'auto', 'half', 'full' */
  height?: "auto" | "half" | "full";
  /** Show drag handle indicator */
  showHandle?: boolean;
  /** Close on backdrop click */
  closeOnBackdrop?: boolean;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  height = "auto",
  showHandle = true,
  closeOnBackdrop = true,
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setIsAnimating(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsAnimating(false);
      onClose();
    }, 300);
  }, [onClose]);

  const handleBackdropClick = useCallback(() => {
    if (closeOnBackdrop) {
      handleClose();
    }
  }, [closeOnBackdrop, handleClose]);

  // Touch handlers for drag-to-close
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return;

    const deltaY = e.touches[0].clientY - dragStartY.current;
    currentY.current = Math.max(0, deltaY);

    sheetRef.current.style.transform = `translateY(${currentY.current}px)`;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || !sheetRef.current) return;

    isDragging.current = false;
    const threshold = sheetRef.current.offsetHeight * 0.3;

    if (currentY.current > threshold) {
      handleClose();
    } else {
      sheetRef.current.style.transform = "";
    }
    currentY.current = 0;
  }, [handleClose]);

  // Keyboard escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  const heightClass = {
    auto: "max-h-[85vh]",
    half: "h-[50vh]",
    full: "h-[90vh]",
  }[height];

  if (!mounted || (!isOpen && !isAnimating)) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          isOpen && !isClosing ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "bottom-sheet-title" : undefined}
        className={`
          absolute bottom-0 left-0 right-0
          bg-card-bg rounded-t-3xl
          ${heightClass}
          overflow-hidden
          transition-transform duration-300 ease-out
          ${isOpen && !isClosing ? "translate-y-0" : "translate-y-full"}
          pb-[env(safe-area-inset-bottom)]
        `}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
            <div className="w-10 h-1 bg-muted/30 rounded-full" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="px-5 py-3 border-b border-card-border flex items-center justify-between">
            <h2 id="bottom-sheet-title" className="text-lg font-semibold">
              {title}
            </h2>
            <button
              onClick={handleClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className={`overflow-y-auto ${height === "auto" ? "max-h-[calc(85vh-4rem)]" : "h-full"}`}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
