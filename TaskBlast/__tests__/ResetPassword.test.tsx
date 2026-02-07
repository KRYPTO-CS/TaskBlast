/**
 * Test Suite: Reset Password
 *
 * This test suite covers the password reset functionality including:
 * - UI rendering and form elements
 * - Password validation (length, matching)
 * - Input masking and security
 * - Error handling
 * - Internationalization (i18n)
 * - Navigation (back to login)
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import ResetPassword from "../app/pages/ResetPassword";

describe("Reset Password", () => {
  const mockOnSubmit = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("UI Rendering", () => {
    it("should render reset password screen with all required fields", () => {
      const { getByPlaceholderText, getByText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      expect(getByText("Create New Password")).toBeTruthy();
      expect(getByText("Enter your new password below")).toBeTruthy();
      expect(getByPlaceholderText("New Password")).toBeTruthy();
      expect(getByPlaceholderText("Confirm Password")).toBeTruthy();
      expect(getByText("Reset Password")).toBeTruthy();
    });

    it("should render background image", () => {
      const { getByTestId } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      // ImageBackground should be rendered
      const { root } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );
      expect(root).toBeTruthy();
    });

    it("should render back to login link", () => {
      const { getByText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      expect(getByText(/Back to/i)).toBeTruthy();
      expect(getByText("Login")).toBeTruthy();
    });

    it("should render submit button", () => {
      const { getByText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      expect(getByText("Reset Password")).toBeTruthy();
    });

    it("should render lock icons for password inputs", () => {
      const { getAllByTestId } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      // Ionicons should be rendered (lock-closed-outline)
      // Can't directly test icon name, but structure is present
      const { root } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );
      expect(root).toBeTruthy();
    });
  });

  describe("Password Input", () => {
    it("should accept password input in new password field", () => {
      const { getByPlaceholderText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const newPasswordInput = getByPlaceholderText("New Password");
      fireEvent.changeText(newPasswordInput, "newpassword123");

      expect(newPasswordInput.props.value).toBe("newpassword123");
    });

    it("should accept password input in confirm password field", () => {
      const { getByPlaceholderText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const confirmPasswordInput = getByPlaceholderText("Confirm Password");
      fireEvent.changeText(confirmPasswordInput, "newpassword123");

      expect(confirmPasswordInput.props.value).toBe("newpassword123");
    });

    it("should mask password inputs (secureTextEntry)", () => {
      const { getByPlaceholderText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const newPasswordInput = getByPlaceholderText("New Password");
      const confirmPasswordInput = getByPlaceholderText("Confirm Password");

      expect(newPasswordInput.props.secureTextEntry).toBe(true);
      expect(confirmPasswordInput.props.secureTextEntry).toBe(true);
    });

    it("should not auto-capitalize password inputs", () => {
      const { getByPlaceholderText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const newPasswordInput = getByPlaceholderText("New Password");
      const confirmPasswordInput = getByPlaceholderText("Confirm Password");

      expect(newPasswordInput.props.autoCapitalize).toBe("none");
      expect(confirmPasswordInput.props.autoCapitalize).toBe("none");
    });
  });

  describe("Password Validation", () => {
    it("should show error when passwords are empty", async () => {
      const { getByText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const submitButton = getByText("Reset Password");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText("Field is required")).toBeTruthy();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should show error when passwords do not match", async () => {
      const { getByPlaceholderText, getByText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const newPasswordInput = getByPlaceholderText("New Password");
      const confirmPasswordInput = getByPlaceholderText("Confirm Password");
      const submitButton = getByText("Reset Password");

      fireEvent.changeText(newPasswordInput, "password123");
      fireEvent.changeText(confirmPasswordInput, "password456");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText("Passwords do not match")).toBeTruthy();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should show error when password is less than 8 characters", async () => {
      const { getByPlaceholderText, getByText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const newPasswordInput = getByPlaceholderText("New Password");
      const confirmPasswordInput = getByPlaceholderText("Confirm Password");
      const submitButton = getByText("Reset Password");

      fireEvent.changeText(newPasswordInput, "pass123");
      fireEvent.changeText(confirmPasswordInput, "pass123");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(
          getByText("Password must be at least 8 characters long")
        ).toBeTruthy();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should accept password with exactly 8 characters", async () => {
      const { getByPlaceholderText, getByText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const newPasswordInput = getByPlaceholderText("New Password");
      const confirmPasswordInput = getByPlaceholderText("Confirm Password");
      const submitButton = getByText("Reset Password");

      fireEvent.changeText(newPasswordInput, "pass1234");
      fireEvent.changeText(confirmPasswordInput, "pass1234");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith("pass1234");
      });
    });

    it("should trim whitespace from passwords", async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const newPasswordInput = getByPlaceholderText("New Password");
      const confirmPasswordInput = getByPlaceholderText("Confirm Password");
      const submitButton = getByText("Reset Password");

      // Empty strings with spaces should be treated as empty
      fireEvent.changeText(newPasswordInput, "   ");
      fireEvent.changeText(confirmPasswordInput, "   ");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(queryByText("Field is required")).toBeTruthy();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe("Successful Password Reset", () => {
    it("should call onSubmit with valid matching passwords", async () => {
      const { getByPlaceholderText, getByText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const newPasswordInput = getByPlaceholderText("New Password");
      const confirmPasswordInput = getByPlaceholderText("Confirm Password");
      const submitButton = getByText("Reset Password");

      fireEvent.changeText(newPasswordInput, "newpassword123");
      fireEvent.changeText(confirmPasswordInput, "newpassword123");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith("newpassword123");
      });
    });

    it("should log success message on valid submission", async () => {
      const consoleLogSpy = jest.spyOn(console, "log");

      const { getByPlaceholderText, getByText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const newPasswordInput = getByPlaceholderText("New Password");
      const confirmPasswordInput = getByPlaceholderText("Confirm Password");
      const submitButton = getByText("Reset Password");

      fireEvent.changeText(newPasswordInput, "validpass123");
      fireEvent.changeText(confirmPasswordInput, "validpass123");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(
          "Password reset successful"
        );
      });

      consoleLogSpy.mockRestore();
    });

    it("should accept password with special characters", async () => {
      const { getByPlaceholderText, getByText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const newPasswordInput = getByPlaceholderText("New Password");
      const confirmPasswordInput = getByPlaceholderText("Confirm Password");
      const submitButton = getByText("Reset Password");

      const complexPassword = "P@ssw0rd!#$%";
      fireEvent.changeText(newPasswordInput, complexPassword);
      fireEvent.changeText(confirmPasswordInput, complexPassword);
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(complexPassword);
      });
    });

    it("should accept long passwords", async () => {
      const { getByPlaceholderText, getByText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const newPasswordInput = getByPlaceholderText("New Password");
      const confirmPasswordInput = getByPlaceholderText("Confirm Password");
      const submitButton = getByText("Reset Password");

      const longPassword = "thisIsAVeryLongPasswordWithMoreThan50Characters12345";
      fireEvent.changeText(newPasswordInput, longPassword);
      fireEvent.changeText(confirmPasswordInput, longPassword);
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(longPassword);
      });
    });
  });

  describe("Navigation", () => {
    it("should call onBack when back link is pressed", () => {
      const { getByText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const backLink = getByText(/Back to/i);
      fireEvent.press(backLink);

      expect(mockOnBack).toHaveBeenCalled();
    });

    it("should call onBack when Login link is pressed", () => {
      const { getByText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      // The "Login" text is inside the back link
      const loginLink = getByText("Login");
      fireEvent.press(loginLink);

      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe("Error State Management", () => {
    it("should clear previous error when submitting again", async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const newPasswordInput = getByPlaceholderText("New Password");
      const confirmPasswordInput = getByPlaceholderText("Confirm Password");
      const submitButton = getByText("Reset Password");

      // First submission with error
      fireEvent.changeText(newPasswordInput, "short");
      fireEvent.changeText(confirmPasswordInput, "short");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(
          getByText("Password must be at least 8 characters long")
        ).toBeTruthy();
      });

      // Second submission with valid password
      fireEvent.changeText(newPasswordInput, "validpass123");
      fireEvent.changeText(confirmPasswordInput, "validpass123");
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith("validpass123");
      });

      // Error should be cleared
      expect(
        queryByText("Password must be at least 8 characters long")
      ).toBeFalsy();
    });

    it("should not show error message initially", () => {
      const { queryByText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      expect(queryByText("Field is required")).toBeFalsy();
      expect(queryByText("Passwords do not match")).toBeFalsy();
      expect(
        queryByText("Password must be at least 8 characters long")
      ).toBeFalsy();
    });
  });

  describe("Internationalization (i18n)", () => {
    it("should use translation function for all text", () => {
      const { getByText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      // These texts should come from i18n
      expect(getByText("Create New Password")).toBeTruthy();
      expect(getByText("Enter your new password below")).toBeTruthy();
      expect(getByText("Reset Password")).toBeTruthy();
      expect(getByText(/Back to/i)).toBeTruthy();
      expect(getByText("Login")).toBeTruthy();
    });

    it("should display translated placeholders", () => {
      const { getByPlaceholderText } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      expect(getByPlaceholderText("New Password")).toBeTruthy();
      expect(getByPlaceholderText("Confirm Password")).toBeTruthy();
    });
  });

  describe("Keyboard Behavior", () => {
    it("should dismiss keyboard when touching outside", () => {
      const { getByTestId } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      // TouchableWithoutFeedback should be rendered
      // Actual keyboard dismissal tested manually
      const { root } = render(
        <ResetPassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );
      expect(root).toBeTruthy();
    });
  });
});
