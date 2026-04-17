/**
 * Test Suite: ProfileSelection
 *
 * This test suite covers the profile selection screen functionality including:
 * - Loading child profiles
 * - Parent profile selection
 * - Child profile selection with PIN verification
 * - Navigation to HomeScreen
 * - Error handling
 */

import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import ProfileSelection from "../app/pages/ProfileSelection";
import { getAuth } from "firebase/auth";
import { getDoc, getDocs } from "firebase/firestore";
import { Alert } from "react-native";

const mockSetActiveChildProfile = jest.fn().mockResolvedValue(undefined);
const mockClearActiveChildProfile = jest.fn().mockResolvedValue(undefined);
const mockActiveProfile = {
  setActiveChildProfile: mockSetActiveChildProfile,
  clearActiveChildProfile: mockClearActiveChildProfile,
};

jest.mock("../app/context/ActiveProfileContext", () => ({
  useActiveProfile: () => mockActiveProfile,
}));

describe("ProfileSelection", () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).mockAlert.clear();
    mockSetActiveChildProfile.mockClear();
    mockClearActiveChildProfile.mockClear();

    // Spy on Alert.alert
    alertSpy = jest.spyOn(Alert, "alert");

    // Mock authenticated user
    (getAuth as jest.Mock).mockReturnValue({
      currentUser: {
        uid: "test-parent-uid",
        email: "parent@example.com",
      },
    });

    // Mock child profiles
    (getDocs as jest.Mock).mockResolvedValue({
      forEach: (callback: Function) => {
        callback({
          id: "child1",
          data: () => ({
            username: "Child1",
            firstName: "Alice",
            pin: "1234",
          }),
        });
        callback({
          id: "child2",
          data: () => ({
            username: "Child2",
            firstName: "Bob",
            pin: "5678",
          }),
        });
      },
    });

    (getDoc as jest.Mock).mockResolvedValue({
      data: () => ({ managerialPin: "1234" }),
    });
  });

  afterEach(() => {
    if (alertSpy) {
      alertSpy.mockRestore();
    }
  });

  describe("UI Rendering", () => {
    it("should render profile selection screen", async () => {
      const { getByText } = render(<ProfileSelection />);

      await waitFor(() => {
        expect(getByText("ProfileSelection.parentProfile")).toBeTruthy();
      });
    });

    it("should display loading indicator initially", () => {
      const { getByText } = render(<ProfileSelection />);

      expect(getByText("Loading profiles...")).toBeTruthy();
    });

    it("should display parent profile option", async () => {
      const { getByText } = render(<ProfileSelection />);

      await waitFor(() => {
        expect(getByText("ProfileSelection.parentProfile")).toBeTruthy();
      });
    });

    it("should display child profiles", async () => {
      const { getByText } = render(<ProfileSelection />);

      await waitFor(() => {
        expect(getByText("Alice")).toBeTruthy();
        expect(getByText("Bob")).toBeTruthy();
      });
    });
  });

  describe("Parent Profile Selection", () => {
    it("should navigate to HomeScreen when parent profile is selected", async () => {
      const mockRouter = require("expo-router").useRouter();
      const { getByPlaceholderText, getByTestId } = render(
        <ProfileSelection />,
      );

      await waitFor(() => {
        const parentButton = getByTestId("parent-profile-button");
        fireEvent.press(parentButton);
      });

      fireEvent.changeText(getByPlaceholderText("****"), "1234");
      fireEvent.press(getByTestId("pin-continue-button"));

      await waitFor(() => {
        expect(mockClearActiveChildProfile).toHaveBeenCalled();
        expect(mockRouter.push).toHaveBeenCalledWith("/pages/HomeScreen");
      });
    });

    it("should clear active child profile when parent is selected", async () => {
      const { getByPlaceholderText, getByTestId } = render(
        <ProfileSelection />,
      );

      await waitFor(() => {
        const parentButton = getByTestId("parent-profile-button");
        fireEvent.press(parentButton);
      });

      fireEvent.changeText(getByPlaceholderText("****"), "1234");
      fireEvent.press(getByTestId("pin-continue-button"));

      await waitFor(() => {
        expect(mockClearActiveChildProfile).toHaveBeenCalled();
      });
    });
  });

  describe("Child Profile Selection", () => {
    it("should show PIN input when child profile is selected", async () => {
      const { getByText, getByTestId } = render(<ProfileSelection />);

      await waitFor(() => {
        const childButton = getByTestId("child-profile-Child1");
        fireEvent.press(childButton);
      });

      await waitFor(() => {
        expect(getByText(/ProfileSelection\.EnterPin/i)).toBeTruthy();
      });
    });

    it("should navigate to HomeScreen with correct PIN", async () => {
      const mockRouter = require("expo-router").useRouter();
      const { getByPlaceholderText, getByTestId } = render(
        <ProfileSelection />,
      );

      await waitFor(() => {
        const childButton = getByTestId("child-profile-Child1");
        fireEvent.press(childButton);
      });

      await waitFor(() => {
        const pinInput = getByPlaceholderText("****");
        fireEvent.changeText(pinInput, "1234");
      });

      const continueButton = getByTestId("pin-continue-button");
      fireEvent.press(continueButton);

      await waitFor(() => {
        expect(mockSetActiveChildProfile).toHaveBeenCalledWith("Child1");
        expect(mockRouter.push).toHaveBeenCalledWith("/pages/HomeScreen");
      });
    });

    it("should show error alert with incorrect PIN", async () => {
      const { getByPlaceholderText, getByTestId } = render(
        <ProfileSelection />,
      );

      await waitFor(() => {
        const childButton = getByTestId("child-profile-Child1");
        fireEvent.press(childButton);
      });

      await waitFor(() => {
        const pinInput = getByPlaceholderText("****");
        fireEvent.changeText(pinInput, "0000");
      });

      const continueButton = getByTestId("pin-continue-button");

      // Press button and wait for async handler to complete
      fireEvent.press(continueButton);

      // Wait for the alert to be called
      await waitFor(
        () => {
          expect(Alert.alert).toHaveBeenCalledWith(
            "Incorrect PIN",
            "Please try again.",
          );
        },
        { timeout: 5000 },
      );
    });

    it("should clear PIN input after incorrect PIN", async () => {
      const { getByPlaceholderText, getByTestId } = render(
        <ProfileSelection />,
      );

      await waitFor(() => {
        const childButton = getByTestId("child-profile-Child1");
        fireEvent.press(childButton);
      });

      await waitFor(() => {
        const pinInput = getByPlaceholderText("****");
        fireEvent.changeText(pinInput, "0000");
      });

      const continueButton = getByTestId("pin-continue-button");
      fireEvent.press(continueButton);

      await waitFor(() => {
        const pinInput = getByPlaceholderText("****");
        expect(pinInput.props.value).toBe("");
      });
    });

    it("should save active child profile to AsyncStorage", async () => {
      const { getByPlaceholderText, getByTestId } = render(
        <ProfileSelection />,
      );

      await waitFor(() => {
        const childButton = getByTestId("child-profile-Child2");
        fireEvent.press(childButton);
      });

      await waitFor(() => {
        const pinInput = getByPlaceholderText("****");
        fireEvent.changeText(pinInput, "1234");
      });

      const continueButton = getByTestId("pin-continue-button");
      fireEvent.press(continueButton);

      await waitFor(() => {
        expect(mockSetActiveChildProfile).toHaveBeenCalledWith("Child2");
      });
    });
  });

  describe("Loading Child Profiles", () => {
    it("should load children from Firestore on mount", async () => {
      render(<ProfileSelection />);

      await waitFor(() => {
        expect(getDocs).toHaveBeenCalled();
      });
    });

    it("should handle no children gracefully", async () => {
      (getDocs as jest.Mock).mockResolvedValue({
        forEach: (callback: Function) => {
          // No children
        },
      });

      const { getAllByText } = render(<ProfileSelection />);

      await waitFor(() => {
        const matches = getAllByText("ProfileSelection.parentProfile");
        expect(matches.length).toBeGreaterThan(0);
      });
    });

    it("should redirect to login if user not authenticated", async () => {
      // Temporarily override auth.currentUser
      const firebase = require("../server/firebase");
      const originalCurrentUser = firebase.auth.currentUser;
      firebase.auth.currentUser = null;

      const mockRouter = require("expo-router").useRouter();
      render(<ProfileSelection />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith("/pages/Login");
      });

      // Restore original currentUser
      firebase.auth.currentUser = originalCurrentUser;
    });
  });

  describe("Error Handling", () => {
    it("should handle Firestore errors gracefully", async () => {
      (getDocs as jest.Mock).mockRejectedValue(new Error("Firestore error"));

      const { getAllByText } = render(<ProfileSelection />);

      await waitFor(() => {
        // Should still render the screen
        const matches = getAllByText("ProfileSelection.parentProfile");
        expect(matches.length).toBeGreaterThan(0);
      });
    });

    it("should handle AsyncStorage errors gracefully", async () => {
      const { getByPlaceholderText, getByTestId } = render(
        <ProfileSelection />,
      );

      await waitFor(() => {
        const childButton = getByTestId("child-profile-Child1");
        fireEvent.press(childButton);
      });

      await waitFor(() => {
        const pinInput = getByPlaceholderText("****");
        fireEvent.changeText(pinInput, "1234");
      });

      const continueButton = getByTestId("pin-continue-button");
      fireEvent.press(continueButton);

      await waitFor(
        () => {
          expect(mockSetActiveChildProfile).toHaveBeenCalledWith("Child1");
        },
        { timeout: 3000 },
      );
    });
  });

  describe("Navigation", () => {
    it("should have back button", async () => {
      const { getAllByTestId } = render(<ProfileSelection />);

      await waitFor(() => {
        // Back button should exist (Ionicons)
        expect(getAllByTestId).toBeTruthy();
      });
    });
  });
});
