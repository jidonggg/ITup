import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ToastContainer from "@/components/Toast";
import FeedbackButton from "@/components/FeedbackButton";
import { SITE_CONFIG } from "@/lib/site-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "커피챗 | 게임 업계 멘토링 플랫폼",
    template: "%s | 커피챗",
  },
  description: "현직 게임 개발자와 1:1 멘토링으로 게임 업계 취업과 커리어 성장을 도와드립니다. 회사 이메일 인증된 대기업 현직자 멘토와 상담하세요.",
  keywords: ["게임 개발", "멘토링", "게임 업계 취업", "게임 프로그래머", "게임 기획자", "게임 아티스트", "커피챗", "게임 회사", "커리어 상담", "게임 취업 준비", "게임 개발자 커리어", "게임 업계 이직", "포트폴리오 리뷰", "모의면접"],
  authors: [{ name: "커피챗" }],
  creator: "커피챗",
  metadataBase: new URL(SITE_CONFIG.url),
  alternates: {
    canonical: SITE_CONFIG.url,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_CONFIG.url,
    siteName: "커피챗",
    title: "커피챗 | 게임 업계 멘토링 플랫폼",
    description: "현직 게임 개발자와 1:1 멘토링으로 게임 업계 취업과 커리어 성장을 도와드립니다.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "커피챗 - 게임 업계 멘토링 플랫폼",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "커피챗 | 게임 업계 멘토링 플랫폼",
    description: "현직 게임 개발자와 1:1 멘토링으로 게임 업계 취업과 커리어 성장을 도와드립니다.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <AuthProvider>
            <AnalyticsProvider>
              <ToastProvider>
                {children}
                <FeedbackButton />
                <ToastContainer />
              </ToastProvider>
            </AnalyticsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
