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
  /** Primary accent (replaces purple #8b5cf6) */
  accent: string;
  /** Glow / shadow version of accent */
  accentGlow: string;
  /** Track color for active Switch */
  switchTrackOn: string;
  /** Thumb color for active Switch */
  switchThumbOn: string;
  /** Secondary accent (replaces blue #60a5fa) */
  secondary: string;
  /** Tertiary accent (replaces pink #ec4899) */
  tertiary: string;
  /** Row background – primary */
  rowBgPrimary: string;
  /** Row border – primary */
  rowBorderPrimary: string;
  /** Row background – secondary */
  rowBgSecondary: string;
  /** Row border – secondary */
  rowBorderSecondary: string;
  /** Modal container border */
  modalBorder: string;
  /** Modal container shadow */
  modalShadow: string;
}

// ─── Palette definitions ──────────────────────────────────────────────────────

const palettes: Record<ColorBlindMode, ColorPalette> = {
  /**
   * Default – original purple / blue / pink theme.
   */
  none: {
    accent: "#8b5cf6",
    accentGlow: "rgba(139, 92, 246, 0.8)",
    switchTrackOn: "#8b5cf6",
    switchThumbOn: "#a855f7",
    secondary: "#60a5fa",
    tertiary: "#ec4899",
    rowBgPrimary: "rgba(59, 130, 246, 0.2)",
    rowBorderPrimary: "rgba(59, 130, 246, 0.3)",
    rowBgSecondary: "rgba(236, 72, 153, 0.2)",
    rowBorderSecondary: "rgba(236, 72, 153, 0.3)",
    modalBorder: "rgba(139, 92, 246, 0.5)",
    modalShadow: "#a855f7",
  },

  /**
   * Deuteranopia – red/green deficiency.
   * Uses blue (#2563eb) and amber (#d97706) instead of red/green.
   */
  deuteranopia: {
    accent: "#2563eb",
    accentGlow: "rgba(37, 99, 235, 0.8)",
    switchTrackOn: "#2563eb",
    switchThumbOn: "#3b82f6",
    secondary: "#d97706",
    tertiary: "#0891b2",
    rowBgPrimary: "rgba(37, 99, 235, 0.2)",
    rowBorderPrimary: "rgba(37, 99, 235, 0.3)",
    rowBgSecondary: "rgba(8, 145, 178, 0.2)",
    rowBorderSecondary: "rgba(8, 145, 178, 0.3)",
    modalBorder: "rgba(37, 99, 235, 0.5)",
    modalShadow: "#3b82f6",
  },

  /**
   * Protanopia – red deficiency (similar to deuteranopia, stronger amber).
   * Uses deep blue (#1d4ed8) and bright amber (#f59e0b).
   */
  protanopia: {
    accent: "#1d4ed8",
    accentGlow: "rgba(29, 78, 216, 0.8)",
    switchTrackOn: "#1d4ed8",
    switchThumbOn: "#3b82f6",
    secondary: "#f59e0b",
    tertiary: "#06b6d4",
    rowBgPrimary: "rgba(29, 78, 216, 0.2)",
    rowBorderPrimary: "rgba(29, 78, 216, 0.3)",
    rowBgSecondary: "rgba(6, 182, 212, 0.2)",
    rowBorderSecondary: "rgba(6, 182, 212, 0.3)",
    modalBorder: "rgba(29, 78, 216, 0.5)",
    modalShadow: "#3b82f6",
  },

  /**
   * Tritanopia – blue/yellow deficiency.
   * Uses red (#dc2626) and green (#16a34a) instead of blue/yellow.
   */
  tritanopia: {
    accent: "#dc2626",
    accentGlow: "rgba(220, 38, 38, 0.8)",
    switchTrackOn: "#dc2626",
    switchThumbOn: "#ef4444",
    secondary: "#16a34a",
    tertiary: "#7c3aed",
    rowBgPrimary: "rgba(220, 38, 38, 0.2)",
    rowBorderPrimary: "rgba(220, 38, 38, 0.3)",
    rowBgSecondary: "rgba(22, 163, 74, 0.2)",
    rowBorderSecondary: "rgba(22, 163, 74, 0.3)",
    modalBorder: "rgba(220, 38, 38, 0.5)",
    modalShadow: "#ef4444",
  },
};

// ─── High-contrast overlay ────────────────────────────────────────────────────

/**
 * Applies high-contrast adjustments on top of a base palette:
 * border opacity is boosted and background opacity is doubled (capped logically).
 */
function applyHighContrast(base: ColorPalette): ColorPalette {
  return {
    ...base,
    rowBgPrimary: base.rowBgPrimary.replace(/[\d.]+\)$/, "0.4)"),
    rowBorderPrimary: base.rowBorderPrimary.replace(/[\d.]+\)$/, "0.8)"),
    rowBgSecondary: base.rowBgSecondary.replace(/[\d.]+\)$/, "0.4)"),
    rowBorderSecondary: base.rowBorderSecondary.replace(/[\d.]+\)$/, "0.8)"),
    modalBorder: base.modalBorder.replace(/[\d.]+\)$/, "0.9)"),
    accentGlow: base.accentGlow.replace(/[\d.]+\)$/, "1.0)"),
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
