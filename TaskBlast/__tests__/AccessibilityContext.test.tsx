/**
 * Test Suite: AccessibilityContext
 *
 * Tests the AccessibilityProvider lifecycle and persistence using the REAL
 * provider with the globally mocked AsyncStorage (wired in jest.setup.js).
 *
 * Covers:
 *  - Default values on first mount (no stored data)
 *  - Loading / isLoading flag lifecycle
 *  - textScale derived values for all three TextSize variants
 *  - Guard: useAccessibility() throws outside provider
 *  - Persistence: saved mode restores on mount
 *  - Persistence: partial stored object merges with defaults
 *  - Persistence: setColorBlindMode / setHighContrast write to AsyncStorage
 *  - Persistence: invalid JSON in AsyncStorage falls back gracefully
 *  - Optimistic state update after setter call
 */

import React from "react";
import { Text } from "react-native";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AccessibilityProvider,
  useAccessibility,
} from "../app/context/AccessibilityContext";

// ─── Mock i18n ────────────────────────────────────────────────────────────────
// AccessibilityContext imports the i18n singleton directly to call
// changeLanguage(). We replace it with a jest.fn()-backed stub.

jest.mock("../app/i18next", () => ({
  language: "en",
  changeLanguage: jest.fn().mockResolvedValue(undefined),
}));

// ─── Consumer components ──────────────────────────────────────────────────────

/** Reads context state and exposes it via testID text nodes. */
function Consumer() {
  const ctx = useAccessibility();
  return (
    <>
      <Text testID="mode-output">{ctx.colorBlindMode}</Text>
      <Text testID="contrast-output">{String(ctx.highContrast)}</Text>
      <Text testID="loading-output">{String(ctx.isLoading)}</Text>
      <Text testID="text-size-output">{ctx.textSize}</Text>
      <Text testID="text-scale-output">{String(ctx.textScale)}</Text>
      <Text testID="reduce-motion-output">{String(ctx.reduceMotion)}</Text>
      <Text testID="tts-output">{String(ctx.ttsEnabled)}</Text>
    </>
  );
}

/** Exposes interactive setters via pressable text nodes. */
function InteractiveConsumer() {
  const ctx = useAccessibility();
  return (
    <>
      <Text testID="mode-output">{ctx.colorBlindMode}</Text>
      <Text testID="contrast-output">{String(ctx.highContrast)}</Text>
      <Text
        testID="set-deuteranopia"
        onPress={() => ctx.setColorBlindMode("deuteranopia")}
      >
        set-deuteranopia
      </Text>
      <Text
        testID="set-protanopia"
        onPress={() => ctx.setColorBlindMode("protanopia")}
      >
        set-protanopia
      </Text>
      <Text
        testID="set-tritanopia"
        onPress={() => ctx.setColorBlindMode("tritanopia")}
      >
        set-tritanopia
      </Text>
      <Text testID="set-none" onPress={() => ctx.setColorBlindMode("none")}>
        set-none
      </Text>
      <Text testID="set-language-pt" onPress={() => ctx.setLanguage("pt")}>
        set-language-pt
      </Text>
      <Text
        testID="set-high-contrast"
        onPress={() => ctx.setHighContrast(true)}
      >
        set-high-contrast
      </Text>
      <Text
        testID="clear-high-contrast"
        onPress={() => ctx.setHighContrast(false)}
      >
        clear-high-contrast
      </Text>
    </>
  );
}

