"use client";

import { useState } from "react";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site-config";
import { LogoIcon } from "@/components/icons";

// =============================================
// 좋은 질문 만들기 가이드
// =============================================

interface QuestionItem {
  title: string;
  content: string;
  category: string;
}

const questionsData: QuestionItem[] = [
  // ── 질문의 중요성 ──
  {
    category: "질문의 중요성",
    title: "왜 질문의 퀄리티가 중요할까요? (멘토의 관점)",
    content:
      "멘토들이 세션에서 가장 힘들어하는 건 \"뭘 물어볼지 모르겠어요\"라는 멘티예요.\n\n[멘토의 솔직한 속마음]\n- 구체적인 질문이 오면 → \"이건 내 경험에서 바로 답할 수 있다\" → 깊이 있는 조언 가능\n- 막연한 질문이 오면 → \"어디서부터 설명해야 하지?\" → 일반론만 말하게 됨\n\n[질문 퀄리티가 세션 퀄리티를 결정해요]\n같은 30분이라도:\n- 구체적 질문 3개 → 실행 가능한 조언 3개를 가져감\n- 막연한 질문 1개 → 검색해도 나올 일반적인 답변만 들음\n\n[좋은 질문의 3가지 특징]\n1. 구체적이에요 — 회사, 직무, 상황이 명시되어 있어요\n2. 멘토의 경험을 물어봐요 — 검색으로는 알 수 없는 실제 이야기\n3. 답을 들으면 다음 행동이 명확해져요 — \"그래서 뭘 하면 되지?\"가 해결됨\n\n[멘토도 사람이에요]\n좋은 질문을 받으면 멘토도 더 열정적으로 답변하게 돼요. \"이 멘티는 준비를 해왔구나\" 싶으면 자연스럽게 더 많은 인사이트를 공유하게 되죠. 반대로 막연한 질문만 계속되면 멘토도 지칠 수밖에 없어요.",
  },
  // ── 커리어 방향 ──
  {
    category: "커리어 방향",
    title: "커리어 방향 질문: 나쁜 예시 → 좋은 예시",
    content:
      "[나쁜 질문 1]\n\"게임 업계 전망이 어떤가요?\"\n→ 너무 넓고 검색으로도 충분히 알 수 있는 질문이에요.\n\n[좋은 질문으로 변환]\n\"모바일 게임 시장이 레드오션이라는 이야기를 많이 들었는데, 멘토님이 보시기에 신입 서버 프로그래머의 수요는 어떤가요? 최근 채용 트렌드에서 변화를 느끼시는 부분이 있으세요?\"\n→ 특정 직무 + 멘토의 체감 경험을 물어봐요.\n\n[나쁜 질문 2]\n\"기획이랑 프로그래밍 중에 뭐가 나아요?\"\n→ 정답이 없는 질문이에요. 본인의 상황 없이 물어보면 \"적성에 따라 다르다\"는 답밖에 못 들어요.\n\n[좋은 질문으로 변환]\n\"저는 문과 출신인데 Unity C# 기초까지 공부했어요. 기획과 클라이언트 프로그래밍 둘 다 관심이 있는데, 제 배경에서 어떤 직무가 더 현실적인 선택일까요? 멘토님 주변에 문과 출신 프로그래머가 있다면 어떤 경로로 입사했는지도 궁금해요.\"\n→ 본인 배경 + 구체적 상황 + 멘토 주변 사례 요청.\n\n[나쁜 질문 3]\n\"대기업이 좋아요, 스타트업이 좋아요?\"\n→ 역시 \"케바케\"라는 답밖에 안 나와요.\n\n[좋은 질문으로 변환]\n\"2년차 클라이언트 프로그래머인데, 지금 중소 게임사에서 다양한 업무를 경험하고 있어요. 3-4년차 때 대형사로 이직하는 게 좋을지, 아니면 더 경험을 쌓고 5년차쯤 가는 게 좋을지 멘토님의 의견이 궁금해요. 멘토님은 이직 시점을 어떻게 결정하셨나요?\"\n→ 구체적 연차 + 현재 상황 + 멘토의 실제 경험 요청.",
  },
  // ── 기술 스킬 ──
  {
    category: "기술 스킬",
    title: "기술/스킬 질문: 나쁜 예시 → 좋은 예시",
    content:
      "[나쁜 질문 1]\n\"Unity 공부 어떻게 해요?\"\n→ 유튜브에서도 답을 찾을 수 있는 질문이에요.\n\n[좋은 질문으로 변환]\n\"Unity로 2D 플랫포머 1개를 완성했는데, 다음 단계로 뭘 공부해야 할지 고민이에요. 실무에서 주니어 Unity 프로그래머가 가장 많이 쓰는 기능이나 패턴이 뭔가요? 예를 들어 어드레서블, 오브젝트 풀링 같은 것을 실무에서 많이 쓰시나요?\"\n→ 현재 수준 명시 + 실무 기준 요청 + 구체적 기술 언급.\n\n[나쁜 질문 2]\n\"코딩테스트 어떻게 준비해요?\"\n→ 백준이나 프로그래머스에 공부법이 넘쳐나요.\n\n[좋은 질문으로 변환]\n\"넥슨 클라이언트 프로그래머 코딩테스트가 C++로 진행된다고 들었는데, 백준 기준으로 어떤 난이도까지 풀어야 하나요? 자료구조 중에서 특히 자주 출제되는 유형이 있다면 알려주실 수 있을까요? 현재 백준 실버 수준이에요.\"\n→ 특정 회사 + 언어 + 현재 수준 + 구체적 요청.\n\n[나쁜 질문 3]\n\"Unreal 배워야 하나요?\"\n→ \"목표에 따라 다르다\"는 답만 나와요.\n\n[좋은 질문으로 변환]\n\"크래프톤이나 시프트업 같은 언리얼 기반 회사에 가고 싶은데, Unity를 2년 써봤어요. 지금부터 Unreal C++로 전환하면 취업까지 현실적으로 얼마나 걸릴까요? 전환할 때 가장 어려운 부분은 뭐였나요?\"\n→ 목표 회사 + 현재 기술 수준 + 현실적 타임라인 + 멘토 경험 요청.",
  },
  // ── 회사/팀 문화 ──
  {
    category: "회사/팀 문화",
    title: "회사/팀 문화 질문: 나쁜 예시 → 좋은 예시",
    content:
      "[나쁜 질문 1]\n\"넥슨 다니기 좋아요?\"\n→ 주관적이고, \"좋다/나쁘다\"로만 대답할 수 있어요.\n\n[좋은 질문으로 변환]\n\"넥슨 서버 팀의 일하는 방식이 궁금해요. 스프린트 주기는 어떤가요? Jira나 Confluence 같은 협업 도구를 어떻게 쓰시나요? 코드 리뷰 문화가 활발한 편인지도 궁금합니다.\"\n→ 구체적인 업무 방식 + 협업 도구 + 문화 요소를 물어봐요.\n\n[나쁜 질문 2]\n\"워라밸 어때요?\"\n→ 부서/프로젝트마다 천차만별이라 의미 있는 답을 듣기 어려워요.\n\n[좋은 질문으로 변환]\n\"라이브 서비스 팀과 신작 개발 팀의 업무 강도가 다르다고 들었는데, 실제로 어떤가요? 크런치(야근) 타임이 주로 언제 생기고, 얼마나 지속되나요? 멘토님 팀의 평균적인 퇴근 시간대가 궁금해요.\"\n→ 팀 유형 구분 + 구체적 상황 + 멘토 실제 경험.\n\n[나쁜 질문 3]\n\"그 회사 분위기 어때요?\"\n→ \"좋아요\" 말고는 할 말이 없어요.\n\n[좋은 질문으로 변환]\n\"스마일게이트 RPG에서 신입 기획자가 의견을 내거나 기획 제안을 할 수 있는 분위기인가요? 주니어의 성장을 위한 사내 교육이나 멘토링 시스템 같은 게 있나요?\"\n→ 구체적 포지션의 성장 환경 + 사내 시스템 확인.",
  },
  // ── 포트폴리오/이력서 ──
  {
    category: "포트폴리오/이력서",
    title: "포트폴리오/이력서 질문: 나쁜 예시 → 좋은 예시",
    content:
      "[나쁜 질문 1]\n\"포트폴리오 어떻게 만들어요?\"\n→ 직무마다, 회사마다 완전히 달라요.\n\n[좋은 질문으로 변환]\n\"넥슨 시스템 기획자 포트폴리오에 BM 설계 문서를 넣으려는데, 어떤 형식으로 작성하면 좋을까요? 멘토님이 면접관으로 포트폴리오를 볼 때 가장 먼저 확인하는 것은 뭔가요?\"\n→ 특정 회사 + 직무 + 구체적 항목 + 면접관 관점 요청.\n\n[나쁜 질문 2]\n\"이력서 많이 넣었는데 다 떨어져요. 왜 그럴까요?\"\n→ 이력서를 안 보면 답할 수 없어요.\n\n[좋은 질문으로 변환]\n\"서류 리뷰 상품을 신청했는데, 제 이력서를 사전에 보내드려도 될까요? 특히 프로젝트 경험 서술 부분과 자기소개서 핵심 메시지에 대한 피드백을 받고 싶어요. 지금까지 대형사 3곳에 넣었는데 모두 서류에서 떨어졌거든요.\"\n→ 구체적 피드백 요청 + 상황 설명 + 자료 제공 의사.\n\n[나쁜 질문 3]\n\"포트폴리오에 팀 프로젝트 넣어도 돼요?\"\n→ 당연히 넣을 수 있지만, 핵심은 \"어떻게\" 넣느냐예요.\n\n[좋은 질문으로 변환]\n\"4인 팀 프로젝트에서 클라이언트 프로그래밍을 담당했는데, 포트폴리오에 넣을 때 팀 프로젝트와 개인 기여를 어떻게 구분해서 보여줘야 할까요? GitHub 커밋 로그를 첨부하는 게 효과적일까요?\"\n→ 구체적 상황 + 실질적 고민 + 해결 방법 제안.",
  },
  // ── 면접 준비 ──
  {
    category: "면접 준비",
    title: "면접 준비 질문: 나쁜 예시 → 좋은 예시",
    content:
      "[나쁜 질문 1]\n\"면접에서 뭐 물어봐요?\"\n→ 구글에 \"게임 회사 면접 질문\"을 검색하면 수백 개가 나와요.\n\n[좋은 질문으로 변환]\n\"크래프톤 기술 면접에서 멘토님이 직접 받았던 질문 중 가장 어려웠던 건 뭐였나요? 그리고 요즘 면접에서 자주 물어보는 트렌드가 바뀌었다면, 어떤 쪽으로 변하고 있나요?\"\n→ 특정 회사 + 멘토의 실제 경험 + 최근 트렌드 변화.\n\n[나쁜 질문 2]\n\"면접 잘 보는 법 알려주세요.\"\n→ 자기소개서 한 권 분량이에요.\n\n[좋은 질문으로 변환]\n\"기획 면접에서 '왜 게임 기획자가 되고 싶은가'라는 질문에 매번 막히는데, 면접관이 이 질문으로 정말 알고 싶은 게 뭔가요? 멘토님이 면접관이시라면 어떤 답변에 높은 점수를 주시겠어요?\"\n→ 특정 질문 + 면접관 관점 + 구체적 기준 요청.\n\n[나쁜 질문 3]\n\"떨어졌는데 이유를 모르겠어요.\"\n→ 멘토도 모를 수밖에 없어요.\n\n[좋은 질문으로 변환]\n\"넥슨 기획 최종 면접에서 떨어졌는데, 기술 면접 때 시스템 기획 질문에 잘 대답했지만 인성 면접에서 약했던 것 같아요. 면접관이 인성 면접에서 특히 확인하려는 게 뭔가요? '협업 갈등 해결' 같은 경험을 어떤 구조로 이야기해야 할까요?\"\n→ 면접 과정 공유 + 자기 분석 + 구체적 개선점 요청.",
  },
  // ── 절대 하지 마세요 ──
  {
    category: "절대 하지 마세요",
    title: "이런 질문은 절대 하지 마세요",
    content:
      "[1. 특정 개인의 연봉을 직접 묻기]\n\"멘토님 연봉이 얼마예요?\"\n→ 개인 프라이버시예요. 대신 \"XX 직무 N년차의 시장 평균 연봉대가 어떤가요?\"로 물어보세요.\n\n[2. 회사 기밀 정보 요청]\n\"아직 발표 안 된 신작 정보 알려주세요.\"\n\"우리 회사 채용 비밀 기준이 뭐예요?\"\n→ NDA(비밀유지계약) 위반이에요. 멘토가 곤란해져요.\n\n[3. 취업 보장 요청]\n\"멘토님 회사에 저 추천해주실 수 있나요?\"\n\"레퍼럴 부탁드려도 될까요?\"\n→ 처음 만나는 세션에서 이런 요청은 부적절해요. 관계가 쌓인 후에 자연스럽게 가능할 수도 있지만, 먼저 요청하지 마세요.\n\n[4. 다른 멘토 평가 요청]\n\"다른 멘토한테 이런 조언을 들었는데, 그 사람 말이 맞아요?\"\n→ 멘토를 경쟁시키는 질문이에요. \"다른 의견도 들어봤는데 멘토님은 어떻게 생각하세요?\"로 바꿔주세요.\n\n[5. 불법/비윤리적 질문]\n\"코딩테스트 문제를 유출해주실 수 있나요?\"\n\"면접 전에 질문 목록을 알 수 있을까요?\"\n→ 절대 안 돼요. 멘토에게 위험을 전가하는 질문이에요.\n\n[6. 세션과 무관한 개인적 요청]\n\"멘토님 LinkedIn 추천사 써주세요.\"\n\"제 프로젝트에 참여해주실 수 있나요?\"\n→ 커피챗 세션의 범위를 벗어나는 요청이에요.\n\n[원칙]\n멘토는 선배이지, 채용 담당자도 아니고, 친구도 아니에요. 전문적인 관계에서 서로를 존중하는 질문을 해주세요.",
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
  "질문의 중요성": {
    color: "text-primary",
    bgColor: "bg-primary/5",
    borderColor: "border-l-primary",
    badgeBg: "bg-primary/10",
    badgeText: "text-primary",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  "커리어 방향": {
    color: "text-blue-600",
    bgColor: "bg-blue-500/5",
    borderColor: "border-l-blue-500",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  "기술 스킬": {
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/5",
    borderColor: "border-l-emerald-500",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  "회사/팀 문화": {
    color: "text-orange-600",
    bgColor: "bg-orange-500/5",
    borderColor: "border-l-orange-500",
    badgeBg: "bg-orange-500/10",
    badgeText: "text-orange-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  "포트폴리오/이력서": {
    color: "text-violet-600",
    bgColor: "bg-violet-500/5",
    borderColor: "border-l-violet-500",
    badgeBg: "bg-violet-500/10",
    badgeText: "text-violet-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  "면접 준비": {
    color: "text-amber-600",
    bgColor: "bg-amber-500/5",
    borderColor: "border-l-amber-500",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  "절대 하지 마세요": {
    color: "text-red-600",
    bgColor: "bg-red-500/5",
    borderColor: "border-l-red-500",
    badgeBg: "bg-red-500/10",
    badgeText: "text-red-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
};

const categories = [
  "전체",
  "질문의 중요성",
  "커리어 방향",
  "기술 스킬",
  "회사/팀 문화",
  "포트폴리오/이력서",
  "면접 준비",
  "절대 하지 마세요",
];

export default function QuestionsGuidePage() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered =
    activeCategory === "전체"
      ? questionsData
      : questionsData.filter((item) => item.category === activeCategory);

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
        <div className="relative mb-12 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-primary/5 to-accent/5 border border-emerald-500/20 p-8 sm:p-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <Link href="/mentee/guides" className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary mb-4 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              멘티 가이드
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">좋은 질문 만들기</h1>
            <p className="text-muted text-lg max-w-2xl">
              같은 시간, 같은 멘토라도 질문이 다르면 결과가 완전히 달라요.
              <br className="hidden sm:block" />
              카테고리별 나쁜 질문을 좋은 질문으로 변환하는 방법을 배워보세요.
            </p>
          </div>
        </div>

        {/* Formula Box */}
        <div className="mb-10 p-6 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl text-center">
          <p className="text-sm text-muted mb-2">좋은 질문 공식</p>
          <p className="text-lg sm:text-xl font-bold text-foreground">
            <span className="text-primary">구체적 상황</span> + <span className="text-accent">멘토의 실제 경험</span> + <span className="text-emerald-600">실행 가능한 답변 유도</span>
          </p>
          <p className="text-sm text-muted mt-2">이 세 가지가 있으면 어떤 질문이든 좋은 질문이 돼요.</p>
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
        <div className="space-y-3" role="region" aria-label="좋은 질문 가이드 목록">
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
          <Link href="/mentee/guides/introduction" className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            자기소개 작성법
          </Link>
          <Link href="/mentee/guides/roles" className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors">
            직무별 준비 가이드
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </main>
    </div>
  );
}
