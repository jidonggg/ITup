import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import ThemeSelector from "@/components/ThemeSelector";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "커피챗 | 게임 업계 멘토링 플랫폼",
  description: "현직 게임 개발자와 1:1 멘토링으로 게임 업계 취업과 커리어 성장을 도와드립니다.",
  keywords: ["게임 개발", "멘토링", "게임 업계 취업", "게임 프로그래머", "게임 기획자", "게임 아티스트", "커피챗"],
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
          <LayoutProvider>
            <AuthProvider>
              <AnalyticsProvider>
                {children}
                <ThemeSelector />
              </AnalyticsProvider>
            </AuthProvider>
          </LayoutProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
