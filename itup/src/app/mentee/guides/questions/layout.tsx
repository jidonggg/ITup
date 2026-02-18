import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "멘토에게 물어볼 질문 가이드 | 커피챗",
  description: "멘토링에서 어떤 질문을 하면 좋을까? 직군별 추천 질문 리스트를 확인하세요.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
