import { PRICES } from "@/lib/constants";

export type ProductType = "text" | "coffee" | "resume" | "interview";
export type BundleType = "starter" | "allinone" | "full";

export interface ProductInfo {
  id: ProductType;
  name: string;
  price: number;
  description: string;
  features: string[];
  icon: string;
  duration: string;
}

export interface BundleInfo {
  id: BundleType;
  name: string;
  price: number;
  originalPrice: number;
  description: string;
  includes: string[];
  includedProducts: { productType: ProductType; quantity: number }[];
  icon: string;
}

export const products: ProductInfo[] = [
  {
    id: "text",
    name: "텍스트 상담",
    price: PRICES.TEXT_CHAT,
    description: "카카오톡 오픈채팅으로 가볍게 질문해봐요",
    features: [
      "카카오톡 오픈채팅 3일 이용",
      "텍스트 기반 Q&A",
      "멘토 24시간 내 답변",
      "간단한 커리어 질문에 딱",
    ],
    icon: "💬",
    duration: "3일간 (카카오톡)",
  },
  {
    id: "coffee",
    name: "커피챗",
    price: PRICES.COFFEE_CHAT,
    description: "가볍게 현직자와 이야기 나눠봐요",
    features: [
      "1:1 화상/대면 상담 30분",
      "커리어 방향 상담",
      "업계 현황 이야기",
      "자유 Q&A",
    ],
    icon: "☕",
    duration: "30분",
  },
  {
    id: "resume",
    name: "이력서/포폴 첨삭",
    price: PRICES.RESUME_REVIEW,
    description: "이력서와 포트폴리오를 꼼꼼히 봐드려요",
    features: [
      "이력서/포트폴리오 상세 리뷰",
      "개선 포인트 피드백",
      "업계 맞춤 어필 포인트",
      "첨삭 후 1회 추가 확인",
    ],
    icon: "📄",
    duration: "50분",
  },
  {
    id: "interview",
    name: "모의면접",
    price: PRICES.MOCK_INTERVIEW,
    description: "실전처럼 면접을 연습해봐요",
    features: [
      "실전형 모의면접 60분",
      "직무별 예상 질문 제공",
      "상세 피드백 리포트",
      "면접 태도/답변 코칭",
    ],
    icon: "🎤",
    duration: "60분",
  },
];

export const bundles: BundleInfo[] = [
  {
    id: "starter",
    name: "스타터 번들",
    price: PRICES.STARTER_BUNDLE,
    originalPrice: PRICES.COFFEE_CHAT + PRICES.RESUME_REVIEW,
    description: "커피챗 + 이력서 첨삭을 한 번에",
    includes: ["커피챗 1회", "이력서/포폴 첨삭 1회"],
    includedProducts: [
      { productType: "coffee", quantity: 1 },
      { productType: "resume", quantity: 1 },
    ],
    icon: "🎯",
  },
  {
    id: "allinone",
    name: "올인원 번들",
    price: PRICES.ALLINONE_BUNDLE,
    originalPrice: PRICES.COFFEE_CHAT + PRICES.RESUME_REVIEW + PRICES.MOCK_INTERVIEW,
    description: "3가지 상품을 모두 포함",
    includes: ["커피챗 1회", "이력서/포폴 첨삭 1회", "모의면접 1회"],
    includedProducts: [
      { productType: "coffee", quantity: 1 },
      { productType: "resume", quantity: 1 },
      { productType: "interview", quantity: 1 },
    ],
    icon: "🚀",
  },
  {
    id: "full",
    name: "풀패키지 번들",
    price: PRICES.FULL_BUNDLE,
    originalPrice: PRICES.COFFEE_CHAT * 2 + PRICES.RESUME_REVIEW + PRICES.MOCK_INTERVIEW,
    description: "커피챗 2회 포함 풀 코스",
    includes: ["커피챗 2회", "이력서/포폴 첨삭 1회", "모의면접 1회"],
    includedProducts: [
      { productType: "coffee", quantity: 2 },
      { productType: "resume", quantity: 1 },
      { productType: "interview", quantity: 1 },
    ],
    icon: "👑",
  },
];

export interface PaymentRequest {
  orderId: string;
  orderName: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  productType?: ProductType;
  bundleType?: BundleType;
}

export interface PaymentResult {
  paymentKey: string;
  orderId: string;
  amount: number;
}
