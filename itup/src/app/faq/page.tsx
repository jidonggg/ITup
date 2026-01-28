"use client";

import { useState } from "react";
import Link from "next/link";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // 서비스 소개
  {
    category: "서비스 소개",
    question: "커피챗은 어떤 서비스인가요?",
    answer: "커피챗은 게임 업계 현직자와 취업 준비생을 연결하는 멘토링 플랫폼입니다. 1:1 커피챗을 통해 실무 경험과 취업 노하우를 공유받을 수 있습니다.",
  },
  {
    category: "서비스 소개",
    question: "어떤 분야의 멘토가 있나요?",
    answer: "게임 기획, 프로그래밍, 아트, QA, 마케팅 등 게임 업계 전반의 현직자 멘토가 활동하고 있습니다. 넥슨, 넷마블, 크래프톤 등 주요 게임사 출신 멘토도 만나보실 수 있습니다.",
  },
  {
    category: "서비스 소개",
    question: "멘토링은 어떤 방식으로 진행되나요?",
    answer: "온라인 화상 미팅 또는 오프라인 대면 미팅 중 선택 가능합니다. 멘토와 일정을 조율하여 진행하며, 1회 약 30-60분 정도 소요됩니다.",
  },
  // 이용 방법
  {
    category: "이용 방법",
    question: "멘토링을 신청하려면 어떻게 해야 하나요?",
    answer: "1) 회원가입 후 로그인 2) 원하는 멘토 선택 3) '상담 신청' 버튼 클릭 4) 신청서 작성 후 제출하면 됩니다. 멘토가 확인 후 일정을 조율해 드립니다.",
  },
  {
    category: "이용 방법",
    question: "멘토를 어떻게 선택하나요?",
    answer: "멘토 목록에서 회사, 직무, 경력, 상담 유형 등을 확인하고 본인에게 맞는 멘토를 선택하시면 됩니다. 멘토 프로필에서 상세 경력과 소개를 확인할 수 있습니다.",
  },
  {
    category: "이용 방법",
    question: "상담 신청 후 언제 연락이 오나요?",
    answer: "멘토가 신청을 확인하면 24-48시간 내에 연락드립니다. 상담 확정 시 이메일로 안내가 발송됩니다.",
  },
  // 요금 및 결제
  {
    category: "요금 및 결제",
    question: "이용 요금은 어떻게 되나요?",
    answer: "Basic(99,000원/월), Pro(199,000원/월), Premium(399,000원/월) 세 가지 플랜이 있습니다. 플랜에 따라 멘토링 횟수, 포트폴리오 리뷰, 모의 면접 등 혜택이 달라집니다.",
  },
  {
    category: "요금 및 결제",
    question: "결제는 어떻게 하나요?",
    answer: "토스페이먼츠를 통해 신용카드, 체크카드, 계좌이체 등 다양한 방법으로 결제 가능합니다. 결제는 월 정기 구독 방식으로 진행됩니다.",
  },
  {
    category: "요금 및 결제",
    question: "환불은 가능한가요?",
    answer: "서비스 이용 전 환불 요청 시 전액 환불이 가능합니다. 서비스 이용 후에는 이용 일수에 따라 부분 환불됩니다. 자세한 내용은 이용약관을 참고해 주세요.",
  },
  {
    category: "요금 및 결제",
    question: "구독을 취소하려면 어떻게 하나요?",
    answer: "마이페이지 > 구독/결제 탭에서 '구독 취소' 버튼을 클릭하여 취소할 수 있습니다. 취소 후에도 결제 기간 종료일까지는 서비스를 이용하실 수 있습니다.",
  },
  // 멘토 관련
  {
    category: "멘토 관련",
    question: "멘토로 활동하려면 어떻게 해야 하나요?",
    answer: "게임 업계 경력 2년 이상이면 멘토로 지원 가능합니다. '멘토 등록' 페이지에서 신청서를 작성해 주시면 검토 후 연락드립니다.",
  },
  {
    category: "멘토 관련",
    question: "멘토 활동 수익은 어떻게 되나요?",
    answer: "멘토링 건당 수익을 받으실 수 있습니다. 상세한 내용은 멘토 등록 후 안내드립니다.",
  },
  // 기타
  {
    category: "기타",
    question: "문의사항이 있으면 어디로 연락하나요?",
    answer: "이메일 support@coffeechat.kr 또는 카카오톡 채널 '커피챗'으로 문의해 주시면 빠르게 답변드리겠습니다.",
  },
  {
    category: "기타",
    question: "개인정보는 안전하게 보호되나요?",
    answer: "네, 모든 개인정보는 암호화되어 안전하게 보관됩니다. 자세한 내용은 개인정보처리방침을 확인해 주세요.",
  },
];

const categories = ["전체", "서비스 소개", "이용 방법", "요금 및 결제", "멘토 관련", "기타"];

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFAQ = activeCategory === "전체"
    ? faqData
    : faqData.filter(item => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-card-border">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white text-sm">☕</span>
            </div>
            <span className="font-bold text-foreground group-hover:text-primary transition-colors">
              커피챗
            </span>
          </Link>
          <Link href="/" className="text-sm text-muted hover:text-foreground transition-colors">
            홈으로
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">자주 묻는 질문</h1>
          <p className="text-muted">
            궁금한 점이 있으시면 아래에서 찾아보세요.
            <br />
            원하는 답변이 없다면{" "}
            <a href="mailto:support@coffeechat.kr" className="text-primary hover:underline">
              문의하기
            </a>
            를 이용해 주세요.
          </p>
        </div>

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
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <div className="pt-4 border-t border-card-border">
                    <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
                      {item.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 text-center bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-2">원하는 답변을 찾지 못하셨나요?</h2>
          <p className="text-muted mb-6">
            고객센터로 문의해 주시면 친절하게 안내해 드리겠습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@coffeechat.kr"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-dark transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              이메일 문의
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-card-border text-foreground rounded-full font-medium hover:border-primary hover:text-primary transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.707 4.8 4.27 6.054-.188.702-.682 2.545-.78 2.94-.123.49.18.484.378.352.156-.103 2.5-1.683 3.512-2.37.517.077 1.056.117 1.62.117 4.97 0 9-3.186 9-7.115C21 6.185 16.97 3 12 3z"/>
              </svg>
              카카오톡 문의
            </a>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            홈으로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
}
