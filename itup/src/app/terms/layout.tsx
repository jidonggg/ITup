import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "이용약관",
  description: "커피챗 서비스 이용약관 - 서비스 이용에 관한 권리와 의무를 안내합니다.",
  alternates: {
    canonical: `${SITE_CONFIG.url}/terms`,
  },
  openGraph: {
    title: "이용약관 | 커피챗",
    description: "커피챗 서비스 이용약관 - 서비스 이용에 관한 권리와 의무를 안내합니다.",
    url: `${SITE_CONFIG.url}/terms`,
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
