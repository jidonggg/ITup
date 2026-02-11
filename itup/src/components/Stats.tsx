"use client";

import { useEffect, useRef, useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const values = [
  {
    icon: "🎮",
    title: "게임 업계 현직자",
    description: "실제 게임사에서 일하는 멘토",
  },
  {
    icon: "☕",
    title: "1:1 맞춤 상담",
    description: "나에게 딱 맞는 커리어 조언",
  },
  {
    icon: "📄",
    title: "포트폴리오 피드백",
    description: "현업 기준의 실전 리뷰",
  },
  {
    icon: "🔒",
    title: "안전한 결제",
    description: "토스페이먼츠 · 환불 정책 보장",
  },
];

const socialProof = [
  { label: "누적 멘토링 세션 수", value: 1240, suffix: "+" },
  { label: "등록 멘토 수", value: 85, suffix: "명" },
  { label: "평균 만족도", value: 4.9, suffix: "/5.0", isDecimal: true },
  { label: "재이용률", value: 73, suffix: "%" },
];

function useCountUp(target: number, isVisible: boolean, isDecimal?: boolean) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;

    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(isDecimal ? Math.round(current * 10) / 10 : Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [isVisible, target, isDecimal]);

  return isDecimal ? count.toFixed(1) : count.toLocaleString();
}

export default function Stats() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({
    threshold: 0.3,
  });

  return (
    <section className="py-20 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div
        ref={ref}
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-animate ${
          isVisible ? "visible" : ""
        }`}
      >
        {/* Social Proof Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
          {socialProof.map((item) => (
            <SocialProofCounter key={item.label} item={item} isVisible={isVisible} />
          ))}
        </div>

        {/* Value Props */}
        <div className="bg-white/50 backdrop-blur-xl border border-card-border/40 rounded-3xl p-8 md:p-12 shadow-lg shadow-primary/[0.03]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {values.map((item) => (
              <div key={item.title} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 group-hover:shadow-md group-hover:shadow-primary/10 transition-all duration-300">
                  <span className="text-3xl sm:text-4xl">{item.icon}</span>
                </div>
                <div className="font-bold text-foreground mb-1">
                  {item.title}
                </div>
                <div className="text-muted text-sm">{item.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialProofCounter({
  item,
  isVisible,
}: {
  item: (typeof socialProof)[number];
  isVisible: boolean;
}) {
  const displayValue = useCountUp(item.value, isVisible, item.isDecimal);

  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        {displayValue}
        <span className="text-lg md:text-xl">{item.suffix}</span>
      </div>
      <div className="text-muted text-sm mt-1">{item.label}</div>
    </div>
  );
}
