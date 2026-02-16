"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const categories = ["전체", "서비스 소개", "이용 방법", "요금 및 결제", "멘토 관련", "기타"];

export default function FAQClient({ faqData }: { faqData: FAQItem[] }) {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFAQ = activeCategory === "전체"
    ? faqData
    : faqData.filter(item => item.category === activeCategory);

  return (
    <>
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => {
              setActiveCategory(category);
              setOpenIndex(null);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              activeCategory === category
                ? "bg-primary text-white"
                : "bg-card-bg border border-card-border text-muted hover:text-foreground hover:border-primary"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="space-y-3">
        {filteredFAQ.map((item, index) => (
          <div
            key={index}
            className="bg-card-bg border border-card-border rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-4 flex items-center justify-between text-left cursor-pointer hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                  {item.category}
                </span>
                <span className="font-medium">{item.question}</span>
              </div>
              <svg
                className={`w-5 h-5 text-muted transition-transform ${
                  openIndex === index ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${openIndex === index ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden">
                <div className="px-6 pb-4">
                  <div className="pt-4 border-t border-card-border">
                    <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
