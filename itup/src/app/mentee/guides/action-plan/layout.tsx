import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "멘토링 후 액션 플랜 가이드 | 커피챗",
  description: "멘토링 상담 후 효과적인 실천 계획을 세우는 방법을 알려드려요.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
