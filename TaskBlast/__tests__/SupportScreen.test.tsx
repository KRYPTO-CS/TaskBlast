/**
 * Test Suite: SupportScreen
 *
 * This test suite covers the SupportScreen page including:
 * - Header rendering (back button, title)
 * - Intro banner text
 * - All nine FAQ items rendered with correct questions
 * - FAQ accordion expand/collapse toggle
 * - FAQ answer visibility after expanding
 * - Contact cards rendered (General Support, Privacy Enquiries)
 * - Back button navigation via router.back()
 * - MainButton navigation
 * - Palette integration via useColorPalette
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TouchableOpacity } from "react-native";
import SupportScreen from "../app/pages/SupportScreen";
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
    accentActiveBorder: "rgba(167,139,250,0.8)",
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

describe("SupportScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe("Rendering", () => {
    it("renders without crashing", () => {
      expect(() => render(<SupportScreen />)).not.toThrow();
    });

    it("renders the screen title from i18n key SupportScreen.title", () => {
      const { getByText } = render(<SupportScreen />);
      expect(getByText("SupportScreen.title")).toBeTruthy();
    });

    it("renders the intro banner text", () => {
      const { getByText } = render(<SupportScreen />);
      expect(getByText("SupportScreen.intro")).toBeTruthy();
    });

    it("renders the 'Frequently Asked Questions' section heading", () => {
      const { getByText } = render(<SupportScreen />);
      expect(getByText("SupportScreen.faqHeading")).toBeTruthy();
    });

    it("renders the 'Contact Us' section heading", () => {
      const { getByText } = render(<SupportScreen />);
      expect(getByText("SupportScreen.contactHeading")).toBeTruthy();
    });
  });

  // ── FAQ items ──────────────────────────────────────────────────────────────

  describe("FAQ items", () => {
    const faqQuestions = [
      "SupportScreen.faq.items.1.question",
      "SupportScreen.faq.items.2.question",
      "SupportScreen.faq.items.3.question",
      "SupportScreen.faq.items.4.question",
      "SupportScreen.faq.items.5.question",
      "SupportScreen.faq.items.6.question",
      "SupportScreen.faq.items.7.question",
      "SupportScreen.faq.items.8.question",
      "SupportScreen.faq.items.9.question",
    ];

    faqQuestions.forEach((question) => {
      it(`renders the FAQ question: "${question}"`, () => {
        const { getByText } = render(<SupportScreen />);
        expect(getByText(question)).toBeTruthy();
      });
    });

    it("renders all 9 FAQ questions", () => {
      const { getAllByText } = render(<SupportScreen />);
      faqQuestions.forEach((q) => {
        expect(getAllByText(q).length).toBe(1);
      });
    });
  });

  // ── FAQ accordion ──────────────────────────────────────────────────────────

  describe("FAQ accordion expand/collapse", () => {
    it("does not show answer text before the FAQ is expanded", () => {
      const { queryByText } = render(<SupportScreen />);
      expect(queryByText("SupportScreen.faq.items.1.answer")).toBeNull();
    });

    it("shows the answer after pressing a FAQ question", () => {
      const { getByText, queryByText } = render(<SupportScreen />);
      fireEvent.press(getByText("SupportScreen.faq.items.1.question"));
      expect(getByText("SupportScreen.faq.items.1.answer")).toBeTruthy();
    });

    it("hides the answer after pressing the same FAQ question twice", () => {
      const { getByText, queryByText } = render(<SupportScreen />);
      fireEvent.press(getByText("SupportScreen.faq.items.1.question"));
      fireEvent.press(getByText("SupportScreen.faq.items.1.question"));
      expect(queryByText("SupportScreen.faq.items.1.answer")).toBeNull();
    });

    it("shows the correct answer for a different FAQ", () => {
      const { getByText } = render(<SupportScreen />);
      fireEvent.press(getByText("SupportScreen.faq.items.2.question"));
      expect(getByText("SupportScreen.faq.items.2.answer")).toBeTruthy();
    });
  });

  // ── Contact cards ──────────────────────────────────────────────────────────

  describe("Contact cards", () => {
    it("renders the General Support contact card label", () => {
      const { getByText } = render(<SupportScreen />);
      expect(getByText("SupportScreen.contactCards.generalSupport")).toBeTruthy();
    });

    it("renders the Privacy Enquiries contact card label", () => {
      const { getByText } = render(<SupportScreen />);
      expect(getByText("SupportScreen.contactCards.privacyEnquiries")).toBeTruthy();
    });
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  describe("Navigation", () => {
    it("calls router.back() when the header back button is pressed", () => {
      const { UNSAFE_getAllByType } = render(<SupportScreen />);
      // First TouchableOpacity in the tree is the header back chevron
      fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[0]);
      expect(router.back).toHaveBeenCalledTimes(1);
    });

    it("calls router.back() when the MainButton is pressed", () => {
      const { getByTestId } = render(<SupportScreen />);
      fireEvent.press(getByTestId("main-button"));
      expect(router.back).toHaveBeenCalled();
    });
  });

  // ── Palette integration ────────────────────────────────────────────────────

  describe("Palette integration", () => {
    it("renders without errors when palette values are provided", () => {
      expect(() => render(<SupportScreen />)).not.toThrow();
    });
  });
});
