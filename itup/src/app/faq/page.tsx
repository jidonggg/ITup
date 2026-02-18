import Link from "next/link";
import FAQClient from "./FAQClient";
import JsonLd from "@/components/JsonLd";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EmailContactButton from "@/components/EmailContactButton";
import { SITE_CONFIG } from "@/lib/site-config";

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
    answer: "게임 업계 현직자와 취업 준비생을 연결하는 1:1 멘토링 서비스예요. 커피챗을 통해 실무 경험, 취업 노하우, 커리어 고민을 직접 물어볼 수 있어요.",
  },
  {
    category: "서비스 소개",
    question: "어떤 분야의 멘토가 있나요?",
    answer: "게임 기획, 프로그래밍, 아트, QA, 마케팅 등 게임 업계 전반의 현직자 멘토가 있어요. 모든 멘토는 회사 이메일 인증을 거친 대기업·유망 게임사 재직 중인 현직자예요.",
  },
  {
    category: "서비스 소개",
    question: "멘토링은 어떤 방식으로 진행되나요?",
    answer: "온라인 화상 미팅(줌, 구글미트 등)으로 진행돼요. 멘토와 일정을 조율해서 진행하고, 1회 약 30-60분 정도예요.",
  },
  // 이용 방법
  {
    category: "이용 방법",
    question: "멘토링을 신청하려면 어떻게 해야 하나요?",
    answer: "1) 회원가입 후 로그인 2) 원하는 멘토 선택 3) '커피챗 신청' 버튼 클릭 4) 신청서 작성 후 제출하면 돼요. 멘토가 확인하고 일정을 잡아줘요.",
  },
  {
    category: "이용 방법",
    question: "멘토를 어떻게 선택하나요?",
    answer: "멘토 목록에서 회사, 직무, 경력, 상담 유형 등을 확인하고 본인에게 맞는 멘토를 선택하면 돼요. 멘토 프로필에서 상세 경력과 소개를 확인할 수 있어요.",
  },
  {
    category: "이용 방법",
    question: "커피챗 신청 후 언제 연락이 오나요?",
    answer: "멘토가 신청을 확인하면 24-48시간 내에 연락드려요. 커피챗 확정되면 이메일로 안내해 드려요.",
  },
  // 요금 및 결제
  {
    category: "요금 및 결제",
    question: "이용 요금은 어떻게 되나요?",
    answer: "커피챗(15,000원~), 서류 리뷰(40,000원~), 모의면접(80,000원~) 세 가지 상품이 있어요. 멘토 경력에 따라 주니어/시니어/리드 등급별로 가격이 달라요.",
  },
  {
    category: "요금 및 결제",
    question: "멘토마다 가격이 다른가요?",
    answer: "네, 멘토 경력에 따라 주니어(3~5년), 시니어(5~10년), 리드(10년+) 등급으로 나뉘어요. 주니어가 기본 가격이고, 시니어는 1.3배, 리드는 1.6배예요.",
  },
  {
    category: "요금 및 결제",
    question: "결제는 어떻게 하나요?",
    answer: "토스페이먼츠를 통해 신용카드, 체크카드, 계좌이체 등으로 결제할 수 있어요. 건당 결제라 부담 없이 필요한 만큼만 이용하면 돼요.",
  },
  {
    category: "요금 및 결제",
    question: "환불은 가능한가요?",
    answer: "세션 시작 48시간 전까지 전액 환불, 24시간 전까지 50% 환불이 가능해요. 24시간 이내에는 환불이 불가하니 일정을 확인해주세요. 자세한 건 이용약관을 확인해주세요.",
  },
  {
    category: "요금 및 결제",
    question: "만족 보증 제도가 있나요?",
    answer: "네! 상담 만족도가 3점 이하인 경우, 세션 완료 후 48시간 이내에 신청하시면 결제 금액을 100% 크레딧으로 돌려드려요. 계정당 최대 2회까지 이용 가능합니다.",
  },
  {
    category: "요금 및 결제",
    question: "만족 보증은 어떻게 신청하나요?",
    answer: "리뷰 작성 시 별점 3점 이하를 남기시면 자동으로 만족 보증 신청 안내가 표시됩니다. 또는 마이페이지에서 해당 예약의 '만족 보증 신청' 버튼을 통해 신청할 수 있어요.",
  },
  // 멘토 관련
  {
    category: "멘토 관련",
    question: "멘토로 활동하려면 어떻게 해야 하나요?",
    answer: "게임 업계 경력 3년 이상이면 멘토로 지원할 수 있어요. '멘토 지원' 페이지에서 신청서를 작성하면 검토 후 연락드려요.",
  },
  {
    category: "멘토 관련",
    question: "멘토 활동 수익은 어떻게 되나요?",
    answer: "커피챗 건당 수익을 받을 수 있어요. 자세한 내용은 멘토 등록 후 안내해 드려요.",
  },
  // 기타
  {
    category: "기타",
    question: "문의사항이 있으면 어디로 연락하나요?",
    answer: `${SITE_CONFIG.contactEmail.support}으로 메일 주시면 빠르게 답변드려요.`,
  },
  {
    category: "기타",
    question: "개인정보는 안전하게 보호되나요?",
    answer: "네, 모든 개인정보는 암호화해서 보관하고 있어요. 자세한 건 개인정보처리방침을 확인해주세요.",
  },
];

export default function FAQPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqData.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <JsonLd data={faqJsonLd} />
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 md:py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/5" />

          <div className="relative max-w-3xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
              자주 묻는 질문
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              궁금한 점을 빠르게 찾아보세요
            </h1>
            <p className="text-muted text-lg max-w-xl mx-auto leading-relaxed">
              서비스 이용, 요금, 멘토 활동 등 자주 묻는 질문과 답변을
              카테고리별로 정리했어요.
            </p>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="max-w-3xl mx-auto px-4 pb-16 w-full">
          <FAQClient faqData={faqData} />

          {/* Contact Section */}
          <div className="mt-16 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-8 md:p-10 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/15 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">
              원하는 답변을 못 찾으셨나요?
            </h2>
            <p className="text-muted mb-6 max-w-md mx-auto">
              추가 문의사항이 있다면 편하게 이메일로 연락주세요.
              빠르게 답변해 드릴게요.
            </p>
            <EmailContactButton email={SITE_CONFIG.contactEmail.support} />
          </div>

          {/* Back Link */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors group"
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              홈으로 돌아가기
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
