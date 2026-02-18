"use client";

import { useState } from "react";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site-config";
import { LogoIcon } from "@/components/icons";

// =============================================
// 세션 전 자기소개 작성법
// =============================================

interface IntroItem {
  title: string;
  content: string;
  category: string;
}

const introData: IntroItem[] = [
  // ── 상황별 템플릿 ──
  {
    category: "상황별 템플릿",
    title: "대학생 / 취업 준비생",
    content:
      "[템플릿]\n\"안녕하세요, [이름]입니다.\n[대학교명] [학과] [학년]이고요,\n[시기]까지 [목표 직무]로 취업하는 것을 목표로 하고 있어요.\n\n지금까지 [경험 1~2개]을 해봤고,\n현재는 [하고 있는 것]을 준비하고 있어요.\n\n오늘 특히 [핵심 질문]에 대해 여쭤보고 싶어요.\"\n\n[좋은 예시]\n\"안녕하세요, 이지은입니다. 한양대 디지털미디어학과 4학년이고요, 올해 하반기에 게임 기획자로 취업하는 게 목표예요.\n\n학교에서 Unity 기반 팀 프로젝트 2개를 진행했고, 그중 하나는 기획 리드를 맡았어요. 현재 시스템 기획서와 레벨 디자인 문서를 포트폴리오로 준비 중이에요.\n\n오늘은 기획 포트폴리오에서 면접관이 특히 중요하게 보는 포인트가 뭔지 여쭤보고 싶습니다.\"\n\n[포인트]\n- 학교/학과를 밝히면 멘토가 수준을 가늠하기 쉬워요\n- \"팀 프로젝트 했어요\"보다 \"기획 리드를 맡았어요\"가 더 구체적이에요\n- 마지막에 핵심 질문을 명확히 하면 멘토가 바로 답변 준비를 할 수 있어요",
  },
  {
    category: "상황별 템플릿",
    title: "주니어 (1-2년차) 현직자",
    content:
      "[템플릿]\n\"안녕하세요, [이름]입니다.\n[회사명]에서 [직무]로 [연차]년째 일하고 있어요.\n\n주로 [담당 업무]를 하고 있고,\n[고민/목표]을 위해 상담을 신청했어요.\n\n특히 [핵심 질문]에 대한 멘토님의 경험이 궁금합니다.\"\n\n[좋은 예시]\n\"안녕하세요, 박서준입니다. 중소 모바일 게임사에서 클라이언트 프로그래머로 1년 6개월째 일하고 있어요.\n\nUnity C#으로 UI 시스템과 인게임 이펙트 쪽을 담당하고 있고, 최근에 이직을 고민하고 있어요. 대형사(넥슨, 넷마블 등)로 옮기고 싶은데, 중소 경력이 어느 정도 인정받을 수 있는지, 코딩테스트 준비를 어떤 수준으로 해야 하는지 궁금합니다.\n\n오늘은 중소에서 대형사로 이직할 때 가장 중요한 준비 사항에 대해 여쭤보고 싶어요.\"\n\n[포인트]\n- 현재 회사 규모와 직무를 명확히 하면 멘토가 상황을 빠르게 파악해요\n- \"이직하고 싶어요\"보다 \"어떤 회사로, 왜\"를 말하면 훨씬 구체적인 조언을 받을 수 있어요\n- 기술 스택(Unity, C# 등)을 언급하면 기술적 대화가 바로 가능해요",
  },
  {
    category: "상황별 템플릿",
    title: "이직 / 타 업계 전환자",
    content:
      "[템플릿]\n\"안녕하세요, [이름]입니다.\n현재 [현 직장/직무]에서 [연차]년째 일하고 있고,\n게임 업계 [목표 직무]로 전환을 준비하고 있어요.\n\n[현 직무에서의 관련 경험]이 있고,\n[게임 쪽으로 준비한 것]도 하고 있어요.\n\n오늘은 [핵심 질문]에 대해 현실적인 조언을 듣고 싶습니다.\"\n\n[좋은 예시]\n\"안녕하세요, 최은영입니다. 현재 IT 스타트업에서 PM으로 3년째 일하고 있고, 게임 기획자로 전환을 준비하고 있어요.\n\n서비스 기획과 유저 리서치 경험이 있어서 게임 기획에 활용할 수 있을 것 같고, 퇴근 후에 Unity 기초 과정을 수강하면서 개인 프로젝트도 하나 진행 중이에요.\n\n오늘은 IT PM 경력이 게임 기획 면접에서 어떻게 인정되는지, 그리고 포트폴리오를 어떤 식으로 준비해야 하는지 현실적인 조언을 듣고 싶습니다.\"\n\n[포인트]\n- 현재 직무의 관련 경험을 언급하면 멘토가 어떤 강점을 살릴 수 있는지 파악해요\n- \"게임을 좋아해서 전환하고 싶어요\"보다 \"이미 이런 준비를 하고 있어요\"가 훨씬 좋은 인상을 줘요\n- 현실적인 타임라인이나 제약 조건(퇴근 후 준비, 가족 등)을 공유하면 맞춤형 조언을 받을 수 있어요",
  },
  {
    category: "상황별 템플릿",
    title: "시니어 / 경력 레벨업",
    content:
      "[템플릿]\n\"안녕하세요, [이름]입니다.\n[회사명]에서 [직무]로 [연차]년째 일하고 있어요.\n\n현재 [역할/포지션]을 맡고 있고,\n[다음 단계 목표]를 고민하고 있어요.\n\n멘토님의 [관련 경험]에 대한 인사이트를 듣고 싶습니다.\"\n\n[좋은 예시]\n\"안녕하세요, 김태현입니다. 넷마블에서 서버 프로그래머로 6년째 일하고 있어요.\n\n현재 5명 규모의 서버 파트 리드를 맡고 있고, 기술 리더(테크 리드)로 성장하고 싶은데 막연하게 느껴져서 고민이에요. 대규모 MMORPG 서버 아키텍처 경험은 있지만, 조직 관리나 기술 의사결정 같은 리더십 역량을 어떻게 키워야 할지 잘 모르겠어요.\n\n멘토님이 테크 리드로 성장하면서 가장 도움이 됐던 경험이나 학습 방법을 들려주시면 감사하겠습니다.\"\n\n[포인트]\n- 시니어는 구체적인 고민을 공유할수록 깊이 있는 대화가 가능해요\n- 기술적 배경(서버 아키텍처, 팀 규모 등)을 명시하면 레벨에 맞는 조언을 받을 수 있어요\n- \"리더십\", \"이직\", \"매니지먼트 전환\" 등 방향을 명확히 하세요",
  },
  // ── 필수 포함 요소 ──
  {
    category: "필수 포함 요소",
    title: "좋은 자기소개의 4가지 핵심 요소",
    content:
      "좋은 자기소개에는 반드시 이 4가지가 들어가야 해요:\n\n[1. 현재 상태 (Where I am)]\n- 학생이라면: 학교, 학과, 학년\n- 현직자라면: 회사(규모), 직무, 연차\n- 전환자라면: 현재 직무 + 게임 쪽 준비 상황\n\n[2. 목표 (Where I want to go)]\n- 어떤 직무? (기획, 프로그래밍, 아트, QA 등)\n- 어떤 회사? (대형사, 중소, 스타트업)\n- 언제까지? (올해 하반기, 내년 상반기 등)\n\n[3. 지금까지 해본 것 (What I've done)]\n- 관련 프로젝트 경험\n- 공부한 기술이나 툴 (Unity, Unreal, Figma, Jira 등)\n- 지원 경험 (합격/불합격 포함)\n\n[4. 오늘의 핵심 질문 (What I want to know today)]\n- 1개의 핵심 질문을 명확하게\n- 이 질문에 대한 답을 들으면 다음 행동이 명확해지는 것\n\n[시간 가이드]\n- 커피챗(30분): 자기소개 30초 이내\n- 서류 리뷰(45분): 자기소개 1분 이내 + 서류 배경 설명\n- 모의면접(60분): 자기소개 1분 이내 + 지원 회사/직무 설명",
  },
  // ── 좋은 예시 vs 나쁜 예시 ──
  {
    category: "예시 비교",
    title: "나쁜 예시 1 → 좋은 예시 1: 목표 없는 자기소개",
    content:
      "[나쁜 예시]\n\"저는 게임을 정말 좋아하는 대학생이에요. 어릴 때부터 게임을 많이 했고, 게임 만드는 사람이 되고 싶어서 이 전공을 선택했어요. 근데 뭘 해야 할지 잘 모르겠어서 상담을 신청했어요. 도움 부탁드려요.\"\n\n[왜 나쁜가요?]\n- \"게임을 좋아한다\"는 정보가 너무 막연해요 (대부분의 지원자가 같은 말을 해요)\n- 목표 직무가 없어서 멘토가 어떤 방향으로 조언할지 잡기 어려워요\n- \"뭘 해야 할지 모르겠다\"만으로는 대화 시작점이 없어요\n- 학교/학과/학년 정보가 없어서 상황 파악이 불가해요\n\n[좋은 예시로 변환]\n\"안녕하세요, 이준호입니다. 경희대 소프트웨어융합학과 3학년이에요. 게임 클라이언트 프로그래머를 목표로 하고 있는데, 아직 Unity와 Unreal 중 어떤 엔진에 집중해야 할지 고민이에요.\n\n지금까지 Unity로 간단한 2D 게임 1개를 만들어봤고, C++ 기초는 학교 수업에서 배웠어요. 내년 상반기 취업을 목표로 포트폴리오를 준비하려는데, 오늘은 어떤 엔진에 집중하는 게 취업에 유리한지, 포트폴리오 프로젝트를 어떤 규모로 만들면 좋을지 여쭤보고 싶습니다.\"\n\n[개선 포인트]\n- 학교/학과/학년이 명시됨\n- 목표 직무가 명확함 (클라이언트 프로그래머)\n- 현재 고민이 구체적임 (Unity vs Unreal)\n- 지금까지의 경험이 있음\n- 핵심 질문이 명확함",
  },
  {
    category: "예시 비교",
    title: "나쁜 예시 2 → 좋은 예시 2: 너무 긴 자기소개",
    content:
      "[나쁜 예시]\n\"안녕하세요, 저는 어렸을 때부터 게임을 좋아했고요, 초등학교 때 스타크래프트를 시작으로 WoW, LOL, 메이플스토리 다 해봤어요. 고등학교 때 코딩에 관심이 생겨서 파이썬을 독학했고, 대학교에서는 컴퓨터공학을 전공하고 있어요. 1학년 때는 자바, 2학년 때는 C++을 배웠고, 2학년 2학기에 팀 프로젝트로 Unity 게임을 하나 만들었는데 잘 안 됐어요. 3학년 때는 알고리즘을 열심히 했고, 백준 골드까지 풀었어요. 그리고 인턴을 하려고 했는데 코로나 때문에... (중략)... 그래서 지금은...\"\n\n[왜 나쁜가요?]\n- 자서전이에요, 자기소개가 아니에요 (3분 이상 소요)\n- 멘토가 중요한 정보를 선별하기 어려워요\n- 30분 세션에서 10분을 자기소개에 쓰면 질문 시간이 부족해요\n\n[좋은 예시로 변환]\n\"안녕하세요, 홍길동입니다. OO대 컴공 4학년이고, 게임 서버 프로그래머로 취업을 준비하고 있어요.\n\nC++/Python 기반으로 백준 골드 수준까지 알고리즘을 준비했고, Unity 팀 프로젝트 경험이 1회 있어요. 서버 쪽으로는 아직 깊이가 부족한데, 오늘은 게임 서버 포트폴리오로 어떤 프로젝트를 만들면 좋을지 여쭤보고 싶습니다.\"\n\n[개선 포인트]\n- 30초 이내로 핵심만 전달\n- 불필요한 히스토리 제거\n- 현재 수준과 부족한 점을 솔직하게 언급\n- 질문이 명확함",
  },
  {
    category: "예시 비교",
    title: "나쁜 예시 3 → 좋은 예시 3: 방어적인 자기소개",
    content:
      "[나쁜 예시]\n\"저는 비전공자라서 많이 부족하고요, 나이도 좀 있고, 늦게 시작해서 자신감이 없어요. 포트폴리오도 별로 없고, 다른 지원자들에 비해 경쟁력이 없을 것 같아요. 그래도 열심히 해보려고요...\"\n\n[왜 나쁜가요?]\n- 부정적인 프레이밍으로 시작하면 멘토도 조언하기 어려워요\n- \"부족하다\"만 반복하면 어디서부터 도와야 할지 모르겠어요\n- 자신감 없는 태도가 대화 분위기를 무겁게 만들어요\n- 스스로를 평가하는 건 멘토의 역할이에요, 본인이 먼저 깎아내리지 마세요\n\n[좋은 예시로 변환]\n\"안녕하세요, 김수진입니다. 28살이고 영어영문학 전공 후 현재 게임 3D 아티스트로 전환을 준비하고 있어요.\n\n6개월 전부터 학원에서 3ds Max와 ZBrush를 배우고 있고, 현재 캐릭터 모델링 작업물이 3개 있어요. 비전공이지만 독학 + 학원으로 기초를 다지고 있고, 포트폴리오 완성 후 내년 상반기에 지원할 계획이에요.\n\n오늘은 비전공 3D 아티스트가 포트폴리오에서 특히 신경 써야 할 부분이 뭔지, 어떤 스타일의 작업물이 입사에 유리한지 여쭤보고 싶습니다.\"\n\n[개선 포인트]\n- 사실 기반으로 현재 상황을 설명 (부정적 평가 X)\n- 이미 하고 있는 노력을 보여줌\n- 구체적인 타임라인과 계획이 있음\n- 질문이 실용적이고 구체적임\n\n[기억하세요]\n비전공, 늦은 나이, 경험 부족 — 이런 것들은 약점이 아니에요. 사실이에요.\n사실을 담담하게 말하고, 그 위에서 \"이런 준비를 하고 있다\"고 보여주는 게 가장 좋은 자기소개예요.",
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
  "상황별 템플릿": {
    color: "text-blue-600",
    bgColor: "bg-blue-500/5",
    borderColor: "border-l-blue-500",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  "필수 포함 요소": {
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/5",
    borderColor: "border-l-emerald-500",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  "예시 비교": {
    color: "text-orange-600",
    bgColor: "bg-orange-500/5",
    borderColor: "border-l-orange-500",
    badgeBg: "bg-orange-500/10",
    badgeText: "text-orange-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
};

const categories = ["전체", "상황별 템플릿", "필수 포함 요소", "예시 비교"];

export default function IntroductionGuidePage() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered =
    activeCategory === "전체"
      ? introData
      : introData.filter((item) => item.category === activeCategory);

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
      {/* Header */}
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
          <Link
            href="/mentee/guides"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            가이드 목록
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="relative mb-12 rounded-2xl bg-gradient-to-br from-blue-500/10 via-primary/5 to-accent/5 border border-blue-500/20 p-8 sm:p-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <Link
              href="/mentee/guides"
              className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary mb-4 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              멘티 가이드
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              세션 전 자기소개 작성법
            </h1>
            <p className="text-muted text-lg max-w-2xl">
              상황별 자기소개 템플릿과 좋은/나쁜 예시를 비교해보세요.
              <br className="hidden sm:block" />
              30초 안에 멘토의 마음을 사로잡는 자기소개를 만들어보세요.
            </p>
          </div>
        </div>

        {/* Key Message Box */}
        <div className="flex gap-3 p-4 bg-primary/10 border border-primary/20 rounded-xl mb-10">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-primary text-sm">핵심 원칙</p>
            <p className="text-sm text-foreground/80">자기소개의 목적은 멘토가 <span className="font-bold">내 상황을 빠르게 파악</span>하게 하는 거예요. 자서전이 아니라 <span className="font-bold">현재 상태 + 목표 + 핵심 질문</span>을 30초 이내로 전달하세요.</p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((category) => {
            const config = category !== "전체" ? getCategoryConfig(category) : null;
            return (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  setOpenIndex(null);
                }}
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
        <div className="space-y-3" role="region" aria-label="자기소개 가이드 목록">
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
                    <svg
                      className={`w-5 h-5 text-muted transition-transform duration-200 shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
                    >
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
                            return (
                              <span key={lineIndex}>
                                <span className={`font-bold ${config.color}`}>{header}</span>
                                {rest}{"\n"}
                              </span>
                            );
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

        {/* Divider */}
        <div className="my-12 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/mentee/guides"
            className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            가이드 목록으로
          </Link>
          <Link
            href="/mentee/guides/questions"
            className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors"
          >
            좋은 질문 만들기
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </main>
    </div>
  );
}
