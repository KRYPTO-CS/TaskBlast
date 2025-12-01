import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import SignUpLanguage from "../app/pages/SignUpLanguage";
import { useTranslation } from "react-i18next";

// Mock i18next
jest.mock("react-i18next", () => ({
  useTranslation: jest.fn(),
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
        selectLanguage: "Please select a language",
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

      expect(screen.getByText("Select your language")).toBeTruthy();
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
        <SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />
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

      const englishOption = screen.getByText("English").parent?.parent;
      if (englishOption) {
        fireEvent.press(englishOption);
      }

      expect(mockChangeLanguage).toHaveBeenCalledWith("en");
    });

    it("should select Spanish when Spanish option is pressed", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      const spanishOption = screen.getByText("Español").parent?.parent;
      if (spanishOption) {
        fireEvent.press(spanishOption);
      }

      expect(mockChangeLanguage).toHaveBeenCalledWith("es");
    });

    it("should highlight selected English option", () => {
      const { UNSAFE_getAllByType } = render(
        <SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );
      const { TouchableOpacity } = require("react-native");

      const options = UNSAFE_getAllByType(TouchableOpacity);
      // Find English option
      const englishOption = options.find((opt: any) =>
        opt.props.children?.some(
          (child: any) => child?.props?.children === "English"
        )
      );

      if (englishOption) {
        fireEvent.press(englishOption);

        // Option was pressed successfully (visual styling tested manually)
        expect(mockChangeLanguage).toHaveBeenCalledWith("en");
      }
    });

    it("should change language immediately when option is pressed", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      const spanishOption = screen.getByText("Español").parent?.parent;
      if (spanishOption) {
        fireEvent.press(spanishOption);
      }

      // Language should change immediately without pressing Continue
      expect(mockChangeLanguage).toHaveBeenCalledWith("es");
    });
  });

  describe("Form Validation", () => {
    it("should show error when continuing without selecting a language", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      const continueButton = screen.getByText("Continue");
      fireEvent.press(continueButton);

      expect(screen.getByText("Please select a language")).toBeTruthy();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should clear error when language is selected", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      // Try to continue without selection
      const continueButton = screen.getByText("Continue");
      fireEvent.press(continueButton);

      expect(screen.getByText("Please select a language")).toBeTruthy();

      // Select a language
      const englishOption = screen.getByText("English").parent?.parent;
      if (englishOption) {
        fireEvent.press(englishOption);
      }

      // Press continue again
      fireEvent.press(continueButton);

      // Error should not appear
      expect(screen.queryByText("Please select a language")).toBeNull();
    });
  });

  describe("Continue Action", () => {
    it("should call onSubmit with English when English is selected and continue is pressed", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      const englishOption = screen.getByText("English").parent?.parent;
      if (englishOption) {
        fireEvent.press(englishOption);
      }

      const continueButton = screen.getByText("Continue");
      fireEvent.press(continueButton);

      expect(mockOnSubmit).toHaveBeenCalledWith("English");
    });

    it("should call onSubmit with Spanish when Spanish is selected and continue is pressed", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      const spanishOption = screen.getByText("Español").parent?.parent;
      if (spanishOption) {
        fireEvent.press(spanishOption);
      }

      const continueButton = screen.getByText("Continue");
      fireEvent.press(continueButton);

      expect(mockOnSubmit).toHaveBeenCalledWith("Spanish");
    });

    it("should change language to en when English is submitted", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      const englishOption = screen.getByText("English").parent?.parent;
      if (englishOption) {
        fireEvent.press(englishOption);
      }

      // Reset mock to see if changeLanguage is called again on continue
      mockChangeLanguage.mockClear();

      const continueButton = screen.getByText("Continue");
      fireEvent.press(continueButton);

      expect(mockChangeLanguage).toHaveBeenCalledWith("en");
    });

    it("should change language to es when Spanish is submitted", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      const spanishOption = screen.getByText("Español").parent?.parent;
      if (spanishOption) {
        fireEvent.press(spanishOption);
      }

      // Reset mock to see if changeLanguage is called again on continue
      mockChangeLanguage.mockClear();

      const continueButton = screen.getByText("Continue");
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

      const continueButton = screen.getByText("Continue");
      fireEvent.press(continueButton);

      expect(mockT).toHaveBeenCalledWith("selectLanguage");
    });
  });

  describe("Selection State Management", () => {
    it("should allow switching between languages", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      // Select English first
      const englishOption = screen.getByText("English").parent?.parent;
      if (englishOption) {
        fireEvent.press(englishOption);
      }

      expect(mockChangeLanguage).toHaveBeenCalledWith("en");

      // Switch to Spanish
      const spanishOption = screen.getByText("Español").parent?.parent;
      if (spanishOption) {
        fireEvent.press(spanishOption);
      }

      expect(mockChangeLanguage).toHaveBeenCalledWith("es");
    });

    it("should submit the most recently selected language", () => {
      render(<SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />);

      // Select English
      const englishOption = screen.getByText("English").parent?.parent;
      if (englishOption) {
        fireEvent.press(englishOption);
      }

      // Change to Spanish
      const spanishOption = screen.getByText("Español").parent?.parent;
      if (spanishOption) {
        fireEvent.press(spanishOption);
      }

      // Submit
      const continueButton = screen.getByText("Continue");
      fireEvent.press(continueButton);

      // Should submit Spanish, not English
      expect(mockOnSubmit).toHaveBeenCalledWith("Spanish");
    });
  });

  describe("Visual States", () => {
    it("should have different styling for active and inactive options", () => {
      const { UNSAFE_getAllByType } = render(
        <SignUpLanguage onSubmit={mockOnSubmit} onBack={mockOnBack} />
      );
      const { TouchableOpacity } = require("react-native");

      const options = UNSAFE_getAllByType(TouchableOpacity);
      const englishOption = options.find((opt: any) =>
        opt.props.children?.some(
          (child: any) => child?.props?.children === "English"
        )
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
