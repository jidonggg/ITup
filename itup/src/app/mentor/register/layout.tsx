import { Metadata } from "next";

export const metadata: Metadata = {
  title: "멘토 등록",
  description: "커피챗 멘토가 되어 후배 게임 개발자들의 성장을 도와주세요. 현직 게임 회사 재직자라면 누구나 신청 가능합니다.",
  openGraph: {
    title: "멘토 등록 | 커피챗",
    description: "커피챗 멘토가 되어 후배 게임 개발자들의 성장을 도와주세요.",
  },
};

export default function MentorRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
