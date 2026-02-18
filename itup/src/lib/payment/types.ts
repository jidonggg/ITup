import { RECOMMENDED_PRICES } from "@/lib/constants";

export type PaymentProductType = "coffee" | "resume" | "interview";
/** @deprecated Use PaymentProductType instead — 'ProductType'은 @/lib/supabase/types와 이름 충돌 */
export type ProductType = PaymentProductType;
export interface ProductInfo {
  id: ProductType;
  name: string;
  price: number;
  description: string;
  features: string[];
  icon: string;
  duration: string;
}

export const products: ProductInfo[] = [
  {
    id: "coffee",
    name: "커피챗",
    price: RECOMMENDED_PRICES.coffee_chat,
    description: "가볍게 현직자와 이야기 나눠봐요",
    features: [
      "1:1 온라인 화상 상담 30분",
      "커리어 방향 상담",
      "업계 현황 이야기",
      "자유 Q&A",
    ],
    icon: "coffee",
    duration: "30분",
  },
  {
    id: "resume",
    name: "이력서/포폴 첨삭",
    price: RECOMMENDED_PRICES.document_review,
    description: "이력서와 포트폴리오를 꼼꼼히 봐드려요",
    features: [
      "서류 분석 15분 + 첨삭 상담 30분",
      "개선 포인트 피드백",
      "업계 맞춤 어필 포인트",
      "첨삭 후 1회 추가 확인",
    ],
    icon: "document",
    duration: "45분",
  },
  {
    id: "interview",
    name: "모의면접",
    price: RECOMMENDED_PRICES.mock_interview,
    description: "실전처럼 면접을 연습해봐요",
    features: [
      "실전형 모의면접 60분",
      "직무별 예상 질문 제공",
      "상세 피드백 리포트",
      "면접 태도/답변 코칭",
    ],
    icon: "microphone",
    duration: "60분",
  },
];

export interface PaymentRequest {
  orderId: string;
  orderName: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  productType?: ProductType;
}

export interface PaymentResult {
  paymentKey: string;
  orderId: string;
  amount: number;
}
