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
    description: "가볍게 시작하는 커피챗",
    features: [
      "월 2회 1:1 커피챗 (회당 50분)",
      "커리어 로드맵 같이 그려봐요",
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
    description: "본격적으로 준비하는 커피챗",
    features: [
      "월 4회 1:1 커피챗 (회당 60분)",
      "맞춤 커리어 이야기",
      "포트폴리오 꼼꼼 리뷰",
      "모의 면접 2회",
      "24시간 내 질문 답변",
      "원하는 멘토 직접 선택",
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
