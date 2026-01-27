"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface LayoutOption {
  id: string;
  name: string;
  description: string;
  heroStyle: "center" | "left" | "split";
  cardStyle: "rounded" | "sharp" | "pill";
  spacing: "compact" | "normal" | "spacious";
  animation: "subtle" | "normal" | "dynamic";
  cardEffect: "none" | "glass" | "glow" | "float";
  gridStyle: "standard" | "bento" | "masonry";
}

export const layoutOptions: LayoutOption[] = [
  // === 기본 (Default) ===
  {
    id: "default",
    name: "기본",
    description: "중앙 정렬, 라운드 카드",
    heroStyle: "center",
    cardStyle: "rounded",
    spacing: "normal",
    animation: "normal",
    cardEffect: "none",
    gridStyle: "standard",
  },
  // === 트렌디 레이아웃 ===
  {
    id: "bento",
    name: "벤토 그리드",
    description: "비대칭 그리드 (2024 트렌드)",
    heroStyle: "left",
    cardStyle: "rounded",
    spacing: "normal",
    animation: "normal",
    cardEffect: "none",
    gridStyle: "bento",
  },
  {
    id: "glass",
    name: "글라스모피즘",
    description: "반투명 유리 효과",
    heroStyle: "center",
    cardStyle: "rounded",
    spacing: "spacious",
    animation: "subtle",
    cardEffect: "glass",
    gridStyle: "standard",
  },
  {
    id: "neon",
    name: "네온 글로우",
    description: "게이밍 스타일 발광 효과",
    heroStyle: "center",
    cardStyle: "rounded",
    spacing: "normal",
    animation: "dynamic",
    cardEffect: "glow",
    gridStyle: "standard",
  },
  {
    id: "float",
    name: "플로팅 카드",
    description: "떠다니는 3D 카드 효과",
    heroStyle: "split",
    cardStyle: "rounded",
    spacing: "spacious",
    animation: "dynamic",
    cardEffect: "float",
    gridStyle: "standard",
  },
  // === 클래식 레이아웃 ===
  {
    id: "minimal",
    name: "미니멀",
    description: "깔끔하고 넓은 여백",
    heroStyle: "center",
    cardStyle: "sharp",
    spacing: "spacious",
    animation: "subtle",
    cardEffect: "none",
    gridStyle: "standard",
  },
  {
    id: "compact",
    name: "컴팩트",
    description: "조밀한 레이아웃",
    heroStyle: "center",
    cardStyle: "pill",
    spacing: "compact",
    animation: "subtle",
    cardEffect: "none",
    gridStyle: "standard",
  },
];

interface LayoutContextType {
  currentLayout: LayoutOption;
  setLayout: (layoutId: string) => void;
  layoutOptions: LayoutOption[];
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [currentLayout, setCurrentLayout] = useState<LayoutOption>(layoutOptions[0]);

  useEffect(() => {
    const root = document.documentElement;

    // Card border radius
    const borderRadius = {
      rounded: "1rem",
      sharp: "0.25rem",
      pill: "2rem",
    };
    root.style.setProperty("--card-radius", borderRadius[currentLayout.cardStyle]);

    // Spacing
    const spacing = {
      compact: "1rem",
      normal: "1.5rem",
      spacious: "2.5rem",
    };
    root.style.setProperty("--section-spacing", spacing[currentLayout.spacing]);

    // Animation duration
    const animDuration = {
      subtle: "0.3s",
      normal: "0.6s",
      dynamic: "0.8s",
    };
    root.style.setProperty("--anim-duration", animDuration[currentLayout.animation]);

    // Layout attributes
    root.setAttribute("data-layout", currentLayout.id);
    root.setAttribute("data-hero-style", currentLayout.heroStyle);
    root.setAttribute("data-card-effect", currentLayout.cardEffect);
    root.setAttribute("data-grid-style", currentLayout.gridStyle);
  }, [currentLayout]);

  const setLayout = (layoutId: string) => {
    const layout = layoutOptions.find((l) => l.id === layoutId);
    if (layout) {
      setCurrentLayout(layout);
      localStorage.setItem("coffeechat-layout", layoutId);
    }
  };

  useEffect(() => {
    const savedLayout = localStorage.getItem("coffeechat-layout");
    if (savedLayout) {
      const layout = layoutOptions.find((l) => l.id === savedLayout);
      if (layout) {
        setCurrentLayout(layout);
      }
    }
  }, []);

  return (
    <LayoutContext.Provider value={{ currentLayout, setLayout, layoutOptions }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}
