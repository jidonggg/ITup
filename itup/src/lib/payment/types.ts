import { PRICES } from "@/lib/constants";

export interface PlanInfo {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
}

export const plans: PlanInfo[] = [
  {
    id: "basic",
    name: "Basic",
    price: PRICES.BASIC_PLAN,
    period: "월",
    description: "게임 업계 입문자를 위한 기본 플랜",
    features: [
      "월 2회 1:1 멘토링 (회당 50분)",
      "커리어 로드맵 설계",
      "이력서 첨삭 1회",
      "이메일 질문 무제한",
      "커뮤니티 접근 권한",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: PRICES.STANDARD_PLAN,
    period: "월",
    description: "집중적인 취업 준비를 위한 프로 플랜",
    features: [
      "월 4회 1:1 멘토링 (회당 60분)",
      "맞춤형 커리어 컨설팅",
      "포트폴리오 심층 리뷰",
      "모의 면접 2회",
      "24시간 내 질문 답변",
      "멘토 직접 선택 가능",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: PRICES.PREMIUM_PLAN,
    period: "월",
    description: "확실한 취업 성공을 위한 프리미엄 플랜",
    features: [
      "무제한 1:1 멘토링",
      "전담 멘토 배정",
      "포트폴리오 완성 프로젝트",
      "모의 면접 무제한",
      "취업 성공시 환급 혜택",
      "채용 담당자 연결 지원",
    ],
  },
];

export interface PaymentRequest {
  orderId: string;
  orderName: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  planId: string;
}

export interface PaymentResult {
  paymentKey: string;
  orderId: string;
  amount: number;
}
