"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useLayout } from "@/contexts/LayoutContext";

const features = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: "1:1 맞춤 멘토링",
    description: "현직자 멘토와 1:1로 진행되는 맞춤형 커리어 상담과 포트폴리오 리뷰를 제공합니다.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "실무 인사이트",
    description: "게임 회사 내부에서만 알 수 있는 실무 경험과 인사이트를 직접 전달받으세요.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    title: "포트폴리오 리뷰",
    description: "실제 채용 담당자 관점에서 포트폴리오를 검토하고 개선점을 제시합니다.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: "모의 면접",
    description: "실제 면접과 동일한 환경에서 모의 면접을 진행하고 피드백을 제공합니다.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    title: "검증된 멘토",
    description: "넥슨, 넷마블, 크래프톤 등 국내외 유명 게임사 현직자들로 구성되어 있습니다.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "유연한 일정",
    description: "멘토와 멘티가 서로 맞는 시간에 자유롭게 일정을 조율할 수 있습니다.",
  },
];

export default function Features() {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation<HTMLDivElement>();
  const { currentLayout } = useLayout();

  const cardRadius = currentLayout.cardStyle === "rounded" ? "rounded-2xl" :
                     currentLayout.cardStyle === "sharp" ? "rounded-lg" : "rounded-3xl";

  const sectionSpacing = currentLayout.spacing === "compact" ? "py-16" :
                         currentLayout.spacing === "spacious" ? "py-32" : "py-24";

  const cardEffect = currentLayout.cardEffect === "glass" ? "card-glass" :
                     currentLayout.cardEffect === "glow" ? "card-glow" :
                     currentLayout.cardEffect === "float" ? "card-float" : "";

  const gridClass = currentLayout.gridStyle === "bento"
    ? "bento-grid"
    : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";

  return (
    <section id="features" className={`${sectionSpacing} relative`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div
          ref={titleRef}
          className={`text-center mb-16 scroll-animate ${titleVisible ? "visible" : ""}`}
        >
          <span className={`inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium mb-4 ${
            currentLayout.cardStyle === "sharp" ? "rounded" : "rounded-full"
          }`}>
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            왜 <span className="text-primary">커피챗</span>인가요?
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            게임 업계 취업과 성장을 위한 최적의 멘토링 플랫폼
          </p>
        </div>

        {/* Features Grid */}
        <div className={gridClass}>
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} cardRadius={cardRadius} cardEffect={cardEffect} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  feature: {
    icon: React.ReactNode;
    title: string;
    description: string;
  };
  index: number;
  cardRadius: string;
  cardEffect: string;
}

function FeatureCard({ feature, index, cardRadius, cardEffect }: FeatureCardProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({
    threshold: 0.1,
  });

  return (
    <div
      ref={ref}
      className={`scroll-animate ${isVisible ? "visible" : ""}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className={`group h-full p-6 bg-card-bg/50 border border-card-border ${cardRadius} ${cardEffect} hover:border-primary/50 hover:bg-card-bg transition-all duration-300 cursor-pointer`}>
        {/* Icon */}
        <div className={`w-14 h-14 ${cardRadius === "rounded-lg" ? "rounded-lg" : "rounded-xl"} bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary mb-4 group-hover:scale-110 group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-300`}>
          {feature.icon}
        </div>

        {/* Content */}
        <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors duration-300">
          {feature.title}
        </h3>
        <p className="text-muted text-sm leading-relaxed">
          {feature.description}
        </p>

        {/* Hover Arrow */}
        <div className="mt-4 flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-2 transition-all duration-300">
          <span className="text-sm font-medium">자세히 보기</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
