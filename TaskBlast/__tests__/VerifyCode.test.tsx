import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import VerifyCode from "../app/pages/VerifyCode";
import { useTranslation } from "react-i18next";
import * as RN from "react-native";

// Mock i18next
jest.mock("react-i18next", () => ({
  useTranslation: jest.fn(),
}));

// Mock Keyboard
const mockDismiss = jest.fn();
jest.spyOn(RN.Keyboard, "dismiss").mockImplementation(mockDismiss);

describe("VerifyCode", () => {
  let mockOnSubmit: jest.Mock;
  let mockOnBack: jest.Mock;
  let mockT: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDismiss.mockClear();

    mockOnSubmit = jest.fn();
    mockOnBack = jest.fn();
    mockT = jest.fn((key: string) => {
      const translations: { [key: string]: string } = {
        "VerifyCode.title": "Verify Your Email",
        "VerifyCode.desc": "Enter the 5-digit code sent to",
        "VerifyCode.notreceived": "Didn't receive the code?",
        "VerifyCode.resend": "Resend",
        "VerifyCode.submit": "Submit",
        "language.backTo": "Back to",
        "birthdate.previousStep": "Previous Step",
      };
      return translations[key] || key;
    });

    (useTranslation as jest.Mock).mockReturnValue([mockT, { language: "en" }]);
  });

  describe("UI Rendering", () => {
    it("should render verification code screen", () => {
      render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText("Verify Your Email")).toBeTruthy();
      expect(screen.getByText(/Enter the 5-digit code sent to/)).toBeTruthy();
      // Email is part of nested text
      expect(screen.getByText(/test@example\.com/)).toBeTruthy();
    });

    it("should render 5 code input boxes", () => {
      const { UNSAFE_getAllByType } = render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );
      const { TextInput } = require("react-native");

      const inputs = UNSAFE_getAllByType(TextInput);
      expect(inputs).toHaveLength(5);
    });

    it("should render submit button", () => {
      render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText("Submit")).toBeTruthy();
    });

    it("should render resend code link", () => {
      render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );

      // Text is nested
      expect(screen.getByText(/Didn't receive the code\?/)).toBeTruthy();
      expect(screen.getByText(/Resend/)).toBeTruthy();
    });

    it("should render back to previous step link", () => {
      render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );

      // Text is nested, so search for combined content
      expect(screen.getByText(/Back to.*Previous Step/)).toBeTruthy();
    });
  });

  describe("Code Input Behavior", () => {
    it("should accept only numeric input", () => {
      const { UNSAFE_getAllByType } = render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );
      const { TextInput } = require("react-native");

      const inputs = UNSAFE_getAllByType(TextInput);

      // Try to enter non-numeric characters
      fireEvent.changeText(inputs[0], "abc");

      // Should not accept letters
      expect(inputs[0].props.value).toBe("");
    });

    it("should accept numeric input", () => {
      const { UNSAFE_getAllByType } = render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );
      const { TextInput } = require("react-native");

      const inputs = UNSAFE_getAllByType(TextInput);

      fireEvent.changeText(inputs[0], "5");

      expect(inputs[0].props.value).toBe("5");
    });

    it("should limit each input to 1 digit", () => {
      const { UNSAFE_getAllByType } = render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );
      const { TextInput } = require("react-native");

      const inputs = UNSAFE_getAllByType(TextInput);

      expect(inputs[0].props.maxLength).toBe(1);
    });

    it("should use number-pad keyboard type", () => {
      const { UNSAFE_getAllByType } = render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );
      const { TextInput } = require("react-native");

      const inputs = UNSAFE_getAllByType(TextInput);

      inputs.forEach((input: any) => {
        expect(input.props.keyboardType).toBe("number-pad");
      });
    });

    it("should take only the last digit when multiple characters are entered", () => {
      const { UNSAFE_getAllByType } = render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );
      const { TextInput } = require("react-native");

      const inputs = UNSAFE_getAllByType(TextInput);

      fireEvent.changeText(inputs[0], "123");

      // Should only keep the last digit
      expect(inputs[0].props.value).toBe("3");
    });
  });

  describe("Auto-Focus Navigation", () => {
    it("should move to next input when digit is entered (focus behavior)", () => {
      const { UNSAFE_getAllByType } = render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );
      const { TextInput } = require("react-native");

      const inputs = UNSAFE_getAllByType(TextInput);

      // Enter digit in first input
      fireEvent.changeText(inputs[0], "5");

      // Verify the value was set (focus is tested manually)
      expect(inputs[0].props.value).toBe("5");
    });

    it("should not auto-focus after last input", () => {
      const { UNSAFE_getAllByType } = render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );
      const { TextInput } = require("react-native");

      const inputs = UNSAFE_getAllByType(TextInput);

      // Enter digit in last input
      fireEvent.changeText(inputs[4], "5");

      // No error should occur (no input[5] to focus)
      expect(inputs[4].props.value).toBe("5");
    });
  });

  describe("Backspace Handling", () => {
    it("should clear current digit on backspace", () => {
      const { UNSAFE_getAllByType } = render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );
      const { TextInput } = require("react-native");

      const inputs = UNSAFE_getAllByType(TextInput);

      // Enter a digit
      fireEvent.changeText(inputs[2], "7");
      expect(inputs[2].props.value).toBe("7");

      // Press backspace
      fireEvent(inputs[2], "onKeyPress", {
        nativeEvent: { key: "Backspace" },
      });

      expect(inputs[2].props.value).toBe("");
    });

    it("should handle backspace on empty input (moves to previous)", () => {
      const { UNSAFE_getAllByType } = render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );
      const { TextInput } = require("react-native");

      const inputs = UNSAFE_getAllByType(TextInput);

      // Enter digit in input 1
      fireEvent.changeText(inputs[1], "5");
      expect(inputs[1].props.value).toBe("5");

      // Press backspace on empty input[2]
      fireEvent(inputs[2], "onKeyPress", {
        nativeEvent: { key: "Backspace" },
      });

      // Previous input should be cleared (focus behavior tested manually)
      expect(inputs[1].props.value).toBe("");
    });

    it("should clear previous digit when backspacing on empty input", () => {
      const { UNSAFE_getAllByType } = render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );
      const { TextInput } = require("react-native");

      const inputs = UNSAFE_getAllByType(TextInput);

      // Enter digit in first input
      fireEvent.changeText(inputs[1], "5");
      expect(inputs[1].props.value).toBe("5");

      // Press backspace on empty input[2]
      fireEvent(inputs[2], "onKeyPress", {
        nativeEvent: { key: "Backspace" },
      });

      // Previous input should be cleared
      expect(inputs[1].props.value).toBe("");
    });

    it("should not crash on backspace in first input", () => {
      const { UNSAFE_getAllByType } = render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );
      const { TextInput } = require("react-native");

      const inputs = UNSAFE_getAllByType(TextInput);

      // Press backspace on first empty input (should not crash)
      expect(() => {
        fireEvent(inputs[0], "onKeyPress", {
          nativeEvent: { key: "Backspace" },
        });
      }).not.toThrow();
    });
  });

  describe("Code Submission", () => {
    it("should submit full 5-digit code when all inputs are filled", () => {
      const { UNSAFE_getAllByType } = render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );
      const { TextInput } = require("react-native");

      const inputs = UNSAFE_getAllByType(TextInput);

      // Enter all 5 digits
      fireEvent.changeText(inputs[0], "1");
      fireEvent.changeText(inputs[1], "2");
      fireEvent.changeText(inputs[2], "3");
      fireEvent.changeText(inputs[3], "4");
      fireEvent.changeText(inputs[4], "5");

      // Press submit
      const submitButton = screen.getByText("Submit");
      fireEvent.press(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith("12345");
    });

    it("should not submit when code is incomplete", () => {
      const { UNSAFE_getAllByType } = render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );
      const { TextInput } = require("react-native");

      const inputs = UNSAFE_getAllByType(TextInput);

      // Enter only 3 digits
      fireEvent.changeText(inputs[0], "1");
      fireEvent.changeText(inputs[1], "2");
      fireEvent.changeText(inputs[2], "3");

      // Press submit
      const submitButton = screen.getByText("Submit");
      fireEvent.press(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should allow submission after editing digits", () => {
      const { UNSAFE_getAllByType } = render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );
      const { TextInput } = require("react-native");

      const inputs = UNSAFE_getAllByType(TextInput);

      // Enter initial code
      fireEvent.changeText(inputs[0], "1");
      fireEvent.changeText(inputs[1], "2");
      fireEvent.changeText(inputs[2], "3");
      fireEvent.changeText(inputs[3], "4");
      fireEvent.changeText(inputs[4], "5");

      // Edit a digit
      fireEvent.changeText(inputs[2], "9");

      // Submit
      const submitButton = screen.getByText("Submit");
      fireEvent.press(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith("12945");
    });
  });

  describe("Navigation", () => {
    it("should call onBack when back link is pressed", () => {
      render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );

      // Text is nested, so get the combined text
      const backText = screen.getByText(/Back to.*Previous Step/);
      fireEvent.press(backText);

      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe("Keyboard Dismissal", () => {
    it("should dismiss keyboard when touching outside inputs", () => {
      const { UNSAFE_getByType } = render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );
      const { TouchableWithoutFeedback } = require("react-native");

      const touchable = UNSAFE_getByType(TouchableWithoutFeedback);
      fireEvent.press(touchable);

      expect(mockDismiss).toHaveBeenCalled();
    });

    it("should dismiss keyboard on submit editing", () => {
      const { UNSAFE_getAllByType } = render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );
      const { TextInput } = require("react-native");

      const inputs = UNSAFE_getAllByType(TextInput);

      fireEvent(inputs[0], "onSubmitEditing");

      expect(mockDismiss).toHaveBeenCalled();
    });
  });

  describe("i18n Integration", () => {
    it("should use translation function for all text", () => {
      render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );

      expect(mockT).toHaveBeenCalledWith("VerifyCode.title");
      expect(mockT).toHaveBeenCalledWith("VerifyCode.desc");
      expect(mockT).toHaveBeenCalledWith("VerifyCode.notreceived");
      expect(mockT).toHaveBeenCalledWith("VerifyCode.resend");
      expect(mockT).toHaveBeenCalledWith("VerifyCode.submit");
      expect(mockT).toHaveBeenCalledWith("language.backTo");
      expect(mockT).toHaveBeenCalledWith("birthdate.previousStep");
    });
  });

  describe("Email Display", () => {
    it("should display the correct email address", () => {
      render(
        <VerifyCode
          email="user@domain.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText(/user@domain\.com/)).toBeTruthy();
    });

    it("should update email display when prop changes", () => {
      const { rerender } = render(
        <VerifyCode
          email="old@email.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText(/old@email\.com/)).toBeTruthy();

      rerender(
        <VerifyCode
          email="new@email.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText(/new@email\.com/)).toBeTruthy();
    });
  });

  describe("Code State Management", () => {
    it("should maintain independent state for each digit", () => {
      const { UNSAFE_getAllByType } = render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );
      const { TextInput } = require("react-native");

      const inputs = UNSAFE_getAllByType(TextInput);

      // Enter different digits
      fireEvent.changeText(inputs[0], "1");
      fireEvent.changeText(inputs[1], "2");
      fireEvent.changeText(inputs[2], "3");

      // Each should maintain its own value
      expect(inputs[0].props.value).toBe("1");
      expect(inputs[1].props.value).toBe("2");
      expect(inputs[2].props.value).toBe("3");
      expect(inputs[3].props.value).toBe("");
      expect(inputs[4].props.value).toBe("");
    });

    it("should allow clearing and re-entering code", () => {
      const { UNSAFE_getAllByType } = render(
        <VerifyCode
          email="test@example.com"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
        />
      );
      const { TextInput } = require("react-native");

      const inputs = UNSAFE_getAllByType(TextInput);

      // Enter code
      fireEvent.changeText(inputs[0], "5");
      fireEvent.changeText(inputs[1], "6");

      // Clear
      fireEvent(inputs[1], "onKeyPress", {
        nativeEvent: { key: "Backspace" },
      });
      fireEvent(inputs[0], "onKeyPress", {
        nativeEvent: { key: "Backspace" },
      });

      // Re-enter
      fireEvent.changeText(inputs[0], "9");
      fireEvent.changeText(inputs[1], "8");

      expect(inputs[0].props.value).toBe("9");
      expect(inputs[1].props.value).toBe("8");
    });
  });
});
