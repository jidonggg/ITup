import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "멘토링 시작 가이드 | 커피챗",
  description: "게임 업계 현직자 멘토링, 어떻게 시작하면 좋을까요? 멘토 선택부터 상담 준비까지 알려드려요.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
