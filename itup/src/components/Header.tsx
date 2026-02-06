"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AuthButton from "@/components/auth/AuthButton";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

export default function Header({ onLoginClick, onSignupClick }: HeaderProps = {}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const { user, profile } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
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
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-secondary/90 backdrop-blur-md shadow-lg shadow-primary/5"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
              <span className="text-white text-xl">☕</span>
            </div>
            <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
              커피챗
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative text-foreground/80 hover:text-primary transition-colors duration-300 py-2 group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <AuthButton
              onLoginClick={onLoginClick}
              onSignupClick={onSignupClick}
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
          <div className="flex flex-col gap-4 pt-4 border-t border-card-border">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-foreground/80 hover:text-primary transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <AuthButton
              onLoginClick={onLoginClick ? () => {
                setIsMobileMenuOpen(false);
                onLoginClick();
              } : undefined}
              onSignupClick={onSignupClick ? () => {
                setIsMobileMenuOpen(false);
                onSignupClick();
              } : undefined}
              variant="mobile"
            />
          </div>
        </div>
      </nav>
    </header>
  );
}
