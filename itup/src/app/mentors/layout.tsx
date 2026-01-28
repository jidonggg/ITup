import { Metadata } from "next";

export const metadata: Metadata = {
  title: "멘토 찾기",
  description: "넥슨, 넷마블, 크래프톤 등 현직 게임 개발자 멘토를 찾아보세요. 1:1 상담, 이력서 리뷰, 모의면접까지.",
  openGraph: {
    title: "멘토 찾기 | ITup",
    description: "넥슨, 넷마블, 크래프톤 등 현직 게임 개발자 멘토를 찾아보세요.",
  },
};

export default function MentorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
