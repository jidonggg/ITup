import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LayoutProvider } from "@/contexts/LayoutContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { ToastProvider } from "@/contexts/ToastContext";
import ThemeSelector from "@/components/ThemeSelector";
import ToastContainer from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ITup | 게임 업계 멘토링 플랫폼",
  description: "현직 게임 개발자와 1:1 멘토링으로 게임 업계 취업과 커리어 성장을 도와드립니다.",
  keywords: ["게임 개발", "멘토링", "게임 업계 취업", "게임 프로그래머", "게임 기획자", "게임 아티스트", "ITup"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 다크모드 깜빡임 방지 스크립트
  const themeScript = `
    (function() {
      try {
        var theme = localStorage.getItem('itup-theme') || 'itup-dark';
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {}
    })();
  `;

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <LayoutProvider>
            <AuthProvider>
              <AnalyticsProvider>
                <ToastProvider>
                  {children}
                  <ThemeSelector />
                  <ToastContainer />
                </ToastProvider>
              </AnalyticsProvider>
            </AuthProvider>
          </LayoutProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
