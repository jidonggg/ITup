"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    muted: string;
    cardBg: string;
    cardBorder: string;
  };
}

export const themes: Theme[] = [
  // === 라이트 테마 (기본) ===
  {
    id: "latte-light",
    name: "라떼 라이트",
    description: "부드러운 크림 라이트 (기본)",
    colors: {
      background: "#faf8f5",
      foreground: "#2d2a26",
      primary: "#8b6f4e",
      primaryLight: "#a68968",
      primaryDark: "#6b5438",
      secondary: "#f0ebe4",
      accent: "#c49a6c",
      muted: "#8a8279",
      cardBg: "#ffffff",
      cardBorder: "#e5ddd3",
    },
  },
  {
    id: "cream-caramel",
    name: "크림 카라멜",
    description: "달콤한 카라멜 라이트",
    colors: {
      background: "#fffbf5",
      foreground: "#3d2e1f",
      primary: "#d97706",
      primaryLight: "#f59e0b",
      primaryDark: "#b45309",
      secondary: "#fef3e2",
      accent: "#fbbf24",
      muted: "#92785a",
      cardBg: "#ffffff",
      cardBorder: "#f5e6d3",
    },
  },
  // === 다크 테마 ===
  {
    id: "coffee-dark",
    name: "다크 에스프레소",
    description: "진한 커피 다크 모드",
    colors: {
      background: "#0d0906",
      foreground: "#f2ebe4",
      primary: "#d97706",
      primaryLight: "#f59e0b",
      primaryDark: "#b45309",
      secondary: "#1a1410",
      accent: "#fbbf24",
      muted: "#8a7a6a",
      cardBg: "#151010",
      cardBorder: "#2d241c",
    },
  },
  {
    id: "default",
    name: "퍼플 나이트",
    description: "다크 퍼플 테마",
    colors: {
      background: "#0a0a0f",
      foreground: "#f0f0f5",
      primary: "#8b5cf6",
      primaryLight: "#a78bfa",
      primaryDark: "#7c3aed",
      secondary: "#1a1a2e",
      accent: "#c084fc",
      muted: "#6b7280",
      cardBg: "#16162a",
      cardBorder: "#2d2d4a",
    },
  },
  {
    id: "midnight-gold",
    name: "미드나잇 골드",
    description: "럭셔리 다크 & 골드",
    colors: {
      background: "#08080a",
      foreground: "#fafaf5",
      primary: "#eab308",
      primaryLight: "#facc15",
      primaryDark: "#ca8a04",
      secondary: "#14140f",
      accent: "#fde047",
      muted: "#8b8970",
      cardBg: "#10100c",
      cardBorder: "#2a2a20",
    },
  },
  // === 라이트 테마 (라떼 계열) ===
  {
    id: "vanilla-bean",
    name: "바닐라 빈",
    description: "깔끔한 바닐라 화이트",
    colors: {
      background: "#fdfcfa",
      foreground: "#1f1f1f",
      primary: "#78716c",
      primaryLight: "#a8a29e",
      primaryDark: "#57534e",
      secondary: "#f5f5f4",
      accent: "#a8a29e",
      muted: "#737373",
      cardBg: "#ffffff",
      cardBorder: "#e7e5e4",
    },
  },
  {
    id: "matcha-light",
    name: "말차 라떼",
    description: "부드러운 녹차 라이트",
    colors: {
      background: "#f8faf8",
      foreground: "#1a2e1a",
      primary: "#4d7c4d",
      primaryLight: "#6b9b6b",
      primaryDark: "#3d633d",
      secondary: "#e8f0e8",
      accent: "#86b386",
      muted: "#6b7c6b",
      cardBg: "#ffffff",
      cardBorder: "#d4e4d4",
    },
  },
  {
    id: "rose-milk",
    name: "로즈 밀크",
    description: "은은한 로즈 핑크",
    colors: {
      background: "#fdf8f8",
      foreground: "#2d1f1f",
      primary: "#be7b7b",
      primaryLight: "#d4a5a5",
      primaryDark: "#a05858",
      secondary: "#f8eded",
      accent: "#e8b4b4",
      muted: "#8a7070",
      cardBg: "#ffffff",
      cardBorder: "#f0dada",
    },
  },
  {
    id: "lavender-cream",
    name: "라벤더 크림",
    description: "고급스러운 라벤더",
    colors: {
      background: "#faf8fc",
      foreground: "#2a1f3d",
      primary: "#8b7bb5",
      primaryLight: "#a899c9",
      primaryDark: "#6b5a9a",
      secondary: "#f0eaf5",
      accent: "#b8a5d4",
      muted: "#7a708a",
      cardBg: "#ffffff",
      cardBorder: "#e5dced",
    },
  },
  {
    id: "sky-light",
    name: "스카이 라이트",
    description: "청명한 하늘빛",
    colors: {
      background: "#f5fafc",
      foreground: "#1a2a3d",
      primary: "#4a90b5",
      primaryLight: "#6badd0",
      primaryDark: "#357a9e",
      secondary: "#e5f2f8",
      accent: "#7ec4e4",
      muted: "#6a8090",
      cardBg: "#ffffff",
      cardBorder: "#d0e5ef",
    },
  },
];

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  themes: Theme[];
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]); // latte-light (기본)
  const [isDarkMode, setIsDarkMode] = useState(false);

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    root.style.setProperty("--background", theme.colors.background);
    root.style.setProperty("--foreground", theme.colors.foreground);
    root.style.setProperty("--primary", theme.colors.primary);
    root.style.setProperty("--primary-light", theme.colors.primaryLight);
    root.style.setProperty("--primary-dark", theme.colors.primaryDark);
    root.style.setProperty("--secondary", theme.colors.secondary);
    root.style.setProperty("--accent", theme.colors.accent);
    root.style.setProperty("--muted", theme.colors.muted);
    root.style.setProperty("--card-bg", theme.colors.cardBg);
    root.style.setProperty("--card-border", theme.colors.cardBorder);
  };

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  const setTheme = (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      setIsDarkMode(themeId === "coffee-dark");
      localStorage.setItem("coffeechat-theme", themeId);
      localStorage.setItem("coffeechat-dark-mode", themeId === "coffee-dark" ? "true" : "false");
    }
  };

  const toggleDarkMode = () => {
    if (isDarkMode) {
      setTheme("latte-light");
    } else {
      setTheme("coffee-dark");
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("coffeechat-theme");
    if (savedTheme) {
      const theme = themes.find((t) => t.id === savedTheme);
      if (theme) {
        setCurrentTheme(theme);
      }
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes, isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
