/**
 * Test Suite: PrivacyScreen
 *
 * This test suite covers the PrivacyScreen page including:
 * - Header rendering (back button, title from i18n)
 * - "Last updated" banner
 * - Intro paragraph
 * - All nine policy sections rendered with correct titles
 * - Back button navigation via router.back()
 * - MainButton "Back to Settings" navigation
 * - Palette integration via useColorPalette
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TouchableOpacity } from "react-native";
import PrivacyScreen from "../app/pages/PrivacyScreen";
import { router } from "expo-router";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("../app/styles/colorBlindThemes", () => ({
  useColorPalette: () => ({
    accent: "#8b5cf6",
    accentSoft: "rgba(139,92,246,0.3)",
    accentSoftBorder: "rgba(167,139,250,0.5)",
    tertiary: "#ec4899",
    rowBgPrimary: "rgba(59,130,246,0.2)",
    rowBorderPrimary: "rgba(59,130,246,0.3)",
    rowBgSecondary: "rgba(236,72,153,0.2)",
    rowBorderSecondary: "rgba(236,72,153,0.3)",
    divider: "rgba(139,92,246,0.3)",
  }),
}));

jest.mock("../TTS", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return { Text: (props: any) => React.createElement(Text, props) };
});

jest.mock("../app/components/MainButton", () => {
  const React = require("react");
  const { TouchableOpacity, Text } = require("react-native");
  return ({
    title,
    onPress,
  }: {
    title: string;
    onPress: () => void;
    variant?: string;
  }) =>
    React.createElement(
      TouchableOpacity,
      { onPress, testID: "main-button" },
      React.createElement(Text, null, title),
    );
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("PrivacyScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe("Rendering", () => {
    it("renders without crashing", () => {
      expect(() => render(<PrivacyScreen />)).not.toThrow();
    });

    it("renders the screen title from i18n key Settings.privacy", () => {
      const { getByText } = render(<PrivacyScreen />);
      expect(getByText("Settings.privacy")).toBeTruthy();
    });

    it("renders the last updated banner", () => {
      const { getByText } = render(<PrivacyScreen />);
      expect(getByText("Last updated: March 30, 2026")).toBeTruthy();
    });

    it("renders the introductory paragraph", () => {
      const { getByText } = render(<PrivacyScreen />);
      expect(
        getByText(/your privacy matters to us/i),
      ).toBeTruthy();
    });
  });

  // ── Policy sections ────────────────────────────────────────────────────────

  describe("Policy sections", () => {
    const sectionTitles = [
      "Information We Collect",
      "How We Use Your Information",
      "Information Sharing",
      "Data Security",
      "Children's Privacy",
      "Notifications",
      "Your Rights",
      "Changes to This Policy",
      "Contact Us",
    ];

    sectionTitles.forEach((title) => {
      it(`renders the "${title}" section`, () => {
        const { getByText } = render(<PrivacyScreen />);
        expect(getByText(title)).toBeTruthy();
      });
    });

    it("renders all 9 policy sections", () => {
      const { getAllByText } = render(<PrivacyScreen />);
      sectionTitles.forEach((title) => {
        expect(getAllByText(title).length).toBe(1);
      });
    });
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  describe("Navigation", () => {
    it("calls router.back() when header back button is pressed", () => {
      const { UNSAFE_getAllByType } = render(<PrivacyScreen />);
      // First TouchableOpacity in the tree is the header back chevron
      fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[0]);
      expect(router.back).toHaveBeenCalledTimes(1);
    });

    it("calls router.back() when MainButton 'Back to Settings' is pressed", () => {
      const { getByTestId } = render(<PrivacyScreen />);
      fireEvent.press(getByTestId("main-button"));
      expect(router.back).toHaveBeenCalled();
    });
  });

  // ── Palette integration ────────────────────────────────────────────────────

  describe("Palette integration", () => {
    it("renders without errors when palette values are provided", () => {
      expect(() => render(<PrivacyScreen />)).not.toThrow();
    });
  });
});
