"use client";

import { useState } from "react";
import Link from "next/link";

interface GuidelineItem {
  title: string;
  content: string;
  category: string;
}

const guidelinesData: GuidelineItem[] = [
  // 응답 시간
  {
    category: "응답 시간",
    title: "신청 확인은 얼마나 빨리 해야 하나요?",
    content:
      "멘티가 상담을 신청하면 24시간 이내에 확인해주세요. 48시간 내 미확인 시 자동으로 멘티에게 안내 메시지가 발송돼요. 72시간 초과 미응답 시 상담이 자동 취소되고 전액 환불됩니다.",
  },
  {
    category: "응답 시간",
    title: "일정 조율은 어떻게 하나요?",
    content:
      "확인 후 48시간 이내에 구체적 일정을 제안해주세요. 최소 2개 이상의 시간대를 제안하면 멘티가 선택하기 편해요.",
  },
  {
    category: "응답 시간",
    title: "텍스트 상담(오픈카톡)은 어떻게 운영하나요?",
    content:
      "오픈채팅방 개설 후 3일간 운영해주세요. 멘티 질문에 24시간 이내 답변이 기본이에요. 하루 최소 1회 이상 채팅방을 확인하고, 3일 종료 후 마무리 인사를 남겨주세요.",
  },
  // 취소/노쇼
  {
    category: "취소/노쇼",
    title: "멘토가 상담을 취소하면 어떻게 되나요?",
    content:
      "상담 24시간 전까지: 패널티 없이 취소 가능 (멘티 전액 환불).\n상담 24시간 이내: 경고 1회 + 멘티 전액 환불 + 할인 쿠폰.\n노쇼(무단 불참): 경고 2회 + 전액 환불 + 추가 1회 무료 상담 제공.\n경고 3회 누적 시 활동 일시 정지(2주), 5회 누적 시 영구 정지.",
  },
  {
    category: "취소/노쇼",
    title: "멘티가 취소하면 환불은?",
    content:
      "상담 24시간 전까지: 전액 환불.\n24시간 이내 ~ 1시간 전: 50% 환불.\n1시간 이내 취소 또는 노쇼: 환불 불가 (멘토에게 전액 정산).\n멘토와 멘티 상호 합의 시 언제든 전액 환불 가능.",
  },
  // 품질 기준
  {
    category: "품질 기준",
    title: "상담 전에 어떤 준비가 필요한가요?",
    content:
      "멘티의 신청서(관심 분야, 메시지)를 사전에 확인해주세요. 이력서/포폴 첨삭은 멘티에게 자료를 사전 요청하고, 모의면접은 직무별 예상 질문 최소 10개를 준비해주세요.",
  },
  {
    category: "품질 기준",
    title: "상담 시간은 얼마나 진행해야 하나요?",
    content:
      "약속한 시간을 정확히 지켜주세요. 최소 시간: 커피챗 30분, 이력서 첨삭 50분, 모의면접 60분, 텍스트 상담 3일. 녹음/녹화는 상호 동의 하에만 가능합니다.",
  },
  {
    category: "품질 기준",
    title: "상담 후에 해야 할 일은?",
    content:
      "이력서/포폴 첨삭: 3일 이내에 서면 피드백 전달.\n모의면접: 2일 이내에 피드백 리포트 전달.\n커피챗: 추가 질문 1회 대응.\n텍스트 상담: 3일 종료 시 마무리 인사 + 요약.",
  },
  {
    category: "품질 기준",
    title: "평점이 낮으면 어떻게 되나요?",
    content:
      "평균 평점 4.0 미만이 3개월 이상 지속되면 개선 안내를 드려요. 3.5 미만이면 활동이 일시 정지될 수 있어요. 별점 1-2점 리뷰가 달리면 운영팀에서 상황을 확인하고 연락드립니다.",
  },
  // 텍스트 에티켓
  {
    category: "텍스트 에티켓",
    title: "텍스트 상담 기본 원칙은?",
    content:
      "존댓말 사용이 기본이에요. 답변은 구체적이고 actionable하게 최소 2-3문장 이상으로 작성해주세요. 단답형보다는 이유와 함께 설명해주세요. 참고 링크, 자료를 함께 공유하면 좋아요.",
  },
  {
    category: "텍스트 에티켓",
    title: "경계 설정은 어떻게 하나요?",
    content:
      "업무 외 시간대에 답변이 어려우면 미리 안내해주세요. 개인 연락처 교환은 자유이나, 플랫폼 외 유료 상담 유도는 금지예요. 부적절한 대화 발생 시 즉시 운영팀에 신고해주세요.",
  },
  // 수익/정산
  {
    category: "수익/정산",
    title: "수수료는 얼마인가요?",
    content:
      "플랫폼 수수료 15% (런칭 초기). 멘토는 상품 가격의 85%를 수령합니다. 정산은 월 1회 (매월 15일, 전월 완료 건).",
  },
  {
    category: "수익/정산",
    title: "티어별 가격은 어떻게 되나요?",
    content:
      "경력에 따라 주니어(🌱 1.0x), 시니어(⭐ 1.3x), 리드(👑 1.6x) 등급이 적용돼요.\n예: 커피챗 — 주니어 15,000원, 시니어 20,000원, 리드 24,000원.\n예: 모의면접 — 주니어 59,000원, 시니어 77,000원, 리드 94,000원.",
  },
  {
    category: "수익/정산",
    title: "세금은 어떻게 되나요?",
    content:
      "멘토 수익은 기타소득으로 분류되며, 원천징수 후 지급돼요. 연간 수익이 일정 금액 이상이면 종합소득세 신고가 필요합니다.",
  },
  // 금지사항
  {
    category: "금지사항",
    title: "어떤 행위가 금지되나요?",
    content:
      "플랫폼 우회 결제 유도, 개인정보 무단 수집/공유, 허위 경력 기재, 상업적 광고/리크루팅 목적 활동, 욕설·차별적 발언·성적 발언, 타 멘토 비방, 특정 회사/서비스 유료 가입 강요.",
  },
  {
    category: "금지사항",
    title: "위반하면 어떤 제재가 있나요?",
    content:
      "경고 → 일시정지(2주) → 영구정지 순서로 제재됩니다. 경고 3회 누적 시 일시정지, 5회 누적 시 영구정지. 중대한 위반(개인정보 유출, 성적 발언 등)은 즉시 영구정지될 수 있습니다.",
  },
];

