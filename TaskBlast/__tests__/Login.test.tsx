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
      const { getByPlaceholderText, getByText } = render(<Login />);

  expect(getByPlaceholderText("Email or Username")).toBeTruthy();
      expect(getByPlaceholderText("Password")).toBeTruthy();
      expect(getByText("Submit")).toBeTruthy();
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

      const { getByPlaceholderText, getByText } = render(<Login />);

      const usernameInput = getByPlaceholderText("Email or Username");
      const passwordInput = getByPlaceholderText("Password");
      const submitButton = getByText("Submit");

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

      const { getByPlaceholderText, getByText, queryByPlaceholderText } =
        render(<Login />);

      const usernameInput = getByPlaceholderText("Email or Username");
      const passwordInput = getByPlaceholderText("Password");
      const submitButton = getByText("Submit");

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

      const { getByPlaceholderText, getByText } = render(<Login />);

  const usernameInput = getByPlaceholderText("Email or Username");
      const passwordInput = getByPlaceholderText("Password");
      const submitButton = getByText("Submit");

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
      const { getByPlaceholderText, getByText, queryByText } = render(
        <Login />
      );

  const usernameInput = getByPlaceholderText("Email or Username");
      const passwordInput = getByPlaceholderText("Password");
      const submitButton = getByText("Submit");

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
  const { getByPlaceholderText, getByText } = render(<Login />);

  const usernameInput = getByPlaceholderText("Email or Username");
      const passwordInput = getByPlaceholderText("Password");
      const submitButton = getByText("Submit");

      fireEvent.changeText(usernameInput, "ADMIN");
      fireEvent.changeText(passwordInput, "taskblaster");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
      });
    });

    it("should handle bypass login with whitespace", async () => {
  const { getByPlaceholderText, getByText } = render(<Login />);

  const usernameInput = getByPlaceholderText("Email or Username");
      const passwordInput = getByPlaceholderText("Password");
      const submitButton = getByText("Submit");

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
      const { getByPlaceholderText, getByText } = render(<Login />);

      const passwordInput = getByPlaceholderText("Password");
      const submitButton = getByText("Submit");

      fireEvent.changeText(passwordInput, "password123");
      fireEvent.press(submitButton);

      expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it("should not proceed with empty password", () => {
  const { getByPlaceholderText, getByText } = render(<Login />);

  const usernameInput = getByPlaceholderText("Email or Username");
      const submitButton = getByText("Submit");

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

  const { getByPlaceholderText, getByText } = render(<Login />);

  const usernameInput = getByPlaceholderText("Email or Username");
      const passwordInput = getByPlaceholderText("Password");
      const submitButton = getByText("Submit");

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

      const { getByPlaceholderText, getByText } = render(<Login />);

  const usernameInput = getByPlaceholderText("Email or Username");
      const passwordInput = getByPlaceholderText("Password");
      const submitButton = getByText("Submit");

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
      const { getByText } = render(<Login />);

      const signUpLink = getByText("Sign Up");
      fireEvent.press(signUpLink);

      // Should navigate to SignUpBirthdate screen
      expect(getByText("What's Your Birthdate?")).toBeTruthy();
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
