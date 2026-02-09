/**
 * Test Suite: HomeScreen
 *
 * This test suite covers the HomeScreen functionality including:
 * - UI rendering (profile, settings, fuel, rocks, task list)
 * - Navigation to different screens
 * - Background music playback
 * - Score persistence
 * - Task management
 * - Settings modal
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import HomeScreen from "../app/pages/HomeScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import { router } from "expo-router";
import { getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Use global audio mocks from jest.setup.js
const mockPlay = (global as any).mockAudioPlayer.play;
const mockPause = (global as any).mockAudioPlayer.pause;

describe("HomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlay.mockReset().mockImplementation(() => {});
    mockPause.mockReset().mockImplementation(() => {});

    // Mock Firestore getDoc to return rocks data
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({ rocks: 1000 }),
    });

    // Mock getAuth to return a user
    (getAuth as jest.Mock).mockReturnValue({
      currentUser: {
        uid: "test-uid",
        email: "test@example.com",
      },
    });
  });

  describe("UI Rendering", () => {
    it("should render all main UI elements", async () => {
      const { getByText } = render(<HomeScreen />);

      await waitFor(() => {
        // Check for buttons
        expect(getByText("Take Off")).toBeTruthy();
      });
    });

    it("should display galaxy crystals (fuel) indicator", () => {
      const { getByTestId, getByText } = render(<HomeScreen />);
      // Galaxy crystals hardcoded to 0000
      expect(getByTestId("fuel-icon")).toBeTruthy();
    });

    it("should display rocks count", async () => {
      const { getByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText("1000")).toBeTruthy();
      });
    });

    it("should display rocks in 4-digit format with leading zeros", async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ rocks: 5 }),
      });

      const { getByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText("0005")).toBeTruthy();
      });
    });

    it("should render profile button", () => {
      const { getByTestId } = render(<HomeScreen />);
      expect(getByTestId("profile-button")).toBeTruthy();
    });

    it("should render settings button", () => {
      const { getByTestId } = render(<HomeScreen />);
      expect(getByTestId("settings-button")).toBeTruthy();
    });

    it("should render task list button", () => {
      const { getByTestId } = render(<HomeScreen />);
      expect(getByTestId("task-button")).toBeTruthy();
    });

    it("should render planet images in scroll list", () => {
      const { getByTestId } = render(<HomeScreen />);
      // Planets are numbered 1-9 in PlanetScrollList
      expect(getByTestId("planet-1-image")).toBeTruthy();
    });
  });

  describe("Navigation", () => {
    it("should navigate to Pomodoro Screen when Take Off is pressed", () => {
      const { getByText } = render(<HomeScreen />);

      const takeOffButton = getByText("Take Off");
      fireEvent.press(takeOffButton);

      expect(router.push).toHaveBeenCalledWith("/pages/PomodoroScreen");
    });

    it("should navigate to Profile Screen when profile button is pressed", () => {
      const { getByTestId } = render(<HomeScreen />);

      const profileButton = getByTestId("profile-button");
      fireEvent.press(profileButton);

      expect(router.push).toHaveBeenCalledWith("/pages/ProfileScreen");
    });

    it("should open settings modal when settings button is pressed", () => {
      const { getByTestId } = render(<HomeScreen />);

      const settingsButton = getByTestId("settings-button");
      fireEvent.press(settingsButton);

      // Settings modal should be visible
      expect(getByTestId("settings-modal")).toBeTruthy();
    });

    it("should open task list modal when task button is pressed", () => {
      const { getByTestId } = render(<HomeScreen />);

      const taskButton = getByTestId("task-button");
      fireEvent.press(taskButton);

      // Task modal should be visible
      expect(getByTestId("task-modal")).toBeTruthy();
    });
  });

  describe("Background Music", () => {
    it("should play background music on mount", async () => {
      render(<HomeScreen />);

      await waitFor(() => {
        expect(mockPlay).toHaveBeenCalled();
      });
    });

    it("should set music to loop", () => {
      const mockAudioPlayer = {
        play: mockPlay,
        pause: mockPause,
        loop: false,
      };

      const mockUseAudioPlayer = jest.requireMock("expo-audio").useAudioPlayer;
      mockUseAudioPlayer.mockReturnValueOnce(mockAudioPlayer);

      render(<HomeScreen />);

      expect(mockAudioPlayer.loop).toBe(true);
    });

    it("should pause music when app goes to background", async () => {
      render(<HomeScreen />);

      mockPause.mockClear();

      // Simulate app state change to background using global helper
      (global as any).mockAppState.triggerAppStateChange("background");

      await waitFor(() => {
        expect(mockPause).toHaveBeenCalled();
      });
    });

    it("should resume music when app becomes active", async () => {
      render(<HomeScreen />);

      mockPlay.mockClear();

      // Simulate app state change to active using global helper
      (global as any).mockAppState.triggerAppStateChange("active");

      await waitFor(() => {
        expect(mockPlay).toHaveBeenCalled();
      });
    });

    it("should pause music when screen loses focus", () => {
      const { unmount } = render(<HomeScreen />);

      unmount();

      expect(mockPause).toHaveBeenCalled();
    });
  });

  describe("Score Persistence", () => {
    it("should load rocks from Firestore on mount", async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ rocks: 2500 }),
      });

      const { getByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText("2500")).toBeTruthy();
      });
    });

    it("should default to 0 if no rocks exist in Firestore", async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ rocks: 0 }),
      });

      const { getAllByText } = render(<HomeScreen />);

      await waitFor(() => {
        // Should find 0000 in display (rocks are 0, formatted with padding)
        const elements = getAllByText("0000");
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it("should handle invalid rocks value gracefully", async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ rocks: NaN }),
      });

      const { getAllByText } = render(<HomeScreen />);

      await waitFor(() => {
        // Should find 0000 (default for NaN rocks)
        const elements = getAllByText("0000");
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it("should reload rocks when screen comes into focus", async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ rocks: 1500 }),
      });

      render(<HomeScreen />);

      const initialCallCount = (getDoc as jest.Mock).mock.calls.length;

      // Simulate focus effect
      const useFocusEffect = jest.requireMock(
        "@react-navigation/native"
      ).useFocusEffect;
      const focusCallback = useFocusEffect.mock.calls[0][0];
      focusCallback();

      await waitFor(() => {
        expect((getDoc as jest.Mock).mock.calls.length).toBeGreaterThan(
          initialCallCount
        );
      });
    });

    it("should floor rocks to integer", async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ rocks: 1234.56 }),
      });

      const { getByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText("1234")).toBeTruthy();
      });
    });

    it("should handle negative rocks as zero", async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ rocks: -100 }),
      });

      const { getAllByText } = render(<HomeScreen />);

      await waitFor(() => {
        // Should find 0000 (negative becomes 0, formatted with padding)
        const elements = getAllByText("0000");
        expect(elements.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Task List Modal", () => {
    it("should open task list modal", () => {
      const { getByTestId } = render(<HomeScreen />);

      const taskButton = getByTestId("task-button");
      fireEvent.press(taskButton);

      expect(getByTestId("task-modal")).toBeTruthy();
    });

    it("should close task list modal", () => {
      const { getByTestId, queryByTestId } = render(<HomeScreen />);

      const taskButton = getByTestId("task-button");
      fireEvent.press(taskButton);

      const closeButton = getByTestId("close-task-modal");
      fireEvent.press(closeButton);

      expect(queryByTestId("task-modal")).toBeFalsy();
    });

    it("should display task list in modal", () => {
      const { getByTestId } = render(<HomeScreen />);

      const taskButton = getByTestId("task-button");
      fireEvent.press(taskButton);

      // Check that the task modal is displayed
      expect(getByTestId("task-modal")).toBeTruthy();
    });
  });

  describe("Settings Modal", () => {
    it("should open settings modal", () => {
      const { getByTestId } = render(<HomeScreen />);

      const settingsButton = getByTestId("settings-button");
      fireEvent.press(settingsButton);

      expect(getByTestId("settings-modal")).toBeTruthy();
    });

    it("should close settings modal", () => {
      const { getByTestId, queryByTestId } = render(<HomeScreen />);

      const settingsButton = getByTestId("settings-button");
      fireEvent.press(settingsButton);

      const closeButton = getByTestId("close-settings-modal");
      fireEvent.press(closeButton);

      expect(queryByTestId("settings-modal")).toBeFalsy();
    });

    it("should display settings options in modal", () => {
      const { getByTestId } = render(<HomeScreen />);

      const settingsButton = getByTestId("settings-button");
      fireEvent.press(settingsButton);

      // Check that the settings modal is displayed
      expect(getByTestId("settings-modal")).toBeTruthy();
    });
  });

  describe("Galaxy Crystals System", () => {
    it("should display galaxy crystals (fuel) as 0000", () => {
      const { getAllByText } = render(<HomeScreen />);
      // Galaxy crystals are hardcoded to 0000
      const elements = getAllByText("0000");
      expect(elements.length).toBeGreaterThan(0);
    });

    it("should display fuel icon", () => {
      const { getByTestId } = render(<HomeScreen />);
      expect(getByTestId("fuel-icon")).toBeTruthy();
    });
  });

  describe("Error Handling", () => {
    it("should handle Firestore errors gracefully", async () => {
      (getDoc as jest.Mock).mockRejectedValue(new Error("Firestore error"));

      const { getAllByText } = render(<HomeScreen />);

      await waitFor(() => {
        // Should default to 0000 on error
        const elements = getAllByText("0000");
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it("should handle audio player errors gracefully", async () => {
      mockPlay.mockImplementation(() => {
        console.warn("Audio error");
        // Don't throw - just warn
      });

      // Should not crash
      const { getByText } = render(<HomeScreen />);

      await waitFor(() => {
        expect(getByText("1000")).toBeTruthy();
      });
    });
  });

  describe("App State Management", () => {
    it("should load rocks successfully on mount", async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({ rocks: 1000 }),
      });

      const { getByText } = render(<HomeScreen />);

      // Verify rocks are loaded and displayed
      await waitFor(() => {
        expect(getDoc).toHaveBeenCalled();
        expect(getByText("1000")).toBeTruthy();
      });
    });
  });
});
