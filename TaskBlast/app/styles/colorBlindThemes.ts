/**
 * Color Blind Palettes
 *
 * Each palette replaces the app's default purple/blue/pink accent trio with
 * CVD-safe alternatives.  Import `useColorPalette()` in any component to get
 * the correct colors based on the user's selected mode.
 *
 * High-contrast mode boosts border and text opacity on top of any palette.
 *
 * Usage:
 *   const palette = useColorPalette();
 *   <View style={{ borderColor: palette.accent }} />
 */

import { useAccessibility } from "../context/AccessibilityContext";
import type { ColorBlindMode } from "../context/AccessibilityContext";

// ─── Palette shape ────────────────────────────────────────────────────────────

export interface ColorPalette {
  // ── Core accents ────────────────────────────────────────────────────────────
  /** Primary accent (replaces purple #8b5cf6) */
  accent: string;
  /** Glow / shadow overlay of accent (rgba at 0.8) */
  accentGlow: string;
  /** Accent at 0.3 opacity — pill/button inert backgrounds */
  accentSoft: string;
  /** Lighter accent at 0.5 opacity — pill/button inert borders */
  accentSoftBorder: string;
  /** Accent at 0.4 opacity — active / selected item background */
  accentActive: string;
  /** Lighter accent at 0.8 opacity — active / selected item border */
  accentActiveBorder: string;

  // ── Secondary & tertiary ─────────────────────────────────────────────────────
  /** Secondary accent (replaces blue #60a5fa) */
  secondary: string;
  /** Secondary at 0.15 opacity — inactive selector / light row background */
  secondarySoft: string;
  /** Secondary at 0.3 opacity — inactive selector / light row border */
  secondarySoftBorder: string;
  /** Secondary at 0.2 opacity — standard settings row background */
  secondaryMed: string;
  /** Tertiary accent (replaces pink #ec4899) */
  tertiary: string;
  /** Tertiary at 0.2 opacity — secondary section row background */
  tertiarySoft: string;
  /** Tertiary at 0.3 opacity — secondary section row border */
  tertiarySoftBorder: string;

  // ── Switches ─────────────────────────────────────────────────────────────────
  /** Track color when Switch is ON */
  switchTrackOn: string;
  /** Thumb color when Switch is ON */
  switchThumbOn: string;
  /** Track color when Switch is OFF */
  switchTrackOff: string;
  /** Thumb color when Switch is OFF */
  switchThumbOff: string;

  // ── Row / card ───────────────────────────────────────────────────────────────
  /** Row background – primary (accent-tinted, 0.2) */
  rowBgPrimary: string;
  /** Row border – primary (accent-tinted, 0.3) */
  rowBorderPrimary: string;
  /** Row background – secondary (tertiary-tinted, 0.2) */
  rowBgSecondary: string;
  /** Row border – secondary (tertiary-tinted, 0.3) */
  rowBorderSecondary: string;

  // ── Modal ────────────────────────────────────────────────────────────────────
  /** Modal container border color */
  modalBorder: string;
  /** Modal container shadow / glow color */
  modalShadow: string;
  /** Divider line color */
  divider: string;

  // ── Section headers ──────────────────────────────────────────────────────────
  /** Icon color used in section header rows */
  sectionIcon: string;
  /** Text color used for section header labels */
  sectionTextColor: string;

  // ── Secondary blue variants (traits section) ─────────────────────────────────
  /** Secondary at 0.4 opacity — trait pill background */
  secondaryMedBold: string;
  /** Light secondary border at 0.5 opacity — trait pills, edit btn border */
  secondaryLightBorder: string;
  /** Deep dark secondary bg — traits card background */
  secondaryDeepBg: string;

