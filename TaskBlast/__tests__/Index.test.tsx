import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import Index from "../app/index";
import { router } from "expo-router";
import { useAdmin } from "../app/context/AdminContext";
import { useActiveProfile } from "../app/context/ActiveProfileContext";
import { auth } from "../server/firebase";

describe("App startup routing", () => {
  const mockCheckEligibility = jest.fn();
  const mockClearAdminSession = jest.fn();
  const mockRefreshProfile = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as any).authStateReady = undefined;
    (auth as any).currentUser = {
      uid: "test-uid",
      email: "test@example.com",
      emailVerified: true,
    };

    (useAdmin as jest.Mock).mockReturnValue({
      adminEmail: null,
      role: null,
      isAdminEligible: false,
      isAdminVerified: false,
      sessionExpiresAt: null,
      isLoading: false,
      error: null,
      checkEligibility: mockCheckEligibility,
      verifyAdminPin: jest.fn(),
      clearAdminSession: mockClearAdminSession,
    });

    (useActiveProfile as jest.Mock).mockReturnValue({
      isLoading: false,
      profileType: "parent",
      activeChildUsername: null,
      childDocId: null,
      childAccountType: null,
      parentAccountType: null,
      parentMangerialPinSet: false,
      refreshProfile: mockRefreshProfile,
      setActiveChildProfile: jest.fn(),
      clearActiveChildProfile: jest.fn(),
      getProfilePathSegments: jest.fn(),
      getProfileDocRef: jest.fn(),
      getProfileCollectionRef: jest.fn(),
      getParentDocRef: jest.fn(),
      getChildDocRef: jest.fn(),
    });
  });

  it("routes to home after restoring a verified persisted user", async () => {
    mockCheckEligibility.mockResolvedValue(false);
    mockClearAdminSession.mockResolvedValue(undefined);
    mockRefreshProfile.mockResolvedValue(undefined);
    (auth as any).authStateReady = jest.fn().mockResolvedValue(undefined);
    (auth as any).currentUser = {
      uid: "persisted-user",
      email: "parent@example.com",
      emailVerified: true,
    };

    render(<Index />);

    await waitFor(() => {
      expect((auth as any).authStateReady).toHaveBeenCalledTimes(1);
      expect(mockCheckEligibility).toHaveBeenCalledWith("parent@example.com");
      expect(mockRefreshProfile).toHaveBeenCalledTimes(1);
      expect(router.replace).toHaveBeenCalledWith("/pages/HomeScreen");
    });
  });

  it("routes to login when no persisted user is restored", async () => {
    (auth as any).authStateReady = jest.fn().mockResolvedValue(undefined);
    (auth as any).currentUser = null;

    render(<Index />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith("/pages/Login");
    });
  });

  it("routes to login for an unverified restored user", async () => {
    mockClearAdminSession.mockResolvedValue(undefined);
    (auth as any).authStateReady = jest.fn().mockResolvedValue(undefined);
    (auth as any).currentUser = {
      uid: "persisted-user",
      email: "parent@example.com",
      emailVerified: false,
    };

    render(<Index />);

    await waitFor(() => {
      expect(mockClearAdminSession).toHaveBeenCalledTimes(1);
      expect(router.replace).toHaveBeenCalledWith("/pages/Login");
    });
  });
});
