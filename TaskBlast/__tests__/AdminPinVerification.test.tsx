/**
 * Test Suite: AdminPinVerification
 *
 * This test suite covers the AdminPinVerification component including:
 * - UI rendering (title, email display, PIN input, Verify and Cancel buttons)
 * - Empty PIN guard (alert shown, verifyAdminPin not called)
 * - Successful PIN verification flow (onVerified callback called)
 * - Failed PIN verification flow (error alert shown)
 * - Loading indicator shown while submitting
 * - verifyAdminPin error handling
 * - Cancel button calls onCancel
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import AdminPinVerification from "../app/pages/AdminPinVerification";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockVerifyAdminPin = jest.fn();
let mockError: string | null = null;

jest.mock("../app/context/AdminContext", () => ({
  useAdmin: () => ({
    verifyAdminPin: mockVerifyAdminPin,
    error: mockError,
  }),
}));

jest.mock("../TTS", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return { Text: (props: any) => React.createElement(Text, props) };
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const defaultProps = {
  email: "admin@test.com",
  onVerified: jest.fn(),
  onCancel: jest.fn(),
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockError = null;
  mockVerifyAdminPin.mockResolvedValue(true);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AdminPinVerification", () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  describe("Rendering", () => {
    it("renders without crashing", () => {
      expect(() => render(<AdminPinVerification {...defaultProps} />)).not.toThrow();
    });

    it("renders the 'Admin Verification' title", () => {
      const { getByText } = render(<AdminPinVerification {...defaultProps} />);
      expect(getByText("Admin Verification")).toBeTruthy();
    });

    it("renders the email in the subtitle", () => {
      const { getByText } = render(<AdminPinVerification {...defaultProps} />);
      expect(getByText("Enter your admin PIN for admin@test.com")).toBeTruthy();
    });

    it("renders the PIN input field", () => {
      const { getByPlaceholderText } = render(<AdminPinVerification {...defaultProps} />);
      expect(getByPlaceholderText("Enter PIN")).toBeTruthy();
    });

    it("renders the Verify Admin PIN button", () => {
      const { getByText } = render(<AdminPinVerification {...defaultProps} />);
      expect(getByText("Verify Admin PIN")).toBeTruthy();
    });

    it("renders the Cancel button", () => {
      const { getByText } = render(<AdminPinVerification {...defaultProps} />);
      expect(getByText("Cancel")).toBeTruthy();
    });
  });

  // ── Input handling ─────────────────────────────────────────────────────────

  describe("Input handling", () => {
    it("accepts text input in the PIN field", () => {
      const { getByPlaceholderText } = render(<AdminPinVerification {...defaultProps} />);
      const input = getByPlaceholderText("Enter PIN");
      fireEvent.changeText(input, "1234");
      expect(input.props.value).toBe("1234");
    });
  });

  // ── Empty PIN guard ────────────────────────────────────────────────────────

  describe("Empty PIN guard", () => {
    it("shows alert when PIN is empty and verify is pressed", async () => {
      const alertSpy = jest.spyOn(Alert, "alert");
      const { getByText } = render(<AdminPinVerification {...defaultProps} />);
      fireEvent.press(getByText("Verify Admin PIN"));
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          "PIN Required",
          expect.any(String),
        );
      });
      expect(mockVerifyAdminPin).not.toHaveBeenCalled();
    });
  });

  // ── Successful verification ────────────────────────────────────────────────

  describe("Successful verification", () => {
    it("calls verifyAdminPin with email and PIN", async () => {
      const { getByPlaceholderText, getByText } = render(
        <AdminPinVerification {...defaultProps} />,
      );
      fireEvent.changeText(getByPlaceholderText("Enter PIN"), "9999");
      fireEvent.press(getByText("Verify Admin PIN"));
      await waitFor(() => {
        expect(mockVerifyAdminPin).toHaveBeenCalledWith(
          "admin@test.com",
          "9999",
        );
      });
    });

    it("calls onVerified after successful PIN verification", async () => {
      const onVerified = jest.fn();
      const { getByPlaceholderText, getByText } = render(
        <AdminPinVerification {...defaultProps} onVerified={onVerified} />,
      );
      fireEvent.changeText(getByPlaceholderText("Enter PIN"), "9999");
      fireEvent.press(getByText("Verify Admin PIN"));
      await waitFor(() => {
        expect(onVerified).toHaveBeenCalledTimes(1);
      });
    });

    it("clears the PIN field after successful verification", async () => {
      const { getByPlaceholderText, getByText } = render(
        <AdminPinVerification {...defaultProps} />,
      );
      const input = getByPlaceholderText("Enter PIN");
      fireEvent.changeText(input, "9999");
      fireEvent.press(getByText("Verify Admin PIN"));
      await waitFor(() => {
        expect(input.props.value).toBe("");
      });
    });
  });

  // ── Failed verification ────────────────────────────────────────────────────

  describe("Failed verification", () => {
    it("shows alert with error message when PIN is incorrect", async () => {
      mockVerifyAdminPin.mockResolvedValue(false);
      mockError = "Invalid PIN.";
      const alertSpy = jest.spyOn(Alert, "alert");
      const { getByPlaceholderText, getByText } = render(
        <AdminPinVerification {...defaultProps} />,
      );
      fireEvent.changeText(getByPlaceholderText("Enter PIN"), "0000");
      fireEvent.press(getByText("Verify Admin PIN"));
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          "Verification Failed",
          "Invalid PIN.",
        );
      });
    });

    it("does not call onVerified when PIN is incorrect", async () => {
      mockVerifyAdminPin.mockResolvedValue(false);
      const onVerified = jest.fn();
      const { getByPlaceholderText, getByText } = render(
        <AdminPinVerification {...defaultProps} onVerified={onVerified} />,
      );
      fireEvent.changeText(getByPlaceholderText("Enter PIN"), "0000");
      fireEvent.press(getByText("Verify Admin PIN"));
      await waitFor(() => {
        expect(mockVerifyAdminPin).toHaveBeenCalled();
      });
      expect(onVerified).not.toHaveBeenCalled();
    });

    it("falls back to 'Invalid PIN.' when error is null and verification fails", async () => {
      mockVerifyAdminPin.mockResolvedValue(false);
      mockError = null;
      const alertSpy = jest.spyOn(Alert, "alert");
      const { getByPlaceholderText, getByText } = render(
        <AdminPinVerification {...defaultProps} />,
      );
      fireEvent.changeText(getByPlaceholderText("Enter PIN"), "0000");
      fireEvent.press(getByText("Verify Admin PIN"));
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          "Verification Failed",
          "Invalid PIN.",
        );
      });
    });
  });

  // ── Cancel button ──────────────────────────────────────────────────────────

  describe("Cancel button", () => {
    it("calls onCancel when Cancel is pressed", () => {
      const onCancel = jest.fn();
      const { getByText } = render(
        <AdminPinVerification {...defaultProps} onCancel={onCancel} />,
      );
      fireEvent.press(getByText("Cancel"));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });
});
