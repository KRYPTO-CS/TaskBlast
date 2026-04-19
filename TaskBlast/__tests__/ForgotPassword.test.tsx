/**
 * Test Suite: Forgot Password Process
 *
 * This test suite covers the forgot password flow including:
 * - Email submission
 * - Email verification via link (not PIN)
 * - Password reset
 * - Email validation
 * - Navigation between screens
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import ForgotPassword from "../app/pages/ForgotPassword";
import ResetPassword from "../app/pages/ResetPassword";
import { sendPasswordResetEmail } from "firebase/auth";

describe("Forgot Password Process", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Email Submission Screen", () => {
    it("should render forgot password screen with email input", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <ForgotPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      expect(getByText("Forgot Your Password?")).toBeTruthy();
      expect(getByPlaceholderText("Email Address")).toBeTruthy();
      expect(getByText("Submit")).toBeTruthy();
    });

    it("should display helper text about reset email", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByText } = render(
        <ForgotPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      expect(
        getByText(/Enter your email address and we'll send you a code/i)
      ).toBeTruthy();
    });

    it("should have a back to login link", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByText } = render(
        <ForgotPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const backLink = getByText("Login");
      expect(backLink).toBeTruthy();
    });
  });

  describe("Email Validation", () => {
    it("should accept valid email format", async () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <ForgotPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const emailInput = getByPlaceholderText("Email Address");
      const submitButton = getByText("Submit");

      fireEvent.changeText(emailInput, "valid@example.com");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith("valid@example.com");
      });
    });

    it("should reject empty email", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByText } = render(
        <ForgotPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const submitButton = getByText("Submit");
      fireEvent.press(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should reject invalid email format", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText, queryByText } = render(
        <ForgotPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const emailInput = getByPlaceholderText("Email Address");
      const submitButton = getByText("Submit");

      // Invalid formats
      const invalidEmails = [
        "notanemail",
        "missing@domain",
        "@nodomain.com",
        "spaces in@email.com",
      ];

      invalidEmails.forEach((email) => {
        fireEvent.changeText(emailInput, email);
        fireEvent.press(submitButton);
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it("should trim whitespace from email", async () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <ForgotPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const emailInput = getByPlaceholderText("Email Address");
      const submitButton = getByText("Submit");

      fireEvent.changeText(emailInput, "  test@example.com  ");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith("test@example.com");
      });
    });
  });

  describe("Email Verification Link", () => {
    it("should send password reset email via Firebase", async () => {
      (sendPasswordResetEmail as jest.Mock).mockResolvedValueOnce(undefined);

      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <ForgotPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const emailInput = getByPlaceholderText("Email Address");
      const submitButton = getByText("Submit");

      fireEvent.changeText(emailInput, "test@example.com");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(sendPasswordResetEmail).toHaveBeenCalledWith(
          expect.anything(),
          "test@example.com"
        );
      });
    });

    it("should display success message after sending email", async () => {
      (sendPasswordResetEmail as jest.Mock).mockResolvedValueOnce(undefined);

      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <ForgotPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const emailInput = getByPlaceholderText("Email Address");
      const submitButton = getByText("Submit");

      fireEvent.changeText(emailInput, "test@example.com");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText(/Check your email for a reset link/i)).toBeTruthy();
      });
    });

    it("should display message about checking email", async () => {
      (sendPasswordResetEmail as jest.Mock).mockResolvedValueOnce(undefined);

      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <ForgotPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const emailInput = getByPlaceholderText("Email Address");
      const submitButton = getByText("Submit");

      fireEvent.changeText(emailInput, "test@example.com");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText(/Please check your email and click the link/i)).toBeTruthy();
      });
    });

    it("should handle email not found error", async () => {
      const mockError = {
        code: "auth/user-not-found",
        message: "User not found",
      };
      (sendPasswordResetEmail as jest.Mock).mockRejectedValueOnce(mockError);

      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <ForgotPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const emailInput = getByPlaceholderText("Email Address");
      const submitButton = getByText("Submit");

      fireEvent.changeText(emailInput, "nonexistent@example.com");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText(/No account found/i)).toBeTruthy();
      });
    });

    it("should allow resending reset email", async () => {
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <ForgotPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const emailInput = getByPlaceholderText("Email Address");
      const submitButton = getByText("Submit");

      // First send
      fireEvent.changeText(emailInput, "test@example.com");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
      });

      // Resend
      const resendButton = getByText(/Resend/i);
      fireEvent.press(resendButton);

      await waitFor(() => {
        expect(sendPasswordResetEmail).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Password Reset Screen", () => {
    it("should render password reset form", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      expect(getByPlaceholderText("New Password")).toBeTruthy();
      expect(getByPlaceholderText("Confirm Password")).toBeTruthy();
      expect(getByText("Reset Password")).toBeTruthy();
    });

    it("should validate password match", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const newPasswordInput = getByPlaceholderText("New Password");
      const confirmPasswordInput = getByPlaceholderText("Confirm Password");
      const submitButton = getByText("Reset Password");

      fireEvent.changeText(newPasswordInput, "newPassword123");
      fireEvent.changeText(confirmPasswordInput, "differentPassword123");
      fireEvent.press(submitButton);

      expect(getByText(/Passwords do not match/i)).toBeTruthy();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should require minimum password length", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const newPasswordInput = getByPlaceholderText("New Password");
      const confirmPasswordInput = getByPlaceholderText("Confirm Password");
      const submitButton = getByText("Reset Password");

      fireEvent.changeText(newPasswordInput, "short");
      fireEvent.changeText(confirmPasswordInput, "short");
      fireEvent.press(submitButton);

      expect(getByText(/at least 8 characters/i)).toBeTruthy();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should successfully reset password with valid input", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const newPasswordInput = getByPlaceholderText("New Password");
      const confirmPasswordInput = getByPlaceholderText("Confirm Password");
      const submitButton = getByText("Reset Password");

      const validPassword = "NewSecure123!";
      fireEvent.changeText(newPasswordInput, validPassword);
      fireEvent.changeText(confirmPasswordInput, validPassword);
      fireEvent.press(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith(validPassword);
    });

    it("should mask password inputs", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const newPasswordInput = getByPlaceholderText("New Password");
      const confirmPasswordInput = getByPlaceholderText("Confirm Password");

      expect(newPasswordInput.props.secureTextEntry).toBe(true);
      expect(confirmPasswordInput.props.secureTextEntry).toBe(true);
    });
  });

  describe("Navigation Flow", () => {
    it("should navigate back to login from forgot password", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByText } = render(
        <ForgotPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const backButton = getByText("Login");
      fireEvent.press(backButton);

      expect(mockOnBack).toHaveBeenCalled();
    });

    it("should return to login after successful password reset", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const newPasswordInput = getByPlaceholderText("New Password");
      const confirmPasswordInput = getByPlaceholderText("Confirm Password");
      const submitButton = getByText("Reset Password");

      const validPassword = "NewSecure123!";
      fireEvent.changeText(newPasswordInput, validPassword);
      fireEvent.changeText(confirmPasswordInput, validPassword);
      fireEvent.press(submitButton);

      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      const mockError = new Error("Network error");
      (sendPasswordResetEmail as jest.Mock).mockRejectedValueOnce(mockError);

      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <ForgotPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const emailInput = getByPlaceholderText("Email Address");
      const submitButton = getByText("Submit");

      fireEvent.changeText(emailInput, "test@example.com");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText(/network error/i)).toBeTruthy();
      });
    });

    it("should handle too many requests error", async () => {
      const mockError = {
        code: "auth/too-many-requests",
        message: "Too many requests",
      };
      (sendPasswordResetEmail as jest.Mock).mockRejectedValueOnce(mockError);

      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <ForgotPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const emailInput = getByPlaceholderText("Email Address");
      const submitButton = getByText("Submit");

      fireEvent.changeText(emailInput, "test@example.com");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText(/too many attempts/i)).toBeTruthy();
      });
    });
  });
});
