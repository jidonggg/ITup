import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "질문 준비 가이드 | 멘티 가이드 | 커피챗",
  description: "멘토에게 물어볼 좋은 질문 리스트. 커리어, 기술, 회사 문화, 포트폴리오, 면접 준비.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
