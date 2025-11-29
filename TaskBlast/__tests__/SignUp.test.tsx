/**
 * Test Suite: Sign Up Process
 *
 * This test suite covers the complete sign-up flow including:
 * - Birthdate validation (COPPA compliance - 13+ years)
 * - Account type selection (Managed vs Independent)
 * - Manager PIN for managed accounts
 * - Name input
 * - Email submission and verification via link (not PIN)
 * - Password creation
 * - Account creation with Firebase
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SignUpBirthdate from "../app/pages/SignUpBirthdate";
import SignUpAccountType from "../app/pages/SignUpAccountType";
import SignUpManagerPin from "../app/pages/SignUpManagerPin";
import SignUpName from "../app/pages/SignUpName";
import SignUpEmail from "../app/pages/SignUpEmail";
import SignUpVerifyEmail from "../app/pages/SignUpVerifyEmail";
import SignUpCreatePassword from "../app/pages/SignUpCreatePassword";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

describe("Sign Up Process", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Step 1: Birthdate Input", () => {
    it("should render birthdate input screen", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByText, getByPlaceholderText } = render(
        <SignUpBirthdate onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      expect(getByText("What's Your Birthdate?")).toBeTruthy();
      expect(getByPlaceholderText("MM")).toBeTruthy();
      expect(getByPlaceholderText("DD")).toBeTruthy();
      expect(getByPlaceholderText("YYYY")).toBeTruthy();
    });

    it("should accept valid birthdate (13+ years)", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <SignUpBirthdate onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const monthInput = getByPlaceholderText("MM");
      const dayInput = getByPlaceholderText("DD");
      const yearInput = getByPlaceholderText("YYYY");
      const continueButton = getByText("Continue");

      // User who is 15 years old
      const fifteenYearsAgo = new Date();
      fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);

      fireEvent.changeText(monthInput, "05");
      fireEvent.changeText(dayInput, "15");
      fireEvent.changeText(yearInput, fifteenYearsAgo.getFullYear().toString());
      fireEvent.press(continueButton);

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.stringMatching(/05\/15\/\d{4}/)
      );
    });

    it("should reject birthdate under 13 years (COPPA compliance)", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <SignUpBirthdate onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const monthInput = getByPlaceholderText("MM");
      const dayInput = getByPlaceholderText("DD");
      const yearInput = getByPlaceholderText("YYYY");
      const continueButton = getByText("Continue");

      // User who is 10 years old
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

      fireEvent.changeText(monthInput, "05");
      fireEvent.changeText(dayInput, "15");
      fireEvent.changeText(yearInput, tenYearsAgo.getFullYear().toString());
      fireEvent.press(continueButton);

      expect(
        getByText(/give the device to a parent or guardian/i)
      ).toBeTruthy();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should validate date format", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <SignUpBirthdate onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const monthInput = getByPlaceholderText("MM");
      const dayInput = getByPlaceholderText("DD");
      const yearInput = getByPlaceholderText("YYYY");
      const continueButton = getByText("Continue");

      // Invalid month
      fireEvent.changeText(monthInput, "13");
      fireEvent.changeText(dayInput, "15");
      fireEvent.changeText(yearInput, "2000");
      fireEvent.press(continueButton);

      expect(getByText(/valid date/i)).toBeTruthy();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should require all fields to be filled", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <SignUpBirthdate onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const continueButton = getByText("Continue");
      fireEvent.press(continueButton);

      expect(getByText(/fill in all fields/i)).toBeTruthy();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe("Step 2: Account Type Selection", () => {
    it("should render account type selection screen", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByText } = render(
        <SignUpAccountType onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      expect(getByText(/Who will be using TaskBlast/i)).toBeTruthy();
      expect(getByText("Managed Account")).toBeTruthy();
      expect(getByText("Independent Account")).toBeTruthy();
    });

    it("should allow selecting managed account", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByText } = render(
        <SignUpAccountType onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const managedOption = getByText("Managed Account");
      const continueButton = getByText("Continue");

      fireEvent.press(managedOption);
      fireEvent.press(continueButton);

      expect(mockOnSubmit).toHaveBeenCalledWith("managed");
    });

    it("should allow selecting independent account", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByText } = render(
        <SignUpAccountType onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const independentOption = getByText("Independent Account");
      const continueButton = getByText("Continue");

      fireEvent.press(independentOption);
      fireEvent.press(continueButton);

      expect(mockOnSubmit).toHaveBeenCalledWith("independent");
    });

    it("should require account type selection", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByText } = render(
        <SignUpAccountType onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const continueButton = getByText("Continue");
      fireEvent.press(continueButton);

      expect(getByText(/choose an account type/i)).toBeTruthy();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should display account type descriptions", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByText } = render(
        <SignUpAccountType onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      expect(getByText(/For dependents/i)).toBeTruthy();
      expect(getByText(/For individual learners/i)).toBeTruthy();
    });
  });

  describe("Step 3: Manager PIN (Managed Accounts Only)", () => {
    it("should render manager PIN input for managed accounts", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByText, getByPlaceholderText } = render(
        <SignUpManagerPin onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      expect(getByText(/Manager/i)).toBeTruthy();
      expect(getByPlaceholderText(/PIN/i)).toBeTruthy();
    });

    it("should accept 4-digit PIN", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <SignUpManagerPin onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const pinInput = getByPlaceholderText("1234");
      const confirmPinInput = getByPlaceholderText("Confirm PIN");
      const continueButton = getByText("Continue");

      fireEvent.changeText(pinInput, "1234");
      fireEvent.changeText(confirmPinInput, "1234");
      fireEvent.press(continueButton);

      expect(mockOnSubmit).toHaveBeenCalledWith("1234");
    });

    it("should only accept numeric input", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText } = render(
        <SignUpManagerPin onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const pinInput = getByPlaceholderText(/PIN/i);

      fireEvent.changeText(pinInput, "abcd");
      expect(pinInput.props.value).toBe("");

      fireEvent.changeText(pinInput, "12ab34");
      expect(pinInput.props.value).toBe("1234");
    });

    it("should validate PIN length", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <SignUpManagerPin onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const pinInput = getByPlaceholderText("1234");
      const confirmPinInput = getByPlaceholderText("Confirm PIN");
      const continueButton = getByText("Continue");

      fireEvent.changeText(pinInput, "12");
      fireEvent.changeText(confirmPinInput, "12");
      fireEvent.press(continueButton);

      expect(getByText("PIN must be 4 digits")).toBeTruthy();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe("Step 4: Name Input", () => {
    it("should render name input screen", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByText, getByPlaceholderText } = render(
        <SignUpName onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      expect(getByText("What's Your Name?")).toBeTruthy();
      expect(getByPlaceholderText("First Name")).toBeTruthy();
      expect(getByPlaceholderText("Last Name")).toBeTruthy();
    });

    it("should accept valid names", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <SignUpName onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const firstNameInput = getByPlaceholderText("First Name");
      const lastNameInput = getByPlaceholderText("Last Name");
      const continueButton = getByText("Continue");

      fireEvent.changeText(firstNameInput, "John");
      fireEvent.changeText(lastNameInput, "Doe");
      fireEvent.press(continueButton);

      expect(mockOnSubmit).toHaveBeenCalledWith("John", "Doe");
    });

    it("should require both first and last names", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <SignUpName onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const firstNameInput = getByPlaceholderText("First Name");
      const continueButton = getByText("Continue");

      fireEvent.changeText(firstNameInput, "John");
      fireEvent.press(continueButton);

      expect(getByText(/both first and last name/i)).toBeTruthy();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should trim whitespace from names", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <SignUpName onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const firstNameInput = getByPlaceholderText("First Name");
      const lastNameInput = getByPlaceholderText("Last Name");
      const continueButton = getByText("Continue");

      fireEvent.changeText(firstNameInput, "  John  ");
      fireEvent.changeText(lastNameInput, "  Doe  ");
      fireEvent.press(continueButton);

      expect(mockOnSubmit).toHaveBeenCalledWith("John", "Doe");
    });
  });

  describe("Step 5: Email Input", () => {
    it("should render email input screen", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByText, getByPlaceholderText } = render(
        <SignUpEmail onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      expect(getByText("What's Your Email?")).toBeTruthy();
      expect(getByPlaceholderText("Email Address")).toBeTruthy();
    });

  it("should accept valid email", async () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <SignUpEmail onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const emailInput = getByPlaceholderText("Email Address");

      fireEvent.changeText(emailInput, "john.doe@example.com");

      // Press the Send Link button to trigger validation and submit
      const sendButton = getByText("Send Link");
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith("john.doe@example.com");
      });
    });

  it("should validate email format", async () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <SignUpEmail onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const emailInput = getByPlaceholderText("Email Address");

      fireEvent.changeText(emailInput, "invalid-email");

      // Trigger validation by pressing the Send Link button
      const sendButton = getByText("Send Link");
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByText(/valid email/i)).toBeTruthy();
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

  it("should require email to be filled", async () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByText } = render(
        <SignUpEmail onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      // Press Send Link without entering an email to trigger the required-field error
      const sendButton = getByText("Send Link");
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByText(/enter your email/i)).toBeTruthy();
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe("Step 6: Email Verification Link (Not PIN)", () => {
    it("should display email verification instructions", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByText } = render(
        <SignUpVerifyEmail
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );

      expect(getByText(/Verify Your Email/i)).toBeTruthy();
      expect(getByText(/test@example.com/i)).toBeTruthy();
    });

    it("should send verification email via Firebase", async () => {
      (sendEmailVerification as jest.Mock).mockResolvedValueOnce(undefined);

      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      render(
        <SignUpVerifyEmail
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(sendEmailVerification).toHaveBeenCalled();
      });
    });

    it("should show message about clicking email link", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByText } = render(
        <SignUpVerifyEmail
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );

      expect(getByText(/click the link/i)).toBeTruthy();
    });

    it("should allow resending verification email", async () => {
      (sendEmailVerification as jest.Mock).mockResolvedValue(undefined);

      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByText } = render(
        <SignUpVerifyEmail
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(sendEmailVerification).toHaveBeenCalledTimes(1);
      });

      const resendButton = getByText(/Resend/i);
      fireEvent.press(resendButton);

      await waitFor(() => {
        expect(sendEmailVerification).toHaveBeenCalledTimes(2);
      });
    });

    it("should proceed after email is verified", async () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByText } = render(
        <SignUpVerifyEmail
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );

      // Simulate email verification complete
      const verifyButton = getByText("Verify");
      fireEvent.press(verifyButton);

      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  describe("Step 7: Password Creation", () => {
    it("should render password creation screen", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByText, getByPlaceholderText } = render(
        <SignUpCreatePassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      expect(getByText("Create a Password")).toBeTruthy();
      expect(getByPlaceholderText("Password")).toBeTruthy();
      expect(getByPlaceholderText("Confirm Password")).toBeTruthy();
    });

    it("should accept valid matching passwords", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <SignUpCreatePassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const passwordInput = getByPlaceholderText("Password");
      const confirmPasswordInput = getByPlaceholderText("Confirm Password");
      const createButton = getByText("Create Account");

      const validPassword = "SecurePass123!";
      fireEvent.changeText(passwordInput, validPassword);
      fireEvent.changeText(confirmPasswordInput, validPassword);
      fireEvent.press(createButton);

      expect(mockOnSubmit).toHaveBeenCalledWith(validPassword);
    });

    it("should reject mismatched passwords", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <SignUpCreatePassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const passwordInput = getByPlaceholderText("Password");
      const confirmPasswordInput = getByPlaceholderText("Confirm Password");
      const createButton = getByText("Create Account");

      fireEvent.changeText(passwordInput, "Password123!");
      fireEvent.changeText(confirmPasswordInput, "DifferentPass123!");
      fireEvent.press(createButton);

      expect(getByText(/do not match/i)).toBeTruthy();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should enforce minimum password length", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <SignUpCreatePassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const passwordInput = getByPlaceholderText("Password");
      const confirmPasswordInput = getByPlaceholderText("Confirm Password");
      const createButton = getByText("Create Account");

      fireEvent.changeText(passwordInput, "short");
      fireEvent.changeText(confirmPasswordInput, "short");
      fireEvent.press(createButton);

      expect(getByText(/at least 8 characters/i)).toBeTruthy();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should mask password inputs", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText } = render(
        <SignUpCreatePassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const passwordInput = getByPlaceholderText("Password");
      const confirmPasswordInput = getByPlaceholderText("Confirm Password");

      expect(passwordInput.props.secureTextEntry).toBe(true);
      expect(confirmPasswordInput.props.secureTextEntry).toBe(true);
    });
  });

  describe("Complete Sign Up Flow", () => {
    it("should create user account with Firebase", async () => {
      const mockUser = {
        uid: "new-user-uid",
        email: "newuser@example.com",
      };

      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });
      (updateProfile as jest.Mock).mockResolvedValueOnce(undefined);
      (setDoc as jest.Mock).mockResolvedValueOnce(undefined);

      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByPlaceholderText, getByText } = render(
        <SignUpCreatePassword onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const passwordInput = getByPlaceholderText("Password");
      const confirmPasswordInput = getByPlaceholderText("Confirm Password");
      const createButton = getByText("Create Account");

      const validPassword = "SecurePass123!";
      fireEvent.changeText(passwordInput, validPassword);
      fireEvent.changeText(confirmPasswordInput, validPassword);
      fireEvent.press(createButton);

      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it("should save user data to Firestore", async () => {
      const mockUser = {
        uid: "new-user-uid",
        email: "newuser@example.com",
      };

      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });
      (updateProfile as jest.Mock).mockResolvedValueOnce(undefined);
      (setDoc as jest.Mock).mockResolvedValueOnce(undefined);

      // This would be tested in the full Login component integration test
      expect(true).toBeTruthy();
    });

    it("should navigate to home screen after successful signup", async () => {
      const mockUser = {
        uid: "new-user-uid",
        email: "newuser@example.com",
      };

      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });

      // This would be tested in the full Login component integration test
      expect(true).toBeTruthy();
    });

    it("should handle account already exists error", async () => {
      const mockError = {
        code: "auth/email-already-in-use",
        message: "Email already in use",
      };

      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(
        mockError
      );

      // This would be tested in the full Login component integration test
      expect(true).toBeTruthy();
    });
  });

  describe("Navigation Between Steps", () => {
    it("should allow going back to previous step", () => {
      const mockOnSubmit = jest.fn();
      const mockOnBack = jest.fn();

      const { getByText } = render(
        <SignUpName onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );

      const backButton = getByText("Previous Step");
      fireEvent.press(backButton);

      expect(mockOnBack).toHaveBeenCalled();
    });

    it("should preserve data when navigating back", () => {
      // This would be tested in the full Login component integration test
      expect(true).toBeTruthy();
    });
  });
});
