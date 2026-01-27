"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useState } from "react";

const testimonials = [
  {
    name: "정다은",
    role: "신입 게임 기획자",
    company: "넷마블 입사",
    content:
      "비전공자로서 게임 업계 진입이 막막했는데, 커피챗 멘토링을 통해 체계적으로 준비할 수 있었어요. 포트폴리오 피드백이 정말 큰 도움이 됐습니다!",
    image: "D",
    rating: 5,
  },
  {
    name: "이승민",
    role: "주니어 클라이언트 개발자",
    company: "크래프톤 입사",
    content:
      "현직자 멘토님의 실무 이야기를 듣고 면접에서 어떤 부분을 어필해야 하는지 명확해졌어요. 모의 면접 덕분에 실제 면접에서 자신감 있게 답변할 수 있었습니다.",
    image: "S",
    rating: 5,
  },
  {
    name: "김하영",
    role: "게임 UI 디자이너",
    company: "스마일게이트 입사",
    content:
      "단순히 취업 팁만 주는 게 아니라, 장기적인 커리어 관점에서 조언해주셔서 좋았어요. 지금도 가끔 멘토님께 연락드려서 조언을 구하고 있습니다.",
    image: "H",
    rating: 5,
  },
  {
    name: "박지호",
    role: "게임 서버 개발자",
    company: "넥슨 입사",
    content:
      "기술 면접 준비가 가장 걱정됐는데, 멘토님이 실제 면접에서 나올 수 있는 질문들을 짚어주시고 피드백해주셔서 큰 도움이 됐습니다.",
    image: "J",
    rating: 5,
  },
];

export default function Testimonials() {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation<HTMLDivElement>();
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section id="testimonials" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div
          ref={titleRef}
          className={`text-center mb-16 scroll-animate ${titleVisible ? "visible" : ""}`}
        >
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            멘티들의 <span className="text-primary">성공 스토리</span>
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            커피챗과 함께 게임 업계에 성공적으로 진입한 분들의 이야기
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.name}
              testimonial={testimonial}
              index={index}
              isActive={activeIndex === index}
              onHover={() => setActiveIndex(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface TestimonialCardProps {
  testimonial: {
    name: string;
    role: string;
    company: string;
    content: string;
    image: string;
    rating: number;
  };
  index: number;
  isActive: boolean;
  onHover: () => void;
}

function TestimonialCard({ testimonial, index, isActive, onHover }: TestimonialCardProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`scroll-animate ${isVisible ? "visible" : ""}`}
      style={{ transitionDelay: `${index * 100}ms` }}
      onMouseEnter={onHover}
    >
      <div
        className={`relative h-full p-6 md:p-8 bg-card-bg border rounded-2xl transition-all duration-300 ${
          isActive ? "border-primary shadow-lg shadow-primary/10" : "border-card-border"
        }`}
      >
        {/* Quote Icon */}
        <div className="absolute top-6 right-6 text-primary/20">
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
        </div>

        {/* Rating */}
        <div className="flex gap-1 mb-4">
          {[...Array(testimonial.rating)].map((_, i) => (
            <svg key={i} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
        </div>

        {/* Content */}
        <p className="text-foreground/90 leading-relaxed mb-6">{testimonial.content}</p>

        {/* Author */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
            {testimonial.image}
          </div>
          <div>
            <h4 className="font-semibold">{testimonial.name}</h4>
            <p className="text-sm text-muted">
              {testimonial.role} · {testimonial.company}
            </p>
          </div>
        </div>

        {/* Decorative Line */}
        <div
          className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-accent rounded-b-2xl transition-all duration-300 ${
            isActive ? "w-full" : "w-0"
          }`}
        />
      </div>
    </div>
  );
}
