import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "회사 소개",
  description: "커피챗은 게임 업계 종사자와 취업 준비생을 연결하는 멘토링 플랫폼입니다. 실무 경험을 바탕으로 한 진정한 멘토링을 제공합니다.",
  alternates: {
    canonical: `${SITE_CONFIG.url}/about`,
  },
  openGraph: {
    title: "회사 소개 | 커피챗",
    description: "커피챗은 게임 업계 종사자와 취업 준비생을 연결하는 멘토링 플랫폼입니다. 넥슨, 넷마블, 크래프톤 등 현직자 멘토와 1:1 상담하세요.",
    url: `${SITE_CONFIG.url}/about`,
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
