"use client";

import { useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { products, bundles, ProductType, BundleType } from "@/lib/payment/types";
import { MENTOR_TIERS, MentorTier, getTieredPrice } from "@/lib/pricing/tiers";
import { ProductIcon } from "@/components/icons";

interface PricingProps {
  onConsultClick: () => void;
  onProductClick?: (productId: ProductType) => void;
  onBundleClick?: (bundleId: BundleType) => void;
}

const tierOptions: { id: MentorTier; label: string }[] = [
  { id: "junior", label: "주니어" },
  { id: "senior", label: "시니어 (1.3x)" },
  { id: "lead", label: "리드 (1.6x)" },
];

// 티어에 해당하는 experience 문자열
const TIER_EXPERIENCE: Record<MentorTier, string> = {
  junior: "3-5년",
  senior: "5-10년",
  lead: "10년 이상",
};

export default function Pricing({ onConsultClick, onProductClick, onBundleClick }: PricingProps) {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation<HTMLDivElement>();
  const [selectedTier, setSelectedTier] = useState<MentorTier>("junior");

  return (
    <section id="pricing" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div
          ref={titleRef}
          className={`text-center mb-16 scroll-animate ${titleVisible ? "visible" : ""}`}
        >
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium mb-4 rounded-full">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            딱 필요한 만큼만 <span className="text-primary">골라봐요</span>
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            구독 없이 건당 결제. 번들로 묶으면 더 합리적이에요.
          </p>
        </div>

        {/* Tier Selector */}
        <div className="flex justify-center gap-2 mb-10 p-1.5 bg-white/40 backdrop-blur-sm rounded-full border border-card-border/40 w-fit mx-auto">
          {tierOptions.map((tier) => (
            <button
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={`px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-300 cursor-pointer ${
                selectedTier === tier.id
                  ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/20"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tier.label}
            </button>
          ))}
        </div>

        {/* Product Cards (3) */}
        <h3 className="text-xl font-semibold text-center mb-6">상품</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto mb-16">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              onProductClick={onProductClick}
              onConsultClick={onConsultClick}
              tierExperience={TIER_EXPERIENCE[selectedTier]}
            />
          ))}
        </div>

        {/* Bundle Cards (3) */}
        <h3 className="text-xl font-semibold text-center mb-6">번들 (더 합리적!)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {bundles.map((bundle, index) => (
            <BundleCard
              key={bundle.id}
              bundle={bundle}
              index={index}
              onBundleClick={onBundleClick}
              highlighted={bundle.id === "allinone"}
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

// 가장 인기 있는 단품 상품
const POPULAR_PRODUCT: ProductType = "resume";

const PRODUCT_CTA: Record<ProductType, string> = {
  coffee: "커피챗 시작하기",
  resume: "첨삭 받아보기",
  interview: "면접 연습하기",
};

interface ProductCardProps {
  product: (typeof products)[number];
  index: number;
  onProductClick?: (productId: ProductType) => void;
  onConsultClick: () => void;
  tierExperience: string;
}

function ProductCard({ product, index, onProductClick, onConsultClick, tierExperience }: ProductCardProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();
  const tieredPrice = getTieredPrice(product.id, tierExperience);
  const isPopular = product.id === POPULAR_PRODUCT;

  return (
    <div
      ref={ref}
      className={`scroll-animate ${isVisible ? "visible" : ""}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div
        className={`relative h-full p-6 md:p-8 rounded-2xl border transition-all duration-300 ${
          isPopular
            ? "bg-gradient-to-b from-primary/8 to-white/60 backdrop-blur-sm border-primary/60 shadow-xl shadow-primary/15 hover:-translate-y-1"
            : "bg-white/50 backdrop-blur-sm border-card-border/50 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/[0.06] hover:-translate-y-1"
        }`}
      >
        {/* Popular Badge */}
        {isPopular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gradient-to-r from-primary to-accent rounded-full text-white text-xs font-bold shadow-md shadow-primary/20">
            인기
          </div>
        )}

        {/* Icon + Name */}
        <div className={`text-center mb-6 ${isPopular ? "mt-2" : ""}`}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            <ProductIcon name={product.icon} className="w-8 h-8 text-primary" />
          </div>
          <h4 className="text-xl font-bold mb-2">{product.name}</h4>
          <p className="text-muted text-sm mb-4">{product.description}</p>
          <div className="flex items-end justify-center gap-1">
            <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {tieredPrice.toLocaleString()}
            </span>
            <span className="text-muted mb-1 font-medium">원</span>
          </div>
          <p className="text-xs text-muted mt-1">{product.duration}</p>
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8">
          {product.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-3 h-3 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="text-sm text-foreground/80">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={() => onProductClick ? onProductClick(product.id) : onConsultClick()}
          className={`w-full py-3 font-semibold transition-all duration-300 cursor-pointer rounded-full ${
            isPopular
              ? "shine-effect bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5"
              : "border border-card-border/60 text-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5"
          }`}
        >
          {PRODUCT_CTA[product.id]}
        </button>
      </div>
    </div>
  );
}

interface BundleCardProps {
  bundle: (typeof bundles)[number];
  index: number;
  onBundleClick?: (bundleId: BundleType) => void;
  highlighted: boolean;
}

function BundleCard({ bundle, index, onBundleClick, highlighted }: BundleCardProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();
  const discountPercent = Math.round((1 - bundle.price / bundle.originalPrice) * 100);

  return (
    <div
      ref={ref}
      className={`scroll-animate ${isVisible ? "visible" : ""}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div
        className={`relative h-full p-6 md:p-8 rounded-2xl border transition-all duration-300 ${
          highlighted
            ? "bg-gradient-to-b from-primary/8 to-white/60 backdrop-blur-sm border-primary/60 shadow-xl shadow-primary/15 hover:-translate-y-1"
            : "bg-white/50 backdrop-blur-sm border-card-border/50 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/[0.06] hover:-translate-y-1"
        }`}
      >
        {/* Discount Badge */}
        <div className="absolute -top-3 right-4 px-3 py-1.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-full text-white text-xs font-bold shadow-md shadow-red-500/20">
          {discountPercent}% 할인
        </div>

        {/* Popular Badge */}
        {highlighted && (
          <div className="absolute -top-3 left-4 px-3 py-1.5 bg-gradient-to-r from-primary to-accent rounded-full text-white text-xs font-bold shadow-md shadow-primary/20">
            인기
          </div>
        )}

        {/* Icon + Name */}
        <div className="text-center mb-6 mt-2">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent/15 to-primary/15 flex items-center justify-center">
            <ProductIcon name={bundle.icon} className="w-8 h-8 text-primary" />
          </div>
          <h4 className="text-xl font-bold mb-2">{bundle.name}</h4>
          <p className="text-muted text-sm mb-4">{bundle.description}</p>
          <div className="flex items-end justify-center gap-1">
            <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {bundle.price.toLocaleString()}
            </span>
            <span className="text-muted mb-1">원</span>
          </div>
          <p className="text-xs text-muted mt-1 line-through">
            정가 {bundle.originalPrice.toLocaleString()}원
          </p>
        </div>

        {/* Includes */}
        <ul className="space-y-3 mb-8">
          {bundle.includes.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-accent flex-shrink-0 mt-0.5"
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
              <span className="text-sm text-foreground/80">{item}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={() => onBundleClick?.(bundle.id)}
          className={`w-full py-3.5 font-semibold transition-all duration-300 cursor-pointer rounded-full ${
            highlighted
              ? "shine-effect bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5"
              : "border border-card-border/60 text-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5"
          }`}
        >
          {highlighted ? `${discountPercent}% 할인받고 시작하기` : "번들로 할인받기"}
        </button>
      </div>
    </div>
  );
}
