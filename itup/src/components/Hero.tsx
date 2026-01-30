"use client";

import { useEffect, useRef, useState } from "react";
import { useAnalytics } from "@/contexts/AnalyticsContext";

interface HeroProps {
  onConsultClick: () => void;
}

const headlines = [
  { line1: "궁금한 거 있으면", line2: "커피챗하세요" },
  { line1: "현직자한테 물어보고 싶을 땐", line2: "커피챗하세요" },
  { line1: "편하게 물어보세요", line2: "커피챗하세요" },
];

export default function Hero({ onConsultClick }: HeroProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const rafRef = useRef<number | null>(null);
  const { trackClick } = useAnalytics();

  const handleConsultClick = () => {
    trackClick("히어로_상담신청_버튼");
    onConsultClick();
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
          backgroundImage: `linear-gradient(rgba(160, 113, 79, 0.15) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(160, 113, 79, 0.15) 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Content Section */}
        <div>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 mb-8 animate-fade-in-up rounded-full">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm text-primary-light">
              현직자 멘토와 편하게 나누는 커피챗
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
          <p className="text-lg sm:text-xl text-muted mb-10 animate-fade-in-up [animation-delay:200ms] max-w-2xl mx-auto">
            현직 게임 개발자, 기획자, 아티스트와
            <br className="hidden sm:block" />
            편하게 물어보세요.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up [animation-delay:300ms] justify-center items-center">
            <button
              onClick={handleConsultClick}
              className="group relative px-8 py-4 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold text-lg overflow-hidden transform hover:-translate-y-1 transition-all duration-300 animate-pulse-glow cursor-pointer rounded-full"
            >
              <span className="relative z-10">커피챗 시작하기</span>
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap gap-8 text-muted animate-fade-in-up [animation-delay:400ms] justify-center items-center">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm">현직자 멘토</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm">안전한 결제</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm">1:1 맞춤 상담</span>
            </div>
          </div>
        </div>

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
