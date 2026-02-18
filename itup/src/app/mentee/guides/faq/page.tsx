"use client";

import { useState } from "react";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site-config";
import { LogoIcon } from "@/components/icons";

// =============================================
// 멘토링 FAQ
// =============================================

interface FaqItem {
  title: string;
  content: string;
  category: string;
}

const faqData: FaqItem[] = [
  // ── 결제/환불 ──
  {
    category: "결제/환불",
    title: "결제 방법은 어떤 게 있나요?",
    content:
      "[결제 수단]\n토스페이먼츠를 통한 카드결제를 지원해요. 신용카드, 체크카드 모두 사용 가능합니다.\n\n[결제 취소 시]\n결제 취소가 승인되면 원래 결제하신 수단으로 환불이 진행돼요.\n→ 카드 결제의 경우 카드사 사정에 따라 환불까지 3~5 영업일이 소요될 수 있어요.\n\n[영수증]\n결제 완료 후 등록하신 이메일로 결제 확인 메일이 발송돼요. 별도 영수증이 필요하시면 고객센터로 문의해주세요.",
  },
  {
    category: "결제/환불",
    title: "환불 규정이 어떻게 되나요?",
    content:
      "[환불 기준]\n세션 시작 시점을 기준으로 환불 비율이 달라져요.\n\n→ 48시간 전 취소: 전액 환불\n→ 24시간 전 취소: 50% 환불\n→ 24시간 이내 취소: 환불 불가\n→ 노쇼: 환불 불가 + 노쇼 기록\n\n[만족 보증 제도]\n세션 후 별점 3점 이하를 주신 경우, 48시간 이내에 만족 보증을 신청하실 수 있어요.\n→ 승인 시 결제 금액만큼 크레딧으로 환불돼요.\n→ 크레딧은 다음 세션 예약에 사용할 수 있어요.\n→ 계정당 최대 2회까지 이용 가능합니다.\n\n[가격 안내]\n→ 커피챗 15,000원~\n→ 서류 리뷰 40,000원~\n→ 모의면접 80,000원~\n\n[환불 신청 방법]\n마이페이지 > 예약 내역에서 직접 취소하거나, 고객센터로 연락해주세요.",
  },
  // ── 세션 진행 ──
  {
    category: "세션 진행",
    title: "세션은 어떤 방식으로 진행되나요?",
    content:
      "[진행 방식]\nGoogle Meet 또는 Zoom을 통한 화상 세션으로 진행돼요.\n\n[미팅 링크]\n세션 확정 후 멘토가 미팅 링크를 공유해요. 예약 시간 전에 이메일과 마이페이지에서 링크를 확인할 수 있어요.\n\n[카메라 사용]\n→ 카메라를 켜는 것을 권장해요. 서로 얼굴을 보면서 이야기하면 소통이 훨씬 원활해져요.\n→ 꼭 켜야 하는 건 아니지만, 멘토와의 라포 형성에 큰 도움이 돼요.\n\n[준비물]\n안정적인 인터넷 환경, 이어폰/헤드셋, 그리고 미리 준비한 질문 목록이 있으면 완벽해요.",
  },
  {
    category: "세션 진행",
    title: "세션 시간이 부족하면 연장할 수 있나요?",
    content:
      "[연장 가능 여부]\n세션 연장은 전적으로 멘토의 재량이에요. 멘토의 다음 일정에 따라 달라질 수 있어요.\n\n[추가 시간이 필요한 경우]\n→ 추가 결제가 필요하다면, 현재 세션에서 무리하지 말고 다음 세션을 예약하는 것을 권장해요.\n→ 멘토에게 \"다음에 이어서 이야기해도 될까요?\"라고 여쭤보세요.\n\n[시간을 효율적으로 쓰는 팁]\n→ 미리 질문의 우선순위를 정해오세요.\n→ 가장 중요한 질문부터 먼저 물어보면 시간이 부족해도 핵심 내용은 얻을 수 있어요.\n→ 좋은 질문 만들기 가이드를 참고해서 질문을 미리 정리해보세요.",
  },
  {
    category: "세션 진행",
    title: "멘토가 5분 이상 늦으면 어떻게 하나요?",
    content:
      "[대기 기준]\n세션 시작 시간으로부터 10분까지는 대기해주세요. 멘토에게도 갑작스러운 사정이 생길 수 있어요.\n\n[10분 이후]\n→ 10분이 지나도 멘토가 접속하지 않으면 고객센터로 연락해주세요.\n→ 고객센터에서 멘토에게 연락을 시도하고, 상황을 안내해드려요.\n\n[멘토 노쇼 시]\n→ 전액 환불이 처리돼요.\n→ 불편을 겪으신 점에 대해 추가 할인 쿠폰을 드려요.\n→ 해당 멘토에게는 경고 조치가 취해져요.",
  },
  // ── 멘토 관련 ──
  {
    category: "멘토 관련",
    title: "멘토의 실제 경력은 어떻게 검증하나요?",
    content:
      "[검증 절차]\n멘토 등록 시 다단계 검증을 거쳐요.\n\n→ 회사 이메일 인증 필수: 재직 중인 회사의 사내 이메일로 인증을 완료해야 해요.\n→ 운영팀 직접 확인: 프로필에 기재된 경력사항을 운영팀이 별도로 확인해요.\n→ LinkedIn, 포트폴리오 등 추가 자료를 요청할 수 있어요.\n\n[허위 경력 발견 시]\n→ 즉시 퇴출 처리돼요.\n→ 해당 멘토와 세션을 진행한 멘티에게는 전액 환불 + 보상이 이뤄져요.\n\n[신뢰 지표]\n멘토 프로필의 인증 배지, 리뷰 수, 평점을 종합적으로 확인해보세요.",
  },
  {
    category: "멘토 관련",
    title: "특정 회사 출신 멘토를 찾고 싶어요",
    content:
      "[멘토 검색 방법]\n여러 가지 필터를 활용해서 원하는 멘토를 찾을 수 있어요.\n\n→ 회사 필터: 멘토 검색 페이지에서 특정 회사명으로 필터링할 수 있어요.\n→ 직무 태그: 프로그래밍, 기획, 아트 등 직무별로 필터링이 가능해요.\n→ 멘토 프로필: 각 멘토의 프로필에서 현재/이전 재직 회사를 확인할 수 있어요.\n\n[팁]\n같은 회사라도 팀마다 문화가 다를 수 있어요. 멘토 프로필의 직무 설명과 리뷰를 꼼꼼히 읽어보세요.",
  },
  {
    category: "멘토 관련",
    title: "멘토에게 연봉을 물어봐도 되나요?",
    content:
      "[직접적인 연봉 질문은 피해주세요]\n멘토 개인의 구체적인 연봉을 직접 묻는 것은 실례예요. 개인 프라이버시에 해당하는 민감한 정보입니다.\n\n[이렇게 물어보세요]\n→ 시장 평균 연봉대 범위는 물어볼 수 있어요.\n→ \"N년차 서버 프로그래머의 시장 평균이 어느 정도인가요?\" 이런 식으로 물어보세요.\n→ \"주니어에서 시니어로 갈 때 연봉 상승폭이 보통 어느 정도인가요?\"도 괜찮아요.\n\n[참고]\n게임 업계 연봉 정보는 블라인드, 잡플래닛 등에서도 대략적으로 확인할 수 있어요. 멘토에게는 공개 정보로는 알 수 없는 실질적인 인사이트를 물어보는 게 더 효율적이에요.",
  },
  // ── 플랫폼 이용 ──
  {
    category: "플랫폼 이용",
    title: "회원가입 없이 이용할 수 있나요?",
    content:
      "[비회원으로 가능한 것]\n→ 멘토 프로필 둘러보기가 가능해요.\n→ 멘토 목록, 프로필, 리뷰 등을 자유롭게 확인할 수 있어요.\n→ 가이드 문서도 비로그인 상태에서 열람 가능해요.\n\n[로그인이 필요한 것]\n→ 세션 예약 및 결제는 로그인이 필요해요.\n→ 리뷰 작성, 찜하기 등 개인화 기능도 로그인 후 이용 가능해요.\n\n[회원가입]\n간편하게 소셜 로그인(Google, GitHub 등)으로 가입할 수 있어요. 별도의 복잡한 절차 없이 바로 시작할 수 있어요.",
  },
  {
    category: "플랫폼 이용",
    title: "예약 취소 후 다시 예약하면 불이익이 있나요?",
    content:
      "[불이익 없어요]\n예약 취소 후 다시 예약해도 어떠한 페널티도 없어요.\n\n→ 24시간 전 취소는 페널티 없이 전액 환불돼요.\n→ 같은 멘토에게 다시 예약하는 것도 자유로워요.\n→ 취소 횟수가 누적되어 불이익을 받는 일은 없어요.\n\n[다만 주의할 점]\n→ 24시간 이내 취소나 노쇼가 반복되면 일부 멘토가 예약을 거절할 수 있어요.\n→ 멘토도 해당 시간을 비워두고 준비하는 만큼, 가능하면 일찍 취소해주세요.",
  },
  // ── 불만/문제해결 ──
  {
    category: "불만/문제해결",
    title: "세션이 기대에 못 미쳤어요",
    content:
      "[만족 보증 제도]\n세션 후 별점 3점 이하를 남기신 경우, 48시간 이내에 만족 보증을 신청할 수 있어요.\n\n→ 신청이 승인되면 결제 금액만큼 크레딧으로 환불돼요.\n→ 크레딧으로 다른 멘토의 세션을 예약해볼 수 있어요.\n\n[상세 리뷰 작성을 부탁드려요]\n→ 어떤 부분이 기대에 못 미쳤는지 구체적으로 작성해주시면 서비스 품질 개선에 큰 도움이 돼요.\n→ \"답변이 너무 일반적이었다\", \"시간 관리가 안 됐다\" 등 구체적 피드백이 중요해요.\n\n[다음 세션을 위한 팁]\n다른 멘토를 선택하거나, 질문을 더 구체적으로 준비하면 만족도가 크게 올라갈 수 있어요. 좋은 질문 만들기 가이드를 참고해보세요.",
  },
  {
    category: "불만/문제해결",
    title: "멘토가 부적절한 언행을 했어요",
    content:
      "[즉시 대응 가능해요]\n불쾌한 상황이 발생하면 즉시 세션을 종료할 수 있어요. 참을 필요 없어요.\n\n[신고 절차]\n→ 세션 종료 후 관리자에게 신고해주세요.\n→ 마이페이지 > 세션 내역에서 해당 세션의 \"신고하기\" 버튼을 이용하시거나, 고객센터로 직접 연락해주세요.\n→ 상황을 구체적으로 설명해주시면 빠른 처리가 가능해요.\n\n[처리 결과]\n→ 전액 환불이 처리돼요.\n→ 해당 멘토에 대해 즉시 조사가 시작돼요.\n→ 조사 결과에 따라 경고, 활동 정지, 영구 퇴출 등의 제재가 이뤄져요.\n\n[멘티 보호 원칙]\n→ 신고자의 개인정보는 멘토에게 공개되지 않아요.\n→ 신고로 인한 어떠한 불이익도 없어요.",
  },
];