const categories = [
  "전체",
  "응답 시간",
  "취소/노쇼",
  "품질 기준",
  "텍스트 에티켓",
  "수익/정산",
  "금지사항",
];

export default function MentorGuidelinesPage() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered =
    activeCategory === "전체"
      ? guidelinesData
      : guidelinesData.filter((item) => item.category === activeCategory);

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
          <Link
            href="/mentor/dashboard"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            대시보드
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            멘토 가이드라인
          </h1>
          <p className="text-muted">
            멘토 활동에 필요한 규칙과 안내를 확인해보세요.
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

        {/* Guidelines List */}
        <div className="space-y-3">
          {filtered.map((item, index) => (
            <div
              key={index}
              className="bg-card-bg border border-card-border rounded-xl overflow-hidden"
            >
              <button
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
                className="w-full px-6 py-4 flex items-center justify-between text-left cursor-pointer hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                    {item.category}
                  </span>
                  <span className="font-medium">{item.title}</span>
                </div>
                <svg
                  className={`w-5 h-5 text-muted transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <div className="pt-4 border-t border-card-border">
                    <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
                      {item.content}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-12 text-center bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-2">
            궁금한 점이 있으신가요?
          </h2>
          <p className="text-muted mb-6">
            가이드라인 관련 문의는 편하게 연락주세요.
          </p>
          <a
            href="mailto:support@itup.kr"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-dark transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            이메일 문의
          </a>
        </div>

        {/* Back */}
        <div className="mt-8 text-center">
          <Link
            href="/mentor/dashboard"
            className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            대시보드로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
}
