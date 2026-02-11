"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { SITE_CONFIG } from "@/lib/site-config";

const footerLinks = {
  서비스: [
    { label: "멘토 찾기", href: "/mentors" },
    { label: "멘토 지원", href: "/mentor/apply" },
    { label: "멘토링 소개", href: "/#features" },
    { label: "기업 서비스", href: "/business" },
  ],
  회사: [
    { label: "회사 소개", href: "/about" },
    { label: "자주 묻는 질문", href: "/faq" },
    { label: "문의하기", href: `mailto:${SITE_CONFIG.contactEmail.support}` },
  ],
  지원: [
    { label: "이용약관", href: "/terms" },
    { label: "개인정보처리방침", href: "/privacy" },
  ],
  계정: [
    { label: "로그인", href: "/login" },
    { label: "회원가입", href: "/signup" },
    { label: "마이페이지", href: "/mypage" },
  ],
};

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({ type: "error", text: "올바른 이메일을 입력해주세요." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();

        // Check if email already exists
        const { data: existing } = await supabase
          .from("newsletter_subscriptions")
          .select("id, is_active")
          .eq("email", email)
          .single();

        if (existing) {
          if (existing.is_active) {
            setMessage({ type: "error", text: "이미 구독 중인 이메일이에요." });
          } else {
            // Reactivate subscription
            await supabase
              .from("newsletter_subscriptions")
              .update({ is_active: true })
              .eq("id", existing.id);
            setMessage({ type: "success", text: "뉴스레터 구독이 재활성화되었어요!" });
            setEmail("");
          }
        } else {
          // Create new subscription
          const { error } = await supabase
            .from("newsletter_subscriptions")
            .insert({ email, is_active: true });

          if (error) {
            throw error;
          }
          setMessage({ type: "success", text: "뉴스레터 구독이 완료되었어요!" });
          setEmail("");
        }
      } else {
        // Demo mode
        setMessage({ type: "success", text: "구독 신청이 접수되었어요. (데모 모드)" });
        setEmail("");
      }
    } catch (error) {
      setMessage({ type: "error", text: "구독 처리 중 오류가 발생했어요." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-gradient-to-b from-secondary/30 to-secondary/60 border-t border-card-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Logo & Description */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shadow-primary/15 group-hover:scale-105 transition-transform">
                <span className="text-white text-xl">☕</span>
              </div>
              <span className="text-xl font-bold">커피챗</span>
            </Link>
            <p className="text-muted text-sm mb-6 max-w-xs leading-relaxed">
              현직자 멘토와 편하게 나누는 커피챗. 게임 업계 커리어를 함께 만들어가요.
            </p>
            {/* 문의 이메일 */}
            <a
              href={`mailto:${SITE_CONFIG.contactEmail.support}`}
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {SITE_CONFIG.contactEmail.support}
            </a>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-bold text-sm uppercase tracking-wider text-foreground/80 mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    {"disabled" in link && link.disabled ? (
                      <span className="text-muted/50 text-sm cursor-default">
                        {link.label}
                      </span>
                    ) : link.href.startsWith("mailto:") || link.href.startsWith("http") ? (
                      <a
                        href={link.href}
                        className="text-muted text-sm hover:text-primary transition-colors duration-300"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-muted text-sm hover:text-primary transition-colors duration-300"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-8 border-t border-card-border/40">
          <div className="text-center md:text-left">
            <h4 className="font-bold mb-1">뉴스레터 구독</h4>
            <p className="text-muted text-sm">취업 꿀팁 받아보기</p>
          </div>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col w-full md:w-auto gap-2">
            <div className="flex w-full md:w-auto gap-2 sm:gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소"
                aria-label="뉴스레터 구독용 이메일 주소"
                className="flex-1 md:w-64 px-5 py-3 bg-white/70 backdrop-blur-sm border border-card-border/50 rounded-full text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="shine-effect px-5 sm:px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {isSubmitting ? "처리중..." : "구독"}
              </button>
            </div>
            {message && (
              <p className={`text-sm text-center md:text-right ${message.type === "success" ? "text-green-500" : "text-red-500"}`}>
                {message.text}
              </p>
            )}
          </form>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-card-border/40 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-muted text-sm">
            <p>&copy; {new Date().getFullYear()} 커피챗. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-primary transition-colors">
                이용약관
              </Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">
                개인정보처리방침
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
