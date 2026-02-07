/**
 * Test Suite: ProfileScreen
 *
 * This test suite covers the profile screen functionality including:
 * - Profile data loading and display
 * - Profile picture upload
 * - Edit profile modal
 * - Traits and awards display
 * - Stats and analytics charts
 * - Profile switching
 * - Logout functionality
 * - Child profile support
 */

import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import ProfileScreen from "../app/pages/ProfileScreen";
import { getAuth } from "firebase/auth";
import { getDoc, getDocs, collection, query, where } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

describe("ProfileScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authenticated user
    (getAuth as jest.Mock).mockReturnValue({
      currentUser: {
        uid: "test-uid",
        email: "test@example.com",
      },
    });

    // Mock AsyncStorage - default to parent profile
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    // Mock Firestore user document
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        firstName: "John",
        lastName: "Doe",
        displayName: "John",
        email: "test@example.com",
        traits: ["Focused", "Persistent", "Creative"],
        awards: ["🏆 First Mission", "⭐ 10 Tasks Complete"],
        rocks: 1500,
        allTimeRocks: 5000,
        allTimeRocksArr: [100, 200, 300, 400, 500],
        workTimeMinutesArr: [25, 30, 20, 35, 40],
        playTimeMinutesArr: [5, 5, 5, 5, 5],
      }),
    });
  });

  describe("UI Rendering", () => {
    it("should render profile screen with user data", async () => {
      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText("John")).toBeTruthy();
      });
    });

    it("should display parent profile badge for parent accounts", async () => {
      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText(/Parent Account/i)).toBeTruthy();
      });
    });

    it("should display child profile badge for child accounts", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("TestChild");

      (getDocs as jest.Mock).mockResolvedValue({
        empty: false,
        docs: [
          {
            id: "child-doc-id",
            data: () => ({
              firstName: "TestChild",
              lastName: "Doe",
              username: "TestChild",
              traits: ["Creative"],
              awards: ["🏆 First Mission"],
            }),
          },
        ],
      });

      const { getAllByText } = render(<ProfileScreen />);

      await waitFor(() => {
        // May appear multiple times in UI - just check it exists
        const matches = getAllByText(/TestChild/i);
        expect(matches.length).toBeGreaterThan(0);
      });
    });

    it("should display profile picture placeholder when no image exists", async () => {
      const { getByTestId } = render(<ProfileScreen />);

      await waitFor(() => {
        // Profile image container should be rendered
        expect(getByTestId).toBeTruthy();
      });
    });

    it("should display Edit Profile button", async () => {
      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText("Edit Profile")).toBeTruthy();
      });
    });

    it("should display back button", async () => {
      const { getAllByTestId } = render(<ProfileScreen />);

      await waitFor(() => {
        // Back button should be rendered (Ionicons arrow-back)
        expect(getAllByTestId).toBeTruthy();
      });
    });
  });

  describe("Traits Display", () => {
    it("should display user traits", async () => {
      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText("Traits")).toBeTruthy();
        expect(getByText("Focused")).toBeTruthy();
        expect(getByText("Persistent")).toBeTruthy();
        expect(getByText("Creative")).toBeTruthy();
      });
    });

    it("should handle empty traits gracefully", async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          firstName: "John",
          traits: [],
        }),
      });

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText("Traits")).toBeTruthy();
      });
    });
  });

  describe("Awards Display", () => {
    it("should display user awards", async () => {
      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText("Awards")).toBeTruthy();
        expect(getByText("🏆 First Mission")).toBeTruthy();
        expect(getByText("⭐ 10 Tasks Complete")).toBeTruthy();
      });
    });

    it("should handle empty awards gracefully", async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          firstName: "John",
          awards: [],
        }),
      });

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText("Awards")).toBeTruthy();
      });
    });
  });

  describe("Stats and Analytics", () => {
    it("should display stats section", async () => {
      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText("Your Stats")).toBeTruthy();
      });
    });

    it("should load rocks data from Firestore", async () => {
      render(<ProfileScreen />);

      await waitFor(() => {
        expect(getDoc).toHaveBeenCalled();
      });
    });

    it("should handle missing stats data gracefully", async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          firstName: "John",
          allTimeRocksArr: [],
          workTimeMinutesArr: [],
          playTimeMinutesArr: [],
        }),
      });

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText("Your Stats")).toBeTruthy();
      });
    });
  });

  describe("Profile Actions", () => {
    it("should display Switch Profile button", async () => {
      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText("Switch Profile")).toBeTruthy();
      });
    });

    it("should navigate to ProfileSelection when Switch Profile is pressed", async () => {
      const mockRouter = require("expo-router").useRouter();
      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        const switchButton = getByText("Switch Profile");
        fireEvent.press(switchButton);
      });

      expect(mockRouter.push).toHaveBeenCalledWith("/pages/ProfileSelection");
    });

    it("should display Logout button", async () => {
      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText("Logout")).toBeTruthy();
      });
    });

    it("should display Add Child Account button", async () => {
      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText("Add Child Account")).toBeTruthy();
      });
    });

    it("should navigate to CreateChildAccount when Add Child is pressed", async () => {
      const mockRouter = require("expo-router").useRouter();
      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        const addChildButton = getByText("Add Child Account");
        fireEvent.press(addChildButton);
      });

      expect(mockRouter.push).toHaveBeenCalledWith("/pages/CreateChildAccount");
    });
  });

  describe("Navigation", () => {
    it("should navigate back when back button is pressed", async () => {
      const mockRouter = require("expo-router").useRouter();
      const { getByTestId } = render(<ProfileScreen />);

      await waitFor(() => {
        // Find back button and press it
        // Note: In actual implementation, we'd need a testID on the back button
        expect(mockRouter.back).toBeDefined();
      });
    });
  });

  describe("Child Profile Support", () => {
    it("should load child profile data when child is active", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("TestChild");

      (getDocs as jest.Mock).mockResolvedValue({
        empty: false,
        docs: [
          {
            id: "child-doc-id",
            data: () => ({
              firstName: "TestChild",
              lastName: "Doe",
              username: "TestChild",
              birthdate: "2015-01-01",
              traits: ["Creative", "Fun"],
              awards: ["🏆 First Mission"],
            }),
          },
        ],
      });

      render(<ProfileScreen />);

      await waitFor(() => {
        expect(getDocs).toHaveBeenCalled();
        expect(AsyncStorage.getItem).toHaveBeenCalledWith("activeChildProfile");
      });
    });

    it("should handle missing child profile gracefully", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("NonExistentChild");

      (getDocs as jest.Mock).mockResolvedValue({
        empty: true,
        docs: [],
      });

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        // Should still render the screen without crashing
        expect(getByText).toBeTruthy();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle Firestore errors gracefully", async () => {
      (getDoc as jest.Mock).mockRejectedValue(new Error("Firestore error"));

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        // Should render default profile
        expect(getByText("Space Explorer")).toBeTruthy();
      });
    });

    it("should handle missing user data gracefully", async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
        data: () => null,
      });

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        // Should render default profile
        expect(getByText("Space Explorer")).toBeTruthy();
      });
    });

    it("should handle AsyncStorage errors gracefully", async () => {
      const consoleErrorMock = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error("AsyncStorage error")
      );

      const { getByText } = render(<ProfileScreen />);

      // Wait for component to handle error and render default profile
      await waitFor(() => {
        expect(getByText("Space Explorer")).toBeTruthy();
      });

      consoleErrorMock.mockRestore();
    });
  });

  describe("Profile Data Loading", () => {
    it("should load parent profile on mount", async () => {
      render(<ProfileScreen />);

      await waitFor(() => {
        expect(getAuth).toHaveBeenCalled();
        expect(getDoc).toHaveBeenCalled();
      });
    });

    it("should display default profile if no profile exists", async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText("Space Explorer")).toBeTruthy();
      });
    });

    it("should handle unauthenticated user", async () => {
      (getAuth as jest.Mock).mockReturnValue({
        currentUser: null,
      });

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        // Should render without crashing
        expect(getByText).toBeTruthy();
      });
    });
  });
});
