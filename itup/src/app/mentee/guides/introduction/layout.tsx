import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "자기소개 가이드 | 멘티 가이드 | 커피챗",
  description: "멘토링 세션에서 효과적인 자기소개를 하는 방법. 상황별 템플릿과 좋은/나쁜 예시.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
