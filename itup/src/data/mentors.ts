import { MentorData } from "@/components/MentorDetailModal";

export type ConsultType = "coffee" | "resume" | "interview";

export const consultTypeLabels: Record<ConsultType, string> = {
  coffee: "커피챗",
  resume: "이력서/포트폴리오",
  interview: "모의면접",
};

export const mentorsData: MentorData[] = [
  {
    name: "데브민",
    role: "시니어 게임 프로그래머",
    company: "N사",
    previousCompanies: ["S사", "K사"],
    experience: "8년",
    specialty: "언리얼 엔진, 서버 개발",
    rating: 4.9,
    sessions: 120,
    reviews: 89,
    bio: "대형 MMORPG 및 액션 게임 프로젝트에서 서버 개발을 담당했습니다. 게임 서버 아키텍처 설계부터 최적화까지 실무 경험을 바탕으로 멘토링을 진행합니다. 특히 신입 개발자분들의 기술 면접 준비와 포트폴리오 리뷰에 강점이 있습니다.",
    availableTimes: ["평일 저녁 7-10시", "주말 오후 2-6시"],
    consultTypes: ["coffee", "resume", "interview"],
  },
  {
    name: "기획요정",
    role: "게임 기획자",
    company: "N사",
    previousCompanies: [],
    experience: "6년",
    specialty: "밸런싱, 시스템 기획",
    rating: 4.8,
    sessions: 95,
    reviews: 72,
    bio: "모바일 RPG 및 수집형 게임의 시스템 기획과 밸런싱을 전문으로 합니다. 기획서 작성법부터 데이터 분석을 통한 라이브 운영까지, 실무에서 바로 쓸 수 있는 노하우를 전달해드립니다.",
    availableTimes: ["평일 저녁 8-11시", "토요일 오전 10-12시"],
    consultTypes: ["coffee", "resume"],
  },
  {
    name: "쉐이더장인",
    role: "테크니컬 아티스트",
    company: "K사",
    previousCompanies: ["N사"],
    experience: "7년",
    specialty: "셰이더, 최적화",
    rating: 5.0,
    sessions: 78,
    reviews: 65,
    bio: "AAA급 FPS 게임의 그래픽 최적화 및 셰이더 개발에 참여했습니다. 아트와 프로그래밍의 가교 역할을 하는 TA로서, 언리얼/유니티 셰이더 작성과 렌더링 파이프라인 이해를 도와드립니다.",
    availableTimes: ["평일 저녁 9-11시", "일요일 오후 3-7시"],
    consultTypes: ["coffee", "resume", "interview"],
  },
  {
    name: "유나UI",
    role: "UI/UX 디자이너",
    company: "S사",
    previousCompanies: ["N사", "P사"],
    experience: "5년",
    specialty: "게임 UI, 모션 그래픽",
    rating: 4.9,
    sessions: 86,
    reviews: 71,
    bio: "여러 인기 게임의 UI/UX 디자인을 담당했습니다. 게임 특유의 몰입감 있는 인터페이스 설계와 모션 그래픽을 통한 피드백 디자인을 전문으로 합니다. 포트폴리오 구성과 면접 준비를 함께 도와드려요.",
    availableTimes: ["화/목 저녁 7-10시", "토요일 오후 1-5시"],
    consultTypes: ["coffee", "resume"],
  },
];
