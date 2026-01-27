"use client";

import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLayout } from "@/contexts/LayoutContext";

export default function ThemeSelector() {
  const { currentTheme, setTheme, themes } = useTheme();
  const { currentLayout, setLayout, layoutOptions } = useLayout();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"theme" | "layout">("theme");

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center cursor-pointer"
        style={{ borderRadius: "var(--card-radius, 9999px)" }}
        aria-label="디자인 설정"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      </button>

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-card-bg border-l border-card-border shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-card-border">
          <div>
            <h2 className="font-bold text-lg">디자인 시안</h2>
            <p className="text-xs text-muted">테마 & 레이아웃 테스트</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-card-border">
          <button
            onClick={() => setActiveTab("theme")}
            className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "theme"
                ? "text-primary border-b-2 border-primary"
                : "text-muted hover:text-foreground"
            }`}
          >
            컬러 테마
          </button>
          <button
            onClick={() => setActiveTab("layout")}
            className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "layout"
                ? "text-primary border-b-2 border-primary"
                : "text-muted hover:text-foreground"
            }`}
          >
            레이아웃
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto h-[calc(100%-140px)]">
          {activeTab === "theme" ? (
            <div className="space-y-3">
              <p className="text-xs text-muted mb-2">
                {themes.length}개 테마 ({themes.filter(t => t.colors.background.startsWith("#f") || t.colors.background.startsWith("#fff")).length}개 라이트)
              </p>
              {themes.map((theme, index) => (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme.id)}
                  className={`w-full p-3 rounded-xl border-2 transition-all duration-300 cursor-pointer text-left ${
                    currentTheme.id === theme.id
                      ? "border-primary bg-primary/10"
                      : "border-card-border hover:border-primary/50 hover:bg-secondary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-muted font-mono w-5">#{index + 1}</span>
                    <span className="font-medium text-sm">{theme.name}</span>
                    {currentTheme.id === theme.id && (
                      <span className="ml-auto px-1.5 py-0.5 bg-primary text-white text-xs rounded">
                        ON
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mb-2 pl-7">{theme.description}</p>
                  <div className="flex gap-1 pl-7">
                    {[theme.colors.primary, theme.colors.accent, theme.colors.background, theme.colors.cardBg].map((color, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-full border border-white/20"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted mb-2">{layoutOptions.length}개 레이아웃 옵션</p>
              {layoutOptions.map((layout, index) => (
                <button
                  key={layout.id}
                  onClick={() => setLayout(layout.id)}
                  className={`w-full p-3 rounded-xl border-2 transition-all duration-300 cursor-pointer text-left ${
                    currentLayout.id === layout.id
                      ? "border-primary bg-primary/10"
                      : "border-card-border hover:border-primary/50 hover:bg-secondary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-muted font-mono w-5">#{index + 1}</span>
                    <span className="font-medium text-sm">{layout.name}</span>
                    {currentLayout.id === layout.id && (
                      <span className="ml-auto px-1.5 py-0.5 bg-primary text-white text-xs rounded">
                        ON
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mb-2 pl-7">{layout.description}</p>
                  <div className="flex flex-wrap gap-1.5 pl-7">
                    <span className="px-2 py-0.5 bg-secondary text-xs rounded">
                      {layout.heroStyle === "center" ? "중앙" : layout.heroStyle === "left" ? "좌측" : "분할"}
                    </span>
                    <span className="px-2 py-0.5 bg-secondary text-xs rounded">
                      {layout.cardStyle === "rounded" ? "라운드" : layout.cardStyle === "sharp" ? "샤프" : "필"}
                    </span>
                    {layout.cardEffect !== "none" && (
                      <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded font-medium">
                        {layout.cardEffect === "glass" ? "글라스" :
                         layout.cardEffect === "glow" ? "글로우" :
                         layout.cardEffect === "float" ? "플로트" : ""}
                      </span>
                    )}
                    {layout.gridStyle === "bento" && (
                      <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded font-medium">
                        벤토
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Current Selection */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-secondary/80 backdrop-blur border-t border-card-border">
          <div className="text-xs text-center text-muted">
            현재: <span className="text-primary">{currentTheme.name}</span> + <span className="text-accent">{currentLayout.name}</span>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
