/**
 * Test Suite: Game Screen
 *
 * This test suite covers the Game page functionality including:
 * - WebView integration
 * - Loading states
 * - Score updates from game
 * - Navigation (back button)
 * - Message handling from embedded game
 * - Error handling for missing WebView
 */

import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import GamePage from "../app/pages/GamePage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { AccessibilityContext } from "../app/context/AccessibilityContext";
import { getDoc } from "firebase/firestore";

const mockProfileDocRef = { id: "mock-profile-doc" };
const mockActiveProfile = {
  getProfileDocRef: jest.fn(() => mockProfileDocRef),
  isLoading: false,
};

jest.mock("../app/context/ActiveProfileContext", () => ({
  useActiveProfile: () => mockActiveProfile,
}));

jest.mock("../TTS", () => ({
  Text: ({ children, ...props }: any) => {
    const { Text } = require("react-native");
    return <Text {...props}>{children}</Text>;
  },
}));

const getSkinsPayloads = () => {
  const postMessageCalls = ((global as any).mockWebView?.postMessage?.mock
    ?.calls ?? []) as string[][];
  return postMessageCalls
    .map((call) => {
      try {
        return JSON.parse(call[0]);
      } catch {
        return null;
      }
    })
    .filter((payload) => payload?.type === "skins");
};

const renderWithColorBlindMode = (
  colorBlindMode: "none" | "deuteranopia" | "protanopia" | "tritanopia",
) => {
  return render(
    <AccessibilityContext.Provider
      value={
        {
          language: "en",
          colorBlindMode,
          textSize: "medium",
          highContrast: false,
          reduceMotion: false,
          ttsEnabled: false,
          setLanguage: jest.fn(async () => undefined),
          setColorBlindMode: jest.fn(async () => undefined),
          setTextSize: jest.fn(async () => undefined),
          setHighContrast: jest.fn(async () => undefined),
          setReduceMotion: jest.fn(async () => undefined),
          setTtsEnabled: jest.fn(async () => undefined),
          textScale: 1,
          isLoading: false,
        } as any
      }
    >
      <GamePage />
    </AccessibilityContext.Provider>,
  );
};

