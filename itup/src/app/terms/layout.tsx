import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 | 커피챗",
  description: "커피챗 서비스 이용약관 - 서비스 이용에 관한 권리와 의무를 안내합니다.",
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
