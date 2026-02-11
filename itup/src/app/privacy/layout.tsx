import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "커피챗 개인정보처리방침 - 개인정보의 수집, 이용, 보호에 관한 안내입니다.",
  alternates: {
    canonical: `${SITE_CONFIG.url}/privacy`,
  },
  openGraph: {
    title: "개인정보처리방침 | 커피챗",
    description: "커피챗 개인정보처리방침 - 개인정보의 수집, 이용, 보호에 관한 안내입니다.",
    url: `${SITE_CONFIG.url}/privacy`,
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
