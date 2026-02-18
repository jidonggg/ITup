"use client";

import { useState } from "react";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site-config";
import { LogoIcon } from "@/components/icons";

// =============================================
// 커피챗 활용 가이드 (멘티용) — 메인 페이지
// =============================================

interface GuideItem {
  title: string;
  content: string;
  category: string;
}

const guidesData: GuideItem[] = [
  // ── 멘토 선택법 ──
  {
    category: "멘토 선택법",
    title: "내 상황에 맞는 멘토는 어떻게 고르나요?",
    content:
      "[직무별로 고르기]\n게임 기획자가 되고 싶다면 → 기획 직무 멘토\n게임 프로그래머를 목표로 한다면 → 클라이언트/서버 직무 멘토\n아트 쪽이라면 → 원화/3D/UI 전문 멘토\n\n직무가 아직 명확하지 않다면, \"게임 기획\"이나 \"게임 프로그래밍\" 같은 넓은 직무 태그를 가진 멘토부터 만나보세요. 방향을 잡는 데 도움이 돼요.\n\n[회사별로 고르기]\n목표 회사가 있다면, 해당 회사 출신이나 재직 중인 멘토를 선택하세요.\n예: 넥슨 지원 예정 → 넥슨 재직/출신 멘토\n예: 크래프톤 관심 → 크래프톤 출신 멘토\n\n같은 회사가 아니더라도 비슷한 규모(대형사/중소형사/스타트업)의 멘토라면 채용 과정이나 문화에 대한 인사이트를 얻을 수 있어요.\n\n[경력 수준별로 고르기]\n주니어 멘토 (3-5년): 최근 취업 경험을 생생하게 공유해줘요. 면접 후기, 실무 적응 이야기에 강해요.\n시니어 멘토 (5-10년): 커리어 방향 설정, 이직 전략, 팀 리딩 경험 등 중장기 관점의 조언을 해줘요.\n리드 멘토 (10년+): 업계 전반적인 흐름, 기술 리더십, 조직 문화 이야기를 들을 수 있어요.\n\n[팁] 처음이라면 주니어 멘토부터 시작하는 걸 추천해요. 눈높이가 비슷해서 공감대를 형성하기 쉽고, 가격도 부담이 적어요.",
  },
  {
    category: "멘토 선택법",
    title: "멘토 프로필에서 꼭 확인해야 할 것은?",
    content:
      "[필수 확인 항목]\n1. 현재 직무와 회사 — 내가 원하는 분야와 맞는지\n2. 경력 연차 — 내 상황에 맞는 조언을 줄 수 있는지\n3. 상담 유형 — 커피챗/서류 리뷰/모의면접 중 원하는 상품이 있는지\n4. 리뷰와 평점 — 다른 멘티들의 실제 후기 확인\n5. 자기소개 — 어떤 멘티에게 도움이 되는지 직접 쓴 내용 확인\n\n[보너스 확인 항목]\n- 기술 태그 (Unity, Unreal, C++, C# 등) — 내가 배우고 싶은 기술과 일치하는지\n- 상담 가능 시간대 — 내 스케줄과 맞는지\n- 상담 건수 — 경험이 많은 멘토일수록 진행이 매끄러워요\n\n[주의] 프로필이 너무 짧거나 모호한 멘토는 피하세요. \"게임 업계에서 일합니다\" 같은 소개만 있다면, 다른 멘토를 찾아보는 게 나아요.",
  },
  // ── 세션 전 준비 ──
  {
    category: "세션 전 준비",
    title: "세션 전 준비 체크리스트",
    content:
      "[ ] 1. 멘토 배경 조사하기\n  - 멘토 프로필을 꼼꼼히 읽기 (직무, 경력, 회사)\n  - LinkedIn이나 공개 프로필이 있다면 참고하기\n  - 멘토가 작성한 글이나 발표 자료가 있다면 미리 읽기\n\n[ ] 2. 구체적인 질문 준비하기 (최소 3개, 최대 5개)\n  - \"게임 업계 어때요?\" (X) → \"넥슨 서버 직무 코딩테스트에서 주로 어떤 유형이 나오나요?\" (O)\n  - 질문의 우선순위를 정해두세요 (시간이 부족할 수 있어요)\n\n[ ] 3. 이력서/포트폴리오 준비하기\n  - 서류 리뷰라면 최소 2-3일 전에 멘토에게 전달\n  - 커피챗이라도 최신 이력서를 준비해두면 좋아요\n  - PDF 형태로 정리해두세요\n\n[ ] 4. 현재 상황과 목표 정리하기\n  - 나는 지금 어디에 있는지 (학년, 경력, 현 직장)\n  - 어디로 가고 싶은지 (목표 회사, 목표 직무, 타임라인)\n  - 지금까지 무엇을 해봤는지 (프로젝트, 공부, 지원 경험)\n\n[ ] 5. 기술 환경 점검하기\n  - 카메라, 마이크 테스트\n  - 안정적인 인터넷 환경 확보\n  - 조용한 공간 확보\n  - Google Meet / Zoom 접속 확인\n\n[ ] 6. 메모 도구 준비하기\n  - 노트앱 또는 메모장을 열어두세요\n  - 핵심 키워드 중심으로 빠르게 기록할 준비",
  },
  {
    category: "세션 전 준비",
    title: "멘토에게 사전 메시지를 보내야 하나요?",
    content:
      "신청서에 자기소개와 질문을 잘 작성했다면 추가 메시지는 필수가 아니에요.\n하지만 아래 경우에는 사전에 간단히 보내면 좋아요:\n\n[보내면 좋은 경우]\n- 서류 리뷰를 신청한 경우: 이력서/포트폴리오 파일 전달\n- 질문이 특수한 경우: \"크래프톤 TA 면접 경험을 특히 듣고 싶습니다\"\n- 일정 조율이 필요한 경우: 선호 시간대 안내\n\n[좋은 사전 메시지 예시]\n\"안녕하세요, 다음 주 상담 신청한 OOO입니다. 서류 리뷰를 신청했는데, 이력서 PDF를 미리 보내드려도 될까요? 넥슨 클라이언트 프로그래머에 지원 예정이라 해당 직무에 맞춰 봐주시면 감사하겠습니다.\"\n\n[보내지 않아도 되는 경우]\n- 일반 커피챗으로 가벼운 대화를 원할 때\n- 신청서에 이미 충분한 정보를 적었을 때",
  },
  // ── 세션 진행 팁 ──
  {
    category: "세션 진행 팁",
    title: "30초 자기소개 템플릿",
    content:
      "세션이 시작되면 멘토가 \"간단히 자기소개 부탁해요\"라고 할 거예요.\n이때 길게 말하면 시간이 아까우니, 30초 이내로 핵심만 전달하세요.\n\n[템플릿]\n\"안녕하세요, [이름]입니다.\n현재 [상태: 대학교 3학년 / 2년차 기획자 / 이직 준비 중]이고요,\n[목표: 게임 기획자로 취업 / 클라이언트 프로그래머로 이직]을 준비하고 있어요.\n지금까지 [경험: Unity로 팀 프로젝트 2개 / 모바일 RPG 기획 1년]을 해봤고요,\n오늘은 특히 [핵심 질문: 포트폴리오 방향 / 면접 준비법]에 대해 여쭤보고 싶어요.\"\n\n[좋은 예시]\n\"안녕하세요, 김민수입니다. 대학교 4학년이고 내년 상반기 게임 기획자로 취업을 목표로 하고 있어요. 학교에서 Unity 팀 프로젝트 2개를 했고, 기획 문서 작성 위주로 경험을 쌓고 있어요. 오늘은 기획 포트폴리오에 어떤 걸 넣어야 하는지 구체적으로 여쭤보고 싶습니다.\"\n\n[나쁜 예시]\n\"음... 저는 게임을 좋아하고... 어릴 때부터 게임을 많이 했고... 뭘 해야 할지 잘 모르겠어서 신청했어요...\"\n→ 이러면 멘토가 처음 10분을 상황 파악하느라 쓰게 돼요.",
  },
  {
    category: "세션 진행 팁",
    title: "좋은 질문 vs 나쁜 질문 예시",
    content:
      "[나쁜 질문 → 좋은 질문 변환]\n\n\"게임 업계 어떤가요?\"\n→ \"넥슨 서버 팀에서 신입이 주로 맡는 업무는 어떤 건가요? 실제 하루 일과가 궁금해요.\"\n\n\"포트폴리오 어떻게 해요?\"\n→ \"3D 배경 아티스트 포트폴리오에 꼭 들어가야 하는 필수 항목이 뭔가요? 학교 팀 프로젝트에서 만든 작업물을 넣으려는데 괜찮을까요?\"\n\n\"면접 어렵나요?\"\n→ \"크래프톤 기획 면접에서 실제로 받았던 질문이나, 면접관이 특히 중요하게 보는 포인트가 뭐였나요?\"\n\n\"코딩테스트 어떻게 준비해요?\"\n→ \"넷마블 클라이언트 프로그래머 코딩테스트 난이도가 백준 기준으로 어느 정도인가요? 추천하는 공부 순서가 있을까요?\"\n\n[좋은 질문의 공통점]\n- 구체적인 회사/직무/상황이 명시되어 있어요\n- 멘토의 실제 경험을 물어봐요\n- 검색으로는 알기 어려운 인사이트를 요청해요\n- 예/아니오로 끝나지 않는 열린 질문이에요",
  },
  {
    category: "세션 진행 팁",
    title: "세션 중 효과적으로 메모하는 법",
    content:
      "[메모 원칙]\n전부 받아 적으려 하지 마세요. 대화에 집중하면서 키워드만 빠르게 적으세요.\n\n[추천 메모 형식]\nQ: (내가 한 질문)\nA: (멘토 답변의 핵심 키워드 2-3개)\nTODO: (당장 해야 할 액션)\n\n[예시]\nQ: 기획 포폴에 뭘 넣어야 하나요?\nA: 시스템 기획서 1개 + 레벨 디자인 + 유저 플로우, 질보다 양 아닌 깊이\nTODO: 기존 팀프 기획서를 시스템 기획서 형태로 리팩토링\n\n[팁]\n- 녹음은 멘토 동의 하에만 가능해요\n- 세션 끝나고 바로 30분 이내에 메모를 정리하세요 (기억이 신선할 때)\n- 멘토가 추천한 책, 강의, 사이트는 즉시 적어두세요",
  },
  {
    category: "세션 진행 팁",
    title: "멘토의 조언에 동의하지 않을 때는?",
    content:
      "멘토의 조언이 내 생각과 다를 수 있어요. 이건 정상이에요.\n게임 업계에서도 사람마다 커리어 철학이 달라요.\n\n[이렇게 대처하세요]\n1. 일단 끝까지 들으세요 — 중간에 반박하면 나머지 인사이트를 놓칠 수 있어요\n2. \"다른 의견도 들어봤는데요\" 식으로 부드럽게 물어보세요\n   예: \"다른 분은 대형사보다 스타트업에서 먼저 경험을 쌓으라고 하셨는데, 멘토님은 어떻게 생각하세요?\"\n3. 판단은 세션 후에 — 여러 멘토의 의견을 모아서 종합 판단하세요\n\n[기억하세요]\n- 멘토도 자기 경험 기반으로 이야기하는 거예요. 정답이 아니라 참고 의견이에요.\n- \"감사합니다, 생각해볼게요\"는 항상 좋은 반응이에요.\n- 절대 세션 중에 논쟁하지 마세요. 시간 낭비예요.\n- 다른 멘토와의 추가 세션으로 크로스체크하는 게 가장 좋은 방법이에요.",
  },
  // ── 세션 후 ──
  {
    category: "세션 후",
    title: "도움이 되는 리뷰 작성법",
    content:
      "리뷰는 다른 멘티에게도, 멘토에게도 중요한 피드백이에요.\n좋은 리뷰를 쓰면 멘토가 더 좋은 세션을 준비할 수 있고, 다른 멘티도 멘토를 고르는 데 참고할 수 있어요.\n\n[좋은 리뷰 구성]\n1. 내 상황 한 줄 (어떤 상태에서 상담을 받았는지)\n2. 어떤 도움을 받았는지 구체적으로\n3. 인상적이었던 조언 1-2개\n4. 추천 대상\n\n[좋은 리뷰 예시]\n\"게임 기획 취준생인데, 포트폴리오 방향을 잡는 데 큰 도움이 됐어요. 시스템 기획서를 어떤 구조로 쓰면 좋을지 실무 양식까지 알려주셔서 바로 적용할 수 있었어요. 기획 취준생에게 강력 추천합니다.\"\n\n[도움이 안 되는 리뷰 예시]\n\"좋았습니다.\" / \"감사합니다.\" / \"별로였어요.\"\n→ 이런 리뷰는 아무에게도 도움이 안 돼요.\n\n[별점 가이드]\n5점: 기대 이상으로 도움이 됐다\n4점: 전반적으로 만족하고 유익했다\n3점: 보통이었다 (기대에 못 미침)\n2점: 실질적인 도움이 적었다\n1점: 상담이 제대로 이루어지지 않았다\n\n[만족 보증] 별점 3점 이하라면 만족 보증을 신청할 수 있어요. 세션 완료 후 48시간 이내에 신청하면 크레딧으로 환불받을 수 있습니다.",
  },
  {
    category: "세션 후",
    title: "세션 후 액션 체크리스트",
    content:
      "[ ] 1. 세션 후 30분 이내에 메모 정리하기\n  - 키워드 → 완전한 문장으로 정리\n  - 기억이 흐려지기 전에 빠르게!\n\n[ ] 2. 액션 아이템 추출하기\n  - 멘토가 권한 것 중 당장 실행 가능한 것 뽑기\n  - 1주일 내 할 수 있는 것 / 1달 내 할 수 있는 것 구분\n\n[ ] 3. 리뷰 작성하기\n  - 구체적이고 도움이 되는 리뷰를 남기세요\n  - 멘토에게 감사 인사를 전하는 것도 좋아요\n\n[ ] 4. 추천받은 자료 정리하기\n  - 책, 강의, 유튜브, 웹사이트 등 링크 저장\n  - 바로 북마크하거나 노션에 정리\n\n[ ] 5. 다음 세션 필요 여부 판단하기\n  - 추가 질문이 생겼다면 다음 세션 예약 고려\n  - 다른 직무/관점의 멘토와도 만나보기\n  - 액션 실행 후 피드백을 받기 위한 후속 세션도 효과적",
  },
  {
    category: "세션 후",
    title: "다음 세션은 언제 잡는 게 좋을까요?",
    content:
      "[즉시 다시 잡아야 하는 경우]\n- 서류 리뷰 후 수정본을 다시 봐달라고 할 때\n- 모의면접 후 개선 사항을 반영하고 재시도할 때\n- 이번 세션에서 시간이 부족해서 질문을 못 한 게 있을 때\n\n[2-4주 후에 잡으면 좋은 경우]\n- 이번 세션의 액션 아이템을 실행한 뒤 피드백을 받고 싶을 때\n- 포트폴리오를 수정/보강한 후 다시 봐달라고 할 때\n- 면접 대비 연습을 충분히 한 후 실전 모의면접을 할 때\n\n[다른 멘토를 만나보면 좋은 경우]\n- 같은 질문을 다른 관점에서 듣고 싶을 때\n- 다른 회사/직무에 대한 정보가 필요할 때\n- 현재 멘토와 케미가 잘 안 맞다고 느낄 때\n\n[팁] \"같은 멘토 3회 + 다른 멘토 1회\" 조합이 가장 효과적이에요. 같은 멘토와 연속 세션으로 깊이 있는 피드백을 받고, 가끔 다른 멘토의 관점도 들어보세요.",
  },
  // ── 에티켓 ──
  {
    category: "에티켓",
    title: "멘티가 지켜야 할 기본 에티켓",
    content:
      "[시간 약속]\n- 정시에 접속하세요. 5분 전에 미팅 링크를 확인하고 대기해주세요.\n- 늦을 것 같으면 반드시 미리 연락하세요.\n- 10분 이상 늦으면 잔여 시간만큼만 진행돼요.\n\n[태도]\n- 카메라를 켜주세요 (멘토와 대화할 때 훨씬 자연스러워요)\n- 질문을 준비해와 주세요 (\"뭐 물어볼지 모르겠어요\"는 시간 낭비예요)\n- 멘토의 말을 끝까지 들어주세요\n- 감사 인사를 잊지 마세요\n\n[금지사항]\n- 세션 녹음/녹화는 멘토 동의 없이 절대 금지\n- 멘토의 개인 연락처(카톡, 전화번호)를 요청하지 마세요\n- 플랫폼 외부에서의 무료 상담을 요청하지 마세요\n- 다른 멘토를 비방하지 마세요\n- 채용 청탁이나 추천서 요청은 부적절해요\n\n[취소/변경]\n- 일정 변경은 최소 24시간 전에 해주세요\n- 당일 취소나 노쇼는 환불이 안 되고, 멘토에게도 피해가 돼요\n- 부득이한 사정이 생기면 최대한 빨리 연락해주세요",
  },
  // ── 서브 가이드 안내 ──
  {
    category: "더 알아보기",
    title: "자기소개 작성법 (상황별 템플릿)",
    content:
      "대학생, 주니어, 이직자, 시니어 등 각 상황에 맞는 자기소개 템플릿과 좋은 예시/나쁜 예시를 정리해두었어요.\n\n→ 자세한 내용은 \"세션 전 자기소개 작성법\" 가이드를 확인해주세요.\n\n[바로가기] /mentee/guides/introduction",
  },
  {
    category: "더 알아보기",
    title: "좋은 질문 만들기 가이드",
    content:
      "직무별, 상황별로 좋은 질문과 나쁜 질문을 비교해두었어요. 커리어, 기술, 회사 문화, 포트폴리오, 면접 등 카테고리별 질문 예시가 있어요.\n\n→ 자세한 내용은 \"좋은 질문 만들기\" 가이드를 확인해주세요.\n\n[바로가기] /mentee/guides/questions",
  },
  {
    category: "더 알아보기",
    title: "직무별 준비 가이드",
    content:
      "게임 기획자, 프로그래머, 아티스트, QA, 마케팅/사업 등 직무별로 준비해야 할 것과 포트폴리오 항목, 핵심 스킬, 면접 주제를 정리해두었어요.\n\n→ 자세한 내용은 \"직무별 준비 가이드\"를 확인해주세요.\n\n[바로가기] /mentee/guides/roles",
  },
  {
    category: "더 알아보기",
    title: "멘토링 후 액션 플랜 템플릿",
    content:
      "멘토링에서 받은 조언을 정리하고, 우선순위 매트릭스와 주간 액션 플랜을 세우는 방법을 안내해요.\n\n→ 자세한 내용은 \"멘토링 후 액션 플랜\" 가이드를 확인해주세요.\n\n[바로가기] /mentee/guides/action-plan",
  },
  {
    category: "더 알아보기",
    title: "멘토링 FAQ (멘티용)",
    content:
      "\"조언이 서로 다르면 어떡하죠?\", \"세션이 별로였으면요?\", \"연봉을 물어봐도 되나요?\" 등 멘티들이 자주 궁금해하는 질문과 답변을 모았어요.\n\n→ 자세한 내용은 \"멘토링 FAQ\" 가이드를 확인해주세요.\n\n[바로가기] /mentee/guides/faq",
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
  "멘토 선택법": {
    color: "text-blue-600",
    bgColor: "bg-blue-500/5",
    borderColor: "border-l-blue-500",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  "세션 전 준비": {
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/5",
    borderColor: "border-l-emerald-500",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  "세션 진행 팁": {
    color: "text-primary",
    bgColor: "bg-primary/5",
    borderColor: "border-l-primary",
    badgeBg: "bg-primary/10",
    badgeText: "text-primary",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  "세션 후": {
    color: "text-orange-600",
    bgColor: "bg-orange-500/5",
    borderColor: "border-l-orange-500",
    badgeBg: "bg-orange-500/10",
    badgeText: "text-orange-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  "에티켓": {
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
  "더 알아보기": {
    color: "text-violet-600",
    bgColor: "bg-violet-500/5",
    borderColor: "border-l-violet-500",
    badgeBg: "bg-violet-500/10",
    badgeText: "text-violet-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
};

const categories = [
  "전체",
  "멘토 선택법",
  "세션 전 준비",
  "세션 진행 팁",
  "세션 후",
  "에티켓",
  "더 알아보기",
];

const STATS = [
  { value: "6개", label: "가이드 카테고리", sublabel: "단계별 안내" },
  { value: "30초", label: "자기소개 템플릿", sublabel: "핵심만 전달" },
  { value: "15+", label: "질문 예시", sublabel: "좋은 질문 가이드" },
];

const SUB_GUIDES = [
  {
    href: "/mentee/guides/introduction",
    title: "자기소개 작성법",
    description: "대학생, 주니어, 이직자 등 상황별 30초 자기소개 템플릿과 좋은/나쁜 예시 비교",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: "from-primary to-primary-dark",
  },
  {
    href: "/mentee/guides/questions",
    title: "좋은 질문 만들기",
    description: "커리어, 기술, 회사 문화, 포트폴리오, 면접 등 직군별 추천 질문 리스트",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "from-primary to-primary-dark",
  },
  {
    href: "/mentee/guides/roles",
    title: "직무별 준비 가이드",
    description: "프로그래밍, 기획, 아트, QA, 마케팅 등 게임 업계 직군별 취업 준비 로드맵",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    color: "from-primary to-primary-dark",
  },
  {
    href: "/mentee/guides/action-plan",
    title: "액션 플랜 템플릿",
    description: "멘토링 후 메모 정리, 우선순위 매트릭스, 주간 실행 계획 수립 방법",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    color: "from-primary to-primary-dark",
  },
  {
    href: "/mentee/guides/faq",
    title: "멘토링 FAQ",
    description: "결제/환불, 세션 진행, 멘토 검증 등 서비스 이용에 대한 자주 묻는 질문과 답변",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "from-primary to-primary-dark",
  },
];

export default function MenteeGuidesPage() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered =
    activeCategory === "전체"
      ? guidesData
      : guidesData.filter((item) => item.category === activeCategory);

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
            href="/mentors"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            멘토 둘러보기
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="relative mb-12 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border border-primary/20 p-8 sm:p-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary font-medium mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              멘티 필수 가이드
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              커피챗 활용 가이드
            </h1>
            <p className="text-muted text-lg max-w-2xl">
              멘토링 세션을 200% 활용하는 방법을 알려드려요.
              <br className="hidden sm:block" />
              준비부터 세션 진행, 후속 조치까지 한눈에 확인하세요.
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

        {/* Sub-guide Cards */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            상세 가이드 바로가기
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SUB_GUIDES.map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="group flex items-start gap-3 p-4 bg-card-bg border border-card-border rounded-xl hover:border-primary/50 hover:shadow-md transition-all duration-200"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${guide.color} flex items-center justify-center shrink-0 text-white group-hover:scale-110 transition-transform`}>
                  {guide.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors">{guide.title}</p>
                  <p className="text-xs text-muted mt-0.5">{guide.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="flex gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-emerald-700 text-sm">핵심 팁</p>
              <p className="text-sm text-foreground/80">질문은 <span className="font-bold text-emerald-700">구체적으로</span> 준비하세요. &quot;게임 업계 어때요?&quot; 대신 특정 회사/직무를 언급하면 10배 유익해요.</p>
            </div>
          </div>
          <div className="flex gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-amber-700 text-sm">시간은 금</p>
              <p className="text-sm text-foreground/80">30분 세션에서 자기소개는 <span className="font-bold text-amber-700">30초 이내</span>로. 준비된 질문 3-4개면 충분해요.</p>
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
        <div className="space-y-3" role="region" aria-label="멘티 가이드 목록">
          {filtered.map((item, index) => {
            const isOpen = openIndex === index;
            const contentId = `guide-content-${index}`;
            const headerId = `guide-header-${index}`;
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
                    onClick={() => setOpenIndex(isOpen ? null : index)}
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
                      className={`w-5 h-5 text-muted transition-transform duration-200 shrink-0 ml-2 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
                            // Section headers in brackets
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
                            // Lines with (X) markers
                            if (line.includes("(X)")) {
                              return (
                                <span key={lineIndex} className="text-red-500/80">
                                  {line}
                                  {"\n"}
                                </span>
                              );
                            }
                            // Lines with (O) markers
                            if (line.includes("(O)")) {
                              return (
                                <span key={lineIndex} className="text-emerald-600/80">
                                  {line}
                                  {"\n"}
                                </span>
                              );
                            }
                            // Sub-guide link lines: [바로가기] /path
                            if (line.startsWith("[바로가기]")) {
                              const path = line.replace("[바로가기]", "").trim();
                              return (
                                <span key={lineIndex} className="block my-2">
                                  <Link
                                    href={path}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                    자세히 보기
                                  </Link>
                                  {"\n"}
                                </span>
                              );
                            }
                            // Arrow transform lines
                            if (line.startsWith("→")) {
                              return (
                                <span key={lineIndex} className="text-primary font-medium">
                                  {line}
                                  {"\n"}
                                </span>
                              );
                            }
                            // Checklist items
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

        {/* Contact */}
        <div className="text-center bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-8">
          <h2 className="text-xl font-semibold mb-2">
            추가로 궁금한 점이 있으신가요?
          </h2>
          <p className="text-muted mb-6">
            가이드에서 찾지 못한 내용이 있다면 편하게 문의해주세요.
          </p>
          <a
            href={`mailto:${SITE_CONFIG.contactEmail.support}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-dark transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            이메일 문의
          </a>
        </div>

        {/* Back */}
        <div className="mt-8 text-center">
          <Link
            href="/mentors"
            className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            멘토 둘러보기
          </Link>
        </div>
      </main>
    </div>
  );
}
