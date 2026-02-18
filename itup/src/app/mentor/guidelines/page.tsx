"use client";

import { useState } from "react";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site-config";
import { LogoIcon } from "@/components/icons";

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
      "약속한 시간을 정확히 지켜주세요. 최소 시간: 커피챗 30분, 이력서 첨삭 50분, 모의면접 60분. 녹음/녹화는 상호 동의 하에만 가능합니다.",
  },
  {
    category: "품질 기준",
    title: "상담 후에 해야 할 일은?",
    content:
      "이력서/포폴 첨삭: 3일 이내에 서면 피드백 전달.\n모의면접: 2일 이내에 피드백 리포트 전달.\n커피챗: 추가 질문 1회 대응.",
  },
  {
    category: "품질 기준",
    title: "평점이 낮으면 어떻게 되나요?",
    content:
      "평균 평점 4.0 미만이 3개월 이상 지속되면 개선 안내를 드려요. 3.5 미만이면 활동이 일시 정지될 수 있어요. 별점 1-2점 리뷰가 달리면 운영팀에서 상황을 확인하고 연락드립니다.",
  },
  // 수익/정산
  {
    category: "수익/정산",
    title: "수수료는 얼마인가요?",
    content:
      "플랫폼 수수료 15% (기본). 멘토는 상품 가격의 85%를 수령합니다. 완료 건수가 늘어나면 수수료가 낮아져요 (10건+ 12%, 50건+ 10%, 200건+ 8%). 정산은 매주 월요일 진행됩니다.",
  },
  {
    category: "수익/정산",
    title: "티어별 가격은 어떻게 되나요?",
    content:
      "경력에 따라 주니어(3-5년, 1.0x), 시니어(5-10년, 1.5x), 리드(10년+, 2.0x) 등급이 적용돼요.\n예: 커피챗 — 주니어 25,000원, 시니어 38,000원, 리드 50,000원.\n예: 모의면접 — 주니어 80,000원, 시니어 120,000원, 리드 160,000원.",
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
  // 실전 매뉴얼
  {
    category: "실전 매뉴얼",
    title: "커피챗 (30분) 진행 가이드",
    content:
      "[시간 배분]\n00:00~03:00 — 인사 & 아이스브레이킹\n03:00~05:00 — 목표 확인 (\"오늘 가장 궁금한 것 하나만 뽑으면?\")\n05:00~22:00 — 핵심 대화 (질문당 3-5분, 최대 3-4개)\n22:00~25:00 — 추가 질문 & 정리\n25:00~28:00 — 액션 아이템 & 클로징\n28:00~30:00 — 마무리 인사\n\n[오프닝 스크립트]\n\"안녕하세요! 반갑습니다. 오늘 상담 신청해주셔서 감사해요. 먼저 현재 상황이랑 오늘 가장 듣고 싶은 이야기가 뭔지 말씀해주시면 그에 맞춰 진행할게요.\"\n\n[클로징 스크립트]\n\"오늘 핵심을 정리하면: 1) ... 2) ... 3) ... 이에요. 당장 해보시면 좋을 건 [액션아이템]이에요. 피드백 페이지에 정리해서 남겨드릴게요. 좋은 결과 있으시길 바랍니다!\"\n\n[주의]\n- 30분은 짧습니다. 시계를 보며 진행하세요.\n- 한 질문에 10분 이상 쓰지 마세요.\n- 멘티가 말이 없으면 \"혹시 OO에 대해서도 궁금하세요?\" 식으로 유도하세요.",
  },
  {
    category: "실전 매뉴얼",
    title: "서류 리뷰 (45분) 진행 가이드",
    content:
      "[사전 준비 — 상담 2-3일 전]\n멘티에게 서류 사전 제출을 요청하세요. 서류를 읽으며 메모:\n(1) 즉시 고쳐야 할 치명적 문제 3개 (2) 구조/포맷 개선점 (3) 내용 강화 포인트 (4) 잘 된 부분 2개 이상\n\n[시간 배분]\n00:00~03:00 — 인사 & 목표 확인 (\"어떤 회사/직무에 지원하시나요?\")\n03:00~08:00 — 긍정 피드백 먼저 (절대 건너뛰지 마세요!)\n08:00~28:00 — 개선점 상세 리뷰 (화면공유, 섹션별 순서대로)\n28:00~35:00 — 우선순위 정리 (\"가장 중요한 3가지는...\")\n35:00~42:00 — 수정 방향 합의 + 구체적 수정 계획\n42:00~45:00 — 마무리 + 참고 자료 공유\n\n[피드백 원칙 — Sandwich Method]\n칭찬 → 개선점 → 격려 순서로 전달하세요.\n\"이 부분이 별로예요\" (X) → \"이 부분을 OO로 바꾸면 더 효과적이에요\" (O)\n\"너무 부족해요\" (X) → \"기본기가 있으니 OO를 보강하면 좋겠어요\" (O)\n\n[서류를 안 가져온 경우]\n\"괜찮아요, 오늘은 방향을 잡는 시간으로 활용해볼까요? 지원 직무에서 보는 이력서 포인트를 설명드릴게요.\"",
  },
  {
    category: "실전 매뉴얼",
    title: "모의 면접 (60분) 진행 가이드",
    content:
      "[사전 준비 — 상담 3일 전]\n멘티 지원 직무/회사 확인 후, 질문 최소 10개 준비:\n- 기술 질문 5개 + 경험/행동 질문 3개 + 인성 질문 2개\n\n[시간 배분]\n00:00~05:00 — 사전 안내 (\"실제 면접처럼 진행할게요\")\n05:00~07:00 — 자기소개 요청\n07:00~20:00 — 기술 질문 (3-5개, 꼬리질문으로 깊이 확인)\n20:00~30:00 — 경험/행동 질문 (STAR 기법 유도)\n30:00~35:00 — 인성/문화적합 질문\n— 면접 종료 —\n35:00~37:00 — 전환 (\"수고하셨어요! 면접관 모드 끝이에요\")\n37:00~55:00 — 상세 피드백 (질문별 복기 + 모범 답변 예시)\n55:00~58:00 — 종합 평가 & 액션 플랜\n58:00~60:00 — 마무리\n\n[면접관 역할 가이드]\n- 면접 중에는 포커페이스 유지 (좋아도 \"네, 다음 질문입니다\")\n- 모르겠다 하면 \"알고 있는 범위에서만 설명해주세요\"\n- 피드백 파트에서는 모드 완전 전환: 따뜻하고 구체적으로\n- 합격 가능성 솔직하게 평가하되 부드럽게",
  },
  {
    category: "실전 매뉴얼",
    title: "멘티가 준비 안 되어있을 때 대처법",
    content:
      "[질문이 없거나 목표가 불분명할 때]\n구체적 질문으로 전환하세요:\n\"혹시 취업 준비 중이세요, 아니면 아직 탐색 중이세요?\"\n\"보통 이 시기에 고민하시는 분들은 A) 어떤 회사에 지원할지 B) 실력이 충분한지 C) 포트폴리오를 어떻게 만들지 — 이 중 어디에 가까우세요?\"\n\n[서류 리뷰인데 서류를 안 가져온 경우]\n방향 잡기 시간으로 전환하세요. 시간을 낭비하지 않되, 멘티가 돈을 쓴 만큼의 가치는 전달하세요.\n\n[모의면접인데 기본기가 전혀 없는 경우]\n\"오늘은 면접 주제별 로드맵을 짜드릴게요. 2-4주 준비하신 후 다시 모의면접을 잡으시면 훨씬 효과적일 거예요.\"\n\n[멘티가 5분 이상 늦게 접속한 경우]\n5분 후 메시지 전송, 10분까지 대기 (노쇼 기준). 늦게 접속하면 잔여 시간만큼 진행.\n\n[멘티가 감정적이거나 불만을 표시하는 경우]\n경청 먼저 → 공감 표현 → 해결 방향 제시. 절대 방어적 태도, 상대 탓, 감정적 대응 하지 마세요.",
  },
  // 프로필 작성법
  {
    category: "프로필 작성법",
    title: "프로필 잘 쓰는 법",
    content:
      "[나쁜 예시]\n\"게임 업계에서 일하고 있습니다. 궁금한 점 물어보세요.\"\n→ 어떤 분야인지, 몇 년 차인지, 어떤 도움을 줄 수 있는지 없음\n\n[좋은 예시]\n\"넥슨에서 6년째 서버 프로그래머로 일하고 있어요. 메이플스토리 라이브 서비스 팀에서 대규모 트래픽 처리와 실시간 게임 서버 최적화를 담당하고 있습니다.\n\n이전에 스마일게이트에서 신작 MMORPG 서버 개발을 2년 했고, 런칭 경험이 있어요. 게임 서버 직무 취업/이직을 준비하시는 분, 포트폴리오에 어떤 프로젝트를 넣어야 할지 고민이신 분들에게 특히 도움이 될 거예요.\"\n\n[작성 팁]\n- 구체적 회사, 연차, 직무 명시\n- 핵심 경험과 기술 스택 언급\n- 어떤 멘티에게 도움이 되는지 명확히\n- 기술 태그는 실무에서 매일 사용하는 것 위주 (5-7개)\n- 상담 가능 시간은 최소 주 3-4슬롯, 평일 저녁(19-22시)과 주말 오전이 수요 많음",
  },
  // 첫 상담 준비
  {
    category: "첫 상담 준비",
    title: "멘토 첫 상담 체크리스트",
    content:
      "[ ] 1. 프로필 완성도 확인\n  - 자기소개 200자 이상 작성\n  - 전문 분야 최소 3개 이상 태그\n  - 상담 가능 시간 최소 주 3슬롯 등록\n\n[ ] 2. 상품 설정 확인\n  - 최소 1개 상품 활성화 및 가격 설정\n  - 본인 경력에 맞는 상품인지 확인\n\n[ ] 3. 도구 준비\n  - Google Meet 또는 Zoom 계정 확인\n  - 카메라, 마이크, 화면공유 테스트\n  - 조용하고 밝은 상담 공간 확보\n\n[ ] 4. 첫 예약이 들어오면\n  - 멘티 소개, 목표, 질문 목록을 반드시 사전에 읽기\n  - 미팅 링크 생성 후 \"확정\" 클릭\n  - 상담 24시간 전에 한번 더 준비 상태 점검",
  },
];

