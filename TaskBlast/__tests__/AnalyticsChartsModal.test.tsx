/**
 * Test Suite: AnalyticsChartsModal
 *
 * This test suite covers the AnalyticsChartsModal component including:
 * - Modal visibility (visible / hidden)
 * - Header rendering and close button behaviour
 * - WebView rendering when data is present
 * - Empty-state placeholders when arrays are empty
 * - Correct chart sections rendered (rocks, work time, play time)
 * - Palette integration via useColorPalette
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { TouchableOpacity } from "react-native";
import AnalyticsChartsModal from "../app/components/AnalyticsChartsModal";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("../app/styles/colorBlindThemes", () => ({
  useColorPalette: () => ({
    statsAccent: "#8b5cf6",
    statsAccentGlow: "rgba(139,92,246,0.8)",
    statsChartBorder: "rgba(139,92,246,0.4)",
    statsChartFill: "rgba(139,92,246,0.3)",
    statsBg: "rgba(139,92,246,0.1)",
    statsBgBorder: "rgba(139,92,246,0.3)",
    secondaryLightBorder: "rgba(255,255,255,0.2)",
  }),
}));

jest.mock("../TTS", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return { Text: (props: any) => React.createElement(Text, props) };
});

// WebView is already mocked globally in jest.setup.js

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  statsLabels: ["Jan 1", "Jan 2", "Jan 3"],
  statsValues: [100, 200, 150],
  workLabels: ["Jan 1", "Jan 2"],
  workTimes: [25, 50],
  playLabels: ["Jan 1", "Jan 2"],
  playTimes: [5, 10],
};

const emptyProps = {
  visible: true,
  onClose: jest.fn(),
  statsLabels: [],
  statsValues: [],
  workLabels: [],
  workTimes: [],
  playLabels: [],
  playTimes: [],
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AnalyticsChartsModal", () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  describe("Rendering", () => {
    it("renders when visible is true", () => {
      const { getByText } = render(<AnalyticsChartsModal {...defaultProps} />);
      expect(getByText("Analytics Charts")).toBeTruthy();
    });

    it("does not render content when visible is false", () => {
      const { queryByText } = render(
        <AnalyticsChartsModal {...defaultProps} visible={false} />,
      );
      expect(queryByText("Analytics Charts")).toBeNull();
    });

    it("renders a close button", () => {
      const { UNSAFE_getAllByType } = render(<AnalyticsChartsModal {...defaultProps} />);
      // TouchableOpacity wrapping the close icon
      const buttons = UNSAFE_getAllByType(TouchableOpacity);
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Close behaviour ────────────────────────────────────────────────────────

  describe("Close button", () => {
    it("calls onClose when the close button is pressed", () => {
      const onClose = jest.fn();
      const { UNSAFE_getAllByType } = render(
        <AnalyticsChartsModal {...defaultProps} onClose={onClose} />,
      );
      fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[0]);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ── WebView charts (data present) ──────────────────────────────────────────

  describe("Chart WebViews with data", () => {
    it("renders three WebView elements when all data arrays are non-empty", () => {
      const { getAllByTestId } = render(
        <AnalyticsChartsModal {...defaultProps} />,
      );
      const webviews = getAllByTestId("webview");
      expect(webviews.length).toBe(3);
    });

    it("renders a rocks chart WebView when statsValues is non-empty", () => {
      const { getAllByTestId } = render(
        <AnalyticsChartsModal {...defaultProps} />,
      );
      expect(getAllByTestId("webview").length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Empty state placeholders ───────────────────────────────────────────────

  describe("Empty-state placeholders", () => {
    it("shows 'No rock stats yet.' when statsValues is empty", () => {
      const { getByText } = render(
        <AnalyticsChartsModal {...emptyProps} />,
      );
      expect(getByText("No rock stats yet.")).toBeTruthy();
    });

    it("shows 'No work sessions yet.' when workTimes is empty", () => {
      const { getByText } = render(
        <AnalyticsChartsModal {...emptyProps} />,
      );
      expect(getByText("No work sessions yet.")).toBeTruthy();
    });

    it("shows 'No play sessions yet.' when playTimes is empty", () => {
      const { getByText } = render(
        <AnalyticsChartsModal {...emptyProps} />,
      );
      expect(getByText("No play sessions yet.")).toBeTruthy();
    });

    it("shows all three placeholders simultaneously when all arrays are empty", () => {
      const { getByText } = render(
        <AnalyticsChartsModal {...emptyProps} />,
      );
      expect(getByText("No rock stats yet.")).toBeTruthy();
      expect(getByText("No work sessions yet.")).toBeTruthy();
      expect(getByText("No play sessions yet.")).toBeTruthy();
    });

    it("shows no WebViews when all data arrays are empty", () => {
      const { queryAllByTestId } = render(
        <AnalyticsChartsModal {...emptyProps} />,
      );
      expect(queryAllByTestId("webview").length).toBe(0);
    });
  });

  // ── Mixed data ─────────────────────────────────────────────────────────────

  describe("Mixed data states", () => {
    it("shows WebView for rocks but placeholder for work and play when only statsValues is set", () => {
      const { getAllByTestId, getByText } = render(
        <AnalyticsChartsModal
          {...emptyProps}
          statsLabels={["Jan 1"]}
          statsValues={[50]}
        />,
      );
      expect(getAllByTestId("webview").length).toBe(1);
      expect(getByText("No work sessions yet.")).toBeTruthy();
      expect(getByText("No play sessions yet.")).toBeTruthy();
    });
  });

  // ── Palette integration ────────────────────────────────────────────────────

  describe("Palette integration", () => {
    it("renders without errors when useColorPalette returns a full palette", () => {
      expect(() =>
        render(<AnalyticsChartsModal {...defaultProps} />),
      ).not.toThrow();
    });
  });
});
