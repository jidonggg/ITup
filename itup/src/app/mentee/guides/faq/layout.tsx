import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "멘토링 자주 묻는 질문 | 커피챗",
  description: "커피챗 멘토링 서비스 이용에 대한 자주 묻는 질문과 답변을 확인하세요.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
