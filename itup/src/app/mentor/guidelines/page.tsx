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
  // 실전 매뉴얼 — 커피챗
  {
    category: "실전 매뉴얼",
    title: "커피챗 실전 가이드 (30분 세션) - 분 단위 스크립트",
    content:
      "[1단계: 오프닝 (0:00~3:00)]\n목표: 긴장 풀기 + 라포 형성 + 세션 방향 합의\n\n오프닝 스크립트:\n\"안녕하세요, OO님! 반갑습니다. 저는 [회사명]에서 [직무]를 하고 있는 [닉네임]이에요. 오늘 상담 신청해주셔서 감사합니다. 화면이랑 소리 잘 되시죠?\"\n\n아이스브레이킹 (게임업계 특화):\n- \"혹시 요즘 하고 계신 게임 있으세요?\" (게임 취향으로 대화 시작)\n- \"학교/회사에서 팀 프로젝트 진행 중이세요?\" (현재 상태 파악)\n- 2분 이내로 아이스브레이킹을 마무리하세요. 길어지면 본론 시간 부족.\n\n\"그럼 오늘 30분 알차게 써볼게요. 먼저 현재 상황이랑, 오늘 가장 듣고 싶은 이야기 하나만 뽑아주시면 그에 맞춰서 진행할게요.\"\n\n[2단계: 상황 파악 (3:00~8:00)]\n아래 5가지를 빠르게 확인하세요:\n1) 현재 신분: 학생(몇 학년) / 취준생 / 현직자(몇 년차)\n2) 관심 직무: 기획 / 프로그래밍 / 아트 / QA / TA 등\n3) 준비 단계: 탐색 중 / 포트폴리오 제작 중 / 서류 지원 중 / 면접 준비 중\n4) 목표 회사: 대형(넥슨,크래프톤,넷마블) / 중견(시프트업,펄어비스) / 스타트업 / 미정\n5) 오늘의 핵심 질문: 가장 궁금한 것 1가지\n\n이 단계에서 5분 이상 쓰지 마세요. 멘티가 장황하면:\n\"네, 상황 잘 이해했어요! 정리하면 OO님은 [요약]이시네요. 그럼 핵심 이야기로 들어갈게요.\"\n\n[3단계: 핵심 조언 (8:00~22:00)]\n14분 안에 최대 3개 주제만 다루세요.\n- 질문 1개당 4~5분 배분\n- 각 답변은 \"결론 먼저 -> 근거/사례 -> 구체적 액션\" 순서로\n- 실제 경험을 섞어주세요 (\"제가 넥슨 면접 볼 때는...\", \"우리 팀 신입이 왔을 때...\")\n\n멘티 유형별 핵심 조언 포인트:\n\n-- 유형 A: 대학생/취준생 --\n- 포트폴리오 방향: \"기획자라면 시스템 기획서 1개 + 레벨 기획서 1개 + 개인 분석 글이 최소. 프로그래머라면 완성된 게임 1개가 이력서 10줄보다 강력해요.\"\n- 회사 선택 기준: \"신입 때는 '배울 수 있는 환경'이 연봉보다 중요해요.\"\n- 현실적 타임라인: \"지금 2학년이면 3학년 여름까지 포트폴리오 1차 완성, 4학년 상반기에 공채/수시 지원이 일반적이에요.\"\n\n-- 유형 B: 주니어(1~3년차) 이직 고민 --\n- 이직 타이밍: \"최소 1년은 채우세요. 2~3년차가 이직 골든타임이에요.\"\n- 연봉 협상: \"게임 업계 이직 시 20~30% 인상이 일반적이에요.\"\n- 크런치/문화 이슈: \"면접에서 직접 물어보세요. 답변을 회피하는 회사는 피하는 게 좋아요.\"\n\n-- 유형 C: 타 업종 전환자 --\n- 현실 인식: \"전환은 가능하지만 쉽지 않아요. 직무별 필요 기술이 다릅니다.\"\n- 전환 전략: \"IT 개발자->게임 서버: 비교적 수월. 웹 프론트->게임 클라이언트: 언어(C++/C#)부터 다시.\"\n- 추천 경로: \"게임잼 참가, 소규모 인디 프로젝트 합류, 사이드 프로젝트로 포트폴리오를 만드세요.\"\n\n[4단계: 마무리 (22:00~28:00)]\n\"시간이 벌써 많이 갔네요. 오늘 나눈 이야기를 정리해볼게요.\"\n\"핵심 포인트 세 가지로 정리하면:\n1) [첫 번째 핵심]\n2) [두 번째 핵심]\n3) [세 번째 핵심]\"\n\n액션 아이템 제시 (반드시 구체적으로):\n\"오늘부터 바로 해보실 수 있는 건:\n- 이번 주: [구체적 행동 1]\n- 2주 내: [구체적 행동 2]\n- 1개월 내: [구체적 행동 3]\"\n\n[5단계: 버퍼 (28:00~30:00)]\n\"피드백 페이지에 오늘 핵심 내용을 정리해서 남겨드릴게요. 더 깊이 준비하고 싶으시면 이력서 첨삭이나 모의면접 상품도 있으니 참고해주세요. 좋은 결과 있으시길 바랍니다!\"\n\n[예시 대화 1: 컴공 3학년, 클라이언트 프로그래머 지망]\n멘토: \"어떤 게임을 좋아하세요?\"\n멘티: \"소울라이크 장르요. 엘든 링 500시간 했어요.\"\n멘토: \"대형사 클라이언트 포지션은 대부분 C++과 언리얼을 씁니다. 유니티는 중소/모바일 쪽이에요. 지금 유니티 프로젝트는 완성하세요. 완성 후 언리얼로 두 번째 프로젝트를 시작하시면 됩니다.\"\n\n[예시 대화 2: 마케터 3년차, 게임 기획자 전환]\n멘토: \"마케팅 경험을 버리지 마세요. 데이터 분석 능력은 라이브 서비스 기획에서 강점이에요. 좋아하는 게임 3개의 시스템 분석서를 써보세요. 넷마블, 컴투스 같은 모바일 게임사의 '라이브 운영 기획자' 포지션을 노려보세요.\"\n\n[예시 대화 3: QA 2년차, 커리어 고민]\n멘토: \"테크니컬 QA, 즉 자동화 테스트 엔지니어 쪽은 수요가 늘고 있어요. Python이나 C#으로 테스트 자동화 스크립트를 짤 수 있으면 QA와 개발 사이의 포지션을 잡을 수 있어요.\"\n\n[주의사항]\n- 30분은 짧습니다. 반드시 타이머를 켜놓고 진행하세요.\n- 한 질문에 10분 이상 쓰지 마세요.\n- 모르는 질문: \"제 전문 영역이 아니라서, [관련 자료]를 추천드릴게요.\" 모르는 걸 아는 척하지 마세요.\n- NDA 주의: 현재 프로젝트의 구체적 수치, 매출, 미공개 정보는 절대 언급 금지.",
  },
  // 실전 매뉴얼 — 서류 리뷰
  {
    category: "실전 매뉴얼",
    title: "서류 리뷰 실전 가이드 (45분 세션) - 사전 준비부터 피드백까지",
    content:
      "[사전 준비 체크리스트 (상담 2~3일 전)]\n\n멘티에게 사전 요청할 것:\n1) 이력서/포트폴리오 파일 (PDF 권장)\n2) 지원 회사 & 직무 (구체적으로: \"넥슨 게임 기획자\" vs 단순 \"기획자\")\n3) 경력 수준 (신입/경력 몇 년차)\n4) 특별히 피드백 받고 싶은 부분\n\n멘토가 사전에 해야 할 메모 작업:\n서류를 받으면 다음 4가지를 메모하세요:\n(1) 치명적 문제 3개: 탈락 사유가 될 수 있는 것\n(2) 구조/포맷 이슈: 가독성, 분량, 레이아웃\n(3) 내용 보강 포인트: 약한 섹션, 누락된 정보\n(4) 잘 된 부분 2개 이상: 반드시 찾으세요. 칭찬 없는 피드백은 의욕을 꺾습니다.\n\n[직무별 흔한 서류 실수]\n\n-- 게임 기획자 --\n- 기획서가 없고 자기소개서만 있음 -> \"기획자는 기획서가 곧 실력 증명이에요\"\n- 게임 분석이 감상문 수준 -> \"'재미있었다'가 아니라 '이 시스템이 리텐션에 기여하는 구조'를 분석해야 해요\"\n- 아이디어만 나열, 구현 가능성 무시\n- 수치/데이터 없음 -> \"밸런스 기획이면 시뮬레이션 스프레드시트를 첨부하세요\"\n\n-- 게임 프로그래머 --\n- GitHub 링크만 있고 설명 없음 -> \"리크루터는 코드를 직접 안 봐요. README에 요약, 기술 스택, 본인 기여도를 써야 해요\"\n- 학교 과제만 나열 -> \"팀 프로젝트에서 본인 역할을 명확히, 수치로\"\n- 사용 기술만 나열, 깊이 없음 -> \"'C++ 사용'이 아니라 'C++로 메모리 풀 구현하여 프레임 드랍 해결' 수준으로\"\n- 개인 프로젝트가 미완성 -> \"완성된 소규모 1개가 미완성 대규모 3개보다 나아요\"\n\n-- 게임 아티스트 --\n- 포트폴리오 이미지 해상도가 낮음 -> \"아트 포트폴리오는 첫인상이 전부예요\"\n- 스타일 일관성 없음 -> \"지원 회사 아트 스타일에 맞는 작업물 위주로\"\n- 작업 과정(WIP) 미포함 -> \"스케치->라인->컬러 과정을 보여주면 실력 어필\"\n- 팬아트만 있음 -> \"팬아트는 보조. 오리지널 디자인 필수\"\n\n[시간 배분 (분 단위)]\n00:00~03:00 — 인사 & 목표 확인 (\"어떤 회사/직무에 지원하시나요?\", \"이미 지원하셨어요, 지원 전이에요?\")\n03:00~08:00 — 긍정 피드백 먼저 (절대 건너뛰지 마세요!)\n08:00~28:00 — 개선점 상세 리뷰 (화면공유 필수, 섹션별 순서대로)\n28:00~35:00 — 우선순위 정리 (\"가장 중요한 3가지는...\")\n35:00~42:00 — 수정 방향 합의 + 구체적 수정 계획\n42:00~45:00 — 마무리 + 참고 자료 공유\n\n[피드백 프레임워크: Sandwich Method]\n\"이 부분이 별로예요\" (X)\n\"이 부분의 의도는 이해하는데, [구체적 이유]로 면접관에게 약하게 보일 수 있어요. [구체적 수정 방향]으로 바꾸면 훨씬 효과적이에요.\" (O)\n\n\"너무 부족해요\" (X)\n\"기본 구조는 잡혀 있으니까, 여기에 [구체적 보강 항목]을 추가하면 완성도가 확 올라갈 거예요.\" (O)\n\n[Before/After 예시 - 기획자]\nBefore: \"모바일 RPG 기획 참여\"\nAfter: \"[게임명] 모바일 RPG 전투 시스템 기획 (2인 기획팀, 본인 담당: 스킬 밸런싱). 1차 CBT 유저 피드백 기반 전투 밸런스 3회 개편, 전투 만족도 4.2점(5점 만점).\"\n\n[Before/After 예시 - 프로그래머]\nBefore: \"Unity, C#, Git 사용 가능\"\nAfter: \"Unity(C#) 2년 사용. 3D 액션 게임에서 FSM 기반 AI 시스템, 오브젝트 풀링, 어드레서블 에셋 로딩 구현. Git Flow 기반 4인 협업.\"\n\n[Before/After 예시 - 아티스트]\nBefore: \"3D 캐릭터 모델링 가능. Maya, ZBrush 사용.\"\nAfter: \"스타일라이즈드 3D 캐릭터 전문. Maya + ZBrush로 로우폴리(5K~15K tri) 게임용 캐릭터 제작. Substance Painter 텍스처링, 리깅, 기본 애니메이션까지 원스톱 가능.\"\n\n[서류 Red Flag 체크리스트]\n반드시 지적해야 할 것들:\n- 오탈자, 문법 오류 (기본 중의 기본)\n- 회사명/직무명 오기 (다른 회사에 보낸 서류 재활용 흔적)\n- 거짓/과장 경력 (면접에서 반드시 들킴)\n- 연락처/이메일 누락, 포트폴리오 링크 깨짐\n- 분량 과다 (신입 이력서는 1~2장이 적정)\n\n[서류를 안 가져온 경우]\n\"괜찮아요, 오늘은 방향을 잡는 시간으로 활용해볼까요? 지원 직무에서 면접관이 보는 포인트를 알려드리고, 이걸 체크리스트 삼아서 서류를 만들어 보세요. 완성 후 첨삭 상담을 다시 잡으시는 것도 좋은 방법이에요.\"",
  },
  // 실전 매뉴얼 — 모의면접
  {
    category: "실전 매뉴얼",
    title: "모의면접 실전 가이드 (60분 세션) - 면접관 역할부터 피드백까지",
    content:
      "[사전 준비 (상담 3일 전)]\n\n멘티에게 사전 요청:\n1) 지원 회사 & 직무 (예: \"크래프톤 배그 클라이언트 프로그래머\")\n2) 이력서/포트폴리오 (면접 질문 커스터마이징용)\n3) 면접 단계 (서류 합격 후 1차 기술면접? 2차 임원면접?)\n4) 특별히 연습하고 싶은 부분\n\n[직무별 면접 질문 뱅크]\n\n-- 게임 기획자 질문 (10개) --\n1) 최근 플레이한 게임의 핵심 재미요소를 분석해주세요\n2) 유저 리텐션을 높이기 위한 시스템을 설계해보세요\n3) P2W 없이 매출을 올리는 BM을 설계해보세요\n4) DAU 10만인 게임의 밸런스 패치를 어떻게 기획하겠어요?\n5) 팀원과 의견 충돌 시 어떻게 해결했나요?\n6) 기획 의도와 다르게 유저가 플레이한 경험은?\n7) 데드라인이 촉박할 때 피처 커팅 기준은?\n8) 왜 기획자가 되고 싶으세요? (구체적 계기)\n9) 5년 후 어떤 기획자가 되고 싶으세요?\n10) 이 게임의 경제 시스템에서 개선할 점은?\n\n-- 게임 프로그래머 질문 (12개) --\n1) C++에서 가상 함수 테이블(vtable) 동작 원리를 설명해주세요\n2) 게임에서 오브젝트 풀링을 사용하는 이유와 구현 방법은?\n3) A* 알고리즘을 설명하고, 게임에서의 활용 사례는?\n4) 멀티스레드 환경에서 데이터 레이스 방지 방법은?\n5) 클라이언트-서버 간 동기화 문제를 해결한 경험은?\n6) 프레임 드랍 발생 시 프로파일링 과정을 설명해주세요\n7) 언리얼 엔진의 리플리케이션 시스템을 설명해주세요\n8) 가장 어려웠던 버그와 해결 과정은?\n9) 코드 리뷰에서 의견 충돌 시 어떻게 했나요?\n10) 레거시 코드를 리팩토링한 경험은?\n11) 왜 게임 프로그래머를 선택했나요?\n12) 새로운 기술을 어떻게 학습하나요?\n\n-- 게임 아티스트 질문 (8개) --\n1) 포트폴리오에서 가장 자신 있는 작업물을 설명해주세요\n2) 이 캐릭터의 제작 파이프라인을 처음부터 끝까지 설명해주세요\n3) 로우폴리와 하이폴리 작업 시 최적화 기준은?\n4) PBR 워크플로우를 설명해주세요\n5) 기획/프로그래머와 협업 시 의견 충돌 경험은?\n6) 타이트한 일정에서 퀄리티와 속도의 균형은?\n7) 어떤 아트 스타일에 강점이 있나요?\n8) 아트 트렌드를 어떻게 따라가나요?\n\n-- QA 질문 (8개) --\n1) 테스트 케이스 작성 시 우선순위를 어떻게 정하나요?\n2) 재현이 어려운 버그를 어떻게 추적하나요?\n3) 자동화 테스트와 수동 테스트의 적절한 비율은?\n4) 크래시 로그 분석 과정을 설명해주세요\n5) 개발자가 \"이건 버그가 아니다\"라고 할 때 대응법은?\n6) 출시 직전 크리티컬 버그 발견 경험은?\n7) QA 직무의 가치를 어떻게 생각하나요?\n8) QA에서 커리어를 어떻게 발전시킬 계획인가요?\n\n[60분 세션 구조 (분 단위)]\n\n00:00~05:00 — 사전 안내\n\"앞으로 약 30분간 실제 면접처럼 진행해요. 저는 면접관 모드로 들어가서, 리액션을 일부러 최소화할 거예요. 면접이 끝나면 모드를 바꿔서 상세하게 피드백 드릴게요.\"\n\n05:00~07:00 — 자기소개 (평가: 시간 준수, 핵심 역량 언급, 지원 동기, 자신감)\n07:00~20:00 — 기술 질문 (3~5개, 꼬리질문으로 깊이 확인)\n20:00~30:00 — 경험/행동 질문 (STAR 기법 유도: Situation-Task-Action-Result)\n30:00~35:00 — 인성/문화적합 질문 + 역질문 능력 평가\n\n--- 면접 종료 ---\n\n35:00~37:00 — 모드 전환: \"수고하셨어요! 면접관 모드는 끝이에요. 편하게 대화하면서 피드백 드릴게요.\"\n37:00~55:00 — 상세 피드백 (질문별 복기 + 모범 답변 예시)\n55:00~58:00 — 종합 평가 & 액션 플랜\n58:00~60:00 — 마무리\n\n[평가 루브릭 - 면접관이 실제로 보는 5가지]\n1) 논리적 사고력: 답변의 구조, 근거 제시 (5점)\n2) 기술적 깊이: 표면적 지식 vs 원리 이해 (5점)\n3) 커뮤니케이션: 설명력, 경청, 질문 이해도 (5점)\n4) 문제해결 능력: 모르는 문제에 대한 접근 방식 (5점)\n5) 문화적합도: 팀워크, 성장 의지, 태도 (5점)\n총점과 함께 전달하고, 합격 가능성을 솔직하되 부드럽게 평가하세요.\n\n[면접 Top 10 실수 & 코칭 포인트]\n1) 자기소개가 3분 이상 -> \"1분 안에 핵심만. 이름, 경력/학교, 핵심 역량, 지원 동기 순서로\"\n2) \"잘 모르겠습니다\"로 끝냄 -> \"모르더라도 '알고 있는 범위에서 추측하면...' 식으로 사고 과정을 보여주세요\"\n3) 프로젝트 설명 시 팀 전체 이야기만 -> \"면접관은 '당신이 뭘 했는지'를 듣고 싶어요. 주어를 '저는'으로\"\n4) 기술 용어를 정확히 모르면서 사용 -> \"확실히 아는 것만 말하세요. 아는 척이 제일 위험해요\"\n5) 답변이 너무 길거나 횡설수설 -> \"결론 먼저, 근거 다음. PREP 구조를 쓰세요\"\n6) 이전 회사/팀 험담 -> \"절대 금지. '성장 환경을 바꾸고 싶어서' 정도로 순화하세요\"\n7) 역질문에서 \"없습니다\" -> \"반드시 1~2개 준비. '팀 개발 문화는?' '신입 1년 목표는?'\"\n8) 카메라를 안 봄 -> \"화상 면접이면 카메라 렌즈를 보세요. 화면 속 얼굴이 아니라 렌즈를 봐야 아이컨택\"\n9) 복장이 너무 캐주얼 -> \"게임 업계도 면접은 비즈니스 캐주얼 이상\"\n10) 너무 빨리 말함 -> \"의식적으로 천천히, 문장 끝에서 0.5초 쉬세요\"",
  },
  // 멘티 대처법 (상황별)
  {
    category: "멘티 대처법",
    title: "상황 1: 준비를 전혀 안 해 온 멘티",
    content:
      "[증상]\n- 질문이 없음, \"그냥 이것저것 궁금해서요\"\n- 지원 회사/직무도 정하지 않음\n- 서류 리뷰인데 서류를 안 가져옴\n- 모의면접인데 지원 분야를 모름\n\n[원칙] 멘티를 탓하지 말고, 세션을 구조화해주세요.\n멘티가 돈을 냈습니다. 어떤 상황이든 가치를 전달하는 것이 프로의 자세입니다.\n\n[커피챗인 경우 - 대처 스크립트]\n\"괜찮아요! 방향을 못 잡으신 분들이 꽤 많아요. 제가 질문을 드릴 테니 편하게 답해주세요.\"\n1) \"게임 업계의 어떤 점이 끌리세요?\"\n2) \"평소에 게임을 주로 하시나요? 어떤 장르를 좋아하세요?\"\n3) \"학교에서 뭘 전공하시고, 어떤 과목이 재밌었어요?\"\n4) \"코딩, 그림, 글쓰기, 데이터 분석 - 이 중에 하나 고르면?\"\n이 질문들을 통해 적합 직무를 추천해주세요.\n\n[서류 리뷰인데 서류가 없는 경우]\n\"서류가 아직 없으시군요. 그러면 오늘은 더 효율적으로 활용해볼게요.\"\n\"지원 직무의 이력서/포트폴리오에서 면접관이 실제로 보는 포인트를 알려드릴 테니, 체크리스트 삼아서 서류를 만들어 보세요.\"\n\n[모의면접인데 기본기가 전혀 없는 경우]\n\"솔직하게 말씀드릴게요. 지금 바로 모의면접을 하면 힘드실 거예요. 오늘은 면접 준비 로드맵을 짜드릴게요.\"\n\"1단계(1~2주): 핵심 지식 정리\n2단계(2~3주): 예상 질문 30개 답변 스크립트 작성\n3단계(1주): 모의면접 실전 연습\n2단계까지 하신 후 다시 잡으시면 100배 효과적이에요.\"\n\n[주의사항]\n- 절대 \"왜 준비를 안 하셨어요?\" 식의 질문 금지\n- \"다음에는 준비해 오세요\" 식의 훈계 톤 금지\n- \"이 단계에서 상담 오신 게 오히려 좋아요. 방향을 잘못 잡고 6개월 낭비하는 것보다 훨씬 효율적이에요.\"",
  },
  {
    category: "멘티 대처법",
    title: "상황 2: 검색하면 나오는 기초 질문만 하는 멘티",
    content:
      "[증상]\n- \"게임 기획자가 하는 일이 뭐예요?\"\n- \"유니티랑 언리얼 중에 뭐가 좋아요?\"\n- \"게임 회사 취업하려면 뭘 준비해야 해요?\"\n\n[원칙] 검색 결과 이상의 가치를 더해주세요.\n기초 질문 자체를 무시하지 마세요. 멘티는 정보가 너무 많아서 '진짜'가 뭔지 모르는 것입니다.\n\n[기초 질문에 현직자 관점 추가]\n멘티: \"게임 기획자가 하는 일이 뭐예요?\"\n\n나쁜 답변: \"그건 검색해보시면 나와요.\"\n\n좋은 답변: \"검색하면 '게임 설계를 하는 사람'이라고 나오는데, 실제로는 조금 달라요. 업무의 60%가 '문서 작성과 커뮤니케이션'이에요. 아이디어를 내는 시간보다, 기획서로 정리하고, 일정 조율하고, 피드백 반영하는 시간이 훨씬 많아요.\n\n구체적으로 하루 일과를 말씀드리면:\n- 오전: 전날 빌드 플레이 + 이슈 체크 + 데일리 스크럼\n- 오후: 기획서 작성/수정 + 다른 직군과 미팅 + 데이터 확인\n- 저녁(크런치 시): QA 이슈 대응 + 다음 마일스톤 기획\n이게 검색으로는 안 나오는 실제 모습이에요.\"\n\n[질문을 한 단계 깊이 유도]\n\"그러면 기획자 업무 중에서 어떤 부분이 가장 끌리세요? 시스템 설계? 스토리? 레벨 디자인? 각각 필요한 역량이 달라서, 거기에 맞춰 준비 방향을 잡아드릴 수 있어요.\"\n\n[엔진 비교 질문 대처]\n\"'어떤 게임을 만들고 싶은지'에 따라 달라요.\n- 모바일/인디/2D -> 유니티 (C#, 진입장벽 낮음)\n- PC/콘솔/AAA/FPS -> 언리얼 (C++, 그래픽 강점)\n- 취업 관점 -> 크래프톤/펄어비스 = 언리얼, 넷마블 일부/중소 모바일 = 유니티\n근데 더 중요한 건, '어떤 엔진이냐'보다 '완성된 프로젝트가 있느냐'예요.\"\n\n[핵심 원칙]\n1) 기초 질문 = 현직자만 줄 수 있는 살아있는 정보를 더하세요.\n2) 답변 후 반드시 한 단계 깊은 질문으로 유도하세요.\n3) 전체 세션이 기초 Q&A로만 끝나지 않도록, 중반 이후에는 멘티 상황에 맞춘 조언으로 전환하세요.",
  },
  {
    category: "멘티 대처법",
    title: "상황 3: 회사 가십/연봉 정보만 물어보는 멘티",
    content:
      "[증상]\n- \"넥슨 연봉이 진짜 얼마예요?\"\n- \"크래프톤 크런치 심해요?\"\n- \"OO 팀 분위기 어때요?\"\n- \"OO 게임 서비스 종료 예정이에요?\"\n- \"OOO PD님 성격이 어때요?\"\n\n[원칙] 공유 가능한 범위를 명확히 하고, 커리어 관점으로 리다이렉트하세요.\n\n[연봉 질문 대처]\n\"구체적인 숫자는 말씀드리기 어려워요. 대신 업계 전반적인 범위는 알려드릴 수 있어요.\n\n게임 업계 프로그래머 기준 대략적 범위:\n- 신입: 3,500~5,000만원 (대형사 기준, 중소는 2,800~3,500)\n- 3년차: 4,500~6,500만원\n- 5년차: 6,000~8,500만원\n- 10년차+: 8,000~1.2억+\n이건 블라인드나 잡플래닛에서도 확인하실 수 있어요.\"\n\n\"더 중요한 건, 같은 3년차라도 프로젝트와 역할에 따라 차이가 커요. 연봉을 높이는 기술 전략이나 이직 타이밍을 같이 이야기해보는 게 더 도움이 될 것 같은데 어떠세요?\"\n\n[크런치/문화 질문 대처]\n\"특정 팀 상황은 말씀드리기 어렵지만, 업계 일반적 패턴은 알려드릴 수 있어요.\n보통 마일스톤/CBT/런칭 전 2~3개월이 집중 기간이에요. 회사마다, 같은 회사 안에서도 팀마다 천차만별이에요.\n면접 때 '일반적인 근무 패턴이 어떻게 되나요?' 이런 식으로 물어보면 자연스러워요.\"\n\n[특정 인물/팀 질문 대처]\n\"특정 분에 대해서는 말씀드리기 어려워요. 대신, 면접이나 입사 후에 팀 리더십을 파악하는 방법을 알려드릴게요.\n1) 면접에서 '팀 리드분의 업무 스타일은 어떤가요?'라고 물어보세요.\n2) 블라인드, 잡플래닛에서 해당 팀 리뷰를 찾아보세요.\n3) 가능하면 해당 팀 재직자/퇴사자와 커피챗을 해보세요.\"\n\n[미공개 정보 질문 대처]\n\"그건 NDA(비밀유지계약) 사항이라 말씀드릴 수 없어요. 공식 발표 전 정보는 어떤 경우에도 공유할 수 없다는 점 양해 부탁드려요.\n대신, 회사의 사업 방향성을 파악하는 방법은 알려드릴 수 있어요:\n- 공시 자료 (상장사), 실적 발표회/IR 자료\n- 채용 공고의 직무/기술 스택 변화 추이\n- 게임 미디어 인터뷰/발표 자료\"\n\n[핵심 원칙]\n1) NDA를 위반하지 마세요. 커피챗에서 말한 것도 '공개 발언'입니다.\n2) 특정 개인에 대한 평가는 절대 하지 마세요.\n3) 가십 질문을 커리어 전략 질문으로 전환하세요.\n4) \"대신 이런 걸 알려드릴 수 있어요\"로 세션 가치를 유지하세요.",
  },
  {
    category: "멘티 대처법",
    title: "상황 4: 비현실적 기대를 가진 멘티",
    content:
      "[증상]\n- \"6개월 안에 넥슨 입사할 수 있을까요?\" (비전공, 프로젝트 경험 없음)\n- \"프로그래밍 안 해도 기획자 될 수 있죠?\"\n- \"포트폴리오 없이 대형사 갈 수 있는 방법 없나요?\"\n- \"1년만 하면 연봉 1억 가능하죠?\"\n\n[원칙] 현실을 알려주되, 희망을 꺾지 마세요.\n솔직함과 잔인함은 다릅니다. 목표 달성까지의 현실적 경로를 제시하세요.\n\n[비전공자의 단기 대형사 목표]\n멘티: \"프로그래밍 배운 지 3개월인데, 내년에 크래프톤 가고 싶어요.\"\n\n\"목표가 높은 건 좋아요! 근데 현실적인 타임라인을 같이 잡아보면 더 전략적으로 준비할 수 있어요.\"\n\n\"크래프톤 프로그래머 공채 합격자 프로필:\n- CS 기초(자료구조, 알고리즘, OS, 네트워크) 탄탄\n- C++ 숙련 (최소 1년 이상)\n- 완성된 게임 프로젝트 1~2개\n- 코딩 테스트 통과 능력\n\n현재 3개월차라면 내년 공채는 빠듯해요. 대신 이런 로드맵을 제안할게요:\n1단계 - 기반 다지기 (6개월): CS 기초 + C++ 심화 + 알고리즘 300문제+\n2단계 - 프로젝트 (6개월): 언리얼 학습 + 미니 프로젝트 + 게임잼 참가\n3단계 - 지원 (3개월): 포트폴리오 정리 + 모의면접\n\n총 15~18개월. 처음부터 대형사를 고집하기보다, 중소/중견에서 1~2년 실무 경험 후 이직하는 게 현실적으로 더 빠른 길일 수 있어요.\"\n\n[포트폴리오 없이 취업 가능 질문]\n\"포트폴리오 없이 지원하는 건 이력서에 '저는 유능합니다'라고만 쓰는 거랑 같아요. 하지만 대단한 걸 기대하는 건 아니에요.\n기획자의 경우: A4 3~5장짜리 시스템 기획서 1개 + 게임 분석글 1개 + 레벨 기획서 1개. 2~3주면 만들 수 있어요.\"\n\n[과도한 연봉 기대]\n\"게임 업계 연봉 1억은 보통 시니어급(7~10년차) 이상에서 도달하는 구간이에요. 하지만 3~4년차에 이직하면서 빠르게 올리는 분들도 많아요. 지금은 '어디서 뭘 배울 수 있는지'에 집중하시는 게 장기적으로 더 높은 연봉으로 가는 길이에요.\"\n\n[핵심 원칙]\n1) \"불가능하다\"가 아니라 \"이 경로로 가면 가능하다\"로 표현\n2) 현실적 타임라인을 구체적 숫자로 제시\n3) 대안 경로를 반드시 함께 제시\n4) 멘티의 열정은 인정하되, 전략을 다듬어주세요",
  },
  {
    category: "멘티 대처법",
    title: "상황 5: 감정적이거나 좌절한 멘티",
    content:
      "[증상]\n- 면접 불합격 직후, 눈물을 보이거나 목소리가 떨림\n- \"저는 재능이 없나 봐요\", \"이 업계가 저를 안 받아주는 것 같아요\"\n- 현직에서 번아웃/크런치로 지쳐 있음\n- 퇴사를 감정적으로 결정하려 함\n- 동기/후배가 먼저 취업/승진해서 자존감 하락\n\n[원칙] 먼저 감정을 받아주고, 그 다음에 해결책을 이야기하세요.\n감정적인 멘티에게 바로 해결책을 제시하면 \"내 마음을 모르면서\"라는 반감이 생깁니다.\n\n[1단계: 경청 & 공감 (3~5분) - 이 시간에는 조언하지 마세요]\n\"많이 힘드셨겠어요.\"\n\"그 상황이면 누구라도 지칠 수 있어요.\"\n\"불합격 소식 받고 바로 이 상담을 신청하신 거예요? 그것만으로도 대단하세요.\"\n\"저도 [프로젝트명] 런칭 때 3개월 동안 매일 야근했는데, 그때 게임 업계를 떠나고 싶었어요.\"\n주의: 가벼운 위로(\"괜찮아요~\")는 오히려 역효과. 구체적 공감이 필요합니다.\n\n[2단계: 상황 객관화 (5~10분)]\n감정이 어느 정도 가라앉으면 상황을 객관적으로 정리해주세요.\n\n면접 불합격 후:\n\"면접 불합격이 본인의 가치와 동일하지 않아요. 저도 첫 이직 때 3번 떨어졌어요. 면접은 '이 회사와의 궁합'을 보는 거지 '능력의 절대적 평가'가 아니에요.\"\n\n번아웃/크런치:\n\"지금 당장 퇴사를 결정하시기보다, 이 크런치가 프로젝트 특성상 일시적인 건지, 팀/회사 문화적으로 상시적인 건지 확인해보세요. 감정적 퇴사 후 공백기가 생기면 다음 면접에서 불리할 수 있어요. 현재 회사에서 버티면서 이직 준비를 병행하시는 게 안전해요.\"\n\n[3단계: 작은 액션 아이템 (5분)]\n좌절한 상태에서 큰 계획은 부담됩니다. 아주 작은 행동 1개만 제안하세요.\n- 불합격: \"면접에서 가장 막혔던 질문 1개만 정리해서 답변을 다시 써보세요.\"\n- 번아웃: \"이번 주말에 하루만 완전히 쉬세요. 게임도, 공부도 안 하고.\"\n- 자존감: \"본인이 지금까지 해온 것들을 리스트로 적어보세요. 생각보다 많을 거예요.\"\n\n[절대 하면 안 되는 것]\n- \"그 정도는 누구나 겪어요\" (고통의 상대화)\n- \"긍정적으로 생각하세요\" (감정 부정)\n- \"제가 더 힘들었어요\" (경쟁적 공감)\n- \"그 회사 별로예요, 안 간 게 다행\" (목표 폄하)\n- 즉석에서 퇴사를 권유하거나 말리는 것 (결정은 멘티의 몫)\n\n[멘토 자신의 감정 관리]\n멘티의 감정에 과도하게 동조하면 멘토도 지칩니다.\n- 상담 후 5분간 혼자 정리하는 시간을 가지세요\n- 감정적 상담이 연속되면 스케줄 간격을 넉넉히 두세요\n- 멘토도 사람입니다. 무리하지 마세요.",
  },
  {
    category: "멘티 대처법",
    title: "공통: 멘티 늦게 접속 / 노쇼 / 기술 문제 대처",
    content:
      "[멘티가 늦게 접속하는 경우]\n\n5분 후 메시지: \"안녕하세요! 오늘 상담 시간이에요. 접속이 안 되시면 편하게 연락주세요.\"\n10분 후 메시지: \"10분이 지났는데 접속이 안 되고 있어요. 15분까지 대기할게요.\"\n15분 후: \"15분간 대기했는데 접속이 안 되어서, 오늘 상담은 노쇼로 처리할게요.\"\n\n늦게 접속한 경우: \"괜찮아요! 남은 시간만큼 최대한 알차게 진행할게요.\"\n잔여 시간에 맞춰 내용 조정. 10분 늦었으면 아이스브레이킹 생략, 바로 핵심으로.\n\n[기술 문제 대처]\n\n음성이 안 들리는 경우:\n\"마이크 음소거 확인해주세요.\"\n\"브라우저 마이크 권한을 확인해주세요.\"\n\"한번 나갔다가 다시 들어와주세요.\"\n최후 수단: \"채팅으로 질문 보내주시고 제가 음성으로 답변드리는 방식으로 할까요?\"\n\n화면공유 불가:\n\"서류/포트폴리오를 채팅창에 파일로 공유해주세요. 제가 화면공유로 띄워서 같이 볼게요.\"\n\n[원칙]\n- 기술 문제로 5분 이상 허비하지 마세요. 대안을 빠르게 제시하세요.\n- 멘티 탓을 하지 마세요. \"이런 일 자주 있어요, 괜찮아요.\"",
  },
  // 프로필 작성법
  {
    category: "프로필 작성법",
    title: "프로필 작성 공식 - 멘티가 '이 분이다!' 하고 클릭하게 만드는 법",
    content:
      "[프로필이 중요한 이유]\n멘티는 멘토를 고를 때 평균 3~5명의 프로필을 비교합니다. 첫 2줄에서 \"이 분이 내 고민을 해결해줄 수 있겠다\"는 확신이 안 들면 넘어갑니다.\n\n[프로필 작성 공식 (4단락 구조)]\n\n1단락 - 현재: 누구인가 (1~2줄)\n\"[회사명]에서 [N]년째 [직무]로 일하고 있어요. [현재 담당 업무]를 하고 있습니다.\"\n\n2단락 - 경력: 무엇을 해왔는가 (2~3줄)\n\"이전에는 [이전 회사]에서 [경험]을 했고, [주요 성과/프로젝트]에 참여했어요.\"\n\n3단락 - 전문성: 무엇을 잘하는가 (1~2줄)\n\"특히 [세부 전문 분야]에 강점이 있어요.\"\n\n4단락 - 대상: 누구에게 도움이 되는가 (2~3줄)\n\"이런 분들에게 도움이 될 수 있어요: [대상 1], [대상 2], [대상 3]\"\n\n[나쁜 프로필 vs 좋은 프로필]\n\n나쁜 예시 1:\n\"게임 업계에서 일하고 있습니다. 궁금한 점 물어보세요.\"\n문제: 어떤 회사, 어떤 직무, 몇 년차인지 전혀 알 수 없음.\n\n나쁜 예시 2:\n\"넥슨, 크래프톤, 넷마블 등 다양한 경험. 게임 관련 모든 질문에 답해드릴 수 있어요.\"\n문제: 범위가 너무 넓어서 전문성이 안 느껴짐.\n\n좋은 예시 (기획자):\n\"넷마블에서 6년째 시스템 기획자로 일하고 있어요. 모바일 RPG의 경제 시스템과 BM 기획을 담당하고 있습니다.\n이전에 스타트업에서 하이퍼캐주얼 게임 3종을 기획/런칭했어요. 모바일 게임 수치 밸런싱과 라이브 운영에 강점이 있습니다.\n시스템 기획자가 되고 싶은 분, 기획서 작성이 어려운 분, 모바일 게임 업계 현실이 궁금한 분들에게 조언 드릴 수 있어요.\"\n\n좋은 예시 (아티스트):\n\"시프트업에서 4년째 3D 캐릭터 모델러로 일하고 있어요. 스타일라이즈드 캐릭터 제작과 PBR 텍스처링을 전문으로 합니다.\n이전에 프리랜서로 2년간 인디 게임 3종의 캐릭터 에셋을 납품했어요. Maya, ZBrush, Substance Painter 기반 파이프라인에 익숙합니다.\n게임 아티스트 취업 준비, 포트폴리오 구성 고민, 프리랜서->정규직 전환 고민에 도움이 될 수 있어요.\"\n\n[태그 선택 팁]\n- 5~7개가 적정. 너무 많으면 전문성이 희석됨\n- 실무에서 매일 사용하는 기술 위주\n- 나쁜 예: C++, C#, Python, Java, Unity, Unreal, Godot (모든 걸 다 하는 사람은 없습니다)\n- 좋은 예: C++, Unreal Engine, 게임 서버, 최적화, 셰이더 (집중된 전문성)\n\n[프로필 사진 팁]\n- 얼굴 사진이 아니어도 OK (닉네임 시스템)\n- 게임 캐릭터, 아바타, 깔끔한 일러스트 권장\n- 프로필 사진이 없는 것보다는 어떤 이미지라도 있는 게 클릭률이 높습니다\n\n[상담 가능 시간 설정 팁]\n- 최소 주 3~4슬롯 등록 권장\n- 수요가 가장 많은 시간대: 평일 저녁 7~10시, 주말 오전 10~12시\n- 최소 3일 후부터 가능하게 설정하세요 (당일/다음날은 예약이 잘 안 들어옵니다)",
  },
  {
    category: "프로필 작성법",
    title: "경력 기술 시 주의사항 - 신뢰를 쌓는 방법",
    content:
      "[경력 기술 원칙]\n\nDO:\n- 구체적 회사명과 연차를 명시하세요 (인증 멘토는 더 높은 신뢰)\n- 담당한 프로젝트와 역할을 구체적으로\n- 본인이 실제로 도움 줄 수 있는 범위를 정직하게\n- 멘토링 경험이나 후배 교육 경험이 있으면 언급\n\nDON'T:\n- 경력 과장/허위 기재 절대 금지 (적발 시 영구 정지)\n- NDA에 해당하는 프로젝트 정보 노출 금지\n- \"모든 분야 가능\" 식의 과대 범위 설정 금지\n- 타인의 성과를 본인 것처럼 기술 금지\n\n[경력별 프로필 차별화]\n\n주니어 멘토 (3~5년차)\n강점: 최근 취업/면접 경험이 생생함\n\"취업 준비부터 현직 3년차까지의 경험을 생생하게 공유할 수 있어요. 특히 서류 준비와 면접에서 합격의 결정적 요소가 뭐였는지 구체적으로 알려드릴게요.\"\n\n시니어 멘토 (5~10년차)\n강점: 실무 깊이 + 팀 리딩 경험\n\"5년간 라이브 서비스 운영을 거치면서, 신입 때 몰랐던 '실제 게임 개발의 현실'을 많이 배웠어요. 취업 준비뿐 아니라 입사 후 적응, 커리어 방향 설정까지 도와드릴 수 있습니다.\"\n\n리드 멘토 (10년차+)\n강점: 채용 면접관 경험 + 업계 전체 조감\n\"10년간 3개 회사를 거치면서 채용 면접관으로 수십 명을 평가했어요. 면접관이 지원자의 어디를 보는지, 합격과 불합격을 가르는 결정적 차이가 뭔지를 알려드릴 수 있습니다.\"",
  },
  // 첫 상담 준비
  {
    category: "첫 상담 준비",
    title: "기술 환경 세팅 체크리스트",
    content:
      "[상담 전날까지 완료할 것]\n\n카메라:\n[ ] 웹캠 작동 확인 (Google Meet/Zoom에서 테스트)\n[ ] 얼굴이 화면 중앙~상단 1/3에 위치하도록 조정\n[ ] 역광 주의: 창문을 등지지 마세요. 얼굴에 빛이 오도록\n[ ] 카메라를 눈높이에 맞추세요 (노트북이면 받침대 사용)\n[ ] 카메라 ON이 부담스러우면 OFF도 OK. 단, 첫 인사 때만이라도 잠시 켜는 것 권장\n\n마이크:\n[ ] 마이크 음질 확인: 녹음 앱으로 자기 목소리 들어보기\n[ ] 에어팟/이어폰보다 헤드셋이 음질이 좋습니다\n[ ] 키보드 타이핑 소리가 마이크에 들어가지 않는지 확인\n[ ] 음소거 단축키 미리 확인 (기침, 소음 발생 시 즉시 음소거)\n\n배경:\n[ ] 깔끔하고 정리된 배경 (책장, 단색 벽 등)\n[ ] 가상 배경 사용도 OK (Zoom 가상 배경, 흐림 효과)\n[ ] 조용한 장소: 카페 등 소음이 많은 곳 피하기\n\n인터넷:\n[ ] 유선 인터넷 > WiFi (가능하면 유선 사용)\n[ ] 속도 테스트: fast.com에서 최소 10Mbps 이상 확인\n[ ] 다른 탭에서 영상 스트리밍, 대용량 다운로드 중지\n[ ] 만약을 위해 모바일 핫스팟 준비\n\n화면공유 준비:\n[ ] 불필요한 탭/창 정리 (개인정보, 사적 대화 노출 주의)\n[ ] 서류 리뷰 시: 멘티 서류를 미리 열어두기\n[ ] 필요한 참고 자료(채용 공고, 예시 포트폴리오)도 미리 열어두기\n[ ] 알림 끄기: 슬랙, 카카오톡, 메일 등의 알림 OFF",
  },
  {
    category: "첫 상담 준비",
    title: "멘탈 준비 & 마인드셋",
    content:
      "[첫 상담 전 멘토의 흔한 걱정]\n\n\"내가 좋은 멘토가 될 수 있을까?\"\n-> 멘티는 '완벽한 답'이 아니라 '현직자의 솔직한 경험'을 원합니다. 본인의 경험을 있는 그대로 공유하는 것만으로 충분합니다.\n\n\"모르는 질문이 나오면 어쩌지?\"\n-> \"그 부분은 제 전문 영역이 아니라서 정확한 답변이 어렵지만, [대안]을 추천드릴 수 있어요.\" 모르는 걸 인정하는 게 아는 척보다 100배 신뢰를 줍니다.\n\n\"30분 동안 할 말이 없으면 어쩌지?\"\n-> 멘티의 질문 목록을 사전에 확인하세요. 질문이 없어도, '멘티 대처법' 가이드를 활용하면 대화를 이끌 수 있습니다.\n\n[상담 5분 전 루틴]\n1) 멘티 정보 다시 한번 확인 (이름, 질문, 목표)\n2) 물 한 잔 준비\n3) 미팅 링크에 미리 접속 (1~2분 전)\n4) 상담 구조를 머릿속으로 정리 (오프닝 -> 상황파악 -> 핵심 -> 마무리)\n5) 타이머 설정 (30분/45분/60분)\n\n[멘토링 마인드셋 3가지]\n\n1. 가르치는 게 아니라 공유하는 것\n\"선생님\"이 아니라 \"먼저 그 길을 걸어본 사람\"의 입장으로 다가가세요. \"이렇게 해야 해요\" 대신 \"제 경험에서는 이랬어요\"가 더 효과적입니다.\n\n2. 정답보다 방향을 제시하세요\n멘티마다 상황이 다릅니다. \"A를 하세요\"보다 \"A, B, C 옵션이 있는데, OO님 상황에서는 A가 적합해 보여요. 이유는...\"이 더 좋은 조언입니다.\n\n3. 사후 관리도 중요합니다\n상담이 끝난 후 피드백 페이지에 핵심 내용을 정리해서 남겨주세요. 이것만으로도 멘티의 만족도가 크게 올라갑니다.",
  },
  {
    category: "첫 상담 준비",
    title: "첫 상담 실전 체크리스트 (완전판)",
    content:
      "[상담 7일 전: 프로필 점검]\n[ ] 자기소개 200자 이상 작성 (4단락 공식 활용)\n[ ] 전문 분야 태그 5~7개 설정\n[ ] 상담 가능 시간 최소 주 3슬롯 등록\n[ ] 프로필 사진 등록\n[ ] 상품 최소 1개 활성화 및 가격 설정\n[ ] 본인 경력 티어에 맞는 상품인지 확인\n\n[첫 예약이 들어오면 (24시간 이내)]\n[ ] 예약 알림 확인\n[ ] 멘티 소개/목표/질문 목록 읽기\n[ ] 24시간 이내 \"확인\" 클릭\n[ ] 미팅 링크 생성 (Google Meet 또는 Zoom)\n[ ] 미팅 링크를 대시보드에 입력 후 \"확정\"\n[ ] 서류 리뷰의 경우: 멘티에게 서류 사전 제출 요청\n\n[상담 전날]\n[ ] 멘티 정보 재확인 (이름, 직무 관심사, 질문 목록)\n[ ] 상담 유형에 맞는 가이드 재확인 (커피챗/서류/모의면접)\n[ ] 서류 리뷰: 사전 제출 서류 검토 + 메모 작성\n[ ] 모의면접: 질문 10개 이상 준비\n[ ] 기술 환경 테스트 (카메라, 마이크, 인터넷)\n\n[상담 당일 (30분 전)]\n[ ] 상담 공간 정리 (배경, 조명, 소음)\n[ ] 불필요한 프로그램/탭 종료\n[ ] 알림 끄기 (슬랙, 카카오톡, 메일)\n[ ] 참고 자료 미리 열어두기\n[ ] 물 준비\n\n[상담 직전 (5분 전)]\n[ ] 미팅 링크 접속\n[ ] 카메라/마이크 최종 확인\n[ ] 타이머 설정\n[ ] 멘티 이름과 핵심 질문 머릿속 정리\n\n[상담 직후]\n[ ] 피드백 페이지에 핵심 내용 정리 (3일 이내)\n[ ] 서류 리뷰: 서면 피드백 전달 (3일 이내)\n[ ] 모의면접: 피드백 리포트 전달 (2일 이내)\n[ ] 추가 질문 대응 (커피챗: 1회, 서류/모의면접: 필요시)\n\n[첫 상담에서 흔한 실수 5가지]\n1) 시간 초과: 30분 상담을 50분 하지 마세요. 시간 관리가 프로의 기본.\n2) TMI: 본인 이야기만 20분 하고 멘티 질문을 못 다루는 경우. 멘티의 시간입니다.\n3) 과도한 겸손: \"저도 잘 모르지만...\"을 반복하면 멘티가 불안해합니다. 아는 것은 자신 있게.\n4) 지나친 솔직: \"솔직히 그 회사 최악이에요\" - 개인적 감정을 사실처럼 전달하지 마세요.\n5) 팔로업 없음: 상담만 하고 피드백을 안 남기면 만족도가 크게 떨어집니다.",
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
  "멘티 대처법": {
    color: "text-rose-600",
    bgColor: "bg-rose-500/5",
    borderColor: "border-l-rose-500",
    badgeBg: "bg-rose-500/10",
    badgeText: "text-rose-600",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
  "멘티 대처법",
  "프로필 작성법",
  "첫 상담 준비",
];

// Stats for the hero section
const STATS = [
  { value: "85%", label: "멘토 수령률", sublabel: "수수료 15%" },
  { value: "24h", label: "응답 시간", sublabel: "이내 확인" },
  { value: "9개", label: "가이드 카테고리", sublabel: "핵심 규칙" },
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