  // ── Stats / analytics accent ─────────────────────────────────────────────────
  /** Main stats accent color (hex) — chart line, shadow, glow */
  statsAccent: string;
  /** Stats accent at 0.25 opacity — stat pill backgrounds */
  statsAccentSoft: string;
  /** Stats accent at 0.45 opacity — stat pill borders */
  statsAccentBorder: string;
  /** Stats card at 0.30 opacity — analytics card background */
  statsBg: string;
  /** Stats card border at 0.35 opacity — analytics card border */
  statsBgBorder: string;
  /** Stats accent at 0.6 opacity — section heading glow */
  statsAccentGlow: string;
  /** Chart line/gradient fill color string (rgba, 0.35) */
  statsChartFill: string;
  /** Chart border color string (rgba, 0.5) */
  statsChartBorder: string;

  // ── Error / danger (semantic — kept constant across modes) ───────────────────
  /** Danger action background (rgba red at 0.2) */
  errorSoft: string;
  /** Danger action border (rgba red at 0.3) */
  errorSoftBorder: string;
  /** Danger icon / text color */
  errorIcon: string;
}

// ─── Palette definitions ──────────────────────────────────────────────────────

const palettes: Record<ColorBlindMode, ColorPalette> = {
  /**
   * Default – original purple / blue / pink theme.
   */
  none: {
    // Core accents
    accent: "#8b5cf6",
    accentGlow: "rgba(139, 92, 246, 0.8)",
    accentSoft: "rgba(139, 92, 246, 0.3)",
    accentSoftBorder: "rgba(167, 139, 250, 0.5)",
    accentActive: "rgba(139, 92, 246, 0.4)",
    accentActiveBorder: "rgba(167, 139, 250, 0.8)",
    // Secondary & tertiary
    secondary: "#60a5fa",
    secondarySoft: "rgba(59, 130, 246, 0.15)",
    secondarySoftBorder: "rgba(59, 130, 246, 0.3)",
    secondaryMed: "rgba(59, 130, 246, 0.2)",
    tertiary: "#ec4899",
    tertiarySoft: "rgba(236, 72, 153, 0.2)",
    tertiarySoftBorder: "rgba(236, 72, 153, 0.3)",
    // Switches
    switchTrackOn: "#8b5cf6",
    switchThumbOn: "#a855f7",
    switchTrackOff: "#334155",
    switchThumbOff: "#64748b",
    // Row / card
    rowBgPrimary: "rgba(59, 130, 246, 0.2)",
    rowBorderPrimary: "rgba(59, 130, 246, 0.3)",
    rowBgSecondary: "rgba(236, 72, 153, 0.2)",
    rowBorderSecondary: "rgba(236, 72, 153, 0.3)",
    // Modal
    modalBorder: "rgba(139, 92, 246, 0.5)",
    modalShadow: "#a855f7",
    divider: "rgba(139, 92, 246, 0.3)",
    // Section headers
    sectionIcon: "#a78bfa",
    sectionTextColor: "#c4b5fd",
    // Secondary blue variants
    secondaryMedBold: "rgba(59, 130, 246, 0.4)",
    secondaryLightBorder: "rgba(96, 165, 250, 0.5)",
    secondaryDeepBg: "rgba(30, 58, 138, 0.3)",
    // Stats / analytics accent (green)
    statsAccent: "#3bf670",
    statsAccentSoft: "rgba(59, 246, 112, 0.25)",
    statsAccentBorder: "rgba(59, 246, 112, 0.45)",
    statsBg: "rgba(30, 138, 43, 0.30)",
    statsBgBorder: "rgba(59, 246, 112, 0.35)",
    statsAccentGlow: "rgba(59, 246, 112, 0.6)",
    statsChartFill: "rgba(59, 246, 112, 0.35)",
    statsChartBorder: "rgba(85, 247, 104, 0.5)",
    // Error / danger
    errorSoft: "rgba(239, 68, 68, 0.2)",
    errorSoftBorder: "rgba(239, 68, 68, 0.3)",
    errorIcon: "#ef4444",
  },

  /**
   * Deuteranopia – red/green deficiency.
   * Uses blue (#2563eb) and amber (#d97706) instead of red/green.
   */
  deuteranopia: {
    // Core accents
    accent: "#2563eb",
    accentGlow: "rgba(37, 99, 235, 0.8)",
    accentSoft: "rgba(37, 99, 235, 0.3)",
    accentSoftBorder: "rgba(59, 130, 246, 0.5)",
    accentActive: "rgba(37, 99, 235, 0.4)",
    accentActiveBorder: "rgba(59, 130, 246, 0.8)",
    // Secondary & tertiary
    secondary: "#d97706",
    secondarySoft: "rgba(37, 99, 235, 0.15)",
    secondarySoftBorder: "rgba(37, 99, 235, 0.3)",
    secondaryMed: "rgba(37, 99, 235, 0.2)",
    tertiary: "#0891b2",
    tertiarySoft: "rgba(8, 145, 178, 0.2)",
    tertiarySoftBorder: "rgba(8, 145, 178, 0.3)",
    // Switches
    switchTrackOn: "#2563eb",
    switchThumbOn: "#3b82f6",
    switchTrackOff: "#334155",
    switchThumbOff: "#64748b",
    // Row / card
    rowBgPrimary: "rgba(37, 99, 235, 0.2)",
    rowBorderPrimary: "rgba(37, 99, 235, 0.3)",
    rowBgSecondary: "rgba(8, 145, 178, 0.2)",
    rowBorderSecondary: "rgba(8, 145, 178, 0.3)",
    // Modal
    modalBorder: "rgba(37, 99, 235, 0.5)",
    modalShadow: "#3b82f6",
    divider: "rgba(37, 99, 235, 0.3)",
    // Section headers
    sectionIcon: "#93c5fd",
    sectionTextColor: "#bfdbfe",
    // Secondary blue variants
    secondaryMedBold: "rgba(37, 99, 235, 0.4)",
    secondaryLightBorder: "rgba(59, 130, 246, 0.5)",
    secondaryDeepBg: "rgba(10, 30, 80, 0.3)",
    // Stats / analytics accent (amber — avoids green for red/green deficiency)
    statsAccent: "#d97706",
    statsAccentSoft: "rgba(217, 119, 6, 0.25)",
    statsAccentBorder: "rgba(217, 119, 6, 0.45)",
    statsBg: "rgba(120, 60, 0, 0.30)",
    statsBgBorder: "rgba(217, 119, 6, 0.35)",
    statsAccentGlow: "rgba(217, 119, 6, 0.6)",
    statsChartFill: "rgba(217, 119, 6, 0.35)",
    statsChartBorder: "rgba(251, 191, 36, 0.5)",
    // Error / danger
    errorSoft: "rgba(239, 68, 68, 0.2)",
    errorSoftBorder: "rgba(239, 68, 68, 0.3)",
    errorIcon: "#ef4444",
  },

  /**
   * Protanopia – red deficiency (similar to deuteranopia, stronger amber).
   * Uses deep blue (#1d4ed8) and bright amber (#f59e0b).
   */
  protanopia: {
    // Core accents
    accent: "#1d4ed8",
    accentGlow: "rgba(29, 78, 216, 0.8)",
    accentSoft: "rgba(29, 78, 216, 0.3)",
    accentSoftBorder: "rgba(59, 130, 246, 0.5)",
    accentActive: "rgba(29, 78, 216, 0.4)",
    accentActiveBorder: "rgba(59, 130, 246, 0.8)",
    // Secondary & tertiary
    secondary: "#f59e0b",
    secondarySoft: "rgba(29, 78, 216, 0.15)",
    secondarySoftBorder: "rgba(29, 78, 216, 0.3)",
    secondaryMed: "rgba(29, 78, 216, 0.2)",
    tertiary: "#06b6d4",
    tertiarySoft: "rgba(6, 182, 212, 0.2)",
    tertiarySoftBorder: "rgba(6, 182, 212, 0.3)",
    // Switches
    switchTrackOn: "#1d4ed8",
    switchThumbOn: "#3b82f6",
    switchTrackOff: "#334155",
    switchThumbOff: "#64748b",
    // Row / card
    rowBgPrimary: "rgba(29, 78, 216, 0.2)",
    rowBorderPrimary: "rgba(29, 78, 216, 0.3)",
    rowBgSecondary: "rgba(6, 182, 212, 0.2)",
    rowBorderSecondary: "rgba(6, 182, 212, 0.3)",
    // Modal
    modalBorder: "rgba(29, 78, 216, 0.5)",
    modalShadow: "#3b82f6",
    divider: "rgba(29, 78, 216, 0.3)",
    // Section headers
    sectionIcon: "#93c5fd",
    sectionTextColor: "#bfdbfe",
    // Secondary blue variants
    secondaryMedBold: "rgba(29, 78, 216, 0.4)",
    secondaryLightBorder: "rgba(59, 130, 246, 0.5)",
    secondaryDeepBg: "rgba(8, 25, 70, 0.3)",
    // Stats / analytics accent (amber — avoids green for red/green deficiency)
    statsAccent: "#f59e0b",
    statsAccentSoft: "rgba(245, 158, 11, 0.25)",
    statsAccentBorder: "rgba(245, 158, 11, 0.45)",
    statsBg: "rgba(120, 70, 0, 0.30)",
    statsBgBorder: "rgba(245, 158, 11, 0.35)",
    statsAccentGlow: "rgba(245, 158, 11, 0.6)",
    statsChartFill: "rgba(245, 158, 11, 0.35)",
    statsChartBorder: "rgba(252, 211, 77, 0.5)",
    // Error / danger
    errorSoft: "rgba(239, 68, 68, 0.2)",
    errorSoftBorder: "rgba(239, 68, 68, 0.3)",
    errorIcon: "#ef4444",
  },

  /**
   * Tritanopia – blue/yellow deficiency.
   * Uses red (#dc2626) and green (#16a34a) instead of blue/yellow.
   */
  tritanopia: {
    // Core accents
    accent: "#dc2626",
    accentGlow: "rgba(220, 38, 38, 0.8)",
    accentSoft: "rgba(220, 38, 38, 0.3)",
    accentSoftBorder: "rgba(248, 113, 113, 0.5)",
    accentActive: "rgba(220, 38, 38, 0.4)",
    accentActiveBorder: "rgba(248, 113, 113, 0.8)",
    // Secondary & tertiary
    secondary: "#16a34a",
    secondarySoft: "rgba(220, 38, 38, 0.15)",
    secondarySoftBorder: "rgba(220, 38, 38, 0.3)",
    secondaryMed: "rgba(220, 38, 38, 0.2)",
    tertiary: "#7c3aed",
    tertiarySoft: "rgba(124, 58, 237, 0.2)",
    tertiarySoftBorder: "rgba(124, 58, 237, 0.3)",
    // Switches
    switchTrackOn: "#dc2626",
    switchThumbOn: "#ef4444",
    switchTrackOff: "#334155",
    switchThumbOff: "#64748b",
    // Row / card
    rowBgPrimary: "rgba(220, 38, 38, 0.2)",
    rowBorderPrimary: "rgba(220, 38, 38, 0.3)",
    rowBgSecondary: "rgba(22, 163, 74, 0.2)",
    rowBorderSecondary: "rgba(22, 163, 74, 0.3)",
    // Modal
    modalBorder: "rgba(220, 38, 38, 0.5)",
    modalShadow: "#ef4444",
    divider: "rgba(220, 38, 38, 0.3)",
    // Section headers
    sectionIcon: "#f87171",
    sectionTextColor: "#fca5a5",
    // Secondary blue variants (red replaces blue for tritanopia)
    secondaryMedBold: "rgba(220, 38, 38, 0.4)",
    secondaryLightBorder: "rgba(248, 113, 113, 0.5)",
    secondaryDeepBg: "rgba(80, 10, 10, 0.3)",
    // Stats / analytics accent (darker green — safe for tritanopia)
    statsAccent: "#16a34a",
    statsAccentSoft: "rgba(22, 163, 74, 0.25)",
    statsAccentBorder: "rgba(22, 163, 74, 0.45)",
    statsBg: "rgba(5, 60, 20, 0.30)",
    statsBgBorder: "rgba(22, 163, 74, 0.35)",
    statsAccentGlow: "rgba(22, 163, 74, 0.6)",
    statsChartFill: "rgba(22, 163, 74, 0.35)",
    statsChartBorder: "rgba(74, 222, 128, 0.5)",
    // Error / danger (use orange-amber to distinguish from accent red)
    errorSoft: "rgba(180, 83, 9, 0.2)",
    errorSoftBorder: "rgba(180, 83, 9, 0.3)",
    errorIcon: "#b45309",
  },
};