// Category config with colors and icons
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
  "응답 시간": {
    color: "text-blue-600",
    bgColor: "bg-blue-500/5",
    borderColor: "border-l-blue-500",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  "취소/노쇼": {
    color: "text-orange-600",
    bgColor: "bg-orange-500/5",
    borderColor: "border-l-orange-500",
    badgeBg: "bg-orange-500/10",
    badgeText: "text-orange-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  "품질 기준": {
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/5",
    borderColor: "border-l-emerald-500",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  "수익/정산": {
    color: "text-primary",
    bgColor: "bg-primary/5",
    borderColor: "border-l-primary",
    badgeBg: "bg-primary/10",
    badgeText: "text-primary",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  "금지사항": {
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
  "실전 매뉴얼": {
    color: "text-accent",
    bgColor: "bg-accent/5",
    borderColor: "border-l-accent",
    badgeBg: "bg-accent/10",
    badgeText: "text-accent",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  "프로필 작성법": {
    color: "text-violet-600",
    bgColor: "bg-violet-500/5",
    borderColor: "border-l-violet-500",
    badgeBg: "bg-violet-500/10",
    badgeText: "text-violet-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  "첫 상담 준비": {
    color: "text-amber-600",
    bgColor: "bg-amber-500/5",
    borderColor: "border-l-amber-500",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
};

const categories = [
  "전체",
  "응답 시간",
  "취소/노쇼",
  "품질 기준",
  "수익/정산",
  "금지사항",
  "실전 매뉴얼",
  "프로필 작성법",
  "첫 상담 준비",
];

// Stats for the hero section
const STATS = [
  { value: "85%", label: "멘토 수령률", sublabel: "수수료 15%" },
  { value: "24h", label: "응답 시간", sublabel: "이내 확인" },
  { value: "8개", label: "가이드 카테고리", sublabel: "핵심 규칙" },
];

export default function MentorGuidelinesPage() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered =
    activeCategory === "전체"
      ? guidelinesData
      : guidelinesData.filter((item) => item.category === activeCategory);

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
            href="/mentor/dashboard"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            대시보드
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section with Gradient */}
        <div className="relative mb-12 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border border-primary/20 p-8 sm:p-10 overflow-hidden">
          {/* Decorative background circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary font-medium mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              멘토 필수 가이드
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              멘토 가이드라인
            </h1>
            <p className="text-muted text-lg max-w-2xl">
              멘토 활동에 필요한 규칙과 안내를 확인해보세요.
              <br className="hidden sm:block" />
              성공적인 멘토링의 핵심을 한눈에 파악할 수 있습니다.
            </p>
          </div>

          {/* Stats Row */}
          <div className="relative grid grid-cols-3 gap-4 mt-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="bg-card-bg/80 backdrop-blur-sm border border-card-border rounded-xl p-4 text-center">
                <p className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm font-medium text-foreground">{stat.label}</p>
                <p className="text-xs text-muted">{stat.sublabel}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Highlight Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {/* Tip Box */}
          <div className="flex gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-amber-700 text-sm">핵심 팁</p>
              <p className="text-sm text-foreground/80">멘티 신청은 <span className="font-bold text-amber-700">24시간 이내</span> 확인, 미응답 72시간 시 자동 취소</p>
            </div>
          </div>

          {/* Warning Box */}
          <div className="flex gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-red-700 text-sm">경고 누적</p>
              <p className="text-sm text-foreground/80">경고 <span className="font-bold text-red-700">3회</span> 시 일시정지(2주), <span className="font-bold text-red-700">5회</span> 시 영구정지</p>
            </div>
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

        {/* Active Category Description */}
        {activeCategory !== "전체" && (
          <div className={`mb-6 p-4 rounded-xl border-l-4 ${getCategoryConfig(activeCategory).borderColor} ${getCategoryConfig(activeCategory).bgColor}`}>
            <div className="flex items-center gap-2">
              <span className={getCategoryConfig(activeCategory).color}>
                {getCategoryConfig(activeCategory).icon}
              </span>
              <span className={`font-semibold ${getCategoryConfig(activeCategory).color}`}>
                {activeCategory}
              </span>
              <span className="text-sm text-muted">
                - {filtered.length}개 항목
              </span>
            </div>
          </div>
        )}

        {/* Guidelines List */}
        <div className="space-y-3" role="region" aria-label="멘토 가이드라인 목록">
          {filtered.map((item, index) => {
            const isOpen = openIndex === index;
            const contentId = `guideline-content-${index}`;
            const headerId = `guideline-header-${index}`;
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
                    id={headerId}
                    onClick={() =>
                      setOpenIndex(isOpen ? null : index)
                    }
                    className="w-full px-6 py-4 flex items-center justify-between text-left cursor-pointer hover:bg-secondary/30 transition-colors"
                    aria-expanded={isOpen}
                    aria-controls={contentId}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 ${config.badgeBg} ${config.badgeText} rounded-full font-medium`}>
                        {config.icon}
                        {item.category}
                      </span>
                      <span className="font-medium">{item.title}</span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-muted transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </h3>
                <div
                  id={contentId}
                  role="region"
                  aria-labelledby={headerId}
                  hidden={!isOpen}
                >
                  {isOpen && (
                    <div className="px-6 pb-5">
                      <div className={`pt-4 border-t ${config.borderColor.replace("border-l-", "border-")}/30`}>
                        <div className="text-foreground/80 leading-relaxed whitespace-pre-line text-[15px]">
                          {item.content.split("\n").map((line, lineIndex) => {
                            // Style section headers in brackets
                            if (line.startsWith("[") && line.includes("]")) {
                              const bracketEnd = line.indexOf("]");
                              const header = line.substring(0, bracketEnd + 1);
                              const rest = line.substring(bracketEnd + 1);
                              return (
                                <span key={lineIndex}>
                                  <span className={`font-bold ${config.color}`}>{header}</span>
                                  {rest}
                                  {"\n"}
                                </span>
                              );
                            }
                            // Style time stamps (00:00~05:00 pattern)
                            if (/^\d{2}:\d{2}~\d{2}:\d{2}/.test(line.trim())) {
                              const dashIndex = line.indexOf("—");
                              if (dashIndex !== -1) {
                                return (
                                  <span key={lineIndex}>
                                    <span className="font-mono text-sm bg-secondary/80 px-1.5 py-0.5 rounded text-primary">{line.substring(0, dashIndex).trim()}</span>
                                    <span className="text-muted"> — </span>
                                    {line.substring(dashIndex + 1).trim()}
                                    {"\n"}
                                  </span>
                                );
                              }
                            }
                            // Style bullet items with key numbers
                            if (/^\d+건\+/.test(line.trim()) || /경고 \d+회/.test(line)) {
                              return (
                                <span key={lineIndex} className="font-medium">
                                  {line}
                                  {"\n"}
                                </span>
                              );
                            }
                            // Style lines with (X) or (O) markers
                            if (line.includes("(X)")) {
                              return (
                                <span key={lineIndex} className="text-red-500/80">
                                  {line}
                                  {"\n"}
                                </span>
                              );
                            }
                            if (line.includes("(O)")) {
                              return (
                                <span key={lineIndex} className="text-emerald-600/80">
                                  {line}
                                  {"\n"}
                                </span>
                              );
                            }
                            // Style checklist items
                            if (line.trimStart().startsWith("[ ]")) {
                              return (
                                <span key={lineIndex} className="flex items-start gap-2 my-0.5">
                                  <span className="w-4 h-4 mt-1 rounded border-2 border-primary/40 shrink-0 inline-block" />
                                  <span>{line.replace(/^\s*\[ \]\s*/, "")}</span>
                                  {"\n"}
                                </span>
                              );
                            }
                            return (
                              <span key={lineIndex}>
                                {line}
                                {"\n"}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Gradient Divider */}
        <div className="my-12 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        {/* Revenue Highlight Section */}
        <div className="mb-12 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border border-primary/20 p-6 sm:p-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            수수료 혜택 한눈에 보기
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { tier: "기본", fee: "15%", earn: "85%", condition: "시작" },
              { tier: "10건+", fee: "12%", earn: "88%", condition: "10건 완료" },
              { tier: "50건+", fee: "10%", earn: "90%", condition: "50건 완료" },
              { tier: "200건+", fee: "8%", earn: "92%", condition: "200건 완료" },
            ].map((item) => (
              <div key={item.tier} className="bg-card-bg border border-card-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                <p className="text-xs text-muted font-medium mb-1">{item.condition}</p>
                <p className="text-2xl font-bold text-primary">{item.earn}</p>
                <p className="text-xs text-muted">수령률</p>
                <p className="text-xs text-foreground/60 mt-1">수수료 {item.fee}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="text-center bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-2">
            궁금한 점이 있으신가요?
          </h2>
          <p className="text-muted mb-6">
            가이드라인 관련 문의는 편하게 연락주세요.
          </p>
          <a
            href={`mailto:${SITE_CONFIG.contactEmail.support}`}
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
