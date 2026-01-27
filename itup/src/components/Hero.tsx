"use client";

import { useEffect, useRef, useState } from "react";
import { useLayout } from "@/contexts/LayoutContext";

interface HeroProps {
  onConsultClick: () => void;
}

const headlines = [
  { line1: "혼자 고민하지 마세요", line2: "커피챗하세요" },
  { line1: "준비가 막막할 땐", line2: "커피챗 한 잔" },
  { line1: "게임 업계 선배와", line2: "커피챗하세요" },
];

export default function Hero({ onConsultClick }: HeroProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const rafRef = useRef<number | null>(null);
  const { currentLayout } = useLayout();

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
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
        style={{
          transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl"
        style={{
          transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)`,
        }}
      />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
        currentLayout.heroStyle === "center" ? "text-center" :
        currentLayout.heroStyle === "left" ? "text-left" :
        "grid md:grid-cols-2 gap-12 items-center text-left"
      }`}>
        {/* Content Section */}
        <div>
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 mb-8 animate-fade-in-up ${
            currentLayout.cardStyle === "rounded" ? "rounded-full" :
            currentLayout.cardStyle === "sharp" ? "rounded" :
            "rounded-full"
          }`}>
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm text-primary-light">
              게임 업계 현직자와 함께하는 멘토링
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up [animation-delay:100ms]">
            <span
              key={headlineIndex}
              className="block text-foreground animate-fade-in-up"
            >
              {headlines[headlineIndex].line1}
            </span>
            <span
              key={`gradient-${headlineIndex}`}
              className="block bg-gradient-to-r from-primary via-accent to-primary-light bg-clip-text text-transparent animate-gradient animate-fade-in-up [animation-delay:100ms]"
            >
              {headlines[headlineIndex].line2}
            </span>
          </h1>

          {/* Subtitle */}
          <p className={`text-lg sm:text-xl text-muted mb-10 animate-fade-in-up [animation-delay:200ms] ${
            currentLayout.heroStyle === "center" ? "max-w-2xl mx-auto" : "max-w-xl"
          }`}>
            현직 게임 개발자, 기획자, 아티스트와의 1:1 멘토링으로
            <br className="hidden sm:block" />
            당신의 게임 업계 진입을 도와드립니다.
          </p>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row gap-4 animate-fade-in-up [animation-delay:300ms] ${
            currentLayout.heroStyle === "center" ? "justify-center items-center" : "justify-start items-start"
          }`}>
            <button
              onClick={onConsultClick}
              className={`group relative px-8 py-4 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold text-lg overflow-hidden transform hover:-translate-y-1 transition-all duration-300 animate-pulse-glow cursor-pointer ${
                currentLayout.cardStyle === "rounded" ? "rounded-full" :
                currentLayout.cardStyle === "sharp" ? "rounded-lg" :
                "rounded-full"
              }`}
            >
              <span className="relative z-10">무료 상담 신청</span>
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>

          {/* Trust Indicators */}
          <div className={`mt-16 flex flex-wrap gap-8 text-muted animate-fade-in-up [animation-delay:400ms] ${
            currentLayout.heroStyle === "center" ? "justify-center items-center" : "justify-start items-start"
          }`}>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-background"
                  />
                ))}
              </div>
              <span className="text-sm">500+ 멘티 참여</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-sm">평균 4.9점 만족도</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">100% 현직자 멘토</span>
            </div>
          </div>
        </div>

        {/* Split Layout: Hero Image/Illustration */}
        {currentLayout.heroStyle === "split" && (
          <div className="hidden md:flex items-center justify-center">
            <div className="relative w-full max-w-md aspect-square">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-3xl animate-pulse" />
              <div className="absolute inset-4 bg-card-bg rounded-2xl flex items-center justify-center">
                <span className="text-8xl">☕</span>
              </div>
            </div>
          </div>
        )}

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-muted rounded-full flex justify-center">
            <div className="w-1 h-3 bg-muted rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}
