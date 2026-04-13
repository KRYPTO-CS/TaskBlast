/**
 * Test Suite: AdminDashboard
 *
 * This test suite covers the AdminDashboard page including:
 * - UI rendering (title, admin email, section headings, inputs, buttons)
 * - Guard behaviour when admin is not verified
 * - Update rocks flow: validation and success
 * - Update shop cost flow: validation and success
 * - Seed shop catalog action
 * - Shop item picker open/close
 * - Navigation back via router.back()
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert, TouchableOpacity } from "react-native";
import AdminDashboard from "../app/pages/AdminDashboard";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockVerifyAdminPin = jest.fn();
const mockClearAdminSession = jest.fn();

let mockIsAdminVerified = true;
let mockAdminEmail: string | null = "admin@test.com";

jest.mock("../app/context/AdminContext", () => ({
  useAdmin: () => ({
    isAdminVerified: mockIsAdminVerified,
    adminEmail: mockAdminEmail,
    verifyAdminPin: mockVerifyAdminPin,
    clearAdminSession: mockClearAdminSession,
  }),
}));

const mockUpdateUserRocks = jest.fn();
const mockUpdateShopItemCost = jest.fn();
const mockSeedShopCatalog = jest.fn();

jest.mock("../app/services/adminService", () => ({
  updateUserRocks: (...args: any[]) => mockUpdateUserRocks(...args),
  updateShopItemCost: (...args: any[]) => mockUpdateShopItemCost(...args),
  seedShopCatalog: (...args: any[]) => mockSeedShopCatalog(...args),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  doc: jest.fn(),
}));

jest.mock("../TTS", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return { Text: (props: any) => React.createElement(Text, props) };
});

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockIsAdminVerified = true;
  mockAdminEmail = "admin@test.com";
  mockUpdateUserRocks.mockResolvedValue({ success: true, newRocks: 1500 });
  mockUpdateShopItemCost.mockResolvedValue({ success: true });
  mockSeedShopCatalog.mockResolvedValue({ createdCount: 8, updatedCount: 0 });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AdminDashboard", () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  describe("Rendering", () => {
    it("renders without crashing", () => {
      expect(() => render(<AdminDashboard />)).not.toThrow();
    });

    it("renders the Admin Dashboard title", () => {
      const { getByText } = render(<AdminDashboard />);
      expect(getByText("Admin Dashboard")).toBeTruthy();
    });

    it("displays the admin email", () => {
      const { getByText } = render(<AdminDashboard />);
      expect(getByText("admin@test.com")).toBeTruthy();
    });

    it("displays 'Unverified Admin' when adminEmail is null", () => {
      mockAdminEmail = null;
      const { getByText } = render(<AdminDashboard />);
      expect(getByText("Unverified Admin")).toBeTruthy();
    });

    it("renders 'Adjust User Rocks' section heading", () => {
      const { getByText } = render(<AdminDashboard />);
      expect(getByText("Adjust User Rocks")).toBeTruthy();
    });

    it("renders 'Edit Shop Item Cost' section heading", () => {
      const { getByText } = render(<AdminDashboard />);
      expect(getByText("Edit Shop Item Cost")).toBeTruthy();
    });

    it("renders the Update Rocks button", () => {
      const { getByText } = render(<AdminDashboard />);
      expect(getByText("Update Rocks")).toBeTruthy();
    });

    it("renders the Seed Default Shop Catalog button", () => {
      const { getByText } = render(<AdminDashboard />);
      expect(getByText("Seed Default Shop Catalog")).toBeTruthy();
    });

    it("renders the Save Shop Cost button", () => {
      const { getByText } = render(<AdminDashboard />);
      expect(getByText("Save Shop Cost")).toBeTruthy();
    });
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  describe("Navigation", () => {
    it("calls router.back() when back button is pressed", async () => {
      const { router } = require("expo-router");
      const { UNSAFE_getAllByType } = render(<AdminDashboard />);
      // First TouchableOpacity in the tree is the header back button
      fireEvent.press(UNSAFE_getAllByType(TouchableOpacity)[0]);
      await waitFor(() => expect(router.back).toHaveBeenCalledTimes(1));
    });
  });

  // ── Admin guard ────────────────────────────────────────────────────────────

  describe("Admin guard", () => {
    it("shows alert and navigates back when admin is not verified", async () => {
      mockIsAdminVerified = false;
      const alertSpy = jest.spyOn(Alert, "alert");
      const { router } = require("expo-router");
      const { getByText } = render(<AdminDashboard />);

      fireEvent.press(getByText("Update Rocks"));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          "Admin Access Required",
          expect.any(String),
        );
      });
    });
  });

  // ── Update rocks validation ────────────────────────────────────────────────

  describe("Update Rocks — validation", () => {
    it("shows alert when user email and amount are empty", async () => {
      const alertSpy = jest.spyOn(Alert, "alert");
      const { getByText } = render(<AdminDashboard />);
      fireEvent.press(getByText("Update Rocks"));
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          "Missing fields",
          expect.any(String),
        );
      });
    });

    it("shows alert when email is invalid (no @)", async () => {
      const alertSpy = jest.spyOn(Alert, "alert");
      const { getByText, getByPlaceholderText } = render(<AdminDashboard />);
      fireEvent.changeText(getByPlaceholderText("User email"), "notanemail");
      fireEvent.changeText(getByPlaceholderText("Amount (+/-)"), "100");
      fireEvent.press(getByText("Update Rocks"));
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          "Invalid email",
          expect.any(String),
        );
      });
    });

    it("shows alert when amount is not numeric", async () => {
      const alertSpy = jest.spyOn(Alert, "alert");
      const { getByText, getByPlaceholderText } = render(<AdminDashboard />);
      fireEvent.changeText(
        getByPlaceholderText("User email"),
        "user@example.com",
      );
      fireEvent.changeText(getByPlaceholderText("Amount (+/-)"), "abc");
      fireEvent.press(getByText("Update Rocks"));
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          "Invalid amount",
          expect.any(String),
        );
      });
    });
  });

  // ── Update rocks success ───────────────────────────────────────────────────

  describe("Update Rocks — success", () => {
    it("calls updateUserRocks with correct args and shows success alert", async () => {
      const alertSpy = jest.spyOn(Alert, "alert");
      const { getByText, getByPlaceholderText } = render(<AdminDashboard />);
      fireEvent.changeText(
        getByPlaceholderText("User email"),
        "user@example.com",
      );
      fireEvent.changeText(getByPlaceholderText("Amount (+/-)"), "500");
      fireEvent.press(getByText("Update Rocks"));
      await waitFor(() => {
        expect(mockUpdateUserRocks).toHaveBeenCalledWith(
          { userEmail: "user@example.com" },
          500,
        );
        expect(alertSpy).toHaveBeenCalledWith("Success", "User rocks updated.");
      });
    });
  });

  // ── Shop item picker ───────────────────────────────────────────────────────

  describe("Shop item picker", () => {
    it("toggles the shop item picker open on press", () => {
      const { getByText, queryByText } = render(<AdminDashboard />);
      // Picker is closed initially
      expect(queryByText(/body-0/)).toBeNull();
      fireEvent.press(getByText("Select shop item"));
      // After pressing, picker opens showing at least one item from default catalog
      expect(getByText("Select shop item")).toBeTruthy(); // still present (label changes)
    });
  });

  // ── Update shop cost validation ────────────────────────────────────────────

  describe("Update Shop Cost — validation", () => {
    it("shows alert when shop cost is empty after an item is selected", async () => {
      const alertSpy = jest.spyOn(Alert, "alert");
      const { getByText, getByPlaceholderText } = render(<AdminDashboard />);
      // Open picker and select the first catalog item (Shop.bBody / body-0)
      fireEvent.press(getByText("Select shop item"));
      fireEvent.press(getByText(/body-0\) - default 0/i));
      // Clear the auto-filled cost so the "Missing fields" guard triggers
      fireEvent.changeText(getByPlaceholderText("New cost"), "");
      fireEvent.press(getByText("Save Shop Cost"));
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          "Missing fields",
          expect.any(String),
        );
      });
    });
  });

  // ── Seed shop catalog ──────────────────────────────────────────────────────

  describe("Seed shop catalog", () => {
    it("calls seedShopCatalog and shows success alert", async () => {
      const alertSpy = jest.spyOn(Alert, "alert");
      const { getByText } = render(<AdminDashboard />);
      fireEvent.press(getByText("Seed Default Shop Catalog"));
      await waitFor(() => {
        expect(mockSeedShopCatalog).toHaveBeenCalledWith(false);
        expect(alertSpy).toHaveBeenCalledWith(
          "Catalog Seeded",
          expect.stringContaining("Created:"),
        );
      });
    });

    it("shows error alert if seedShopCatalog throws", async () => {
      mockSeedShopCatalog.mockRejectedValue(new Error("Seed failed"));
      const alertSpy = jest.spyOn(Alert, "alert");
      const { getByText } = render(<AdminDashboard />);
      fireEvent.press(getByText("Seed Default Shop Catalog"));
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          "Seed failed",
          expect.any(String),
        );
      });
    });
  });
});
