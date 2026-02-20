"use client";

import { useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { products, ProductType } from "@/lib/payment/types";
import { MentorTier, getTieredPrice, isProductAvailableForTier } from "@/lib/pricing/tiers";
import { ProductIcon } from "@/components/icons";

interface PricingProps {
  onConsultClick: () => void;
  onProductClick?: (productId: ProductType) => void;
}

const tierOptions: { id: MentorTier; label: string }[] = [
  { id: "junior", label: "주니어 (3-5년)" },
  { id: "senior", label: "시니어 (5-10년)" },
  { id: "lead", label: "리드 (10년+)" },
];

const TIER_EXPERIENCE: Record<MentorTier, string> = {
  junior: "3-5년",
  senior: "5-10년",
  lead: "10년 이상",
};

export default function Pricing({ onConsultClick, onProductClick }: PricingProps) {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation<HTMLDivElement>();
  const [selectedTier, setSelectedTier] = useState<MentorTier>("senior");

  return (
    <section id="pricing" className="py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/15 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div
          ref={titleRef}
          className={`text-center mb-14 scroll-animate ${titleVisible ? "visible" : ""}`}
        >
          <span className="inline-block px-4 py-1.5 bg-primary/8 text-primary text-xs font-semibold tracking-widest uppercase mb-5 rounded-full border border-primary/10">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 tracking-tight">
            내 커리어에 <span className="text-primary">투자하세요</span>
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto mb-3">
            구독 없이, 딱 한 번만 결제. 부담 없이 시작하세요.
          </p>
          <div className="inline-block px-4 py-2 bg-primary/10 border border-primary/20 text-primary text-sm font-medium rounded-full">
            시범운영 기간 - 결제 없이 무료 이용 가능
          </div>
        </div>

        {/* Tier Selector */}
        <div className="flex justify-center gap-1 mb-12 p-1 bg-secondary/60 backdrop-blur-sm rounded-full border border-card-border/30 w-fit mx-auto">
          {tierOptions.map((tier) => (
            <button
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={`px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium rounded-full transition-all duration-300 cursor-pointer ${
                selectedTier === tier.id
                  ? "bg-card-bg text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tier.label}
            </button>
          ))}
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 max-w-5xl mx-auto">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              onProductClick={onProductClick}
              onConsultClick={onConsultClick}
              tierExperience={TIER_EXPERIENCE[selectedTier]}
              selectedTier={selectedTier}
            />
          ))}
        </div>

        {/* FAQ Link */}
        <div className="text-center mt-14">
          <p className="text-muted text-sm">
            궁금한 게 있으면{" "}
            <a href="/faq" className="text-primary font-medium hover:underline underline-offset-4">
              자주 묻는 질문
            </a>
            을 확인해보세요.
          </p>
        </div>
      </div>
    </section>
  );
}

const POPULAR_PRODUCT: ProductType = "resume";

const PRODUCT_CTA: Record<ProductType, string> = {
  coffee: "가볍게 시작하기",
  resume: "서류 합격률 올리기",
  interview: "실전 감각 익히기",
};

interface ProductCardProps {
  product: (typeof products)[number];
  index: number;
  onProductClick?: (productId: ProductType) => void;
  onConsultClick: () => void;
  tierExperience: string;
  selectedTier: MentorTier;
}

function ProductCard({ product, index, onProductClick, onConsultClick, tierExperience, selectedTier }: ProductCardProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();
  const tieredPrice = getTieredPrice(product.id, tierExperience);
  const isPopular = product.id === POPULAR_PRODUCT;
  const isAvailable = isProductAvailableForTier(product.id, selectedTier);

  return (
    <div
      ref={ref}
      className={`scroll-animate ${isVisible ? "visible" : ""}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div
        className={`relative h-full p-6 md:p-8 rounded-2xl transition-all duration-300 ${
          !isAvailable
            ? "premium-card opacity-60"
            : isPopular
              ? "premium-card border-primary/30 shadow-xl shadow-primary/10 hover:-translate-y-1"
              : "premium-card hover:-translate-y-1"
        }`}
      >
        {/* Popular Badge */}
        {isPopular && isAvailable && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-accent rounded-full text-white text-xs font-bold shadow-md shadow-primary/20">
            인기
          </div>
        )}

        {/* Tier Lock Badge */}
        {!isAvailable && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-secondary border border-card-border rounded-full text-muted text-xs font-bold">
            시니어 이상
          </div>
        )}

        {/* Icon + Name */}
        <div className={`text-center mb-6 ${isPopular ? "mt-2" : ""}`}>
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/8 to-accent/8 flex items-center justify-center">
            <ProductIcon name={product.icon} className="w-7 h-7 text-primary" />
          </div>
          <h4 className="text-lg font-bold mb-1.5">{product.name}</h4>
          <p className="text-muted text-sm mb-5">{product.description}</p>
          <div
            key={tierExperience}
            className="flex items-end justify-center gap-1 transition-all duration-300 animate-[pricePopIn_0.3s_ease-out]"
          >
            <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {tieredPrice.toLocaleString()}
            </span>
            <span className="text-muted mb-1 font-medium text-sm">원</span>
          </div>
          <p className="text-xs text-muted mt-1.5">{product.duration}</p>
        </div>

        {/* Features */}
        <ul className="space-y-2.5 mb-8">
          {product.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-3 h-3 text-success"
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
        {isAvailable ? (
          <button
            onClick={() => onProductClick ? onProductClick(product.id) : onConsultClick()}
            className={`w-full py-3 font-semibold transition-all duration-300 cursor-pointer rounded-full text-sm ${
              isPopular
                ? "shine-effect bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5"
                : "border border-card-border/60 text-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5"
            }`}
          >
            {PRODUCT_CTA[product.id]}
          </button>
        ) : (
          <button
            disabled
            className="w-full py-3 text-center text-muted text-sm font-medium border border-card-border/40 rounded-full cursor-not-allowed"
          >
            시니어 멘토부터 이용 가능
          </button>
        )}
      </div>
    </div>
  );
}
