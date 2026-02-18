import { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "멘토 모집",
  description: "게임 업계 현직자라면 커피챗 멘토로 활동하세요. 자유로운 시간, 직접 설정하는 가격, 파운딩 멘토 1개월 수수료 0% 혜택.",
  alternates: {
    canonical: `${SITE_CONFIG.url}/mentor/recruit`,
  },
  openGraph: {
    title: "멘토 모집 | 커피챗",
    description: "게임 업계 경력을 후배들과 나누면서 수익도 만들어보세요. 파운딩 멘토 1개월 수수료 0%.",
    url: `${SITE_CONFIG.url}/mentor/recruit`,
  },
};

export default function MentorRecruitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
