import { MentorData } from "@/components/MentorDetailModal";
import { ConsultType } from "@/lib/supabase/types";

export type { ConsultType };

export const consultTypeLabels: Record<ConsultType, string> = {
  text: "텍스트 상담",
  coffee: "커피챗",
  resume: "이력서/포폴 첨삭",
  interview: "모의면접",
};

// 기술 스택 카테고리
export const skillCategories = {
  programming: {
    label: "프로그래밍",
    skills: ["C++", "C#", "Python", "Java", "TypeScript", "Go", "Rust"],
  },
  engine: {
    label: "게임 엔진",
    skills: ["Unity", "Unreal Engine", "Godot", "자체 엔진"],
  },
  graphics: {
    label: "그래픽스",
    skills: ["셰이더", "렌더링", "VFX", "라이팅", "최적화"],
  },
  server: {
    label: "서버/인프라",
    skills: ["게임 서버", "백엔드", "DB", "AWS", "쿠버네티스"],
  },
  design: {
    label: "기획/디자인",
    skills: ["시스템 기획", "레벨 디자인", "밸런싱", "내러티브", "UX/UI"],
  },
  art: {
    label: "아트",
    skills: ["2D 아트", "3D 모델링", "애니메이션", "컨셉 아트", "UI 디자인"],
  },
};

export const allSkills = Object.values(skillCategories).flatMap((cat) => cat.skills);

export const mentorsData: MentorData[] = [
  {
    name: "데브민",
    role: "시니어 게임 프로그래머",
    company: "넥슨",
    previousCompanies: ["스마일게이트", "크래프톤"],
    experience: "8년",
    skills: ["C++", "Unreal Engine", "게임 서버", "최적화"],
    rating: 4.9,
    sessions: 120,
    reviews: 89,
    bio: "메이플스토리, 던전앤파이터 등 대형 프로젝트에서 서버 개발을 담당했습니다. 게임 서버 아키텍처 설계부터 최적화까지 실무 경험을 바탕으로 멘토링을 진행합니다. 특히 신입 개발자분들의 기술 면접 준비와 포트폴리오 리뷰에 강점이 있습니다.",
    availableTimes: ["평일 저녁 7-10시", "주말 오후 2-6시"],
    consultTypes: ["coffee", "resume", "interview"],
  },
  {
    name: "기획요정",
    role: "게임 기획자",
    company: "넷마블",
    previousCompanies: [],
    experience: "6년",
    skills: ["시스템 기획", "밸런싱", "레벨 디자인", "UX/UI"],
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
    company: "크래프톤",
    previousCompanies: ["넥슨"],
    experience: "7년",
    skills: ["셰이더", "렌더링", "Unity", "Unreal Engine", "최적화"],
    rating: 5.0,
    sessions: 78,
    reviews: 65,
    bio: "배틀그라운드 그래픽 최적화 및 셰이더 개발에 참여했습니다. 아트와 프로그래밍의 가교 역할을 하는 TA로서, 언리얼/유니티 셰이더 작성과 렌더링 파이프라인 이해를 도와드립니다.",
    availableTimes: ["평일 저녁 9-11시", "일요일 오후 3-7시"],
    consultTypes: ["coffee", "resume", "interview"],
  },
  {
    name: "유나UI",
    role: "UI/UX 디자이너",
    company: "스마일게이트",
    previousCompanies: ["넥슨", "펄어비스"],
    experience: "5년",
    skills: ["UI 디자인", "UX/UI", "애니메이션", "VFX"],
    rating: 4.9,
    sessions: 86,
    reviews: 71,
    bio: "로스트아크, 에픽세븐 등의 UI/UX 디자인을 담당했습니다. 게임 특유의 몰입감 있는 인터페이스 설계와 모션 그래픽을 통한 피드백 디자인을 전문으로 합니다. 포트폴리오 구성과 면접 준비를 함께 도와드려요.",
    availableTimes: ["화/목 저녁 7-10시", "토요일 오후 1-5시"],
    consultTypes: ["coffee", "resume"],
  },
];