/** Wraps children in the real AccessibilityProvider. */
function Wrapper({ children }: { children: React.ReactNode }) {
  return <AccessibilityProvider>{children}</AccessibilityProvider>;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "@taskblast_accessibility_settings";

describe("AccessibilityContext – defaults and loading", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it("(C1) colorBlindMode defaults to 'none' when no stored settings", async () => {
    const { getByTestId } = render(<Consumer />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(getByTestId("loading-output").props.children).toBe("false"),
    );
    expect(getByTestId("mode-output").props.children).toBe("none");
  });

  it("(C2) highContrast defaults to false when no stored settings", async () => {
    const { getByTestId } = render(<Consumer />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(getByTestId("loading-output").props.children).toBe("false"),
    );
    expect(getByTestId("contrast-output").props.children).toBe("false");
  });

  it("(C3) isLoading transitions to false after settings resolve", async () => {
    const { getByTestId } = render(<Consumer />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(getByTestId("loading-output").props.children).toBe("false"),
    );
  });

  it("reduceMotion defaults to false", async () => {
    const { getByTestId } = render(<Consumer />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(getByTestId("loading-output").props.children).toBe("false"),
    );
    expect(getByTestId("reduce-motion-output").props.children).toBe("false");
  });

  it("ttsEnabled defaults to false", async () => {
    const { getByTestId } = render(<Consumer />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(getByTestId("loading-output").props.children).toBe("false"),
    );
    expect(getByTestId("tts-output").props.children).toBe("false");
  });

  it("(C4) textScale is 1 when textSize is 'medium' (default)", async () => {
    const { getByTestId } = render(<Consumer />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(getByTestId("loading-output").props.children).toBe("false"),
    );
    expect(getByTestId("text-scale-output").props.children).toBe("1");
  });

  it("(C5) textScale is 0.85 when textSize is 'small'", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ textSize: "small" }),
    );
    const { getByTestId } = render(<Consumer />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(getByTestId("text-scale-output").props.children).toBe("0.85"),
    );
  });

  it("(C5) textScale is 1.2 when textSize is 'large'", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ textSize: "large" }),
    );
    const { getByTestId } = render(<Consumer />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(getByTestId("text-scale-output").props.children).toBe("1.2"),
    );
  });

  it("(C6) useAccessibility throws when used outside AccessibilityProvider", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow(
      "useAccessibility must be used within an AccessibilityProvider",
    );
    spy.mockRestore();
  });
});

