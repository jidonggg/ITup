import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "액션 플랜 가이드 | 멘티 가이드 | 커피챗",
  description: "멘토링 후 실행 계획 세우기. 메모 정리, 우선순위 매트릭스, 주간 플랜, 후속 세션 활용법.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
