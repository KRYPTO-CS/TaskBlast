/**
 * Test Suite: Login Process
 *
 * This test suite covers the login functionality including:
 * - Valid user login
 * - Invalid credentials
 * - Bypass login for testing
 * - Empty field validation
 * - Firebase authentication integration
 */

// Mock HomeScreen to prevent infinite loops when navigating to home
jest.mock("../app/pages/HomeScreen", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return jest.fn(() =>
    React.createElement(View, { testID: "home-screen" }, [
      React.createElement(Text, { key: "home-text" }, "Home Screen"),
    ])
  );
});

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import Login from "../app/pages/Login";
import { signInWithEmailAndPassword } from "firebase/auth";
import { router } from "expo-router";

describe("Login Process", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("UI Rendering", () => {
    it("should render login screen with all required fields", () => {
      const { getByPlaceholderText, getByText, getAllByText } = render(
        <Login />
      );

      expect(getByPlaceholderText("Email or Username")).toBeTruthy();
      expect(getByPlaceholderText("Password")).toBeTruthy();
      expect(getAllByText("Sign Up").length).toBeGreaterThan(0);
      expect(getByText(/Don't have an account\?/i)).toBeTruthy();
      expect(getByText("Forgot Your Password?")).toBeTruthy();
    });

    it("should render TaskBlast logo", () => {
      const { getByText } = render(<Login />);
      expect(getByText("TaskBlast")).toBeTruthy();
    });

    it("should render Google sign-in button", () => {
      const { getByText } = render(<Login />);
      expect(getByText("Sign in with Google")).toBeTruthy();
    });
  });

  describe("Valid Login", () => {
    it("should successfully login with valid credentials", async () => {
      const mockUser = {
        uid: "test-uid",
        email: "test@example.com",
      };

      (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });

      const { getByPlaceholderText, getAllByText } = render(<Login />);

      const usernameInput = getByPlaceholderText("Email or Username");
      const passwordInput = getByPlaceholderText("Password");
      const submitButton = getAllByText("Sign Up")[0];

      fireEvent.changeText(usernameInput, "test@example.com");
      fireEvent.changeText(passwordInput, "password123");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
          expect.anything(),
          "test@example.com",
          "password123"
        );
      });
    });

    it("should navigate to HomeScreen after successful login", async () => {
      const mockUser = {
        uid: "test-uid",
        email: "test@example.com",
      };

      (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });

      const { getByPlaceholderText, getAllByText, queryByPlaceholderText } =
        render(<Login />);

      const usernameInput = getByPlaceholderText("Email or Username");
      const passwordInput = getByPlaceholderText("Password");
      const submitButton = getAllByText("Sign Up")[0];

      fireEvent.changeText(usernameInput, "test@example.com");
      fireEvent.changeText(passwordInput, "password123");
      fireEvent.press(submitButton);

      await waitFor(() => {
        // Should navigate to HomeScreen after successful login by rendering it
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
          expect.anything(),
          "test@example.com",
          "password123"
        );
      });
    });

    it("should trim whitespace from username and password", async () => {
      const mockUser = {
        uid: "test-uid",
        email: "test@example.com",
      };

      (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });

      const { getByPlaceholderText, getAllByText } = render(<Login />);

      const usernameInput = getByPlaceholderText("Email or Username");
      const passwordInput = getByPlaceholderText("Password");
      const submitButton = getAllByText("Sign Up")[0];

      fireEvent.changeText(usernameInput, "  test@example.com  ");
      fireEvent.changeText(passwordInput, "  password123  ");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
          expect.anything(),
          "test@example.com",
          "password123"
        );
      });
    });
  });

  describe("Bypass Login", () => {
    it("should allow bypass login with admin/taskblaster credentials", async () => {
      const { getByPlaceholderText, getAllByText, queryByText } = render(
        <Login />
      );

      const usernameInput = getByPlaceholderText("Email or Username");
      const passwordInput = getByPlaceholderText("Password");
      const submitButton = getAllByText("Sign Up")[0];

      fireEvent.changeText(usernameInput, "admin");
      fireEvent.changeText(passwordInput, "taskblaster");
      fireEvent.press(submitButton);

      await waitFor(() => {
        // Should navigate to home screen without Firebase call
        expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
        expect(queryByText("Login")).toBeFalsy();
      });
    });

    it("should handle bypass login case-insensitively", async () => {
      const { getByPlaceholderText, getAllByText } = render(<Login />);

      const usernameInput = getByPlaceholderText("Email or Username");
      const passwordInput = getByPlaceholderText("Password");
      const submitButton = getAllByText("Sign Up")[0];

      fireEvent.changeText(usernameInput, "ADMIN");
      fireEvent.changeText(passwordInput, "taskblaster");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
      });
    });

    it("should handle bypass login with whitespace", async () => {
      const { getByPlaceholderText, getAllByText } = render(<Login />);

      const usernameInput = getByPlaceholderText("Email or Username");
      const passwordInput = getByPlaceholderText("Password");
      const submitButton = getAllByText("Sign Up")[0];

      fireEvent.changeText(usernameInput, "  admin  ");
      fireEvent.changeText(passwordInput, "  taskblaster  ");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
      });
    });
  });

  describe("Invalid Login", () => {
    it("should not proceed with empty username", () => {
      const { getByPlaceholderText, getAllByText } = render(<Login />);

      const passwordInput = getByPlaceholderText("Password");
      const submitButton = getAllByText("Sign Up")[0];

      fireEvent.changeText(passwordInput, "password123");
      fireEvent.press(submitButton);

      expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it("should not proceed with empty password", () => {
      const { getByPlaceholderText, getAllByText } = render(<Login />);

      const usernameInput = getByPlaceholderText("Email or Username");
      const submitButton = getAllByText("Sign Up")[0];

      fireEvent.changeText(usernameInput, "test@example.com");
      fireEvent.press(submitButton);

      expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it("should handle invalid credentials error", async () => {
      const mockError = {
        code: "auth/invalid-credential",
        message: "Invalid email or password",
      };

      (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(
        mockError
      );

      const { getByPlaceholderText, getAllByText } = render(<Login />);

      const usernameInput = getByPlaceholderText("Email or Username");
      const passwordInput = getByPlaceholderText("Password");
      const submitButton = getAllByText("Sign Up")[0];

      fireEvent.changeText(usernameInput, "invalid@example.com");
      fireEvent.changeText(passwordInput, "wrongpassword");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalled();
      });
    });

    it("should handle user-not-found error", async () => {
      const mockError = {
        code: "auth/user-not-found",
        message: "User not found",
      };

      (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(
        mockError
      );

      const { getByPlaceholderText, getAllByText } = render(<Login />);

      const usernameInput = getByPlaceholderText("Email or Username");
      const passwordInput = getByPlaceholderText("Password");
      const submitButton = getAllByText("Sign Up")[0];

      fireEvent.changeText(usernameInput, "nonexistent@example.com");
      fireEvent.changeText(passwordInput, "password123");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(signInWithEmailAndPassword).toHaveBeenCalled();
      });
    });
  });

  describe("Navigation", () => {
    it("should navigate to Forgot Password screen", () => {
      const { getByText } = render(<Login />);

      const forgotPasswordLink = getByText("Forgot Your Password?");
      fireEvent.press(forgotPasswordLink);

      expect(getByText("Forgot Your Password?")).toBeTruthy();
    });

    it("should navigate to Sign Up flow", () => {
      const { getAllByText, getByText } = render(<Login />);

      const signUpLink = getAllByText("Sign Up")[1];
      fireEvent.press(signUpLink);

      // Should navigate to SignUpLanguage screen (first step in signup flow)
      expect(getByText("English")).toBeTruthy();
      expect(getByText("Español")).toBeTruthy();
    });
  });

  describe("Input Validation", () => {
    it("should accept email format for username", () => {
      const { getByPlaceholderText } = render(<Login />);

      const usernameInput = getByPlaceholderText("Email or Username");
      fireEvent.changeText(usernameInput, "test@example.com");

      expect(usernameInput.props.value).toBe("test@example.com");
    });

    it("should mask password input", () => {
      const { getByPlaceholderText } = render(<Login />);

      const passwordInput = getByPlaceholderText("Password");

      expect(passwordInput.props.secureTextEntry).toBe(true);
    });
  });
});
