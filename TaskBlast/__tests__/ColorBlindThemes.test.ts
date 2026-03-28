/**
 * Test Suite: ColorBlindThemes
 *
 * Unit tests for the pure palette logic exported from
 * app/styles/colorBlindThemes.ts:
 *
 *  - Palette shape completeness (all 40 tokens present for every mode)
 *  - Correct hex / rgba values per CVD mode
 *  - Stats accent safety (avoids green for red/green-deficiency modes)
 *  - Error token consistency and semantic isolation (tritanopia override)
 *  - useColorPalette() palette selection logic
 *  - applyHighContrast() opacity / color boosts
 *  - Fallback to "none" palette for unknown / unsupported modes
 */

import { renderHook } from "@testing-library/react-native";
import { palettes, useColorPalette } from "../app/styles/colorBlindThemes";

// ─── Mock AccessibilityContext ────────────────────────────────────────────────
// useColorPalette() calls useAccessibility() internally. We mock it here so
// the hook can be exercised without an actual React tree / provider.

const mockAccessibility = {
  colorBlindMode: "none" as
    | "none"
    | "deuteranopia"
    | "protanopia"
    | "tritanopia",
  highContrast: false,
  language: "en",
  textSize: "medium" as "small" | "medium" | "large",
  textScale: 1.0,
  reduceMotion: false,
  ttsEnabled: false,
  isLoading: false,
  setLanguage: jest.fn(),
  setColorBlindMode: jest.fn(),
  setTextSize: jest.fn(),
  setHighContrast: jest.fn(),
  setReduceMotion: jest.fn(),
  setTtsEnabled: jest.fn(),
};

jest.mock("../app/context/AccessibilityContext", () => ({
  useAccessibility: () => mockAccessibility,
}));

// ─── Required palette keys ────────────────────────────────────────────────────

const REQUIRED_KEYS: (keyof typeof palettes.none)[] = [
  // Core accents
  "accent",
  "accentGlow",
  "accentSoft",
  "accentSoftBorder",
  "accentActive",
  "accentActiveBorder",
  // Secondary & tertiary
  "secondary",
  "secondarySoft",
  "secondarySoftBorder",
  "secondaryMed",
  "tertiary",
  "tertiarySoft",
  "tertiarySoftBorder",
  // Switches
  "switchTrackOn",
  "switchThumbOn",
  "switchTrackOff",
  "switchThumbOff",
  // Row / card
  "rowBgPrimary",
  "rowBorderPrimary",
  "rowBgSecondary",
  "rowBorderSecondary",
  // Modal
  "modalBorder",
  "modalShadow",
  "divider",
  // Section headers
  "sectionIcon",
  "sectionTextColor",
  // Secondary blue variants
  "secondaryMedBold",
  "secondaryLightBorder",
  "secondaryDeepBg",
  // Stats / analytics
  "statsAccent",
  "statsAccentSoft",
  "statsAccentBorder",
  "statsBg",
  "statsBgBorder",
  "statsAccentGlow",
  "statsChartFill",
  "statsChartBorder",
  // Error / danger
  "errorSoft",
  "errorSoftBorder",
  "errorIcon",
];

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Parses the trailing opacity value from an rgba() string. */
function parseOpacity(rgba: string): number {
  const match = rgba.match(/([\d.]+)\)$/);
  return match ? parseFloat(match[1]) : -1;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

// ── U1-U5: Palette shape completeness ────────────────────────────────────────

describe("ColorBlindThemes – Palette shape completeness", () => {
  it.each(["none", "deuteranopia", "protanopia", "tritanopia"] as const)(
    "%s palette contains all required keys with string values",
    (mode) => {
      REQUIRED_KEYS.forEach((key) => {
        expect(palettes[mode]).toHaveProperty(key);
        expect(typeof palettes[mode][key]).toBe("string");
      });
    },
  );
});

// ── U1-U4: Accent token values per mode ──────────────────────────────────────