const categoryConfig: Record<
  string,
  {
    color: string;
    bgColor: string;
    borderColor: string;
    badgeBg: string;
    badgeText: string;
    icon: React.ReactNode;
  }
> = {
  "결제/환불": {
    color: "text-blue-600",
    bgColor: "bg-blue-500/5",
    borderColor: "border-l-blue-500",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  "세션 진행": {
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/5",
    borderColor: "border-l-emerald-500",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  "멘토 관련": {
    color: "text-primary",
    bgColor: "bg-primary/5",
    borderColor: "border-l-primary",
    badgeBg: "bg-primary/10",
    badgeText: "text-primary",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  "플랫폼 이용": {
    color: "text-orange-600",
    bgColor: "bg-orange-500/5",
    borderColor: "border-l-orange-500",
    badgeBg: "bg-orange-500/10",
    badgeText: "text-orange-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  "불만/문제해결": {
    color: "text-red-600",
    bgColor: "bg-red-500/5",
    borderColor: "border-l-red-500",
    badgeBg: "bg-red-500/10",
    badgeText: "text-red-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
};

const categories = [
  "전체",
  "결제/환불",
  "세션 진행",
  "멘토 관련",
  "플랫폼 이용",
  "불만/문제해결",
];

export default function FaqGuidePage() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered =
    activeCategory === "전체"
      ? faqData
      : faqData.filter((item) => item.category === activeCategory);

  const getCategoryConfig = (category: string) => {
    return (
      categoryConfig[category] || {
        color: "text-primary",
        bgColor: "bg-primary/5",
        borderColor: "border-l-primary",
        badgeBg: "bg-primary/10",
        badgeText: "text-primary",
        icon: null,
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-card-border">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <LogoIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground group-hover:text-primary transition-colors">
              {SITE_CONFIG.name}
            </span>
          </Link>
          <Link href="/mentee/guides" className="text-sm text-muted hover:text-foreground transition-colors">
            가이드 목록
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="relative mb-12 rounded-2xl bg-gradient-to-br from-red-500/10 via-primary/5 to-accent/5 border border-red-500/20 p-8 sm:p-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <Link href="/mentee/guides" className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary mb-4 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              멘티 가이드
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">멘토링 FAQ</h1>
            <p className="text-muted text-lg max-w-2xl">
              멘토링 서비스를 이용하면서 자주 묻는 질문들을 모았어요.
              <br className="hidden sm:block" />
              결제부터 세션 진행, 불만 해결까지 궁금한 점을 확인해보세요.
            </p>
          </div>
        </div>

        {/* Key Message Box */}
        <div className="mb-10 p-6 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl text-center">
          <p className="text-lg sm:text-xl font-bold text-foreground mb-2">
            <span className="text-primary">찾는 답이 없나요?</span>
          </p>
          <p className="text-sm text-muted">
            페이지 하단의 플로팅 피드백 버튼을 눌러 의견을 남기시거나, 이메일로 문의해주세요. 빠르게 답변드릴게요.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((category) => {
            const config = category !== "전체" ? getCategoryConfig(category) : null;
            return (
              <button
                key={category}
                onClick={() => { setActiveCategory(category); setOpenIndex(null); }}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                  activeCategory === category
                    ? category === "전체"
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : `${config?.badgeBg} ${config?.badgeText} ring-2 ring-current/20`
                    : "bg-card-bg border border-card-border text-muted hover:text-foreground hover:border-primary/50"
                }`}
              >
                {category !== "전체" && config?.icon}
                {category}
              </button>
            );
          })}
        </div>

        {/* List */}
        <div className="space-y-3" role="region" aria-label="멘토링 FAQ 목록">
          {filtered.map((item, index) => {
            const isOpen = openIndex === index;
            const config = getCategoryConfig(item.category);

            return (
              <div
                key={index}
                className={`border border-card-border rounded-xl overflow-hidden border-l-4 ${config.borderColor} transition-all duration-200 ${
                  isOpen ? config.bgColor : "bg-card-bg hover:shadow-md"
                }`}
              >
                <h3>
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left cursor-pointer hover:bg-secondary/30 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 ${config.badgeBg} ${config.badgeText} rounded-full font-medium`}>
                        {config.icon}
                        {item.category}
                      </span>
                      <span className="font-medium">{item.title}</span>
                    </div>
                    <svg className={`w-5 h-5 text-muted transition-transform duration-200 shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </h3>
                {isOpen && (
                  <div className="px-6 pb-5">
                    <div className={`pt-4 border-t ${config.borderColor.replace("border-l-", "border-")}/30`}>
                      <div className="text-foreground/80 leading-relaxed whitespace-pre-line text-[15px]">
                        {item.content.split("\n").map((line, lineIndex) => {
                          if (line.startsWith("[") && line.includes("]")) {
                            const bracketEnd = line.indexOf("]");
                            const header = line.substring(0, bracketEnd + 1);
                            const rest = line.substring(bracketEnd + 1);
                            return <span key={lineIndex}><span className={`font-bold ${config.color}`}>{header}</span>{rest}{"\n"}</span>;
                          }
                          if (line.startsWith("→")) {
                            return <span key={lineIndex} className="text-primary font-medium">{line}{"\n"}</span>;
                          }
                          return <span key={lineIndex}>{line}{"\n"}</span>;
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="my-12 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        <div className="flex items-center justify-between">
          <Link href="/mentee/guides/action-plan" className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            액션 플랜
          </Link>
          <Link href="/mentee/guides" className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors">
            가이드 목록
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </main>
    </div>
  );
}
