import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "멘토 찾기",
  description: "넥슨, 넷마블, 크래프톤 등 현직 게임 개발자 멘토를 찾아보세요. 1:1 커피챗, 이력서/포트폴리오 리뷰, 모의면접까지 다양한 멘토링 서비스.",
  alternates: {
    canonical: `${SITE_CONFIG.url}/mentors`,
  },
  openGraph: {
    title: "게임 업계 현직자 멘토 찾기 | 커피챗",
    description: "넥슨, 넷마블, 크래프톤 등 현직 게임 개발자 멘토를 찾아보세요. 1:1 커피챗, 이력서 리뷰, 모의면접까지.",
    url: `${SITE_CONFIG.url}/mentors`,
  },
};

export default function MentorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
