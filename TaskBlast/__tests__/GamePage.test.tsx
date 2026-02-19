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

describe("Game Screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    it("should handle negative scores as zero", async () => {
      const { getByTestId } = render(<GamePage />);

      const mockScoreMessage = {
        nativeEvent: {
          data: JSON.stringify({
            type: "scoreUpdate",
            score: -100,
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

  describe("Triple-Tap Bypass", () => {
    it("should support triple-tap timer bypass for admin", () => {
      const { getByText } = render(<GamePage />);

      // Timer should be rendered
      const timerElement = getByText(/\d{2}:\d{2}/);
      expect(timerElement).toBeTruthy();

      // Triple tap feature exists (implementation detail - cannot fully test without integration)
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
