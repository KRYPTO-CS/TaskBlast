/**
 * Test Suite: AboutUsScreen
 *
 * This test suite covers the AboutUsScreen page including:
 * - Header rendering (back button, icon, title)
 * - All seven about sections rendered with correct titles
 * - Hero card content ("TaskBlast", tagline)
 * - Back button navigation via router.back()
 * - Palette integration via useColorPalette
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TouchableOpacity } from "react-native";
import AboutUsScreen from "../app/pages/AboutUsScreen";
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

describe("AboutUsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe("Rendering", () => {
    it("renders without crashing", () => {
      expect(() => render(<AboutUsScreen />)).not.toThrow();
    });

    it("renders the screen title from i18n key AboutScreen.title", () => {
      const { getByText } = render(<AboutUsScreen />);
      // t() in test returns the key itself
      expect(getByText("AboutScreen.title")).toBeTruthy();
    });

    it("renders the hero card with TaskBlast brand name", () => {
      const { getByText } = render(<AboutUsScreen />);
      expect(getByText("TaskBlast")).toBeTruthy();
    });

    it("renders the hero tagline", () => {
      const { getByText } = render(<AboutUsScreen />);
      expect(getByText("AboutScreen.tagline")).toBeTruthy();
    });
  });

  // ── About sections ─────────────────────────────────────────────────────────

  describe("About sections", () => {
    const sectionTitles = [
      "AboutScreen.sections.mission.title",
      "AboutScreen.sections.howItWorks.title",
      "AboutScreen.sections.forEveryone.title",
      "AboutScreen.sections.accessibility.title",
      "AboutScreen.sections.languages.title",
      "AboutScreen.sections.privacy.title",
      "AboutScreen.sections.credits.title",
      "AboutScreen.sections.version.title",
    ];

    sectionTitles.forEach((title) => {
      it(`renders the "${title}" section`, () => {
        const { getByText } = render(<AboutUsScreen />);
        expect(getByText(title)).toBeTruthy();
      });
    });

    it("renders all 7 about sections", () => {
      const { getAllByText } = render(<AboutUsScreen />);
      // Each section title appears exactly once
      sectionTitles.forEach((title) => {
        expect(getAllByText(title).length).toBe(1);
      });
    });
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  describe("Navigation", () => {
    it("calls router.back() when the header back button is pressed", () => {
      const { UNSAFE_getAllByType } = render(<AboutUsScreen />);
      // First TouchableOpacity in the tree is the header back chevron
      fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[0]);
      expect(router.back).toHaveBeenCalledTimes(1);
    });

    it("calls router.back() when the back MainButton is pressed", () => {
      const { getByTestId } = render(<AboutUsScreen />);
      fireEvent.press(getByTestId("main-button"));
      expect(router.back).toHaveBeenCalled();
    });
  });

  // ── Palette ────────────────────────────────────────────────────────────────

  describe("Palette integration", () => {
    it("renders without errors when palette values are provided", () => {
      expect(() => render(<AboutUsScreen />)).not.toThrow();
    });
  });
});
