"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useLayout } from "@/contexts/LayoutContext";
import { useState } from "react";
import { plans as planData } from "@/lib/payment/types";

interface PricingProps {
  onConsultClick: () => void;
  onPaymentClick?: (planId: string) => void;
}

const PLAN_EXTRAS: Record<string, { priceNote: string; highlighted: boolean; cta: string }> = {
  basic: { priceNote: "하루 커피 한 잔 가격으로", highlighted: false, cta: "가볍게 시작하기" },
  pro: { priceNote: "점심 한 끼 가격으로 매주 멘토를 만나요", highlighted: true, cta: "제일 인기 있어요" },
};

const plans = planData.map((p) => ({
  id: p.id,
  name: p.name,
  price: p.price.toLocaleString(),
  period: p.period,
  description: p.description,
  features: p.features,
  ...PLAN_EXTRAS[p.id],
}));

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
            어떤 <span className="text-primary">커피챗</span>이 좋을까?
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            부담 없이 시작해보세요. 언제든 바꿀 수 있어요.
          </p>
        </div>

        {/* Single Session Card */}
        <div className={`mb-10 max-w-2xl mx-auto p-6 md:p-8 ${cardRadius} ${cardEffect} border border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-semibold">단건 커피챗</span>
                <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-xs font-medium rounded-full">첫 15분 무료</span>
              </div>
              <p className="text-muted text-sm">구독 없이 한 번만 만나볼 수도 있어요</p>
            </div>
            <button
              onClick={onConsultClick}
              className={`px-6 py-3 border border-primary text-primary font-medium hover:bg-primary hover:text-white transition-all duration-300 cursor-pointer whitespace-nowrap ${
                cardRadius === "rounded-lg" ? "rounded-lg" : "rounded-full"
              }`}
            >
              무료로 시작하기
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
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
            궁금한 게 있으면{" "}
            <a href="/faq" className="text-primary hover:underline">
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
    priceNote?: string;
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
          {plan.priceNote && (
            <p className="text-xs text-muted mt-2">{plan.priceNote}</p>
          )}
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
