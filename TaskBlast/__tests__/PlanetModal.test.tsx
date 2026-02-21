/**
 * Test Suite: Planet Modal
 *
 * This test suite validates the planet details modal behavior including:
 * - Loading and rendering planet data
 * - Locked vs unlocked UI states
 * - Unlock flow: cost check, Firestore update, and onRocksChange callback
 * - Error handling for data fetch and write failures
 * - Close button behavior
 */

import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react-native";
import PlanetModal from "../app/components/PlanetModal";

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  increment: jest.fn(),
}));

import { getAuth } from "firebase/auth";
import { getDoc, setDoc } from "firebase/firestore";
import { Alert } from "react-native";
import { ActivityIndicator } from "react-native";

describe("PlanetModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuth as jest.Mock).mockReturnValue({ currentUser: { uid: "user-1" } });
  });

  it("renders planet data when visible", async () => {
    // planet doc then user doc (if any) - first call for planet data
    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => true, data: () => ({ name: "Glowy", description: "A glowing world", cost: 5 }) });

    render(<PlanetModal visible={true} onClose={() => {}} planetId={1} isLocked={false} selectedPlanet={1} onRocksChange={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("A glowing world")).toBeTruthy();
      expect(screen.getByText("Glowy")).toBeTruthy();
    });
  });

  it("allows unlocking when user has enough crystals", async () => {
    // First getDoc for planet data
    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => true, data: () => ({ name: "UnlockMe", description: "Buy me", cost: 10 }) });
    // Second getDoc is for user doc, providing rocks
    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => true, data: () => ({ rocks: 100 }) });

    (setDoc as jest.Mock).mockResolvedValue(undefined);

    render(<PlanetModal visible={true} onClose={() => {}} planetId={2} isLocked={true} selectedPlanet={2} onRocksChange={() => {}} />);

    // Wait for planet data to load
    await waitFor(() => expect(screen.getByText("Buy me")).toBeTruthy());

    // Press Unlock Planet -> should show Confirm Unlock button
    fireEvent.press(screen.getByText("Unlock Planet"));

    await waitFor(() => expect(screen.getByText("Confirm Unlock")).toBeTruthy());

    // Press Confirm Unlock -> should call setDoc to update user
    fireEvent.press(screen.getByText("Confirm Unlock"));

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalled();
    });
  });

  it("shows loading state while planet data is fetched", async () => {
    // make getDoc take time
    (getDoc as jest.Mock).mockImplementationOnce(() => new Promise((resolve) => setTimeout(() => resolve({ exists: () => true, data: () => ({ name: "SlowPlanet", description: "Slow load", cost: 1 }) }), 50)));

    render(<PlanetModal visible={true} onClose={() => {}} planetId={3} isLocked={false} selectedPlanet={3} onRocksChange={() => {}} />);

    // while loading the header should show "Loading..."
    await waitFor(() => expect(screen.getByText("Loading...")).toBeTruthy());
  });

  it("handles planet load errors", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    (getDoc as jest.Mock).mockRejectedValueOnce(new Error("fail"));

    render(<PlanetModal visible={true} onClose={() => {}} planetId={4} isLocked={false} selectedPlanet={4} onRocksChange={() => {}} />);

    await waitFor(() => expect(screen.getByText("Failed to load planet")).toBeTruthy());
  });

  it("alerts when user lacks crystals to unlock", async () => {
    jest.spyOn(Alert, "alert");
    // planet data
    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => true, data: () => ({ name: "Expensive", description: "Costs a lot", cost: 100 }) });
    // user doc with few rocks
    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => true, data: () => ({ rocks: 1 }) });

    render(<PlanetModal visible={true} onClose={() => {}} planetId={5} isLocked={true} selectedPlanet={5} onRocksChange={() => {}} />);

    // wait for planet data to render
    await waitFor(() => expect(screen.getByText("Costs a lot")).toBeTruthy());

    // Press Unlock Planet then Confirm Unlock
    fireEvent.press(screen.getByText("Unlock Planet"));
    await waitFor(() => expect(screen.getByText("Confirm Unlock")).toBeTruthy());
    fireEvent.press(screen.getByText("Confirm Unlock"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Not Enough Crystals",
        expect.stringContaining("You need")
      );
    });
  });

  it("close button invokes onClose", async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => true, data: () => ({ name: "CloseMe", description: "desc" }) });
    const onClose = jest.fn();

    render(<PlanetModal visible={true} onClose={onClose} planetId={6} isLocked={false} selectedPlanet={6} onRocksChange={() => {}} />);

    await waitFor(() => expect(screen.getByText("desc")).toBeTruthy());

    fireEvent.press(screen.getByTestId("close-planet-modal"));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows 'No planet data found' when doc exists=false", async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => false });

    render(<PlanetModal visible={true} onClose={() => {}} planetId={7} isLocked={false} selectedPlanet={7} onRocksChange={() => {}} />);

    await waitFor(() => expect(screen.getByText("No planet data found")).toBeTruthy());
  });

  it("alerts on unlock failure when setDoc rejects", async () => {
    jest.spyOn(Alert, "alert");

    // planet data then user data
    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => true, data: () => ({ name: "FailUnlock", description: "desc", cost: 5 }) });
    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => true, data: () => ({ rocks: 100 }) });

    (setDoc as jest.Mock).mockRejectedValueOnce(new Error("write fail"));

    render(<PlanetModal visible={true} onClose={() => {}} planetId={8} isLocked={true} selectedPlanet={8} onRocksChange={() => {}} />);

    // wait for planet data
    await waitFor(() => expect(screen.getByText("desc")).toBeTruthy());

    fireEvent.press(screen.getByText("Unlock Planet"));
    await waitFor(() => expect(screen.getByText("Confirm Unlock")).toBeTruthy());
    fireEvent.press(screen.getByText("Confirm Unlock"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Error", "Failed to unlock planet");
    });
  });
});
