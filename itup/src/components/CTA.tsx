"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface CTAProps {
  onConsultClick: () => void;
}

export default function CTA({ onConsultClick }: CTAProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section className="py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-accent/[0.02] to-primary-light/[0.04]" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[140px]" />

      <div
        ref={ref}
        className={`relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center scroll-animate ${
          isVisible ? "visible" : ""
        }`}
      >
        <div className="premium-card rounded-3xl p-8 md:p-14 lg:p-16">
          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-subtle-float shadow-lg shadow-primary/20">
            <svg
              className="w-8 h-8 text-white"
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
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            커리어 고민,
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary-light bg-clip-text text-transparent animate-gradient">
              현직자와 나눠보세요
            </span>
          </h2>

          <p className="text-muted text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            커피 한 잔 가격으로 현직자의 이야기를 들어보세요.
            <br />
            30분이면 방향이 잡힙니다.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onConsultClick}
              className="shine-effect cta-glow group relative px-10 py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-semibold text-lg overflow-hidden transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
              <span className="relative z-10 flex items-center justify-center gap-2.5">
                커피챗 시작하기
                <svg
                  className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300"
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
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
            </button>

            <button
              onClick={() => {
                const el = document.getElementById("mentors");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-8 py-4 bg-card-bg/60 backdrop-blur-sm border border-card-border/60 text-foreground rounded-full font-medium hover:border-primary/40 hover:text-primary hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              멘토 둘러보기
            </button>
          </div>

          {/* Trust Badge */}
          <div className="mt-10 inline-flex items-center gap-2 text-muted text-sm px-4 py-2 bg-card-bg/30 rounded-full border border-card-border/30">
            <svg
              className="w-4 h-4 text-success"
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
            토스페이먼츠 안전 결제 · 환불 정책 보장
          </div>
        </div>
      </div>
    </section>
  );
}
