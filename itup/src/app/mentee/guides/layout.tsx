import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "멘티 가이드 | 커피챗",
  description: "게임업계 멘토링을 최대한 활용하는 실전 가이드. 자기소개, 질문 준비, 직무별 준비, 액션 플랜까지.",
  openGraph: {
    title: "멘티 가이드 | 커피챗",
    description: "게임업계 멘토링을 최대한 활용하는 실전 가이드",
  },
};
export default function MenteeGuidesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
