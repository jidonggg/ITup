import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 커피챗",
  description: "커피챗 개인정보처리방침 - 개인정보의 수집, 이용, 보호에 관한 안내입니다.",
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
