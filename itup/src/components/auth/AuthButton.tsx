"use client";

import { useAuth } from "@/contexts/AuthContext";

interface AuthButtonProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
  variant?: "desktop" | "mobile";
}

export default function AuthButton({ onLoginClick, onSignupClick, variant = "desktop" }: AuthButtonProps) {
  const { user, profile, signOut, isLoading } = useAuth();

  if (isLoading) {
    return variant === "desktop" ? (
      <div className="flex items-center gap-4">
        <div className="w-16 h-8 bg-secondary rounded-full animate-pulse" />
      </div>
    ) : (
      <div className="flex gap-4 pt-4">
        <div className="flex-1 h-10 bg-secondary rounded-full animate-pulse" />
      </div>
    );
  }

  if (user) {
    const displayName = profile?.name || user.email?.split("@")[0] || "사용자";

    if (variant === "mobile") {
      return (
        <div className="flex flex-col gap-4 pt-4">
          <a href="/mypage" className="flex items-center gap-2 text-foreground/80 hover:text-primary transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold">
              {displayName[0]}
            </div>
            <span className="text-sm">{displayName}</span>
          </a>
          <div className="flex gap-4">
            <a
              href="/mypage"
              className="flex-1 px-4 py-2 text-center border border-card-border rounded-full text-foreground/80 hover:border-primary hover:text-primary transition-all"
            >
              마이페이지
            </a>
            <button
              onClick={signOut}
              className="flex-1 px-4 py-2 bg-secondary text-foreground/80 rounded-full font-medium hover:bg-secondary/80 transition-all cursor-pointer"
            >
              로그아웃
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3">
        <a
          href="/mypage"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
            {displayName[0]}
          </div>
          <span className="text-sm font-medium">{displayName}</span>
        </a>
        <button
          onClick={signOut}
          className="px-4 py-2 text-sm border border-card-border rounded-full hover:border-primary hover:text-primary transition-colors cursor-pointer"
        >
          로그아웃
        </button>
      </div>
    );
  }

  if (variant === "mobile") {
    return (
      <div className="flex gap-4 pt-4">
        <button
          onClick={onLoginClick}
          className="flex-1 px-4 py-2 border border-card-border rounded-full text-foreground/80 hover:border-primary hover:text-primary transition-all cursor-pointer"
        >
          로그인
        </button>
        <button
          onClick={onSignupClick}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium cursor-pointer"
        >
          시작하기
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onLoginClick}
        className="px-4 py-2 text-foreground/80 hover:text-primary transition-colors duration-300 cursor-pointer"
      >
        로그인
      </button>
      <button
        onClick={onSignupClick}
        className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium hover:shadow-lg hover:shadow-primary/30 transform hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
      >
        시작하기
      </button>
    </div>
  );
}
