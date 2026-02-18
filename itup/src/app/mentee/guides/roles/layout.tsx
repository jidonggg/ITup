import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "직무별 준비 가이드 | 멘티 가이드 | 커피챗",
  description: "게임 기획, 프로그래밍, 아트, QA, 마케팅 직무별 멘토링 준비 가이드.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
