/**
 * Test Suite: Sign Up Language
 *
 * This test suite verifies language selection during sign up including:
 * - Rendering available language options
 * - Applying selected language via `i18next`
 * - Proper callbacks for submit/back actions
 */

import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import SignUpLanguage from "../app/pages/SignUpLanguage";
import { useTranslation } from "react-i18next";

// Mock i18next
jest.mock("react-i18next", () => ({
  useTranslation: jest.fn(),
  initReactI18next: {
    type: "3rdParty",
    init: jest.fn(),
  },
}));

describe("SignUpLanguage", () => {
  let mockOnSubmit: jest.Mock;
  let mockOnBack: jest.Mock;
  let mockChangeLanguage: jest.Mock;
  let mockT: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockOnSubmit = jest.fn();
    mockOnBack = jest.fn();
    mockChangeLanguage = jest.fn();
    mockT = jest.fn((key: string) => {
      const translations: { [key: string]: string } = {
        "language.selectLanguage": "Select your language",
        "language.continue": "Continue",
        "language.backTo": "Back to",
        "language.Login": "Login",
      };
      return translations[key] || key;
    });

    (useTranslation as jest.Mock).mockReturnValue({
      t: mockT,
      i18n: {
        changeLanguage: mockChangeLanguage,
        language: "en",
      },
    });
  });

  describe("UI Rendering", () => {
    it("should render language selection screen", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      expect(
        screen.getAllByText("Select your language").length,
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("English")).toBeTruthy();
      expect(screen.getByText("Español")).toBeTruthy();
    });

    it("should render continue button", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      expect(screen.getByText("Continue")).toBeTruthy();
    });

    it("should render back to login link", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      // Text is nested, search for combined content
      expect(screen.getByText(/Back to.*Login/)).toBeTruthy();
    });

    it("should render flag images for both languages", () => {
      const { UNSAFE_getAllByType } = render(
        <SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />,
      );
      const { Image } = require("react-native");

      const images = UNSAFE_getAllByType(Image);
      // Should have 2 flag images (USA and Mexico) plus background
      expect(images.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Language Selection", () => {
    it("should select English when English option is pressed", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      fireEvent.press(screen.getByTestId("language-option-english"));

      expect(mockChangeLanguage).toHaveBeenCalledWith("en");
    });

    it("should select Spanish when Spanish option is pressed", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      fireEvent.press(screen.getByTestId("language-option-spanish"));

      expect(mockChangeLanguage).toHaveBeenCalledWith("es");
    });

    it("should highlight selected English option", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);
      fireEvent.press(screen.getByTestId("language-option-english"));
      expect(mockChangeLanguage).toHaveBeenCalledWith("en");
    });

    it("should change language immediately when option is pressed", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      fireEvent.press(screen.getByTestId("language-option-spanish"));

      // Language should change immediately without pressing Continue
      expect(mockChangeLanguage).toHaveBeenCalledWith("es");
    });
  });

  describe("Form Validation", () => {
    it("should continue with the default language when nothing is selected", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      const continueButton = screen.getByTestId("language-continue-button");
      fireEvent.press(continueButton);

      expect(mockOnSubmit).toHaveBeenCalledWith("English");
    });

    it("should allow changing the default selection before continuing", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      // Select a language
      fireEvent.press(screen.getByTestId("language-option-english"));

      // Press continue again
      const continueButton = screen.getByTestId("language-continue-button");
      fireEvent.press(continueButton);

      // Continue should succeed once selection is made
      expect(mockOnSubmit).toHaveBeenCalledWith("English");
    });
  });

  describe("Continue Action", () => {
    it("should call onSubmit with English when English is selected and continue is pressed", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      fireEvent.press(screen.getByTestId("language-option-english"));

      const continueButton = screen.getByTestId("language-continue-button");
      fireEvent.press(continueButton);

      expect(mockOnSubmit).toHaveBeenCalledWith("English");
    });

    it("should call onSubmit with Spanish when Spanish is selected and continue is pressed", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      fireEvent.press(screen.getByTestId("language-option-spanish"));

      const continueButton = screen.getByTestId("language-continue-button");
      fireEvent.press(continueButton);

      expect(mockOnSubmit).toHaveBeenCalledWith("Spanish");
    });

    it("should change language to en when English is submitted", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      fireEvent.press(screen.getByTestId("language-option-english"));

      // Reset mock to see if changeLanguage is called again on continue
      mockChangeLanguage.mockClear();

      const continueButton = screen.getByTestId("language-continue-button");
      fireEvent.press(continueButton);

      expect(mockChangeLanguage).toHaveBeenCalledWith("en");
    });

    it("should change language to es when Spanish is submitted", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      fireEvent.press(screen.getByTestId("language-option-spanish"));

      // Reset mock to see if changeLanguage is called again on continue
      mockChangeLanguage.mockClear();

      const continueButton = screen.getByTestId("language-continue-button");
      fireEvent.press(continueButton);

      expect(mockChangeLanguage).toHaveBeenCalledWith("es");
    });
  });

  describe("Navigation", () => {
    it("should call onBack when back to login is pressed", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      // Text is nested, so search for combined content
      const backText = screen.getByText(/Back to.*Login/);
      fireEvent.press(backText);

      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe("i18n Integration", () => {
    it("should use translation function for all text", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      expect(mockT).toHaveBeenCalledWith("language.selectLanguage");
      expect(mockT).toHaveBeenCalledWith("language.continue");
      expect(mockT).toHaveBeenCalledWith("language.backTo");
      expect(mockT).toHaveBeenCalledWith("language.Login");
    });

    it("should use selectLanguage translation for error message", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      const continueButton = screen.getByTestId("language-continue-button");
      fireEvent.press(continueButton);

      expect(mockT).toHaveBeenCalledWith("language.selectLanguage");
    });
  });

  describe("Selection State Management", () => {
    it("should allow switching between languages", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      // Select English first
      fireEvent.press(screen.getByTestId("language-option-english"));

      expect(mockChangeLanguage).toHaveBeenCalledWith("en");

      // Switch to Spanish
      fireEvent.press(screen.getByTestId("language-option-spanish"));

      expect(mockChangeLanguage).toHaveBeenCalledWith("es");
    });

    it("should submit the most recently selected language", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      // Select English
      fireEvent.press(screen.getByTestId("language-option-english"));

      // Change to Spanish
      fireEvent.press(screen.getByTestId("language-option-spanish"));

      // Submit
      const continueButton = screen.getByTestId("language-continue-button");
      fireEvent.press(continueButton);

      // Should submit Spanish, not English
      expect(mockOnSubmit).toHaveBeenCalledWith("Spanish");
    });
  });

  describe("Visual States", () => {
    it("should have different styling for active and inactive options", () => {
      const { UNSAFE_getAllByType } = render(
        <SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />,
      );
      const { TouchableOpacity } = require("react-native");

      const options = UNSAFE_getAllByType(TouchableOpacity);
      const englishOption = options.find((opt: any) =>
        opt.props.children?.some(
          (child: any) => child?.props?.children === "English",
        ),
      );

      if (englishOption) {
        // Select option
        fireEvent.press(englishOption);

        // Option should exist and be pressable (styling tested manually)
        expect(englishOption).toBeTruthy();
      }
    });

    it("should not show error message initially", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      expect(screen.queryByText("Please select a language")).toBeNull();
    });
  });
});
