"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAnalytics } from "@/contexts/AnalyticsContext";

const headlines = [
  { line1: "게임 회사 현직자에게", line2: "직접 물어볼 수 있다면?" },
  { line1: "포폴 고민, 커리어 고민", line2: "현직자와 나눠보세요" },
  { line1: "30분이면 충분합니다", line2: "방향이 달라지니까요" },
];

export default function Hero() {
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const rafRef = useRef<number | null>(null);
  const { trackClick } = useAnalytics();

  const handleMentorSearchClick = () => {
    trackClick("히어로_멘토찾기_버튼");
    router.push("/mentors");
  };

  const handleLearnMoreClick = () => {
    trackClick("히어로_서비스알아보기_버튼");
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  // 헤드라인 로테이션
  useEffect(() => {
    const interval = setInterval(() => {
      setHeadlineIndex((prev) => (prev + 1) % headlines.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        setMousePosition({
          x: (e.clientX / window.innerWidth - 0.5) * 20,
          y: (e.clientY / window.innerHeight - 0.5) * 20,
        });
        rafRef.current = null;
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background - Refined subtle gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-secondary/30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,_var(--primary)_0%,_transparent_60%)] opacity-[0.06]" />
      <div
        className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-gradient-to-br from-primary/10 to-accent/8 rounded-full blur-[130px] transition-transform duration-[3s] ease-out"
        style={{
          transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
        }}
      />
      <div
        className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-accent/10 to-primary-light/8 rounded-full blur-[130px] transition-transform duration-[3s] ease-out"
        style={{
          transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)`,
        }}
      />

      {/* Mesh gradient blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-[100px] animate-[meshFloat1_20s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tl from-accent/8 to-transparent rounded-full blur-[120px] animate-[meshFloat2_25s_ease-in-out_infinite]" />
      <div className="absolute top-[30%] right-[20%] w-[40%] h-[40%] bg-gradient-to-bl from-primary-light/8 to-transparent rounded-full blur-[80px] animate-[meshFloat3_18s_ease-in-out_infinite]" />

      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(var(--primary) 0.8px, transparent 0.8px)`,
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div>
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-card-bg/50 backdrop-blur-xl border border-primary/15 mb-12 animate-fade-in-up rounded-full shadow-sm">
            <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
            <span className="text-sm font-medium text-foreground/70 tracking-wide">
              회사 이메일 인증된 게임업계 현직자 매칭
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-8 animate-fade-in-up [animation-delay:100ms] tracking-tight leading-[1.1]">
            <span
              key={headlineIndex}
              className="block text-foreground animate-fade-in-up"
            >
              {headlines[headlineIndex].line1}
            </span>
            <span
              key={`gradient-${headlineIndex}`}
              className="block bg-gradient-to-r from-primary via-accent to-primary-light bg-clip-text text-transparent animate-gradient animate-fade-in-up [animation-delay:100ms] mt-2"
            >
              {headlines[headlineIndex].line2}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted mb-14 animate-fade-in-up [animation-delay:200ms] max-w-2xl mx-auto leading-relaxed">
            이력서부터 면접까지, 혼자 고민하던 시간을 끝내세요.
            <br className="hidden sm:block" />
            게임 업계 현직자가 직접 답해드립니다.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up [animation-delay:300ms] justify-center items-center">
            <button
              onClick={handleMentorSearchClick}
              aria-label="멘토 찾기 페이지로 이동"
              className="shine-effect cta-glow group relative px-10 py-4 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold text-lg transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
              <span className="relative z-10 flex items-center gap-2.5">
                멘토 찾기
                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary-dark opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
            </button>
            <button
              onClick={handleLearnMoreClick}
              aria-label="서비스 소개 섹션으로 이동"
              className="group px-10 py-4 bg-card-bg/70 border border-card-border/80 text-foreground hover:bg-card-bg hover:border-primary/30 hover:shadow-lg backdrop-blur-sm font-semibold text-lg transform hover:-translate-y-1 transition-all duration-300 cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
              <span className="flex items-center gap-2.5">
                서비스 알아보기
                <svg className="w-5 h-5 transform group-hover:translate-y-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </span>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap gap-3 animate-fade-in-up [animation-delay:400ms] justify-center items-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-card-bg/40 backdrop-blur-sm rounded-full border border-card-border/40">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium text-foreground/60">검증된 현직자</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-card-bg/40 backdrop-blur-sm rounded-full border border-card-border/40">
              <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm font-medium text-foreground/60">토스페이먼츠 결제</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-card-bg/40 backdrop-blur-sm rounded-full border border-card-border/40">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-medium text-foreground/60">1:1 비밀 보장</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
          <div className="w-6 h-10 border-2 border-muted/40 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-muted/40 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}
