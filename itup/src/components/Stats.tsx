"use client";

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
