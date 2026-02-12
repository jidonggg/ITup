"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const values = [
  {
    title: "게임 업계 현직자",
    description: "실제 게임사에서 일하는 멘토",
    icon: (
      <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
      </svg>
    ),
  },
  {
    title: "1:1 맞춤 상담",
    description: "나에게 딱 맞는 커리어 조언",
    icon: (
      <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    title: "포트폴리오 피드백",
    description: "현업 기준의 실전 리뷰",
    icon: (
      <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    title: "안전한 결제",
    description: "토스페이먼츠 · 환불 정책 보장",
    icon: (
      <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
];

const highlights = [
  { label: "커피 한 잔 가격부터", value: "15,000원~" },
  { label: "게임 업계 전 직군", value: "기획·개발·아트·QA" },
  { label: "온/오프라인", value: "자유 선택" },
  { label: "멘토 경력", value: "3년 이상" },
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
        {/* Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
          {highlights.map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-xl md:text-2xl font-bold text-primary">
                {item.value}
              </div>
              <div className="text-muted text-sm mt-1">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Value Props */}
        <div className="bg-white/50 backdrop-blur-xl border border-card-border/40 rounded-3xl p-8 md:p-12 shadow-lg shadow-primary/[0.03]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {values.map((item) => (
              <div key={item.title} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 group-hover:shadow-md group-hover:shadow-primary/10 transition-all duration-300">
                  {item.icon}
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
