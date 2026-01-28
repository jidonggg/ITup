"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useLayout } from "@/contexts/LayoutContext";
import { useState } from "react";

interface PricingProps {
  onConsultClick: () => void;
  onPaymentClick?: (planId: string) => void;
}

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: "99,000",
    period: "월",
    description: "게임 업계 입문자를 위한 기본 플랜",
    features: [
      "월 2회 1:1 멘토링 (회당 50분)",
      "커리어 로드맵 설계",
      "이력서 첨삭 1회",
      "이메일 질문 무제한",
      "커뮤니티 접근 권한",
    ],
    highlighted: false,
    cta: "시작하기",
  },
  {
    id: "pro",
    name: "Pro",
    price: "199,000",
    period: "월",
    description: "집중적인 취업 준비를 위한 프로 플랜",
    features: [
      "월 4회 1:1 멘토링 (회당 60분)",
      "맞춤형 커리어 컨설팅",
      "포트폴리오 심층 리뷰",
      "모의 면접 2회",
      "24시간 내 질문 답변",
      "멘토 직접 선택 가능",
    ],
    highlighted: true,
    cta: "가장 인기 있는 플랜",
  },
  {
    id: "premium",
    name: "Premium",
    price: "399,000",
    period: "월",
    description: "확실한 취업 성공을 위한 프리미엄 플랜",
    features: [
      "무제한 1:1 멘토링",
      "전담 멘토 배정",
      "포트폴리오 완성 프로젝트",
      "모의 면접 무제한",
      "취업 성공시 환급 혜택",
      "채용 담당자 연결 지원",
    ],
    highlighted: false,
    cta: "프리미엄 시작",
  },
];

export default function Pricing({ onConsultClick, onPaymentClick }: PricingProps) {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation<HTMLDivElement>();
  const { currentLayout } = useLayout();
  const [hoveredPlan, setHoveredPlan] = useState<number | null>(1);

  const cardRadius = currentLayout.cardStyle === "rounded" ? "rounded-2xl" :
                     currentLayout.cardStyle === "sharp" ? "rounded-lg" : "rounded-3xl";

  const sectionSpacing = currentLayout.spacing === "compact" ? "py-16" :
                         currentLayout.spacing === "spacious" ? "py-32" : "py-24";

  const cardEffect = currentLayout.cardEffect === "glass" ? "card-glass" :
                     currentLayout.cardEffect === "glow" ? "card-glow" :
                     currentLayout.cardEffect === "float" ? "card-float" : "";

  return (
    <section id="pricing" className={`${sectionSpacing} relative`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div
          ref={titleRef}
          className={`text-center mb-16 scroll-animate ${titleVisible ? "visible" : ""}`}
        >
          <span className={`inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium mb-4 ${
            currentLayout.cardStyle === "sharp" ? "rounded" : "rounded-full"
          }`}>
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            나에게 맞는 <span className="text-primary">플랜</span> 선택
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            목표와 상황에 맞는 플랜을 선택하세요. 언제든 업그레이드 가능합니다.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              index={index}
              isHovered={hoveredPlan === index}
              onHover={() => setHoveredPlan(index)}
              onConsultClick={onConsultClick}
              onPaymentClick={onPaymentClick}
              cardRadius={cardRadius}
              cardEffect={cardEffect}
            />
          ))}
        </div>

        {/* FAQ Link */}
        <div className="text-center mt-12">
          <p className="text-muted">
            궁금한 점이 있으신가요?{" "}
            <a href="#" className="text-primary hover:underline">
              자주 묻는 질문
            </a>
            을 확인해보세요.
          </p>
        </div>
      </div>
    </section>
  );
}

interface PricingCardProps {
  plan: {
    id: string;
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    highlighted: boolean;
    cta: string;
  };
  index: number;
  isHovered: boolean;
  onHover: () => void;
  onConsultClick: () => void;
  onPaymentClick?: (planId: string) => void;
  cardRadius: string;
  cardEffect: string;
}

function PricingCard({ plan, index, isHovered, onHover, onConsultClick, onPaymentClick, cardRadius, cardEffect }: PricingCardProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`scroll-animate ${isVisible ? "visible" : ""}`}
      style={{ transitionDelay: `${index * 100}ms` }}
      onMouseEnter={onHover}
    >
      <div
        className={`relative h-full p-6 md:p-8 ${cardRadius} ${cardEffect} border transition-all duration-300 ${
          plan.highlighted
            ? "bg-gradient-to-b from-primary/10 to-card-bg border-primary shadow-lg shadow-primary/20"
            : "bg-card-bg border-card-border hover:border-primary/50"
        } ${isHovered && !plan.highlighted ? "transform -translate-y-2" : ""}`}
      >
        {/* Popular Badge */}
        {plan.highlighted && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-accent rounded-full text-white text-sm font-medium">
            인기
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
          <p className="text-muted text-sm mb-4">{plan.description}</p>
          <div className="flex items-end justify-center gap-1">
            <span className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {plan.price}
            </span>
            <span className="text-muted mb-2">원/{plan.period}</span>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-4 mb-8">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm text-foreground/80">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <button
          onClick={() => onPaymentClick ? onPaymentClick(plan.id) : onConsultClick()}
          className={`w-full py-3 font-medium transition-all duration-300 cursor-pointer ${
            cardRadius === "rounded-lg" ? "rounded-lg" : "rounded-full"
          } ${
            plan.highlighted
              ? "bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-lg hover:shadow-primary/30"
              : "border border-card-border text-foreground hover:border-primary hover:text-primary"
          }`}
        >
          {plan.cta}
        </button>
      </div>
    </div>
  );
}
