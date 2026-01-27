"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useCountUp } from "@/hooks/useCountUp";
import { useEffect } from "react";

interface StatItemProps {
  value: number;
  suffix: string;
  label: string;
  delay: number;
  isVisible: boolean;
}

function StatItem({ value, suffix, label, delay, isVisible }: StatItemProps) {
  const { count, startCounting } = useCountUp({
    end: value,
    duration: 2000,
    delay,
  });

  useEffect(() => {
    if (isVisible) {
      startCounting();
    }
  }, [isVisible, startCounting]);

  return (
    <div className="text-center group">
      <div className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2 transform group-hover:scale-110 transition-transform duration-300">
        {count}
        {suffix}
      </div>
      <div className="text-muted text-sm sm:text-base">{label}</div>
    </div>
  );
}

export default function Stats() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({
    threshold: 0.3,
  });

  const stats = [
    { value: 500, suffix: "+", label: "누적 멘티" },
    { value: 50, suffix: "+", label: "현직 멘토" },
    { value: 98, suffix: "%", label: "만족도" },
    { value: 85, suffix: "%", label: "취업 성공률" },
  ];

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
        <div className="bg-card-bg/50 backdrop-blur-sm border border-card-border rounded-3xl p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {stats.map((stat, index) => (
              <StatItem
                key={stat.label}
                value={stat.value}
                suffix={stat.suffix}
                label={stat.label}
                delay={index * 100}
                isVisible={isVisible}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
