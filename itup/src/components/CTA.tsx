"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface CTAProps {
  onConsultClick: () => void;
}

export default function CTA({ onConsultClick }: CTAProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />

      <div
        ref={ref}
        className={`relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center scroll-animate ${
          isVisible ? "visible" : ""
        }`}
      >
        <div className="bg-card-bg/80 backdrop-blur-sm border border-card-border rounded-3xl p-8 md:p-12 lg:p-16">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-float">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>

          {/* Content */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            게임 업계 커리어,
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary-light bg-clip-text text-transparent animate-gradient">
              지금 시작하세요
            </span>
          </h2>

          <p className="text-muted text-lg mb-8 max-w-xl mx-auto">
            현직자 멘토와의 첫 상담은 무료입니다.
            <br />
            부담 없이 커리어 고민을 나눠보세요.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onConsultClick}
              className="group relative px-8 py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-semibold text-lg overflow-hidden transform hover:-translate-y-1 transition-all duration-300 animate-pulse-glow cursor-pointer"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                무료 상담 신청하기
                <svg
                  className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            <a
              href="#mentors"
              className="px-8 py-4 border border-card-border text-foreground rounded-full font-medium hover:border-primary hover:text-primary transition-all duration-300"
            >
              멘토 둘러보기
            </a>
          </div>

          {/* Trust Badge */}
          <div className="mt-8 flex items-center justify-center gap-2 text-muted text-sm">
            <svg
              className="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            신용카드 없이 시작 · 언제든 취소 가능
          </div>
        </div>
      </div>
    </section>
  );
}
