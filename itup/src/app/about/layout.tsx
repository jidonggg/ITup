import { Metadata } from "next";

export const metadata: Metadata = {
  title: "회사 소개",
  description: "ITup은 게임 업계 종사자와 취업 준비생을 연결하는 멘토링 플랫폼입니다. 실무 경험을 바탕으로 한 진정한 멘토링을 제공합니다.",
  openGraph: {
    title: "회사 소개 | ITup",
    description: "ITup은 게임 업계 종사자와 취업 준비생을 연결하는 멘토링 플랫폼입니다.",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
