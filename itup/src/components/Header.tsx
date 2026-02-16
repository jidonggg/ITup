"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import AuthButton from "@/components/auth/AuthButton";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { LogoIcon } from "@/components/icons";

const LoginModal = dynamic(() => import("@/components/auth/LoginModal"), { ssr: false });
const SignupModal = dynamic(() => import("@/components/auth/SignupModal"), { ssr: false });
const ForgotPasswordModal = dynamic(() => import("@/components/auth/ForgotPasswordModal"), { ssr: false });

interface HeaderProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

export default function Header({ onLoginClick, onSignupClick }: HeaderProps = {}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const { user, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Internal modal state - used when no onLoginClick/onSignupClick props are provided
  const useInternalModals = !onLoginClick && !onSignupClick;
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const internalOpenLogin = () => setIsLoginOpen(true);
  const internalCloseLogin = () => setIsLoginOpen(false);
  const internalOpenSignup = () => setIsSignupOpen(true);
  const internalCloseSignup = () => setIsSignupOpen(false);
  const internalOpenForgot = () => setIsForgotOpen(true);
  const internalCloseForgot = () => setIsForgotOpen(false);

  const switchToSignup = () => {
    internalCloseLogin();
    internalOpenSignup();
  };
  const switchToLogin = () => {
    internalCloseSignup();
    internalCloseForgot();
    internalOpenLogin();
  };
  const switchToForgotPassword = () => {
    internalCloseLogin();
    internalOpenForgot();
  };

  // Resolve which handlers to pass to AuthButton
  const resolvedLoginClick = onLoginClick ?? (useInternalModals ? internalOpenLogin : undefined);
  const resolvedSignupClick = onSignupClick ?? (useInternalModals ? internalOpenSignup : undefined);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  // 기본 네비게이션 링크
  const baseNavLinks = [
    { href: "/mentors", label: "멘토 둘러보기" },
    { href: "/mentor/apply", label: "멘토 지원" },
    { href: "/faq", label: "FAQ" },
  ];

  // 역할별 추가 링크
  const getNavLinks = () => {
    const links = [...baseNavLinks];

    if (user && profile) {
      if (profile.role === "admin") {
        links.push({ href: "/admin", label: "관리자" });
      }
      if (profile.role === "mentor") {
        links.push({ href: "/mentor/dashboard", label: "대시보드" });
      }
      links.push({ href: "/mypage", label: "마이페이지" });
    }

    return links;
  };

  const navLinks = getNavLinks();

  return (
    <>
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-card-bg/70 backdrop-blur-2xl shadow-lg shadow-black/[0.04] border-b border-card-border/50"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md shadow-primary/20">
              <LogoIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
              커피챗
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative text-foreground/70 hover:text-primary font-medium text-sm transition-colors duration-300 py-2 group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-300 rounded-full" />
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-foreground/60 hover:text-primary hover:bg-primary/10 transition-all duration-300 cursor-pointer"
              aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
            >
              {theme === "dark" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" strokeWidth={2}/><path strokeLinecap="round" strokeWidth={2} d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
              )}
            </button>
            <AuthButton
              onLoginClick={resolvedLoginClick}
              onSignupClick={resolvedSignupClick}
              variant="desktop"
            />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground cursor-pointer"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={isMobileMenuOpen}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            isMobileMenuOpen ? "max-h-80 pb-4" : "max-h-0"
          }`}
          aria-hidden={!isMobileMenuOpen}
        >
          <div className="flex flex-col gap-1 pt-4 border-t border-card-border/50">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-foreground/70 hover:text-primary hover:bg-primary/5 transition-all px-3 py-2.5 rounded-xl font-medium text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 text-foreground/70 hover:text-primary hover:bg-primary/5 transition-all px-3 py-2.5 rounded-xl font-medium text-sm cursor-pointer"
            >
              {theme === "dark" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" strokeWidth={2}/><path strokeLinecap="round" strokeWidth={2} d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
              )}
              {theme === "dark" ? "라이트 모드" : "다크 모드"}
            </button>
            <AuthButton
              onLoginClick={resolvedLoginClick ? () => {
                setIsMobileMenuOpen(false);
                resolvedLoginClick();
              } : undefined}
              onSignupClick={resolvedSignupClick ? () => {
                setIsMobileMenuOpen(false);
                resolvedSignupClick();
              } : undefined}
              variant="mobile"
            />
          </div>
        </div>
      </nav>
    </header>

    {/* Internal auth modals - rendered only when Header manages its own modal state */}
    {useInternalModals && (
      <>
        <LoginModal
          isOpen={isLoginOpen}
          onClose={internalCloseLogin}
          onSwitchToSignup={switchToSignup}
          onSwitchToForgotPassword={switchToForgotPassword}
        />
        <SignupModal
          isOpen={isSignupOpen}
          onClose={internalCloseSignup}
          onSwitchToLogin={switchToLogin}
        />
        <ForgotPasswordModal
          isOpen={isForgotOpen}
          onClose={internalCloseForgot}
          onSwitchToLogin={switchToLogin}
        />
      </>
    )}
    </>
  );
}
