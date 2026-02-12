import type { ReactNode } from "react";

// ─────────────────────────────────────────────
// Brand Logo Icon (coffee cup) — Geometric, polished
// ─────────────────────────────────────────────
export function LogoIcon({ className = "w-5 h-5 text-white" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      {/* Steam wisps */}
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3c0 1.5-.5 2 .5 3s-.5 1.5-.5 3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2c0 1.5-.5 2 .5 3s-.5 1.5-.5 3" />
      {/* Cup body */}
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h12v7a4 4 0 01-4 4H8a4 4 0 01-4-4v-7z" />
      {/* Handle */}
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11h1.5a2.5 2.5 0 010 5H16" />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Product / Tier / Category Icons
// Modern line icons — Lucide/Phosphor-inspired, consistent 2px stroke
// strokeLinecap="round" strokeLinejoin="round" on all paths
// viewBox="0 0 24 24"
// ─────────────────────────────────────────────
type IconRenderer = (props: { className?: string }) => ReactNode;

const s = { strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const iconMap: Record<string, IconRenderer> = {
  // ── Coffee ──────────────────────────────────
  coffee: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path {...s} d="M8 3c0 1.5-.5 2 .5 3s-.5 1.5-.5 3" />
      <path {...s} d="M12 2c0 1.5-.5 2 .5 3s-.5 1.5-.5 3" />
      <path {...s} d="M4 10h12v7a4 4 0 01-4 4H8a4 4 0 01-4-4v-7z" />
      <path {...s} d="M16 11h1.5a2.5 2.5 0 010 5H16" />
    </svg>
  ),

  // ── Document ────────────────────────────────
  document: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path {...s} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <path {...s} d="M14 2v6h6" />
      <path {...s} d="M8 13h8" />
      <path {...s} d="M8 17h6" />
    </svg>
  ),

  // ── Microphone ──────────────────────────────
  microphone: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <rect x="9" y="2" width="6" height="11" rx="3" {...s} />
      <path {...s} d="M5 10v1a7 7 0 0014 0v-1" />
      <path {...s} d="M12 18v4" />
      <path {...s} d="M8 22h8" />
    </svg>
  ),

  // ── Gift ────────────────────────────────────
  gift: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <rect x="3" y="8" width="18" height="4" rx="1" {...s} />
      <path {...s} d="M12 8v13" />
      <path {...s} d="M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      <path {...s} d="M7.5 8a2.5 2.5 0 010-5C9.5 3 12 5.5 12 8" />
      <path {...s} d="M16.5 8a2.5 2.5 0 000-5C14.5 3 12 5.5 12 8" />
    </svg>
  ),

  // ── Target ──────────────────────────────────
  target: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" {...s} />
      <circle cx="12" cy="12" r="6" {...s} />
      <circle cx="12" cy="12" r="2" {...s} />
    </svg>
  ),

  // ── Rocket ──────────────────────────────────
  rocket: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path {...s} d="M12 2C8.5 6 7 10 7 14l5 5c4 0 8-1.5 12-5-2-6-6-10-12-12z" />
      <circle cx="12" cy="12" r="2" {...s} />
      <path {...s} d="M7 14c-2.5.5-4 2-5 4 2 1 3.5.5 5-1" />
      <path {...s} d="M17 9c.5-2.5 2-4 4-5-1 2-.5 3.5-1 5" />
    </svg>
  ),

  // ── Crown ───────────────────────────────────
  crown: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path {...s} d="M2 20h20" />
      <path {...s} d="M4 17l-2-9 5 4 5-7 5 7 5-4-2 9H4z" />
    </svg>
  ),

  // ── Seedling (Tier badge) ───────────────────
  seedling: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path {...s} d="M12 22V12" />
      <path {...s} d="M12 12c0-4 3-7 8-7-.5 4-3.5 7-8 7z" />
      <path {...s} d="M12 15c0-3-2.5-5.5-7-5.5.5 3.5 3 5.5 7 5.5z" />
    </svg>
  ),

  // ── Star (Tier badge) ──────────────────────
  star: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path {...s} d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
    </svg>
  ),

  // ── Monitor (Job type) ─────────────────────
  monitor: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <rect x="2" y="3" width="20" height="14" rx="2" {...s} />
      <path {...s} d="M8 21h8" />
      <path {...s} d="M12 17v4" />
    </svg>
  ),

  // ── Wrench (Job type) ──────────────────────
  wrench: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path {...s} d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94L6.73 20.2a2 2 0 01-2.83 0l-.1-.1a2 2 0 010-2.83l6.73-6.73A6 6 0 016.3 2.53l3.77 3.77z" />
    </svg>
  ),

  // ── Clipboard (Job type) ───────────────────
  clipboard: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path {...s} d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" {...s} />
      <path {...s} d="M9 12h6" />
      <path {...s} d="M9 16h4" />
    </svg>
  ),

  // ── Palette (Job type) ─────────────────────
  palette: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path {...s} d="M12 2a10 10 0 00-1 19.95C12.65 22 14 20.65 14 19v-.5a1.5 1.5 0 011.5-1.5H17a5 5 0 005-5c0-5.52-4.48-10-10-10z" />
      <circle cx="7.5" cy="11.5" r="1.5" fill="currentColor" />
      <circle cx="12" cy="7.5" r="1.5" fill="currentColor" />
      <circle cx="16.5" cy="11.5" r="1.5" fill="currentColor" />
    </svg>
  ),

  // ── Link ────────────────────────────────────
  link: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path {...s} d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path {...s} d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  ),

  // ── Unity (Engine) ─────────────────────────
  unity: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path {...s} d="M12 2L2 7v10l10 5 10-5V7L12 2z" />
      <path {...s} d="M12 22V12" />
      <path {...s} d="M2 7l10 5 10-5" />
      <path {...s} d="M7 4.5v10" />
      <path {...s} d="M17 4.5v10" />
    </svg>
  ),

  // ── Unreal (Engine — lightning bolt) ────────
  unreal: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path {...s} d="M13 2L4 14h7l-2 8 11-12h-7l2-8z" />
    </svg>
  ),

  // ── Cog (Settings) ─────────────────────────
  cog: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path {...s} d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
      <circle cx="12" cy="12" r="3" {...s} />
    </svg>
  ),
};

/**
 * Renders a product/tier icon by its ID string.
 * Used wherever PRODUCT_INFO.icon or tier.badge values are displayed.
 */
export function ProductIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = iconMap[name];
  if (!IconComponent) return <span>{name}</span>;
  return <>{IconComponent({ className })}</>;
}
