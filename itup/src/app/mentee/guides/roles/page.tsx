"use client";

import { useState } from "react";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site-config";
import { LogoIcon } from "@/components/icons";

// =============================================
// 직무별 준비 가이드
// =============================================

interface RoleItem {
  title: string;
  content: string;
  category: string;
}

const rolesData: RoleItem[] = [
  // ── 게임 기획자 ──
  {
    category: "게임 기획자",
    title: "게임 기획자가 준비해야 할 것",
    content:
      "[핵심 스킬]\n- 시스템 기획: 게임 메카닉, 밸런스 설계, 수치 기획\n- 레벨 디자인: 맵 구조, 난이도 곡선, 유저 동선 설계\n- 콘텐츠 기획: 스토리, 퀘스트, 이벤트 설계\n- BM(비즈니스 모델) 기획: 과금 구조, 경제 시스템\n- 유저 리서치: 데이터 분석, A/B 테스트, 유저 플로우\n\n[필수 도구]\n- Excel/Google Sheets: 수치 기획, 밸런스 테이블 (필수!)\n- Figma/Adobe XD: UI/UX 와이어프레임\n- Jira/Confluence: 업무 관리, 기획 문서 공유\n- Unity/Unreal 기초: 엔진 이해 (직접 개발은 아니더라도)\n- Miro/FigJam: 브레인스토밍, 플로우차트\n\n[포트폴리오 필수 항목]\n1. 시스템 기획서 1-2개 (전투 시스템, 성장 시스템 등)\n2. 레벨 디자인 문서 1개 (맵 레이아웃, 난이도 설계)\n3. 유저 플로우 다이어그램\n4. 기존 게임 분석 리포트 1개\n5. (보너스) BM 기획서 또는 이벤트 기획서\n\n[면접 주요 토픽]\n- \"좋아하는 게임의 시스템을 분석해주세요\"\n- \"이 게임의 BM을 개선한다면?\"\n- \"유저 이탈률을 줄이기 위한 기획안을 제시해주세요\"\n- \"팀원과 기획 의견이 충돌했을 때 어떻게 해결하나요?\"\n- 최근 플레이한 게임에 대한 깊은 분석 능력을 보여주세요\n\n[멘토에게 물어보면 좋은 질문]\n\"시스템 기획서를 작성할 때 실무에서 사용하는 양식이나 구조가 있을까요?\"\n\"신입 기획자가 입사 후 처음 맡는 업무가 보통 어떤 건가요?\"",
  },
  {
    category: "게임 기획자",
    title: "기획 포트폴리오 핵심 포인트",
    content:
      "[면접관이 보는 순서]\n1. 문서 구조와 가독성 — 읽기 쉬운가?\n2. 논리적 사고 — 왜 이렇게 기획했는지 설명이 있는가?\n3. 구체성 — 수치, 공식, 조건이 명확한가?\n4. 유저 관점 — 유저 경험을 고려했는가?\n5. 실현 가능성 — 개발팀이 구현할 수 있는 수준인가?\n\n[흔한 실수]\n- 양이 많지만 깊이가 없는 포트폴리오 (10페이지짜리 3개보다 30페이지짜리 1개가 낫다)\n- \"재미있는 게임을 만들고 싶어요\" 같은 추상적 목표\n- 다른 게임을 그대로 베낀 시스템 (참고는 OK, 복붙은 NO)\n- 수치 없는 밸런스 기획 (\"강하다/약하다\"가 아니라 구체적 수치)\n\n[추천 포맷]\n- 표지: 프로젝트명, 장르, 타겟 플랫폼, 본인 역할\n- 개요: 게임 컨셉 한 줄, 핵심 재미 요소, 레퍼런스\n- 시스템 설계: 플로우차트 + 상세 설명 + 수치 테이블\n- 와이어프레임: UI 레이아웃, 유저 동선\n- 결론: 예상 문제점과 개선 방향\n\n[팁] 하나의 시스템을 깊이 있게 파고든 기획서가 면접에서 압도적으로 유리해요. \"넓고 얕게\"보다 \"좁고 깊게\"를 추천합니다.",
  },
  // ── 게임 프로그래머 ──
  {
    category: "게임 프로그래머",
    title: "클라이언트 프로그래머 준비 가이드",
    content:
      "[핵심 기술 스택]\n- Unity + C#: 국내 모바일 게임의 70%+ 사용\n- Unreal Engine + C++: 크래프톤, 시프트업, 펄어비스 등 콘솔/PC 대작\n- 자료구조 & 알고리즘: 코딩테스트 필수\n- 디자인 패턴: 싱글톤, 옵저버, 커맨드, 스테이트 패턴 등\n- 수학/물리: 벡터, 행렬, 쿼터니언, 충돌 처리 기초\n\n[코딩테스트 준비]\n- 백준 기준: 골드 4-5 이상이면 대부분 통과 가능\n- 프로그래머스 레벨 2-3 완벽 풀이\n- 주요 유형: DFS/BFS, DP, 그래프, 문자열, 구현\n- C++ 필수 (대형사 기준), C#은 Unity 기업 중심\n- 넥슨/넷마블/크래프톤 기출 유형 분석 필수\n\n[포트폴리오 프로젝트]\n1. 개인 게임 프로젝트 1-2개 (완성도가 중요!)\n2. 기술 데모: 물리 엔진, AI 시스템, 네트워크 동기화 등\n3. GitHub 정리: 커밋 메시지, README, 코드 구조\n4. (보너스) 최적화 사례: 프로파일링 → 개선 → 결과\n\n[면접 주요 토픽]\n- C++: 메모리 관리, 스마트 포인터, 가상 함수, 다중 상속\n- Unity: MonoBehaviour 라이프사이클, 코루틴 vs async, 어드레서블\n- Unreal: GameplayAbilitySystem, 리플리케이션, 블루프린트 vs C++\n- 그래픽스 기초: 렌더링 파이프라인, 셰이더, 드로우콜 최적화\n- 최적화: 프로파일링 경험, 메모리/성능 개선 사례",
  },
  {
    category: "게임 프로그래머",
    title: "서버 프로그래머 준비 가이드",
    content:
      "[핵심 기술 스택]\n- C++: 고성능 게임 서버 (대형사 표준)\n- C#: Unity 기반 게임의 서버 (.NET)\n- Java/Kotlin: 일부 모바일 게임 서버\n- Go/Node.js: 스타트업, 인디 게임 서버\n- DB: MySQL, Redis, MongoDB\n- 네트워크: TCP/UDP, Protobuf, gRPC\n\n[핵심 지식]\n- 동시성/병렬 처리: 멀티스레딩, 락, 동기화\n- 분산 시스템: 로드밸런싱, 샤딩, 마이크로서비스\n- 데이터베이스: 인덱싱, 트랜잭션, 캐싱 전략\n- 네트워크 프로그래밍: 소켓, 프로토콜 설계, 패킷 처리\n- DevOps: Docker, Kubernetes, CI/CD, AWS/GCP\n\n[포트폴리오 프로젝트]\n1. 멀티플레이어 게임 서버 (2-4인 실시간 동기화)\n2. 채팅 서버 (소켓 프로그래밍 데모)\n3. REST API 서버 + 부하 테스트 결과\n4. (보너스) 대규모 트래픽 처리 실험 (성능 벤치마크)\n\n[면접 주요 토픽]\n- \"동시접속 10만 명을 처리하려면 어떤 아키텍처를 설계하시겠어요?\"\n- \"데드락 상황을 어떻게 예방하나요?\"\n- \"게임 서버에서 TCP와 UDP를 각각 어떤 상황에 쓰나요?\"\n- \"핫픽스 없이 서버를 업데이트하는 방법은?\"\n- 실무에서는 장애 대응 경험이 매우 중요해요\n\n[멘토에게 물어보면 좋은 질문]\n\"실무에서 사용하는 서버 아키텍처가 궁금해요. 마이크로서비스인가요, 모놀리식인가요?\"\n\"신입 서버 프로그래머가 처음 맡는 업무가 보통 어떤 건가요?\"",
  },
  // ── 게임 아티스트 ──
  {
    category: "게임 아티스트",
    title: "원화/컨셉 아티스트 준비 가이드",
    content:
      "[핵심 스킬]\n- 인체 드로잉: 해부학 기초, 다양한 포즈와 비율\n- 컬러/라이팅: 색채 이론, 빛과 그림자 표현\n- 캐릭터 디자인: 실루엣, 의상, 무기, 소품\n- 배경/환경 컨셉: 원근법, 분위기 연출\n- 스토리텔링: 그림 한 장으로 이야기 전달\n\n[필수 도구]\n- Photoshop: 업계 표준\n- Clip Studio Paint: 만화/일러스트 특화\n- Procreate: iPad 작업용\n- (보너스) Blender/3D 기초: 3D 위에 페인트오버\n\n[포트폴리오 구성]\n1. 캐릭터 시트 2-3장 (정면/측면/배면 + 표정/포즈 변형)\n2. 배경/환경 컨셉 2-3장\n3. 소품/무기/UI 아이콘 시트\n4. 작업 과정(WIP): 러프 → 라인 → 컬러 → 완성 단계별 공개\n5. 팬아트보다 오리지널 작업 위주로 구성\n\n[스타일 가이드]\n- 목표 회사의 아트 스타일을 분석하세요\n- 넥슨(메이플스토리): 캐주얼, 2D 도트/일러스트\n- 시프트업(스텔라 블레이드): 리얼리스틱, 하이퀄리티\n- 넷마블: 다양한 스타일 (프로젝트별 상이)\n- 본인만의 스타일도 중요하지만, 회사 스타일에 맞출 수 있는 유연성을 보여주세요\n\n[면접 주요 토픽]\n- 포트폴리오 작업물의 기획 의도와 레퍼런스\n- 실기 테스트: 주어진 키워드로 캐릭터 디자인 (3-4시간)\n- 피드백 수용 능력: \"이 캐릭터를 더 어둡게 바꿔달라면 어떻게 접근하시겠어요?\"\n- 작업 속도와 수정 대응 능력",
  },
  {
    category: "게임 아티스트",
    title: "3D 아티스트 (모델러/애니메이터) 준비 가이드",
    content:
      "[핵심 스킬 - 3D 모델러]\n- 하이폴리/로우폴리 모델링\n- UV 언래핑, 텍스처링\n- PBR(물리 기반 렌더링) 이해\n- 리토폴로지, LOD 최적화\n\n[핵심 스킬 - 3D 애니메이터]\n- 키프레임 애니메이션\n- 리깅/스키닝\n- 모션 캡처 데이터 정리\n- 블렌드 트리, 스테이트 머신\n\n[필수 도구]\n- 3ds Max: 국내 게임 업계 표준 (특히 캐릭터)\n- Maya: 애니메이션 특화, 해외 스튜디오\n- ZBrush: 하이폴리 스컬프팅\n- Substance Painter/Designer: 텍스처링\n- Blender: 무료 대안, 점점 채택 증가\n- Marvelous Designer: 의상 모델링\n\n[포트폴리오 구성]\n1. 캐릭터 모델 2-3개 (다양한 스타일)\n2. 배경/프롭 모델 세트 1-2개\n3. 턴테이블 영상 (360도 회전)\n4. 와이어프레임 + 텍스처 맵 공개\n5. 폴리곤 카운트, 텍스처 해상도 명시\n6. (애니메이터) 워크사이클, 공격 모션, 감정 표현\n\n[면접 주요 토픽]\n- \"이 캐릭터의 폴리곤을 반으로 줄여야 한다면 어디부터 줄이시겠어요?\"\n- \"모바일 게임과 PC 게임의 모델링 스펙 차이를 설명해주세요\"\n- 실기 테스트: 주어진 컨셉아트를 3D로 제작 (과제형, 1-2주)\n- ArtStation이나 개인 사이트에 포트폴리오를 올려두면 유리해요",
  },
  {
    category: "게임 아티스트",
    title: "UI/UX 아티스트 준비 가이드",
    content:
      "[핵심 스킬]\n- UI 디자인: 게임 HUD, 메뉴, 인벤토리, 상점 등\n- UX 설계: 유저 플로우, 와이어프레임, 프로토타이핑\n- 아이콘 디자인: 스킬, 아이템, 상태 아이콘\n- 인터랙션 디자인: 버튼 피드백, 트랜지션, 애니메이션\n- 모션 그래픽: UI 애니메이션, 이펙트\n\n[필수 도구]\n- Figma: UI/UX 설계의 표준 (필수!)\n- Adobe Photoshop/Illustrator: 비주얼 디자인\n- After Effects: UI 모션, 프로토타입 영상\n- Spine/Lottie: 인게임 UI 애니메이션\n- Unity UI (uGUI/UI Toolkit): 엔진 내 UI 구현 이해\n\n[포트폴리오 구성]\n1. 게임 UI 리디자인 2-3개 (기존 게임의 UI를 개선)\n2. 오리지널 게임 UI 시스템 1개 (풀 세트: HUD, 메뉴, 팝업, 상점)\n3. 아이콘 세트 (스킬, 아이템 등 최소 20개)\n4. 유저 플로우 다이어그램\n5. (보너스) UI 모션 스펙 영상\n\n[면접 주요 토픽]\n- \"이 게임의 상점 UI를 개선한다면 어떻게 하시겠어요?\"\n- \"모바일과 PC 게임의 UI 설계 차이점은?\"\n- \"유저가 원하는 정보를 3탭 이내에 찾을 수 있도록 설계해주세요\"\n- 접근성(폰트 크기, 색맹 대응 등)에 대한 이해\n\n[팁] 게임 UI는 웹/앱 UI와 다르다는 걸 보여주세요. 게임 특유의 몰입감, 세계관 반영, 실시간 정보 표시 등을 고려한 디자인이 필요해요.",
  },
  // ── QA/테스터 ──
  {
    category: "QA/테스터",
    title: "QA/테스터 준비 가이드",
    content:
      "[핵심 스킬]\n- 테스트 방법론: 블랙박스/화이트박스, 탐색적 테스트, 회귀 테스트\n- 버그 리포트 작성: 재현 경로, 기대 결과 vs 실제 결과, 심각도 분류\n- 테스트 계획/케이스 작성: 체계적인 테스트 시나리오 설계\n- 자동화 테스트 기초: Selenium, Appium, 게임 전용 프레임워크\n- 게임 이해도: 장르별 핵심 시스템, 밸런스, UX\n\n[필수 도구]\n- Jira/Mantis/Redmine: 버그 트래킹\n- Confluence/Notion: 테스트 문서화\n- Charles Proxy/Fiddler: 네트워크 패킷 분석\n- ADB (Android Debug Bridge): 모바일 테스트\n- Excel: 테스트 케이스 관리, 데이터 분석\n\n[버그 리포트 작성 핵심]\n좋은 버그 리포트 = 개발자가 즉시 이해하고 재현할 수 있는 리포트\n\n[좋은 버그 리포트 예시]\n제목: [전투] 특정 스킬 사용 시 캐릭터가 맵 밖으로 떨어짐\n환경: iOS 17.2 / iPhone 15 / 버전 2.1.3\n심각도: Critical\n재현율: 3/5 (60%)\n재현 경로:\n1. 전투 진입 → 2. 벽 근처에서 \"돌진\" 스킬 사용 → 3. 스킬 사용 중 점프 입력 → 4. 캐릭터가 벽을 관통하여 맵 밖으로 이동\n기대 결과: 벽에 막혀 이동 불가\n실제 결과: 벽을 관통하여 낙하, 게임 진행 불가\n첨부: 스크린샷/영상\n\n[커리어 패스]\n1. QA 테스터 (신입) → 2. QA 리드/매니저 → 3. QA 디렉터\n또는:\n1. QA 테스터 → 2. 테크니컬 QA (자동화) → 3. QA 엔지니어\n또는:\n1. QA 테스터 → 2. 게임 기획자/PM으로 전환 (실제로 많아요)\n\n[면접 주요 토픽]\n- \"이 게임에서 버그를 찾아보세요\" (실기)\n- \"테스트 케이스를 어떤 기준으로 우선순위를 정하나요?\"\n- \"자동화 테스트와 수동 테스트의 장단점은?\"\n- 게임을 많이 플레이한 경험이 큰 강점이에요",
  },
  // ── 마케팅/사업 ──
  {
    category: "마케팅/사업",
    title: "게임 마케팅/사업 준비 가이드",
    content:
      "[핵심 스킬 - 마케팅]\n- 디지털 마케팅: UA(User Acquisition), ASO, 퍼포먼스 마케팅\n- 콘텐츠 마케팅: SNS 운영, 커뮤니티 관리, 인플루언서 협업\n- 데이터 분석: Google Analytics, AppsFlyer, Adjust\n- 브랜딩: 게임 IP 관리, 크로스 프로모션\n- 영상/크리에이티브: 트레일러, 광고 소재 기획\n\n[핵심 스킬 - 사업/퍼블리싱]\n- 시장 분석: 게임 시장 규모, 트렌드, 경쟁 분석\n- 수익 분석: ARPU, ARPPU, LTV, CPI 등 핵심 KPI\n- 사업 개발: 파트너십, 라이선싱, 해외 퍼블리싱\n- 계약 관리: 퍼블리싱 계약, IP 라이선스\n- 해외 사업: 글로벌 시장 이해, 현지화 전략\n\n[필수 도구]\n- Excel/Google Sheets: 데이터 분석, 시장 조사 (필수!)\n- Google Analytics/Firebase: 유저 행동 분석\n- Tableau/Power BI: 데이터 시각화\n- Sensor Tower/App Annie: 앱 시장 조사\n- SQL 기초: 데이터 추출/분석\n\n[포트폴리오 항목]\n1. 시장 분석 리포트 (특정 장르/지역 게임 시장)\n2. 마케팅 캠페인 기획안 (가상 런칭 캠페인)\n3. 경쟁 분석 보고서 (SWOT, 포지셔닝 맵)\n4. 유저 데이터 분석 사례 (공개 데이터 기반)\n5. (보너스) SNS/커뮤니티 운영 경험\n\n[면접 주요 토픽]\n- \"이 게임의 글로벌 런칭 마케팅 전략을 세워주세요\"\n- \"CPI를 낮추면서 유저 품질을 유지하는 방법은?\"\n- \"한국 게임을 일본/동남아 시장에 런칭할 때 주의할 점은?\"\n- \"최근 주목하는 게임 마케팅 트렌드가 있나요?\"\n- 게임에 대한 깊은 이해 + 비즈니스 감각의 균형이 중요해요\n\n[멘토에게 물어보면 좋은 질문]\n\"게임 마케팅에서 신입이 처음 맡는 업무가 보통 어떤 건가요?\"\n\"데이터 분석 스킬이 어느 수준까지 필요한가요? SQL은 필수인가요?\"",
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
  "게임 기획자": {
    color: "text-blue-600",
    bgColor: "bg-blue-500/5",
    borderColor: "border-l-blue-500",
    badgeBg: "bg-blue-500/10",
    badgeText: "text-blue-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  "게임 프로그래머": {
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
  "게임 아티스트": {
    color: "text-violet-600",
    bgColor: "bg-violet-500/5",
    borderColor: "border-l-violet-500",
    badgeBg: "bg-violet-500/10",
    badgeText: "text-violet-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  "QA/테스터": {
    color: "text-orange-600",
    bgColor: "bg-orange-500/5",
    borderColor: "border-l-orange-500",
    badgeBg: "bg-orange-500/10",
    badgeText: "text-orange-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  "마케팅/사업": {
    color: "text-primary",
    bgColor: "bg-primary/5",
    borderColor: "border-l-primary",
    badgeBg: "bg-primary/10",
    badgeText: "text-primary",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
};

const categories = [
  "전체",
  "게임 기획자",
  "게임 프로그래머",
  "게임 아티스트",
  "QA/테스터",
  "마케팅/사업",
];

export default function RolesGuidePage() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered =
    activeCategory === "전체"
      ? rolesData
      : rolesData.filter((item) => item.category === activeCategory);

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
        <div className="relative mb-12 rounded-2xl bg-gradient-to-br from-orange-500/10 via-primary/5 to-accent/5 border border-orange-500/20 p-8 sm:p-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <Link href="/mentee/guides" className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary mb-4 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              멘티 가이드
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">직무별 준비 가이드</h1>
            <p className="text-muted text-lg max-w-2xl">
              게임 업계 각 직무별로 준비해야 할 기술, 포트폴리오, 면접 주제를 정리했어요.
              <br className="hidden sm:block" />
              목표 직무에 맞는 가이드를 확인하고 멘토링을 더 효과적으로 활용하세요.
            </p>
          </div>
        </div>

        {/* Role Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
          {categories.filter(c => c !== "전체").map((category) => {
            const config = getCategoryConfig(category);
            return (
              <button
                key={category}
                onClick={() => { setActiveCategory(category); setOpenIndex(null); }}
                className={`p-4 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                  activeCategory === category
                    ? `${config.bgColor} border-current ${config.color}`
                    : "bg-card-bg border-card-border hover:border-primary/50 hover:shadow-md"
                }`}
              >
                <div className={`w-8 h-8 mx-auto mb-2 rounded-lg ${config.badgeBg} flex items-center justify-center ${config.badgeText}`}>
                  {config.icon}
                </div>
                <p className="text-xs font-medium">{category}</p>
              </button>
            );
          })}
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
        <div className="space-y-3" role="region" aria-label="직무별 준비 가이드 목록">
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
          <Link href="/mentee/guides/questions" className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            좋은 질문 만들기
          </Link>
          <Link href="/mentee/guides/action-plan" className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors">
            액션 플랜 템플릿
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </main>
    </div>
  );
}
