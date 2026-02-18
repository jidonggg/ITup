"use client";

import { useState } from "react";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site-config";
import { LogoIcon } from "@/components/icons";

// =============================================
// 멘토링 후 액션 플랜 가이드
// =============================================

interface ActionItem {
  title: string;
  content: string;
  category: string;
}

const actionData: ActionItem[] = [
  // ── 메모 정리법 ──
  {
    category: "메모 정리법",
    title: "세션 직후 30분 이내에 해야 할 것",
    content:
      "[왜 30분인가? — 망각 곡선의 심리학]\n에빙하우스 망각 곡선에 따르면 사람은 새로운 정보를 접한 후 20분 만에 42%를 잊고, 1시간 후에는 56%를 잊어요. 멘토가 해준 핵심 조언도 예외가 아니에요. 세션이 끝나고 \"나중에 정리해야지\" 하면 이미 절반 이상이 사라진 뒤예요.\n\n30분 안에 메모를 정리하면 기억 보존율이 80% 이상으로 올라가요. 이 골든타임을 절대 놓치지 마세요.\n\n[세션 직후 즉시 체크리스트]\n[ ] 조용한 카페나 자리에 앉아서 메모 앱을 열었다\n[ ] 멘토가 강조한 핵심 키워드 3개를 먼저 적었다\n[ ] \"이건 꼭 해봐\"라고 말한 액션 아이템을 적었다\n[ ] 추천받은 자료(책, 강의, 사이트, 사람)를 적었다\n[ ] 세션 중 떠오른 추가 질문을 적었다\n[ ] 다음에 만나면 공유할 진행 상황을 메모했다\n\n[30분 메모 정리 템플릿]\n\n날짜: ____년 __월 __일\n멘토: ________ (회사/직무/연차)\n세션 유형: 커피챗 / 서류 리뷰 / 모의면접\n\n[핵심 인사이트 Top 3]\n1. ___________________________\n2. ___________________________\n3. ___________________________\n\n[추천받은 자료/리소스]\n- 책: ___________________________\n- 강의: ___________________________\n- 사이트: ___________________________\n- 참고할 사람/채널: _________________\n\n[즉시 실행할 액션 아이템]\n- ___________________________\n- ___________________________\n\n[추가로 알아볼 것]\n- ___________________________\n\n[다음 세션에서 물어볼 질문]\n- ___________________________\n\n→ 이 템플릿을 노션, 구글 독스, 메모장 어디든 복사해서 쓰세요. 세션마다 하나씩 쌓이면 나만의 커리어 데이터베이스가 만들어져요.",
  },
  {
    category: "메모 정리법",
    title: "멘토 조언을 체계적으로 분류하는 법",
    content:
      "멘토에게 받은 조언이 많으면 \"뭐부터 해야 하지?\"가 돼요. 4가지 분류 프레임워크를 쓰면 즉시 정리가 돼요.\n\n[4가지 분류 프레임워크]\n\n[1. Do Now — 오늘~이번 주 안에 실행]\n바로 할 수 있고, 긴급한 것들이에요.\n- 게임 업계 예시: 이번 주 금요일 마감인 넥슨 공채 지원서 작성\n- 게임 업계 예시: 멘토가 추천한 GDC Vault 강연 1개 시청\n- 게임 업계 예시: 포트폴리오 오탈자/링크 깨진 것 즉시 수정\n\n[2. Do Soon — 1~4주 안에 실행]\n중요하지만 당장은 아닌 것들이에요.\n- 게임 업계 예시: Unity로 프로토타입 1개 완성하기\n- 게임 업계 예시: 시스템 기획서 초안 작성 시작\n- 게임 업계 예시: 백준 골드 레벨 알고리즘 문제 20개 풀기\n\n[3. Do Later — 1~3개월 안에 실행]\n장기적으로 중요하지만 지금 시작하면 산만해지는 것들이에요.\n- 게임 업계 예시: Unreal Engine C++ 학습 시작 (현재 Unity 집중 중)\n- 게임 업계 예시: 영문 이력서/포트폴리오 제작 (해외 취업 대비)\n- 게임 업계 예시: 게임잼 참가 (팀 프로젝트 경험 쌓기)\n\n[4. Note — 참고용으로 기록만]\n지금 당장 실행할 건 아니지만 나중에 유용할 수 있는 정보예요.\n- 게임 업계 예시: \"크래프톤은 면접에서 문제 해결 과정을 특히 본다\"\n- 게임 업계 예시: \"서버 프로그래머는 3년차부터 몸값이 급상승한다\"\n- 게임 업계 예시: \"인디 게임 출시 경험이 대형사 면접에서 큰 플러스\"\n\n→ 멘토에게 받은 모든 조언을 이 4가지 중 하나에 넣어보세요. 5분이면 혼란이 정리돼요.",
  },
  // ── 우선순위 매트릭스 ──
  {
    category: "우선순위 매트릭스",
    title: "아이젠하워 매트릭스로 우선순위 정하기",
    content:
      "할 일은 많은데 시간은 한정돼 있을 때, 아이젠하워 매트릭스로 정리하세요.\n\n[1사분면: 긴급하고 중요함 — 즉시 실행]\n마감이 코앞이고 커리어에 직접적 영향이 있는 일이에요.\n- 이번 주 마감인 넥슨/크래프톤 공채 지원서 제출\n- 내일 모의면접 세션 대비 답변 스크립트 준비\n- 포트폴리오에 치명적 버그 발견 → 즉시 수정\n- 멘토가 \"이건 당장 해\"라고 한 액션 아이템\n\n[2사분면: 중요하지만 긴급하지 않음 — 계획을 세워서 실행]\n장기적으로 가장 가치 있는 영역이에요. 여기에 시간을 많이 써야 해요.\n- Unity/Unreal 프로젝트 완성도 높이기\n- 알고리즘 실력 꾸준히 쌓기 (매일 1문제)\n- 게임 분석 리포트 작성으로 기획 역량 증명\n- 업계 네트워킹 (GDC, NDC 커뮤니티 참여)\n\n[3사분면: 긴급하지만 중요하지 않음 — 빠르게 처리하거나 위임]\n급하게 느껴지지만 커리어에 큰 영향이 없는 일이에요.\n- LinkedIn 프로필 사진 교체\n- 게임 업계 뉴스레터 정리\n- SNS에서 본 채용 정보 북마크 정리\n- 스터디 그룹 일정 조율\n\n[4사분면: 긴급하지도 중요하지도 않음 — 과감히 삭제]\n시간을 빼앗기는 것들이에요. 과감하게 버리세요.\n- 관심 없는 직무의 채용 공고까지 전부 읽기\n- 취업 커뮤니티에서 비교/불안감 글 읽기\n- 아직 필요 없는 기술 스택 미리 걱정하기\n- 완벽주의로 이미 충분한 문서를 계속 다듬기\n\n→ 핵심: 2사분면에 매일 최소 2시간을 투자하세요. 여기가 커리어를 바꾸는 영역이에요.",
  },
  {
    category: "우선순위 매트릭스",
    title: "여러 멘토의 조언이 다를 때 판단하는 법",
    content:
      "[왜 멘토마다 조언이 다를까?]\n멘토도 각자의 경험과 맥락에서 이야기해요. 넥슨 7년차 서버 개발자와 인디 스타트업 대표의 관점이 같을 수 없어요. 이건 누가 틀린 게 아니라, 다른 렌즈로 세상을 보는 거예요.\n\n같은 질문 \"첫 직장으로 대형사 vs 스타트업?\"에 대해:\n- 대형사 멘토: \"체계적인 교육과 대규모 프로젝트 경험이 기반이 된다\"\n- 스타트업 멘토: \"작은 팀에서 다양한 역할을 해봐야 성장이 빠르다\"\n- 이직 경험 많은 멘토: \"어디든 좋으니 빨리 시작하는 게 답이다\"\n\n세 명 다 자기 경험에서는 맞는 말이에요.\n\n[4단계 판단 프레임워크]\n\n[1단계: 공통점 찾기]\n서로 다른 조언에서도 겹치는 부분이 있어요. 3명의 멘토가 모두 \"포트폴리오가 가장 중요하다\"고 했다면, 그건 확실한 진실이에요. 공통 키워드를 먼저 뽑아보세요.\n\n[2단계: 내 상황에 대입하기]\n\"대형사가 좋다\"는 조언이 모든 사람에게 맞는 건 아니에요. 내 현재 상황을 체크하세요:\n- 나의 현재 실력 수준은?\n- 나의 경제적 상황은?\n- 내가 원하는 성장 속도와 방향은?\n- 나의 성격과 업무 스타일은?\n\n[3단계: 멘토의 배경 고려하기]\n각 멘토가 어떤 커리어 패스를 걸어왔는지 생각해보세요.\n- 대형사만 다닌 멘토 → 대형사의 장점에 편향될 수 있어요\n- 스타트업 출신 멘토 → 스타트업의 성장 경험에 편향될 수 있어요\n- 멘토의 시대와 지금 취업 시장이 다를 수도 있어요\n\n[4단계: 최종 결정은 나의 몫]\n멘토의 조언은 \"데이터\"예요. 최종 판단은 내가 하는 거예요.\n- 모든 조언을 취합한 후 \"나에게 가장 현실적인 선택\"을 골라요\n- 결정을 내렸으면 후회하지 말고 전력으로 실행해요\n- 잘못된 선택이었다면 그때 방향을 수정하면 돼요\n\n→ 기억하세요: 완벽한 선택은 없어요. 선택을 완벽하게 실행하는 것이 답이에요.",
  },
  // ── 주간 액션 플랜 ──
  {
    category: "주간 액션 플랜",
    title: "1주 액션 플랜 작성법",
    content:
      "\"열심히 해야지\"는 계획이 아니에요. 구체적인 1주 플랜을 세워야 실행이 돼요.\n\n[1주 액션 플랜 템플릿]\n\n이번 주 목표 (최대 3개):\n1. ___________________________\n2. ___________________________\n3. ___________________________\n\n[일별 계획]\n월요일: ___________________________\n화요일: ___________________________\n수요일: ___________________________\n목요일: ___________________________\n금요일: ___________________________\n토요일: ___________________________\n일요일: 주간 회고 + 다음 주 계획 수립\n\n[완료 기준]\n[ ] 목표 1: _______________ (기한: ___ 요일)\n[ ] 목표 2: _______________ (기한: ___ 요일)\n[ ] 목표 3: _______________ (기한: ___ 요일)\n\n[예상 소요 시간]\n- 목표 1: 약 __시간 (하루 __시간 x __일)\n- 목표 2: 약 __시간 (하루 __시간 x __일)\n- 목표 3: 약 __시간 (하루 __시간 x __일)\n\n[예시: 클라이언트 프로그래머 취준생의 1주 플랜]\n\n목표:\n1. 백준 골드 문제 5개 풀기\n2. Unity 인벤토리 시스템 프로토타입 완성\n3. 크래프톤 지원서 초안 작성\n\n월: 백준 BFS 문제 2개 (2시간) + 인벤토리 UI 설계 (1시간)\n화: 백준 DP 문제 1개 (1.5시간) + 인벤토리 데이터 구조 구현 (2시간)\n수: 인벤토리 아이템 추가/삭제/정렬 구현 (3시간)\n목: 백준 그래프 문제 2개 (2시간) + 인벤토리 드래그앤드롭 (1.5시간)\n금: 크래프톤 지원서 초안 작성 (3시간)\n토: 인벤토리 시스템 테스트 + GitHub README 정리 (2시간)\n일: 주간 회고 + 다음 주 계획 (1시간)\n\n[4가지 원칙]\n1. 하루 1~2개만 — 3개 이상 넣으면 하나도 못 끝내요\n2. 명확한 완료 기준 — \"공부하기\"가 아니라 \"문제 2개 풀기\"\n3. 현실적 시간 추정 — 학생은 하루 3~4시간, 직장인은 하루 2시간이 현실적이에요\n4. 일요일 회고 필수 — 뭘 했고, 뭘 못 했는지 솔직하게 기록하세요",
  },
  {
    category: "주간 액션 플랜",
    title: "4주 로드맵 예시: 커피챗 후 취업 준비",
    content:
      "멘토링 커피챗 1회로 인생이 바뀌진 않아요. 4주 로드맵으로 체계적으로 실행하세요.\n\n[Week 1: 계획 수립 + 자료 수집]\n- 멘토 조언 정리 및 우선순위 매트릭스 작성\n- 추천받은 자료/강의 수집 및 학습 환경 세팅\n- 레퍼런스 게임 3개 선정 및 분석 시작\n- 포트폴리오 방향 확정 (어떤 산출물을 만들 것인지)\n\n✅ Week 1 완료 기준: 4주 로드맵 문서 완성 + 레퍼런스 분석 1개 완료\n\n[Week 2: 핵심 산출물 프로토타입]\n- 포트폴리오 핵심 프로젝트 프로토타입 시작\n- 기획자: 시스템 기획서 초안 or 게임 분석 리포트 초안\n- 프로그래머: 핵심 기능 프로토타입 구현\n- 아티스트: 콘셉트 아트 3장 or 3D 모델 러프 완성\n- 중간 자가 점검: 방향이 맞는지 멘토 조언과 대조\n\n✅ Week 2 완료 기준: 프로토타입 70% 완성 + 자가 점검 완료\n\n[Week 3: 완성도 높이기 + 피드백]\n- 프로토타입을 완성 수준으로 끌어올리기\n- 주변 동료나 스터디 그룹에게 1차 피드백 받기\n- 피드백 반영하여 수정/보완\n- 이력서/자기소개서 초안 작성 시작\n\n✅ Week 3 완료 기준: 산출물 1차 완성 + 피드백 1회 이상 수렴\n\n[Week 4: 문서화 + 다음 단계 준비]\n- 포트폴리오 최종 정리 (README, 설명 문서, 스크린샷)\n- 이력서/자기소개서 1차 완성\n- 4주 회고: 어떤 성과가 있었는지, 부족한 점은 무엇인지\n- 후속 멘토링 예약 (서류 리뷰 세션 추천)\n- 다음 4주 로드맵 초안 작성\n\n✅ Week 4 완료 기준: 포트폴리오 패키지 완성 + 후속 세션 예약 완료\n\n→ 핵심: 4주마다 멘토링을 받으면서 방향을 점검하는 사이클이 가장 효과적이에요. 커피챗 → 4주 실행 → 서류 리뷰 → 2주 수정 → 모의면접 → 실전 지원의 흐름을 만드세요.",
  },
  // ── 후속 세션 활용 ──
  {
    category: "후속 세션 활용",
    title: "후속 세션에서 최대 효과를 내는 법",
    content:
      "[후속 세션은 언제 예약하면 좋을까?]\n- 커피챗 후: 3~4주 뒤 (실행 결과를 가지고 올 수 있는 시점)\n- 서류 리뷰 후: 1~2주 뒤 (수정본 완성 시점)\n- 모의면접 후: 2~3주 뒤 (충분한 연습 후)\n- 급한 고민 발생 시: 가능한 빨리 (오퍼 협상, 면접 임박 등)\n\n[후속 세션 준비 체크리스트]\n[ ] 지난 세션 메모를 다시 읽었다\n[ ] 액션 아이템 중 완료한 것/못한 것을 정리했다\n[ ] 실행하면서 생긴 새로운 질문을 3개 이상 준비했다\n[ ] 진행 상황을 보여줄 산출물(코드, 문서, 포트폴리오)을 준비했다\n[ ] 이번 세션의 목표를 1문장으로 정리했다\n\n[효과적인 오프닝 스크립트]\n\"안녕하세요 멘토님, 지난번에 조언해주신 대로 [구체적 액션]을 실행해봤습니다. [결과/성과]가 나왔는데, 다음 단계에서 [구체적 고민]이 생겼어요. 오늘은 이 부분에 대해 조언을 듣고 싶습니다.\"\n\n→ 이렇게 시작하면 멘토가 \"이 멘티는 진짜 실행하는구나\"라고 느끼고, 더 깊이 있는 조언을 해줘요.\n\n[멘토가 좋아하는 후속 멘티]\n- 지난 조언을 실행하고 결과를 공유하는 멘티\n- 구체적인 진행 상황과 함께 새로운 질문을 가져오는 멘티\n- 산출물(코드, 문서, 포트폴리오)을 직접 보여주며 피드백을 요청하는 멘티\n- 감사함을 표현하면서도 전문적인 태도를 유지하는 멘티\n\n[멘토가 힘들어하는 후속 멘티]\n- 지난 세션 내용을 하나도 기억 못 하는 멘티\n- 액션 아이템을 전혀 실행하지 않고 같은 질문을 반복하는 멘티\n- \"그때 뭐라고 하셨죠?\"로 시작하는 멘티\n- 멘토에게 의존하며 스스로 판단하지 않는 멘티\n\n→ 후속 세션의 핵심: \"지난번 이후로 제가 한 것\"을 먼저 보여주세요.",
  },
  {
    category: "후속 세션 활용",
    title: "멘토링 효과를 3배로 높이는 전략",
    content:
      "같은 횟수의 멘토링을 받아도 전략에 따라 효과가 완전히 달라져요. 검증된 4가지 전략을 소개해요.\n\n[전략 1: 같은 멘토 3회 + 다른 멘토 1회 조합]\n같은 멘토를 반복해서 만나면 내 상황을 깊이 이해하고 연속적인 조언을 받을 수 있어요. 하지만 한 사람의 관점에만 의존하면 편향이 생겨요.\n\n추천 비율: 주력 멘토 3회 만남 + 새로운 멘토 1회로 다른 관점 수집\n- 주력 멘토: 나의 성장을 지속적으로 지켜봐주는 사람\n- 새로운 멘토: 다른 회사, 다른 직무, 다른 연차의 관점을 가진 사람\n\n[전략 2: 2~4주 간격으로 세션 배치]\n너무 자주 만나면 실행할 시간이 없고, 너무 뜸하면 동력이 떨어져요.\n- 최적 간격: 2~4주 (액션 아이템을 실행하고 결과를 가져올 수 있는 시간)\n- 급한 경우: 1주 간격도 가능 (면접 임박, 오퍼 협상 등)\n- 안정기: 월 1회로 방향 점검 (취업 후에도 유지하면 좋아요)\n\n[전략 3: 세션 유형을 점진적으로 업그레이드]\n같은 유형의 세션만 반복하지 마세요. 단계별로 올라가세요.\n\n1단계: 커피챗 (방향 탐색) — \"어떤 길이 있는지\" 파악\n→ 2단계: 커피챗 (심화) — \"내 상황에서 구체적으로 어떻게\" 파악\n→ 3단계: 서류 리뷰 — 산출물(이력서, 포트폴리오)에 대한 피드백\n→ 4단계: 모의면접 — 실전 연습 + 피드백\n→ 5단계: 오퍼 협상/커리어 상담 — 합격 후 의사결정\n\n[전략 4: 기록을 누적하라]\n멘토링 메모를 한곳에 모아두세요. 3~4회 세션이 쌓이면 놀라운 일이 벌어져요.\n- 과거의 고민이 어떻게 해결되었는지 보여요\n- 나의 성장 과정이 기록으로 남아요\n- 같은 실수를 반복하지 않게 돼요\n- 다음 멘토링에서 맥락 설명 시간이 줄어요\n\n→ 노션이나 구글 독스에 \"멘토링 기록\" 폴더를 만들어서 세션마다 메모를 추가하세요. 6개월 뒤에 첫 메모를 다시 읽으면 \"나 이때 이랬구나\" 하며 성장을 체감하게 돼요.\n\n→ 기억하세요: 멘토링 1회의 가치는 세션 자체가 아니라, 세션 후 실행에서 만들어져요.",
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
  "메모 정리법": {
    color: "text-blue-600",
    bgColor: "bg-blue-500/5",
    borderColor: "border-l-blue-500",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  "우선순위 매트릭스": {
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/5",
    borderColor: "border-l-emerald-500",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  "주간 액션 플랜": {
    color: "text-primary",
    bgColor: "bg-primary/5",
    borderColor: "border-l-primary",
    badgeBg: "bg-primary/10",
    badgeText: "text-primary",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  "후속 세션 활용": {
    color: "text-orange-600",
    bgColor: "bg-orange-500/5",
    borderColor: "border-l-orange-500",
    badgeBg: "bg-orange-500/10",
    badgeText: "text-orange-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
};

const categories = [
  "전체",
  "메모 정리법",
  "우선순위 매트릭스",
  "주간 액션 플랜",
  "후속 세션 활용",
];

export default function ActionPlanGuidePage() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered =
    activeCategory === "전체"
      ? actionData
      : actionData.filter((item) => item.category === activeCategory);

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
        <div className="relative mb-12 rounded-2xl bg-gradient-to-br from-purple-500/10 via-primary/5 to-accent/5 border border-purple-500/20 p-8 sm:p-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <Link href="/mentee/guides" className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary mb-4 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              멘티 가이드
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">멘토링 후 액션 플랜</h1>
            <p className="text-muted text-lg max-w-2xl">
              멘토링의 진짜 가치는 세션이 끝난 후에 만들어져요.
              <br className="hidden sm:block" />
              조언을 정리하고, 우선순위를 정하고, 실행하는 체계적인 방법을 안내해요.
            </p>
          </div>
        </div>

        {/* Tip Boxes */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
            <p className="font-bold text-emerald-600 mb-1">실행이 핵심</p>
            <p className="text-sm text-foreground/70">멘토링 1회 후 실행하는 것이 10회 듣기만 하는 것보다 낫습니다. 조언을 행동으로 옮기세요.</p>
          </div>
          <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
            <p className="font-bold text-amber-600 mb-1">30분 골든타임</p>
            <p className="text-sm text-foreground/70">세션 직후 30분 안에 메모를 정리하세요. 시간이 지나면 핵심 인사이트의 절반 이상을 잊어버려요.</p>
          </div>
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
        <div className="space-y-3" role="region" aria-label="액션 플랜 가이드 목록">
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
                          if (line.startsWith("\u2192")) {
                            return <span key={lineIndex} className="text-primary font-medium">{line}{"\n"}</span>;
                          }
                          if (line.includes("[ ]")) {
                            return (
                              <span key={lineIndex} className="flex items-start gap-2 my-0.5">
                                <span className="w-4 h-4 mt-1 rounded border-2 border-primary/40 shrink-0 inline-block" />
                                <span>{line.replace(/- ?\[ \] /, "").replace(/\[ \] /, "")}</span>
                                {"\n"}
                              </span>
                            );
                          }
                          if (line.startsWith("\u2705")) {
                            return <span key={lineIndex} className="text-emerald-600 font-medium">{line}{"\n"}</span>;
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
          <Link href="/mentee/guides/roles" className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            직무별 준비 가이드
          </Link>
          <Link href="/mentee/guides/faq" className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors">
            멘토링 FAQ
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </main>
    </div>
  );
}
