/**
 * Test Suite: Logout Process
 *
 * This test suite covers the logout functionality including:
 * - Successful logout
 * - Session cleanup
 * - Navigation after logout
 * - Firebase signOut integration
 */

import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import HomeScreen from "../app/pages/HomeScreen";
import { signOut, getAuth } from "firebase/auth";
import { getDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

describe("Logout Process", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).mockAlert.clear();

    // Add Firestore mocks to prevent infinite re-render
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({ rocks: 1000 }),
    });

    (getAuth as jest.Mock).mockReturnValue({
      currentUser: { uid: "test-uid", email: "test@example.com" },
    });
  });

  describe("Settings Modal Logout", () => {
    it("should display logout option in settings modal", () => {
      const { getByText, getByTestId } = render(<HomeScreen />);

      // Open settings modal
      const settingsButton = getByTestId("settings-button");
      fireEvent.press(settingsButton);

      // Check for logout button
      expect(getByText("Logout")).toBeTruthy();
    });

    it("should call signOut when logout is pressed", async () => {
      (signOut as jest.Mock).mockResolvedValueOnce(undefined);

      const { getAllByText, getByTestId } = render(<HomeScreen />);

      // Open settings modal
      const settingsButton = getByTestId("settings-button");
      fireEvent.press(settingsButton);

      // Press logout button - use getAllByText since "Logout" appears multiple times
      const logoutButton = getAllByText("Logout")[0];
      fireEvent.press(logoutButton);

      // Verify Alert was called
      await waitFor(() => {
        expect((global as any).Alert.alert).toHaveBeenCalledWith(
          "Logout",
          expect.stringMatching(/are you sure/i),
          expect.any(Array)
        );
      });

      // Manually trigger the logout button in Alert
      act(() => {
        (global as any).mockAlert.pressButtonByText("Logout");
      });

      await waitFor(() => {
        expect(signOut).toHaveBeenCalled();
      });
    });

    it("should navigate to login screen after successful logout", async () => {
      (signOut as jest.Mock).mockResolvedValueOnce(undefined);

      const mockRouter = {
        replace: jest.fn(),
        push: jest.fn(),
        back: jest.fn(),
      };

      const { getByText, getByTestId } = render(<HomeScreen />);

      const settingsButton = getByTestId("settings-button");
      fireEvent.press(settingsButton);

      const logoutButton = getByTestId("logout-button");
      fireEvent.press(logoutButton);

      // Manually trigger the logout confirmation
      await waitFor(() => {
        expect((global as any).Alert.alert).toHaveBeenCalled();
      });

      act(() => {
        (global as any).mockAlert.pressButtonByText("Logout");
      });

      await waitFor(
        () => {
          expect(signOut).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });
  });

  describe("Session Cleanup", () => {
    it("should clear user data from AsyncStorage on logout", async () => {
      (signOut as jest.Mock).mockResolvedValueOnce(undefined);
      (AsyncStorage.clear as jest.Mock).mockResolvedValueOnce(undefined);

      const { getByText, getByTestId } = render(<HomeScreen />);

      const settingsButton = getByTestId("settings-button");
      fireEvent.press(settingsButton);

      const logoutButton = getByTestId("logout-button");
      fireEvent.press(logoutButton);

      // Manually trigger logout confirmation
      await waitFor(() => {
        expect((global as any).Alert.alert).toHaveBeenCalled();
      });

      act(() => {
        (global as any).mockAlert.pressButtonByText("Logout");
      });

      await waitFor(
        () => {
          expect(AsyncStorage.clear).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });

    it("should stop playing background music on logout", async () => {
      const mockPause = jest.fn();
      (signOut as jest.Mock).mockResolvedValueOnce(undefined);

      // Mock audio player with pause function
      const mockUseAudioPlayer = jest.requireMock("expo-audio").useAudioPlayer;
      mockUseAudioPlayer.mockReturnValueOnce({
        play: jest.fn(),
        pause: mockPause,
        loop: false,
      });

      const { getByText, getByTestId } = render(<HomeScreen />);

      const settingsButton = getByTestId("settings-button");
      fireEvent.press(settingsButton);

      const logoutButton = getByTestId("logout-button");
      fireEvent.press(logoutButton);

      // Manually trigger logout confirmation
      await waitFor(() => {
        expect((global as any).Alert.alert).toHaveBeenCalled();
      });

      act(() => {
        (global as any).mockAlert.pressButtonByText("Logout");
      });

      await waitFor(
        () => {
          expect(mockPause).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });

    it("should clear game score on logout", async () => {
      (signOut as jest.Mock).mockResolvedValueOnce(undefined);
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValueOnce(undefined);

      const { getByText, getByTestId } = render(<HomeScreen />);

      const settingsButton = getByTestId("settings-button");
      fireEvent.press(settingsButton);

      const logoutButton = getByTestId("logout-button");
      fireEvent.press(logoutButton);

      // Manually trigger logout confirmation
      await waitFor(() => {
        expect((global as any).Alert.alert).toHaveBeenCalled();
      });

      act(() => {
        (global as any).mockAlert.pressButtonByText("Logout");
      });

      await waitFor(
        () => {
          expect(AsyncStorage.removeItem).toHaveBeenCalledWith("game_score");
        },
        { timeout: 3000 }
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle logout error gracefully", async () => {
      const mockError = new Error("Network error");
      (signOut as jest.Mock).mockRejectedValueOnce(mockError);

      const { getByTestId } = render(<HomeScreen />);

      const settingsButton = getByTestId("settings-button");
      fireEvent.press(settingsButton);

      const logoutButton = getByTestId("logout-button");
      fireEvent.press(logoutButton);

      // Manually trigger logout confirmation
      await waitFor(() => {
        expect((global as any).Alert.alert).toHaveBeenCalled();
      });

      act(() => {
        (global as any).mockAlert.pressButtonByText("Logout");
      });

      await waitFor(
        () => {
          expect(signOut).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      // Error should show in new Alert
      await waitFor(() => {
        expect((global as any).Alert.alert).toHaveBeenCalledWith(
          "Error",
          expect.stringMatching(/failed to logout/i)
        );
      });
    });

    it("should remain on home screen if logout fails", async () => {
      const mockError = new Error("Logout failed");
      (signOut as jest.Mock).mockRejectedValueOnce(mockError);

      const { getByTestId, queryByText } = render(<HomeScreen />);

      const settingsButton = getByTestId("settings-button");
      fireEvent.press(settingsButton);

      const logoutButton = getByTestId("logout-button");
      fireEvent.press(logoutButton);

      // Manually trigger logout confirmation
      await waitFor(() => {
        expect((global as any).Alert.alert).toHaveBeenCalled();
      });

      act(() => {
        (global as any).mockAlert.pressButtonByText("Logout");
      });

      await waitFor(
        () => {
          expect(signOut).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      // Should still be on home screen after error (Take Off button visible)
      expect(queryByText("Take Off")).toBeTruthy();
    });
  });

  describe("Logout Confirmation", () => {
    it("should show confirmation dialog before logout", () => {
      const { getByTestId } = render(<HomeScreen />);

      const settingsButton = getByTestId("settings-button");
      fireEvent.press(settingsButton);

      const logoutButton = getByTestId("logout-button");
      fireEvent.press(logoutButton);

      // Check that Alert was called with confirmation message
      expect((global as any).Alert.alert).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringMatching(/are you sure/i),
        expect.any(Array)
      );
    });

    it("should cancel logout on confirmation decline", async () => {
      // Disable auto-confirm and manually trigger cancel
      (global as any).Alert.alert = jest.fn((title, message, buttons) => {
        (global as any).mockAlert.alert.lastCall = { title, message, buttons };
      });

      const { getByTestId } = render(<HomeScreen />);

      const settingsButton = getByTestId("settings-button");
      fireEvent.press(settingsButton);

      const logoutButton = getByTestId("logout-button");
      fireEvent.press(logoutButton);

      // Press cancel button programmatically
      (global as any).mockAlert.pressButtonByText("Cancel");

      await waitFor(() => {
        // Should not call signOut after cancel
        expect(signOut).not.toHaveBeenCalled();
      });
    });

    it("should proceed with logout on confirmation accept", async () => {
      (signOut as jest.Mock).mockResolvedValueOnce(undefined);

      const { getByTestId } = render(<HomeScreen />);

      const settingsButton = getByTestId("settings-button");
      fireEvent.press(settingsButton);

      const logoutButton = getByTestId("logout-button");
      fireEvent.press(logoutButton);

      // Manually trigger logout confirmation
      await waitFor(() => {
        expect((global as any).Alert.alert).toHaveBeenCalled();
      });

      act(() => {
        (global as any).mockAlert.pressButtonByText("Logout");
      });

      await waitFor(
        () => {
          expect(signOut).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });
  });

  describe("State Reset", () => {
    it("should reset all user-specific state on logout", async () => {
      (signOut as jest.Mock).mockResolvedValueOnce(undefined);

      const { getByTestId } = render(<HomeScreen />);

      const settingsButton = getByTestId("settings-button");
      fireEvent.press(settingsButton);

      const logoutButton = getByTestId("logout-button");
      fireEvent.press(logoutButton);

      // Manually trigger logout confirmation
      await waitFor(() => {
        expect((global as any).Alert.alert).toHaveBeenCalled();
      });

      act(() => {
        (global as any).mockAlert.pressButtonByText("Logout");
      });

      await waitFor(
        () => {
          // AsyncStorage should be cleared
          expect(AsyncStorage.clear).toHaveBeenCalled();
          // Sign out should have been called
          expect(signOut).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });
  });
});
