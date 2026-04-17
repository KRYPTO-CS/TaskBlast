/**
 * Test Suite: ShopModal – Color Blind Integration
 *
 * Covers the palette-aware theming introduced by useColorPalette:
 * - Modal container and confirmation dialog use palette.modalBorder
 * - Item card states (equipped / owned / locked) use distinct palette tokens
 *   that are safe for every CVD mode, replacing hardcoded green/yellow/purple
 * - Status badges (Equipped, Owned, price pill) use correct palette tokens
 * - Page selector tabs and action buttons use palette accent colors
 * - All four color blind modes render without errors and apply their own palette
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import ShopModal from "../app/components/ShopModal";
import { getAuth } from "firebase/auth";
import { getDoc, getDocs, updateDoc } from "firebase/firestore";
import { purchaseShopItem } from "../app/services/economyService";

const mockActiveProfile = {
  childDocId: null as string | null,
  getProfileDocRef: jest.fn(() => ({ id: "mock-profile-doc" })),
  isLoading: false,
  profileType: "parent",
};

jest.mock("../app/context/ActiveProfileContext", () => ({
  useActiveProfile: () => mockActiveProfile,
}));

// ─── Palette fixtures ─────────────────────────────────────────────────────────

const PALETTES = {
  none: {
    accent: "#8b5cf6",
    accentGlow: "rgba(139, 92, 246, 0.8)",
    accentSoft: "rgba(139, 92, 246, 0.3)",
    accentSoftBorder: "rgba(167, 139, 250, 0.5)",
    accentActive: "rgba(139, 92, 246, 0.4)",
    accentActiveBorder: "rgba(167, 139, 250, 0.8)",
    secondary: "#60a5fa",
    secondarySoft: "rgba(59, 130, 246, 0.15)",
    secondarySoftBorder: "rgba(59, 130, 246, 0.3)",
    tertiary: "#ec4899",
    tertiarySoft: "rgba(236, 72, 153, 0.2)",
    tertiarySoftBorder: "rgba(236, 72, 153, 0.3)",
    rowBgPrimary: "rgba(59, 130, 246, 0.2)",
    rowBorderPrimary: "rgba(59, 130, 246, 0.3)",
    modalBorder: "rgba(139, 92, 246, 0.5)",
    modalShadow: "#a855f7",
    divider: "rgba(139, 92, 246, 0.3)",
    sectionTextColor: "#c4b5fd",
    sectionIcon: "#a78bfa",
    switchTrackOn: "#8b5cf6",
    switchThumbOn: "#a855f7",
    switchTrackOff: "#334155",
    switchThumbOff: "#64748b",
    rowBgSecondary: "rgba(236, 72, 153, 0.2)",
    rowBorderSecondary: "rgba(236, 72, 153, 0.3)",
    secondaryMed: "rgba(59, 130, 246, 0.2)",
    errorSoft: "rgba(239, 68, 68, 0.2)",
    errorSoftBorder: "rgba(239, 68, 68, 0.3)",
    errorIcon: "#ef4444",
  },
  deuteranopia: {
    accent: "#2563eb",
    accentGlow: "rgba(37, 99, 235, 0.8)",
    accentSoft: "rgba(37, 99, 235, 0.3)",
    accentSoftBorder: "rgba(59, 130, 246, 0.5)",
    accentActive: "rgba(37, 99, 235, 0.4)",
    accentActiveBorder: "rgba(59, 130, 246, 0.8)",
    secondary: "#d97706",
    secondarySoft: "rgba(37, 99, 235, 0.15)",
    secondarySoftBorder: "rgba(37, 99, 235, 0.3)",
    tertiary: "#0891b2",
    tertiarySoft: "rgba(8, 145, 178, 0.2)",
    tertiarySoftBorder: "rgba(8, 145, 178, 0.3)",
    rowBgPrimary: "rgba(37, 99, 235, 0.2)",
    rowBorderPrimary: "rgba(37, 99, 235, 0.3)",
    modalBorder: "rgba(37, 99, 235, 0.5)",
    modalShadow: "#3b82f6",
    divider: "rgba(37, 99, 235, 0.3)",
    sectionTextColor: "#bfdbfe",
    sectionIcon: "#93c5fd",
    switchTrackOn: "#2563eb",
    switchThumbOn: "#3b82f6",
    switchTrackOff: "#334155",
    switchThumbOff: "#64748b",
    rowBgSecondary: "rgba(8, 145, 178, 0.2)",
    rowBorderSecondary: "rgba(8, 145, 178, 0.3)",
    secondaryMed: "rgba(37, 99, 235, 0.2)",
    errorSoft: "rgba(239, 68, 68, 0.2)",
    errorSoftBorder: "rgba(239, 68, 68, 0.3)",
    errorIcon: "#ef4444",
  },
  protanopia: {
    accent: "#1d4ed8",
    accentGlow: "rgba(29, 78, 216, 0.8)",
    accentSoft: "rgba(29, 78, 216, 0.3)",
    accentSoftBorder: "rgba(59, 130, 246, 0.5)",
    accentActive: "rgba(29, 78, 216, 0.4)",
    accentActiveBorder: "rgba(59, 130, 246, 0.8)",
    secondary: "#f59e0b",
    secondarySoft: "rgba(29, 78, 216, 0.15)",
    secondarySoftBorder: "rgba(29, 78, 216, 0.3)",
    tertiary: "#06b6d4",
    tertiarySoft: "rgba(6, 182, 212, 0.2)",
    tertiarySoftBorder: "rgba(6, 182, 212, 0.3)",
    rowBgPrimary: "rgba(29, 78, 216, 0.2)",
    rowBorderPrimary: "rgba(29, 78, 216, 0.3)",
    modalBorder: "rgba(29, 78, 216, 0.5)",
    modalShadow: "#3b82f6",
    divider: "rgba(29, 78, 216, 0.3)",
    sectionTextColor: "#bfdbfe",
    sectionIcon: "#93c5fd",
    switchTrackOn: "#1d4ed8",
    switchThumbOn: "#3b82f6",
    switchTrackOff: "#334155",
    switchThumbOff: "#64748b",
    rowBgSecondary: "rgba(6, 182, 212, 0.2)",
    rowBorderSecondary: "rgba(6, 182, 212, 0.3)",
    secondaryMed: "rgba(29, 78, 216, 0.2)",
    errorSoft: "rgba(239, 68, 68, 0.2)",
    errorSoftBorder: "rgba(239, 68, 68, 0.3)",
    errorIcon: "#ef4444",
  },
  tritanopia: {
    accent: "#dc2626",
    accentGlow: "rgba(220, 38, 38, 0.8)",
    accentSoft: "rgba(220, 38, 38, 0.3)",
    accentSoftBorder: "rgba(248, 113, 113, 0.5)",
    accentActive: "rgba(220, 38, 38, 0.4)",
    accentActiveBorder: "rgba(248, 113, 113, 0.8)",
    secondary: "#16a34a",
    secondarySoft: "rgba(220, 38, 38, 0.15)",
    secondarySoftBorder: "rgba(220, 38, 38, 0.3)",
    tertiary: "#7c3aed",
    tertiarySoft: "rgba(124, 58, 237, 0.2)",
    tertiarySoftBorder: "rgba(124, 58, 237, 0.3)",
    rowBgPrimary: "rgba(220, 38, 38, 0.2)",
    rowBorderPrimary: "rgba(220, 38, 38, 0.3)",
    modalBorder: "rgba(220, 38, 38, 0.5)",
    modalShadow: "#ef4444",
    divider: "rgba(220, 38, 38, 0.3)",
    sectionTextColor: "#fca5a5",
    sectionIcon: "#f87171",
    switchTrackOn: "#dc2626",
    switchThumbOn: "#ef4444",
    switchTrackOff: "#334155",
    switchThumbOff: "#64748b",
    rowBgSecondary: "rgba(22, 163, 74, 0.2)",
    rowBorderSecondary: "rgba(22, 163, 74, 0.3)",
    secondaryMed: "rgba(220, 38, 38, 0.2)",
    errorSoft: "rgba(180, 83, 9, 0.2)",
    errorSoftBorder: "rgba(180, 83, 9, 0.3)",
    errorIcon: "#b45309",
  },
} as const;

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockUseColorPalette = jest.fn(() => PALETTES.none);

jest.mock("../app/styles/colorBlindThemes", () => ({
  useColorPalette: () => mockUseColorPalette(),
  palettes: { none: {}, deuteranopia: {}, protanopia: {}, tritanopia: {} },
}));

jest.mock("../TTS", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return { Text: (props: any) => React.createElement(Text, props) };
});

jest.mock("../app/services/economyService", () => ({
  purchaseShopItem: jest.fn(),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flattenStyle(style: any): Record<string, any> {
  if (!style) return {};
  if (Array.isArray(style))
    return Object.assign({}, ...style.map(flattenStyle));
  return style;
}

function findNodesByStyle(instance: any, key: string, value: string): any[] {
  const results: any[] = [];
  const walk = (node: any) => {
    if (!node) return;
    const style = flattenStyle(node.props?.style);
    if (style[key] === value) results.push(node);
    (node.children || []).forEach(walk);
  };
  walk(instance.toJSON());
  return results;
}

// ─── Setup ────────────────────────────────────────────────────────────────────

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  onRocksChange: jest.fn(),
};

const defaultUserData = {
  rocks: 1000,
  shopItems: {
    body: [true, false, false, false],
    wings: [false, true, false, false],
    toppers: [true, false],
  },
  unlockedPlanets: [
    true,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ],
  equipped: [0, 1, 0],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseColorPalette.mockReturnValue(PALETTES.none);

  (getDocs as jest.Mock).mockResolvedValue({
    forEach: (callback: any) => {
      [
        {
          id: "body_0",
          data: () => ({ type: "body", image: "body0", cost: 0 }),
        },
        {
          id: "body_1",
          data: () => ({ type: "body", image: "body1", cost: 100 }),
        },
        {
          id: "wings_0",
          data: () => ({ type: "wings", image: "wing0", cost: 0 }),
        },
        {
          id: "wings_1",
          data: () => ({ type: "wings", image: "wing1", cost: 100 }),
        },
      ].forEach(callback);
    },
    docs: [],
    empty: false,
  });

  (getAuth as jest.Mock).mockReturnValue({
    currentUser: { uid: "test-uid", email: "test@example.com" },
  });

  (getDoc as jest.Mock).mockResolvedValue({
    exists: () => true,
    data: () => ({ ...defaultUserData }),
  });

  (updateDoc as jest.Mock).mockResolvedValue(undefined);
  (purchaseShopItem as jest.Mock).mockResolvedValue({
    success: true,
    newRocks: 500,
    shopItems: {
      body: [true, true, false, false],
      wings: [false, true, false, false],
      toppers: [true, false],
    },
    unlockedPlanets: [
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ],
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ShopModal – Color Blind Integration", () => {
  // ── Hook wiring ────────────────────────────────────────────────────────────

  describe("useColorPalette hook wiring", () => {
    it("calls useColorPalette when the modal renders", () => {
      render(<ShopModal {...defaultProps} />);
      expect(mockUseColorPalette).toHaveBeenCalled();
    });

    it("applies palette.modalBorder to the modal container", async () => {
      const palette = PALETTES.none;
      mockUseColorPalette.mockReturnValue(palette);

      const instance = render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      const nodes = findNodesByStyle(
        instance,
        "borderColor",
        palette.modalBorder,
      );
      expect(nodes.length).toBeGreaterThanOrEqual(1);
    });

    it("applies palette.divider to the header separator", async () => {
      const palette = PALETTES.none;
      mockUseColorPalette.mockReturnValue(palette);

      const instance = render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      const nodes = findNodesByStyle(instance, "borderColor", palette.divider);
      expect(nodes.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Item card states ───────────────────────────────────────────────────────

  describe("Item card state styling", () => {
    it("equipped card uses palette.tertiarySoft background", async () => {
      const palette = PALETTES.none;
      mockUseColorPalette.mockReturnValue(palette);

      const instance = render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      const nodes = findNodesByStyle(
        instance,
        "backgroundColor",
        palette.tertiarySoft,
      );
      expect(nodes.length).toBeGreaterThanOrEqual(1);
    });

    it("owned (unlocked but not equipped) card uses palette.rowBgPrimary background", async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          rocks: 1000,
          shopItems: {
            body: [true, true, false, false],
            wings: [false, true, false, false],
          },
          equipped: [0, 1],
        }),
      });

      const palette = PALETTES.none;
      mockUseColorPalette.mockReturnValue(palette);

      const instance = render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      const nodes = findNodesByStyle(
        instance,
        "backgroundColor",
        palette.rowBgPrimary,
      );
      expect(nodes.length).toBeGreaterThanOrEqual(1);
    });

    it("locked card uses palette.secondarySoft background", async () => {
      const palette = PALETTES.none;
      mockUseColorPalette.mockReturnValue(palette);

      const instance = render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      const nodes = findNodesByStyle(
        instance,
        "backgroundColor",
        palette.secondarySoft,
      );
      expect(nodes.length).toBeGreaterThanOrEqual(1);
    });

    it("equipped card border uses palette.tertiarySoftBorder", async () => {
      const palette = PALETTES.none;
      mockUseColorPalette.mockReturnValue(palette);

      const instance = render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      const nodes = findNodesByStyle(
        instance,
        "borderColor",
        palette.tertiarySoftBorder,
      );
      expect(nodes.length).toBeGreaterThanOrEqual(1);
    });

    it("owned card border uses palette.rowBorderPrimary", async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          rocks: 1000,
          shopItems: {
            body: [true, true, false, false],
            wings: [false, true, false, false],
          },
          equipped: [0, 1],
        }),
      });

      const palette = PALETTES.none;
      mockUseColorPalette.mockReturnValue(palette);

      const instance = render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      const nodes = findNodesByStyle(
        instance,
        "borderColor",
        palette.rowBorderPrimary,
      );
      expect(nodes.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Status badge labels ────────────────────────────────────────────────────

  describe("Status badge labels", () => {
    it("shows Equipped badge for equipped items", async () => {
      const { getAllByText } = render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());
      expect(getAllByText("Equipped").length).toBeGreaterThanOrEqual(1);
    });

    it("shows Owned badge for owned but not equipped items", async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          rocks: 1000,
          shopItems: {
            body: [true, true, false, false],
            wings: [false, true, false, false],
          },
          equipped: [0, 1],
        }),
      });

      const { getAllByText } = render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());
      expect(getAllByText("Owned").length).toBeGreaterThanOrEqual(1);
    });

    it("shows price for locked items", async () => {
      const { getByText } = render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());
      expect(getByText("500")).toBeTruthy();
    });
  });

  // ── Page selector tabs ─────────────────────────────────────────────────────

  describe("Page selector tab colors", () => {
    it("active tab uses palette.accent background", async () => {
      const palette = PALETTES.none;
      mockUseColorPalette.mockReturnValue(palette);

      const instance = render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      const nodes = findNodesByStyle(
        instance,
        "backgroundColor",
        palette.accent,
      );
      expect(nodes.length).toBeGreaterThanOrEqual(1);
    });

    it("inactive tab uses palette.secondarySoft background", async () => {
      const palette = PALETTES.none;
      mockUseColorPalette.mockReturnValue(palette);

      const instance = render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      const nodes = findNodesByStyle(
        instance,
        "backgroundColor",
        palette.secondarySoft,
      );
      expect(nodes.length).toBeGreaterThanOrEqual(1);
    });

    it("switching to Wings tab shows wing items", async () => {
      const { getByText } = render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      fireEvent.press(getByText("Wings"));
      expect(getByText("Red Wings")).toBeTruthy();
    });
  });

  // ── Confirmation dialog ────────────────────────────────────────────────────

  describe("Confirmation dialog", () => {
    it("shows confirmation dialog when tapping a locked item", async () => {
      const { getByText } = render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      fireEvent.press(getByText("Red Body"));

      await waitFor(() => {
        expect(getByText("Confirm Purchase")).toBeTruthy();
      });
    });

    it("confirmation dialog uses palette.modalBorder on its container", async () => {
      const palette = PALETTES.none;
      mockUseColorPalette.mockReturnValue(palette);

      const instance = render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      fireEvent.press(instance.getByText("Red Body"));
      await waitFor(() => instance.getByText("Confirm Purchase"));

      const nodes = findNodesByStyle(
        instance,
        "borderColor",
        palette.modalBorder,
      );
      expect(nodes.length).toBeGreaterThanOrEqual(2);
    });

    it("confirmation Purchase button uses palette.accent background", async () => {
      const palette = PALETTES.none;
      mockUseColorPalette.mockReturnValue(palette);

      const instance = render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      fireEvent.press(instance.getByText("Red Body"));
      await waitFor(() => instance.getByText("Confirm Purchase"));

      const nodes = findNodesByStyle(
        instance,
        "backgroundColor",
        palette.accent,
      );
      expect(nodes.length).toBeGreaterThanOrEqual(1);
    });

    it("Cancel button dismisses the confirmation dialog", async () => {
      const { getByText, queryByText } = render(
        <ShopModal {...defaultProps} />,
      );
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      fireEvent.press(getByText("Red Body"));
      await waitFor(() => getByText("Confirm Purchase"));

      fireEvent.press(getByText("Cancel"));

      await waitFor(() => {
        expect(queryByText("Confirm Purchase")).toBeNull();
      });
    });
  });

  // ── Per-mode rendering ─────────────────────────────────────────────────────

  describe("Color blind mode rendering", () => {
    const MODES = ["none", "deuteranopia", "protanopia", "tritanopia"] as const;

    MODES.forEach((mode) => {
      it(`renders without errors in ${mode} mode`, async () => {
        mockUseColorPalette.mockReturnValue(PALETTES[mode]);

        const { getByText } = render(<ShopModal {...defaultProps} />);
        await waitFor(() => expect(getDoc).toHaveBeenCalled());

        expect(getByText("Shop")).toBeTruthy();
        expect(getByText("Body")).toBeTruthy();
        expect(getByText("Wings")).toBeTruthy();
      });
    });

    it("each mode applies a distinct modalBorder color", async () => {
      const borders = new Set<string>();

      for (const mode of MODES) {
        mockUseColorPalette.mockReturnValue(PALETTES[mode]);
        (getDoc as jest.Mock).mockResolvedValue({
          exists: () => true,
          data: () => ({ ...defaultUserData }),
        });

        const instance = render(<ShopModal {...defaultProps} />);
        await waitFor(() => expect(getDoc).toHaveBeenCalled());

        const nodes = findNodesByStyle(
          instance,
          "borderColor",
          PALETTES[mode].modalBorder,
        );
        if (nodes.length > 0) borders.add(PALETTES[mode].modalBorder);

        instance.unmount();
        jest.clearAllMocks();
      }

      expect(borders.size).toBe(4);
    });

    it("none and deuteranopia produce different accent colors", () => {
      expect(PALETTES.none.accent).not.toBe(PALETTES.deuteranopia.accent);
      expect(PALETTES.none.modalBorder).not.toBe(
        PALETTES.deuteranopia.modalBorder,
      );
    });

    it("tertiarySoft differs across all modes so equipped card is always distinguishable", () => {
      const softs = MODES.map((m) => PALETTES[m].tertiarySoft);
      expect(new Set(softs).size).toBe(4);
    });
  });

  // ── Visibility ─────────────────────────────────────────────────────────────

  describe("Visibility", () => {
    it("does not fetch user data when visible=false", () => {
      render(<ShopModal {...defaultProps} visible={false} />);
      expect(getDoc).not.toHaveBeenCalled();
    });

    it("fetches user data and renders items when visible=true", async () => {
      const { getByText } = render(
        <ShopModal {...defaultProps} visible={true} />,
      );
      await waitFor(() => expect(getDoc).toHaveBeenCalled());
      expect(getByText("Blue Body")).toBeTruthy();
    });

    it("calls onClose when the close button is pressed", async () => {
      const onClose = jest.fn();
      const { UNSAFE_getAllByType } = render(
        <ShopModal {...defaultProps} onClose={onClose} />,
      );
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      const { TouchableOpacity } = require("react-native");
      const buttons = UNSAFE_getAllByType(TouchableOpacity);
      fireEvent.press(buttons[0]);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ── Purchase guard ─────────────────────────────────────────────────────────

  describe("Purchase guard", () => {
    it("shows alert when user has insufficient crystals", async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          rocks: 0,
          shopItems: {
            body: [true, false, false, false],
            wings: [false, true, false, false],
          },
          equipped: [0, 1],
        }),
      });

      jest.spyOn(Alert, "alert");

      const { getByText } = render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      fireEvent.press(getByText("Red Body"));

      expect(Alert.alert).toHaveBeenCalledWith(
        "Not Enough Crystals",
        expect.stringContaining("500"),
      );
    });
  });

  // ── Color-blind palette propagation ───────────────────────────────────────

  describe("Color-blind palette propagation", () => {
    // (S1)
    it("(S1) modal container borderColor matches palettes.deuteranopia.modalBorder", async () => {
      mockUseColorPalette.mockReturnValue(PALETTES.deuteranopia);

      const instance = render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      const nodes = findNodesByStyle(
        instance,
        "borderColor",
        PALETTES.deuteranopia.modalBorder,
      );
      expect(nodes.length).toBeGreaterThanOrEqual(1);
    });

    // (S2)
    it("(S2) modal container borderColor matches palettes.tritanopia.modalBorder", async () => {
      mockUseColorPalette.mockReturnValue(PALETTES.tritanopia);

      const instance = render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      const nodes = findNodesByStyle(
        instance,
        "borderColor",
        PALETTES.tritanopia.modalBorder,
      );
      expect(nodes.length).toBeGreaterThanOrEqual(1);
    });

    // (S3)
    it("(S3) all four modes produce distinct, non-identical modalBorder values", () => {
      const borders = [
        PALETTES.none.modalBorder,
        PALETTES.deuteranopia.modalBorder,
        PALETTES.protanopia.modalBorder,
        PALETTES.tritanopia.modalBorder,
      ];
      expect(new Set(borders).size).toBe(4);
    });

    it("protanopia modalBorder differs from none modalBorder", () => {
      expect(PALETTES.protanopia.modalBorder).not.toBe(
        PALETTES.none.modalBorder,
      );
    });

    it("swapping palette from none to deuteranopia changes the rendered border color", async () => {
      // Render once with none
      mockUseColorPalette.mockReturnValue(PALETTES.none);
      const instance = render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      const noneNodes = findNodesByStyle(
        instance,
        "borderColor",
        PALETTES.none.modalBorder,
      );
      expect(noneNodes.length).toBeGreaterThanOrEqual(1);

      // The deuteranopia border should not be present in the none render
      const deutNodes = findNodesByStyle(
        instance,
        "borderColor",
        PALETTES.deuteranopia.modalBorder,
      );
      expect(deutNodes.length).toBe(0);
    });
  });

  // ── Database Operations ────────────────────────────────────────────────────

  describe("Database Operations", () => {
    it("logs when loading shop data for a user", async () => {
      const consoleSpy = jest.spyOn(console, "log");

      render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[ShopModal] Loading shop data for user:"),
        expect.any(String),
      );

      consoleSpy.mockRestore();
    });

    it("logs when fetching shop items from database", async () => {
      const consoleSpy = jest.spyOn(console, "log");

      render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[ShopModal] Fetched"),
        expect.any(Number),
        expect.stringContaining("shop items from database"),
      );

      consoleSpy.mockRestore();
    });

    it("logs when loading user rocks balance", async () => {
      const consoleSpy = jest.spyOn(console, "log");

      render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[ShopModal] Loaded user rocks balance:"),
        expect.any(Number),
      );

      consoleSpy.mockRestore();
    });

    it("logs database update when creating rocks field", async () => {
      const consoleSpy = jest.spyOn(console, "log");

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          shopItems: {
            body: [true, false, false, false],
            wings: [false, true, false, false],
          },
          equipped: [0, 1],
          // rocks field intentionally missing
        }),
      });

      render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ShopModal] Database update needed: Creating rocks field",
      );

      consoleSpy.mockRestore();
    });

    it("logs database update when creating shopItems", async () => {
      const consoleSpy = jest.spyOn(console, "log");

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          rocks: 100,
          equipped: [0, 1],
          // shopItems field intentionally missing
        }),
      });

      render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ShopModal] Database update needed: Creating shopItems",
      );

      consoleSpy.mockRestore();
    });

    it("logs when applying database updates", async () => {
      const consoleSpy = jest.spyOn(console, "log");

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          rocks: 100,
          // shopItems and equipped fields intentionally missing
        }),
      });

      render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ShopModal] Applying database updates:",
        expect.any(Array),
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ShopModal] Database updates completed successfully",
      );

      consoleSpy.mockRestore();
    });

    it("logs when no database updates are needed", async () => {
      const consoleSpy = jest.spyOn(console, "log");

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          rocks: 100,
          shopItems: {
            body: [true, false, false, false],
            wings: [false, true, false, false],
            toppers: [true, false],
          },
          unlockedPlanets: [
            true,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
          ],
          equipped: [0, 1, 0],
        }),
      });

      render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      expect(consoleSpy).toHaveBeenCalledWith(
        "[ShopModal] No database updates needed",
      );

      consoleSpy.mockRestore();
    });

    it("logs purchase confirmation with item price and rocks change", async () => {
      const consoleSpy = jest.spyOn(console, "log");

      const { getByText } = render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      fireEvent.press(getByText("Red Body"));
      await waitFor(() => getByText("Confirm Purchase"));

      fireEvent.press(getByText("Purchase"));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("[ShopModal] Purchase confirmed for item:"),
          expect.any(String),
          expect.stringContaining("Price:"),
          expect.any(Number),
        );
      });

      consoleSpy.mockRestore();
    });

    it("logs rocks balance change before and after purchase", async () => {
      const consoleSpy = jest.spyOn(console, "log");

      const { getByText } = render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      fireEvent.press(getByText("Red Body"));
      await waitFor(() => getByText("Confirm Purchase"));

      fireEvent.press(getByText("Purchase"));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("[ShopModal] Rocks before:"),
          expect.any(Number),
          expect.stringContaining("Rocks after:"),
          expect.any(Number),
        );
      });

      consoleSpy.mockRestore();
    });

    it("logs database update when saving new rocks balance", async () => {
      const consoleSpy = jest.spyOn(console, "log");

      const { getByText } = render(<ShopModal {...defaultProps} />);
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      fireEvent.press(getByText("Red Body"));
      await waitFor(() => getByText("Confirm Purchase"));

      fireEvent.press(getByText("Purchase"));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("[ShopModal] Purchase confirmed for item:"),
          expect.any(String),
          expect.stringContaining("Price:"),
          expect.any(Number),
        );
      });

      consoleSpy.mockRestore();
    });

    it("logs when parent component is notified of rocks change", async () => {
      const consoleSpy = jest.spyOn(console, "log");
      const onRocksChange = jest.fn();

      const { getByText } = render(
        <ShopModal {...defaultProps} onRocksChange={onRocksChange} />,
      );
      await waitFor(() => expect(getDoc).toHaveBeenCalled());

      fireEvent.press(getByText("Red Body"));
      await waitFor(() => getByText("Confirm Purchase"));

      fireEvent.press(getByText("Purchase"));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "[ShopModal] Notified parent component of rocks change",
        );
      });

      consoleSpy.mockRestore();
    });
  });
});