describe("ColorBlindThemes – Accent hex tokens per mode", () => {
  // none
  it("none: accent is purple #8b5cf6", () =>
    expect(palettes.none.accent).toBe("#8b5cf6"));
  it("none: secondary is blue #60a5fa", () =>
    expect(palettes.none.secondary).toBe("#60a5fa"));
  it("none: tertiary is pink #ec4899", () =>
    expect(palettes.none.tertiary).toBe("#ec4899"));

  // deuteranopia
  it("deuteranopia: accent is blue #2563eb", () =>
    expect(palettes.deuteranopia.accent).toBe("#2563eb"));
  it("deuteranopia: secondary is amber #d97706", () =>
    expect(palettes.deuteranopia.secondary).toBe("#d97706"));
  it("deuteranopia: tertiary is cyan #0891b2", () =>
    expect(palettes.deuteranopia.tertiary).toBe("#0891b2"));

  // protanopia
  it("protanopia: accent is deep blue #1d4ed8", () =>
    expect(palettes.protanopia.accent).toBe("#1d4ed8"));
  it("protanopia: secondary is bright amber #f59e0b", () =>
    expect(palettes.protanopia.secondary).toBe("#f59e0b"));
  it("protanopia: tertiary is cyan #06b6d4", () =>
    expect(palettes.protanopia.tertiary).toBe("#06b6d4"));

  // tritanopia
  it("tritanopia: accent is red #dc2626", () =>
    expect(palettes.tritanopia.accent).toBe("#dc2626"));
  it("tritanopia: secondary is green #16a34a", () =>
    expect(palettes.tritanopia.secondary).toBe("#16a34a"));
  it("tritanopia: tertiary is violet #7c3aed", () =>
    expect(palettes.tritanopia.tertiary).toBe("#7c3aed"));

  // All four accents are mutually distinct
  it("all four accent values are unique", () => {
    const accents = [
      palettes.none.accent,
      palettes.deuteranopia.accent,
      palettes.protanopia.accent,
      palettes.tritanopia.accent,
    ];
    expect(new Set(accents).size).toBe(4);
  });
});

// ── U6-U7: Stats accent safety ────────────────────────────────────────────────

describe("ColorBlindThemes – Stats accent color safety", () => {
  it("(U6) deuteranopia statsAccent is not the default green #3bf670", () =>
    expect(palettes.deuteranopia.statsAccent).not.toBe("#3bf670"));

  it("(U6) protanopia statsAccent is not the default green #3bf670", () =>
    expect(palettes.protanopia.statsAccent).not.toBe("#3bf670"));

  it("(U7) tritanopia statsAccent is green – safe for blue/yellow deficiency", () =>
    expect(palettes.tritanopia.statsAccent).toBe("#16a34a"));

  it("none statsAccent is the default neon green #3bf670", () =>
    expect(palettes.none.statsAccent).toBe("#3bf670"));
});

// ── Error / danger – semantic isolation ──────────────────────────────────────

describe("ColorBlindThemes – Error / danger tokens", () => {
  it("none, deuteranopia, protanopia share the same errorIcon #ef4444", () => {
    expect(palettes.none.errorIcon).toBe("#ef4444");
    expect(palettes.deuteranopia.errorIcon).toBe("#ef4444");
    expect(palettes.protanopia.errorIcon).toBe("#ef4444");
  });

  it("tritanopia uses amber-orange errorIcon to distinguish from its red accent", () =>
    expect(palettes.tritanopia.errorIcon).toBe("#b45309"));

  it("tritanopia errorIcon differs from its accent so danger is still distinguishable", () =>
    expect(palettes.tritanopia.errorIcon).not.toBe(
      palettes.tritanopia.accent,
    ));
});

// ── U8-U12: useColorPalette hook – palette selection ─────────────────────────

describe("ColorBlindThemes – useColorPalette() palette selection", () => {
  beforeEach(() => {
    mockAccessibility.colorBlindMode = "none";
    mockAccessibility.highContrast = false;
  });

  it("(U8) returns palettes.none when mode is 'none'", () => {
    mockAccessibility.colorBlindMode = "none";
    const { result } = renderHook(() => useColorPalette());
    expect(result.current.accent).toBe(palettes.none.accent);
    expect(result.current.secondary).toBe(palettes.none.secondary);
  });

  it("(U9) returns deuteranopia palette when mode is 'deuteranopia'", () => {
    mockAccessibility.colorBlindMode = "deuteranopia";
    const { result } = renderHook(() => useColorPalette());
    expect(result.current.accent).toBe("#2563eb");
    expect(result.current.secondary).toBe("#d97706");
  });

  it("(U10) returns protanopia palette when mode is 'protanopia'", () => {
    mockAccessibility.colorBlindMode = "protanopia";
    const { result } = renderHook(() => useColorPalette());
    expect(result.current.accent).toBe("#1d4ed8");
    expect(result.current.secondary).toBe("#f59e0b");
  });

  it("(U11) returns tritanopia palette when mode is 'tritanopia'", () => {
    mockAccessibility.colorBlindMode = "tritanopia";
    const { result } = renderHook(() => useColorPalette());
    expect(result.current.accent).toBe("#dc2626");
    expect(result.current.secondary).toBe("#16a34a");
  });

  it("(U12) falls back to palettes.none for unknown / unsupported mode", () => {
    // @ts-ignore – intentionally passing an unsupported value
    mockAccessibility.colorBlindMode = "monochromacy";
    const { result } = renderHook(() => useColorPalette());
    expect(result.current.accent).toBe(palettes.none.accent);
  });
});