// ─── High-contrast overlay ────────────────────────────────────────────────────

/**
 * Applies high-contrast adjustments on top of a base palette:
 * - Border opacities are boosted to near-solid
 * - Background opacities are doubled (capped at 0.6)
 * - Section icon / text pushed to full white
 * - accentGlow made fully opaque for stronger text shadows
 */
function applyHighContrast(base: ColorPalette): ColorPalette {
  const b = (s: string, v: string) => s.replace(/[\d.]+\)$/, `${v})`);
  return {
    ...base,
    // Backgrounds: double opacity, cap at 0.6
    accentSoft: b(base.accentSoft, "0.5"),
    accentActive: b(base.accentActive, "0.6"),
    secondarySoft: b(base.secondarySoft, "0.3"),
    secondaryMed: b(base.secondaryMed, "0.4"),
    tertiarySoft: b(base.tertiarySoft, "0.4"),
    rowBgPrimary: b(base.rowBgPrimary, "0.4"),
    rowBgSecondary: b(base.rowBgSecondary, "0.4"),
    // Borders: push to near-solid
    accentSoftBorder: b(base.accentSoftBorder, "0.9"),
    accentActiveBorder: b(base.accentActiveBorder, "1.0"),
    secondarySoftBorder: b(base.secondarySoftBorder, "0.8"),
    rowBorderPrimary: b(base.rowBorderPrimary, "0.8"),
    rowBorderSecondary: b(base.rowBorderSecondary, "0.8"),
    modalBorder: b(base.modalBorder, "0.9"),
    tertiarySoftBorder: b(base.tertiarySoftBorder, "0.8"),
    divider: b(base.divider, "0.6"),
    // Glow / shadow: fully opaque
    accentGlow: b(base.accentGlow, "1.0"),
    // Section text/icons → highest contrast white tones
    sectionIcon: "#ffffff",
    sectionTextColor: "#f1f5f9",
    // Secondary blue variant borders → near-solid
    secondaryMedBold: b(base.secondaryMedBold, "0.6"),
    secondaryLightBorder: b(base.secondaryLightBorder, "0.85"),
    secondaryDeepBg: b(base.secondaryDeepBg, "0.5"),
    // Stats accent → boosted opacity
    statsAccentSoft: b(base.statsAccentSoft, "0.45"),
    statsAccentBorder: b(base.statsAccentBorder, "0.85"),
    statsBg: b(base.statsBg, "0.5"),
    statsBgBorder: b(base.statsBgBorder, "0.7"),
    statsAccentGlow: b(base.statsAccentGlow, "1.0"),
    statsChartFill: b(base.statsChartFill, "0.55"),
    statsChartBorder: b(base.statsChartBorder, "0.85"),
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns the active color palette, honoring both `colorBlindMode` and
 * `highContrast` from `AccessibilityContext`.
 */
export function useColorPalette(): ColorPalette {
  const { colorBlindMode, highContrast } = useAccessibility();
  const base = palettes[colorBlindMode] ?? palettes.none;
  return highContrast ? applyHighContrast(base) : base;
}

export { palettes };