describe("AccessibilityContext – persistence (full provider render)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it("(P1) restores saved colorBlindMode 'protanopia' from AsyncStorage on mount", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ colorBlindMode: "protanopia" }),
    );
    const { getByTestId } = render(<Consumer />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(getByTestId("mode-output").props.children).toBe("protanopia"),
    );
  });

  it("restores saved colorBlindMode 'deuteranopia' from AsyncStorage on mount", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ colorBlindMode: "deuteranopia" }),
    );
    const { getByTestId } = render(<Consumer />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(getByTestId("mode-output").props.children).toBe("deuteranopia"),
    );
  });

  it("restores saved colorBlindMode 'tritanopia' from AsyncStorage on mount", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ colorBlindMode: "tritanopia" }),
    );
    const { getByTestId } = render(<Consumer />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(getByTestId("mode-output").props.children).toBe("tritanopia"),
    );
  });

  it("restores highContrast: true from AsyncStorage on mount", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ highContrast: true }),
    );
    const { getByTestId } = render(<Consumer />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(getByTestId("contrast-output").props.children).toBe("true"),
    );
  });

  it("(P2) partial stored object merges with defaults – highContrast stays false", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ colorBlindMode: "tritanopia" }),
    );
    const { getByTestId } = render(<Consumer />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(getByTestId("mode-output").props.children).toBe("tritanopia"),
    );
    expect(getByTestId("contrast-output").props.children).toBe("false");
  });

  it("restores saved language by calling i18n.changeLanguage when language differs", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ language: "es" }),
    );

    const i18nModule = require("../app/i18next");
    i18nModule.language = "en";

    render(<Consumer />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(i18nModule.changeLanguage).toHaveBeenCalledWith("es"),
    );
  });

  it("does not call i18n.changeLanguage when saved language matches current", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ language: "en" }),
    );

    const i18nModule = require("../app/i18next");
    i18nModule.language = "en";

    render(<Consumer />, { wrapper: Wrapper });

    await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalled());
    expect(i18nModule.changeLanguage).not.toHaveBeenCalledWith("en");
  });

  it("partial stored object merges with defaults – reduceMotion stays false", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ colorBlindMode: "deuteranopia" }),
    );
    const { getByTestId } = render(<Consumer />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(getByTestId("mode-output").props.children).toBe("deuteranopia"),
    );
    expect(getByTestId("reduce-motion-output").props.children).toBe("false");
  });

  it("(P3) setColorBlindMode('deuteranopia') writes correct JSON to AsyncStorage", async () => {
    const { getByTestId } = render(<InteractiveConsumer />, {
      wrapper: Wrapper,
    });
    await waitFor(() =>
      expect(getByTestId("mode-output").props.children).toBe("none"),
    );

    await act(async () => {
      fireEvent.press(getByTestId("set-deuteranopia"));
    });

    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('"colorBlindMode":"deuteranopia"'),
      ),
    );
  });

  it("setColorBlindMode('tritanopia') writes correct JSON to AsyncStorage", async () => {
    const { getByTestId } = render(<InteractiveConsumer />, {
      wrapper: Wrapper,
    });
    await waitFor(() =>
      expect(getByTestId("mode-output").props.children).toBe("none"),
    );

    await act(async () => {
      fireEvent.press(getByTestId("set-tritanopia"));
    });

    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('"colorBlindMode":"tritanopia"'),
      ),
    );
  });

  it("(P4) setHighContrast(true) writes correct JSON to AsyncStorage", async () => {
    const { getByTestId } = render(<InteractiveConsumer />, {
      wrapper: Wrapper,
    });
    await waitFor(() =>
      expect(getByTestId("mode-output").props.children).toBe("none"),
    );

    await act(async () => {
      fireEvent.press(getByTestId("set-high-contrast"));
    });

    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('"highContrast":true'),
      ),
    );
  });

  it("setHighContrast(false) writes correct JSON to AsyncStorage", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ highContrast: true }),
    );
    const { getByTestId } = render(<InteractiveConsumer />, {
      wrapper: Wrapper,
    });
    await waitFor(() =>
      expect(getByTestId("contrast-output").props.children).toBe("true"),
    );

    await act(async () => {
      fireEvent.press(getByTestId("clear-high-contrast"));
    });

    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('"highContrast":false'),
      ),
    );
  });

  it("(P5) invalid JSON in AsyncStorage falls back to defaults without crashing", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("not-json{{{");
    const { getByTestId } = render(<Consumer />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(getByTestId("loading-output").props.children).toBe("false"),
    );
    expect(getByTestId("mode-output").props.children).toBe("none");
    expect(getByTestId("contrast-output").props.children).toBe("false");
  });

  it("setColorBlindMode updates in-tree state immediately (optimistic update)", async () => {
    const { getByTestId } = render(<InteractiveConsumer />, {
      wrapper: Wrapper,
    });
    await waitFor(() =>
      expect(getByTestId("mode-output").props.children).toBe("none"),
    );

    await act(async () => {
      fireEvent.press(getByTestId("set-deuteranopia"));
    });

    await waitFor(() =>
      expect(getByTestId("mode-output").props.children).toBe("deuteranopia"),
    );
  });

  it("consecutive setColorBlindMode calls reflect latest value", async () => {
    const { getByTestId } = render(<InteractiveConsumer />, {
      wrapper: Wrapper,
    });
    await waitFor(() =>
      expect(getByTestId("mode-output").props.children).toBe("none"),
    );

    await act(async () => {
      fireEvent.press(getByTestId("set-deuteranopia"));
    });
    await act(async () => {
      fireEvent.press(getByTestId("set-tritanopia"));
    });

    await waitFor(() =>
      expect(getByTestId("mode-output").props.children).toBe("tritanopia"),
    );
  });

  it("restore followed by setter still writes to AsyncStorage correctly", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ colorBlindMode: "protanopia" }),
    );
    const { getByTestId } = render(<InteractiveConsumer />, {
      wrapper: Wrapper,
    });
    await waitFor(() =>
      expect(getByTestId("mode-output").props.children).toBe("protanopia"),
    );

    await act(async () => {
      fireEvent.press(getByTestId("set-none"));
    });

    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('"colorBlindMode":"none"'),
      ),
    );
  });

  it("setLanguage persists language and calls i18n.changeLanguage", async () => {
    const i18nModule = require("../app/i18next");

    const { getByTestId } = render(<InteractiveConsumer />, {
      wrapper: Wrapper,
    });

    await act(async () => {
      fireEvent.press(getByTestId("set-language-pt"));
    });

    await waitFor(() => {
      expect(i18nModule.changeLanguage).toHaveBeenCalledWith("pt");
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.stringContaining('"language":"pt"'),
      );
    });
  });
});
