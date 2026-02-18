import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "멘토링 FAQ | 멘티 가이드 | 커피챗",
  description: "멘토링 자주 묻는 질문. 결제/환불, 세션 진행, 멘토 관련, 플랫폼 이용, 불만/문제해결.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