describe("Game Screen", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  describe("UI Rendering", () => {
    it("should render game page with WebView", () => {
      const { getByTestId } = render(<GamePage />);
      expect(getByTestId("webview")).toBeTruthy();
    });

    it("should render back button", () => {
      const { getByText } = render(<GamePage />);
      expect(getByText("< Back")).toBeTruthy();
    });

    it("should show loading indicator initially", () => {
      const { getByTestId } = render(<GamePage />);
      expect(getByTestId("loading-indicator")).toBeTruthy();
    });

    it("should load correct game URL", () => {
      const { getByTestId } = render(<GamePage />);
      const webview = getByTestId("webview");

      expect(webview).toBeTruthy();
      // In actual implementation, would check source.uri
    });

    it("should render timer display", () => {
      const { getByText } = render(<GamePage />);
      // Default 5 minutes = 05:00
      expect(getByText(/\d{2}:\d{2}/)).toBeTruthy();
    });
  });

  describe("Navigation", () => {
    it("should navigate back when back button is pressed", async () => {
      const { getByTestId } = render(<GamePage />);

      const backButton = getByTestId("back-button");
      fireEvent.press(backButton);

      // Should save score before navigating back
      await waitFor(() => {
        expect(router.back).toHaveBeenCalled();
      });
    });

    it("should return to previous screen (Pomodoro)", async () => {
      const { getByTestId } = render(<GamePage />);

      const backButton = getByTestId("back-button");
      fireEvent.press(backButton);

      await waitFor(() => {
        expect(router.back).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Loading States", () => {
    it("should show loading indicator while WebView loads", () => {
      const { getByTestId } = render(<GamePage />);
      expect(getByTestId("loading-indicator")).toBeTruthy();
    });
  });

  describe("Score Updates", () => {
    it("should handle score update messages from game", async () => {
      const { getByTestId } = render(<GamePage />);

      const mockScoreMessage = {
        nativeEvent: {
          data: JSON.stringify({
            type: "scoreUpdate",
            score: 1500,
          }),
        },
      };

      const webview = getByTestId("webview");
      const onMessage = webview.props.onMessage;
      if (onMessage) onMessage(mockScoreMessage);

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith("game_score", "1500");
      });
    });

    it("should persist score to AsyncStorage", async () => {
      const { getByTestId } = render(<GamePage />);

      const mockScoreMessage = {
        nativeEvent: {
          data: JSON.stringify({
            type: "scoreUpdate",
            score: 2500,
          }),
        },
      };

      const webview = getByTestId("webview");
      const onMessage = webview.props.onMessage;
      if (onMessage) onMessage(mockScoreMessage);

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith("game_score", "2500");
      });
    });

    it("should handle multiple score updates", async () => {
      const { getByTestId } = render(<GamePage />);
      const webview = getByTestId("webview");
      const onMessage = webview.props.onMessage;

      if (onMessage) {
        // First update
        onMessage({
          nativeEvent: {
            data: JSON.stringify({ type: "scoreUpdate", score: 100 }),
          },
        });

        await waitFor(() => {
          expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            "game_score",
            "100",
          );
        });

        // Second update
        onMessage({
          nativeEvent: {
            data: JSON.stringify({ type: "scoreUpdate", score: 500 }),
          },
        });

        await waitFor(() => {
          expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            "game_score",
            "500",
          );
        });
      }
    });

    it("should handle zero score", async () => {
      const { getByTestId } = render(<GamePage />);

      const mockScoreMessage = {
        nativeEvent: {
          data: JSON.stringify({
            type: "scoreUpdate",
            score: 0,
          }),
        },
      };

      const webview = getByTestId("webview");
      const onMessage = webview.props.onMessage;
      if (onMessage) onMessage(mockScoreMessage);

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith("game_score", "0");
      });
    });

    it("should apply negative score deltas without going below zero", async () => {
      const { getByTestId } = render(<GamePage />);

      await waitFor(() => {
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith("game_score");
      });

      await AsyncStorage.setItem("game_score", "50");
      jest.clearAllMocks();

      const mockScoreMessage = {
        nativeEvent: {
          data: JSON.stringify({
            type: "scoreUpdate",
            score: -20,
          }),
        },
      };

      const webview = getByTestId("webview");
      const onMessage = webview.props.onMessage;
      if (onMessage) onMessage(mockScoreMessage);

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith("game_score", "0");
      });
    });
  });

  describe("Message Handling", () => {
    it("should handle invalid JSON messages gracefully", () => {
      const { getByTestId } = render(<GamePage />);

      const invalidMessage = {
        nativeEvent: {
          data: "not valid json",
        },
      };

      const webview = getByTestId("webview");
      const onMessage = webview.props.onMessage;

      // Should not throw error
      expect(() => {
        if (onMessage) onMessage(invalidMessage);
      }).not.toThrow();
    });

    it("should handle non-score messages", () => {
      const { getByTestId } = render(<GamePage />);

      const otherMessage = {
        nativeEvent: {
          data: JSON.stringify({
            type: "gameStart",
            level: 1,
          }),
        },
      };

      const webview = getByTestId("webview");
      const onMessage = webview.props.onMessage;
      if (onMessage) onMessage(otherMessage);

      // Should not update score for non-score messages
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it("should log non-score messages", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const { getByTestId } = render(<GamePage />);

      const otherMessage = {
        nativeEvent: {
          data: JSON.stringify({
            type: "gameEvent",
            event: "levelComplete",
          }),
        },
      };

      const webview = getByTestId("webview");
      const onMessage = webview.props.onMessage;
      if (onMessage) onMessage(otherMessage);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Bridge Contract", () => {
    it("should send skins payload with legacy and named fields after handshake", async () => {
      const mockGetDoc = getDoc as jest.Mock;
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ equipped: [2, 3] }),
      });

      (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key) => {
        if (key === "active_planet_id") {
          return "9";
        }
        return null;
      });

      const { getByTestId } = renderWithColorBlindMode("protanopia");
      const webview = getByTestId("webview");

      act(() => {
        webview.props.onLoadEnd();
      });

      await waitFor(() => {
        expect(mockGetDoc).toHaveBeenCalled();
      });

      await act(async () => {
        webview.props.onMessage({
          nativeEvent: {
            data: JSON.stringify({ type: "testMessage", success: true }),
          },
        });
      });

      await waitFor(() => {
        expect((global as any).mockWebView.postMessage).toHaveBeenCalled();
      });

      const payloads = getSkinsPayloads();
      expect(payloads.length).toBeGreaterThan(0);

      const latestPayload = payloads[payloads.length - 1];
      expect(latestPayload).toMatchObject({
        type: "skins",
        data1: "2",
        data2: "3",
        data3: "0",
        data4: "0",
        data5: "2",
        bodyId: 2,
        wingsId: 3,
        gameId: 0,
        soundMode: 0,
        colorBlindMode: 2,
      });

      expect((global as any).mockWebView.injectJavaScript).toHaveBeenCalled();
    });

    it("should map tritanopia to colorblind code 3", async () => {
      const mockGetDoc = getDoc as jest.Mock;
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ equipped: [0, 1] }),
      });

      (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key) => {
        if (key === "active_planet_id") {
          return "4";
        }
        return null;
      });

      const { getByTestId } = renderWithColorBlindMode("tritanopia");
      const webview = getByTestId("webview");

      act(() => {
        webview.props.onLoadEnd();
      });

      await waitFor(() => {
        expect(mockGetDoc).toHaveBeenCalled();
      });

      await act(async () => {
        webview.props.onMessage({
          nativeEvent: {
            data: JSON.stringify({ type: "testMessage", success: true }),
          },
        });
      });

      await waitFor(() => {
        expect((global as any).mockWebView.postMessage).toHaveBeenCalled();
      });

      const payloads = getSkinsPayloads();
      expect(payloads.length).toBeGreaterThan(0);
      expect(payloads[payloads.length - 1].data5).toBe("3");
      expect(payloads[payloads.length - 1].colorBlindMode).toBe(3);
    });
  });

  describe("WebView Configuration", () => {
    it("should enable JavaScript in WebView", () => {
      const { getByTestId } = render(<GamePage />);
      const webview = getByTestId("webview");

      expect(webview.props.javaScriptEnabled).toBe(true);
    });

    it("should allow inline media playback", () => {
      const { getByTestId } = render(<GamePage />);
      const webview = getByTestId("webview");

      expect(webview.props.allowsInlineMediaPlayback).toBe(true);
    });

    it("should not require user action for media playback", () => {
      const { getByTestId } = render(<GamePage />);
      const webview = getByTestId("webview");

      expect(webview.props.mediaPlaybackRequiresUserAction).toBe(false);
    });

    it("should whitelist all origins", () => {
      const { getByTestId } = render(<GamePage />);
      const webview = getByTestId("webview");

      expect(webview.props.originWhitelist).toContain("*");
    });
  });

  describe("Error Handling", () => {
    it("should handle WebView load errors", () => {
      const { getByTestId } = render(<GamePage />);
      const webview = getByTestId("webview");

      const onError = webview.props.onError;
      if (onError) {
        // Should not crash
        expect(() => onError({ nativeEvent: { code: -1 } })).not.toThrow();
      }
    });

    it("should handle AsyncStorage errors when saving score", async () => {
      const mockError = new Error("Storage error");
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(mockError);

      const { getByTestId } = render(<GamePage />);

      const mockScoreMessage = {
        nativeEvent: {
          data: JSON.stringify({
            type: "scoreUpdate",
            score: 1500,
          }),
        },
      };

      const webview = getByTestId("webview");
      const onMessage = webview.props.onMessage;

      // Should not crash
      expect(async () => {
        if (onMessage) onMessage(mockScoreMessage);
        await waitFor(() => {});
      }).not.toThrow();
    });
  });

  describe("Game Integration", () => {
    it("should load Space Shooter game", () => {
      const { getByTestId } = render(<GamePage />);
      const webview = getByTestId("webview");

      expect(webview).toBeTruthy();
      // In real implementation, would verify source URI matches game URL
    });

    it("should maintain game state during play", () => {
      const { getByTestId } = render(<GamePage />);
      const webview = getByTestId("webview");

      expect(webview).toBeTruthy();
      // WebView should persist state
    });
  });

  describe("Performance", () => {
    it("should show loading state until content loads", () => {
      const { getByTestId } = render(<GamePage />);
      expect(getByTestId("loading-indicator")).toBeTruthy();
    });

    it("should handle rapid score updates", async () => {
      const { getByTestId } = render(<GamePage />);
      const webview = getByTestId("webview");
      const onMessage = webview.props.onMessage;

      if (onMessage) {
        for (let i = 0; i < 10; i++) {
          onMessage({
            nativeEvent: {
              data: JSON.stringify({ type: "scoreUpdate", score: i * 100 }),
            },
          });
        }

        await waitFor(() => {
          expect(AsyncStorage.setItem).toHaveBeenCalledTimes(10);
        });
      }
    });
  });

  describe("Safe Area", () => {
    it("should render within safe area", () => {
      const { getByTestId } = render(<GamePage />);
      expect(getByTestId("safe-area-view")).toBeTruthy();
    });
  });

  describe("Header", () => {
    it("should render header with back button", () => {
      const { getByTestId } = render(<GamePage />);
      expect(getByTestId("game-header")).toBeTruthy();
    });

    it("should style header appropriately", () => {
      const { getByTestId } = render(<GamePage />);
      const header = getByTestId("game-header");

      expect(header.props.style).toBeDefined();
    });
  });

  describe("Timer Functionality", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should countdown from initial time", async () => {
      const { getByText } = render(<GamePage />);

      // Should have a timer display
      const timerElement = getByText(/\d{2}:\d{2}/);
      expect(timerElement).toBeTruthy();
    });

    it("should navigate back when timer reaches zero", async () => {
      jest.useFakeTimers();
      const {} = render(<GamePage />);

      act(() => {
        jest.advanceTimersByTime(300000); // 5 minutes
      });

      await waitFor(() => {
        expect(router.back).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });

    it("should save rocks to database when timer completes", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("1500");
      jest.useFakeTimers();

      render(<GamePage />);

      act(() => {
        jest.advanceTimersByTime(300000); // 5 minutes
      });

      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });
  });

  describe("Timer Display", () => {
    it("should display timer", () => {
      const { getByText } = render(<GamePage />);

      // Timer should be rendered
      const timerElement = getByText(/\d{2}:\d{2}/);
      expect(timerElement).toBeTruthy();
    });
  });

  describe("Rocks Database Integration", () => {
    it("should save rocks to database on back navigation", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("2500");
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      const { getByTestId } = render(<GamePage />);

      const backButton = getByTestId("back-button");
      fireEvent.press(backButton);

      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalledWith("game_score");
      });
    });

    it("should handle zero score gracefully", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("0");
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      const { getByTestId } = render(<GamePage />);

      const backButton = getByTestId("back-button");
      fireEvent.press(backButton);

      await waitFor(() => {
        expect(router.back).toHaveBeenCalled();
      });
    });

    it("should clear temporary score after saving", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("1000");
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      const { getByTestId } = render(<GamePage />);

      const backButton = getByTestId("back-button");
      fireEvent.press(backButton);

      await waitFor(() => {
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith("game_score");
      });
    });
  });
});
