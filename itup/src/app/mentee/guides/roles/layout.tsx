import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "게임 업계 직군별 준비 가이드 | 커피챗",
  description: "프로그래밍, 기획, 아트, QA 등 게임 업계 직군별 취업 준비 방법을 안내합니다.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