// ── U13-U18: useColorPalette hook – high-contrast overlay ────────────────────

describe("ColorBlindThemes – useColorPalette() high-contrast overlay", () => {
  beforeEach(() => {
    mockAccessibility.colorBlindMode = "none";
    mockAccessibility.highContrast = false;
  });

  it("(U13) sectionIcon becomes #ffffff when highContrast is true", () => {
    mockAccessibility.highContrast = true;
    const { result } = renderHook(() => useColorPalette());
    expect(result.current.sectionIcon).toBe("#ffffff");
  });

  it("(U14) sectionTextColor becomes #f1f5f9 when highContrast is true", () => {
    mockAccessibility.highContrast = true;
    const { result } = renderHook(() => useColorPalette());
    expect(result.current.sectionTextColor).toBe("#f1f5f9");
  });

  it("(U15) accentSoftBorder opacity is >= 0.9 under high contrast", () => {
    mockAccessibility.highContrast = true;
    const { result } = renderHook(() => useColorPalette());
    expect(parseOpacity(result.current.accentSoftBorder)).toBeGreaterThanOrEqual(
      0.9,
    );
  });

  it("(U16) accentGlow opacity reaches 1.0 under high contrast", () => {
    mockAccessibility.highContrast = true;
    const { result } = renderHook(() => useColorPalette());
    expect(parseOpacity(result.current.accentGlow)).toBe(1.0);
  });

  it("(U17) original palette is unchanged when highContrast is false", () => {
    mockAccessibility.highContrast = false;
    const { result } = renderHook(() => useColorPalette());
    expect(parseOpacity(result.current.accentSoftBorder)).toBeCloseTo(0.5, 2);
  });

  it("accentActiveBorder opacity reaches 1.0 under high contrast", () => {
    mockAccessibility.highContrast = true;
    const { result } = renderHook(() => useColorPalette());
    expect(parseOpacity(result.current.accentActiveBorder)).toBe(1.0);
  });

  it("statsAccentGlow opacity reaches 1.0 under high contrast", () => {
    mockAccessibility.highContrast = true;
    const { result } = renderHook(() => useColorPalette());
    expect(parseOpacity(result.current.statsAccentGlow)).toBe(1.0);
  });

  it("statsAccentBorder opacity is >= 0.85 under high contrast", () => {
    mockAccessibility.highContrast = true;
    const { result } = renderHook(() => useColorPalette());
    expect(parseOpacity(result.current.statsAccentBorder)).toBeGreaterThanOrEqual(
      0.85,
    );
  });

  it("rowBorderPrimary opacity is >= 0.8 under high contrast", () => {
    mockAccessibility.highContrast = true;
    const { result } = renderHook(() => useColorPalette());
    expect(parseOpacity(result.current.rowBorderPrimary)).toBeGreaterThanOrEqual(
      0.8,
    );
  });

  it("(U18) highContrast + deuteranopia: accent is blue AND sectionIcon is white", () => {
    mockAccessibility.colorBlindMode = "deuteranopia";
    mockAccessibility.highContrast = true;
    const { result } = renderHook(() => useColorPalette());
    expect(result.current.accent).toBe("#2563eb");
    expect(result.current.sectionIcon).toBe("#ffffff");
  });

  it("highContrast + tritanopia: accent is red AND sectionIcon is white", () => {
    mockAccessibility.colorBlindMode = "tritanopia";
    mockAccessibility.highContrast = true;
    const { result } = renderHook(() => useColorPalette());
    expect(result.current.accent).toBe("#dc2626");
    expect(result.current.sectionIcon).toBe("#ffffff");
  });

  it("highContrast + protanopia: accent is deep blue AND sectionIcon is white", () => {
    mockAccessibility.colorBlindMode = "protanopia";
    mockAccessibility.highContrast = true;
    const { result } = renderHook(() => useColorPalette());
    expect(result.current.accent).toBe("#1d4ed8");
    expect(result.current.sectionIcon).toBe("#ffffff");
  });
});
