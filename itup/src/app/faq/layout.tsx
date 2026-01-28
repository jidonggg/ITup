import { Metadata } from "next";

export const metadata: Metadata = {
  title: "자주 묻는 질문",
  description: "커피챗 서비스 이용에 관한 자주 묻는 질문과 답변을 확인하세요. 멘토링 진행 방법, 결제, 환불 정책 등을 안내합니다.",
  openGraph: {
    title: "자주 묻는 질문 | 커피챗",
    description: "커피챗 서비스 이용에 관한 자주 묻는 질문과 답변을 확인하세요.",
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
