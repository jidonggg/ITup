import { Metadata } from "next";

export const metadata: Metadata = {
  title: "기업 서비스",
  description: "게임 회사를 위한 맞춤형 멘토링 프로그램. 신입 온보딩, 팀 역량 강화, 채용 연계까지 커피챗이 함께합니다.",
  openGraph: {
    title: "기업 서비스 | 커피챗",
    description: "게임 회사를 위한 맞춤형 멘토링 프로그램.",
  },
};

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
