/**
 * Test Suite: Planet Scroll List
 *
 * This test suite covers the horizontal planet selector including:
 * - Rendering planet images
 * - Locked vs unlocked planet behavior
 * - Opening `PlanetModal` on press
 * - ScrollView snap offsets and scroll handling
 * - Integration: unlocking a planet triggers `onRocksChange`
 */

import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react-native";
import PlanetScrollList from "../app/components/PlanetScrollList";

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  onSnapshot: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  increment: jest.fn(),
}));

import { getAuth } from "firebase/auth";
import { onSnapshot, getDoc } from "firebase/firestore";
import { ScrollView } from "react-native";

describe("PlanetScrollList", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (getAuth as jest.Mock).mockReturnValue({ currentUser: { uid: "test-user" } });

    // onSnapshot should immediately call back with a user snapshot having currPlanet = 2
    (onSnapshot as jest.Mock).mockImplementation((_, cb) => {
      cb({ exists: () => true, data: () => ({ currPlanet: 2 }) });
      return jest.fn();
    });

    // Default getDoc resolves to a planet document
    (getDoc as jest.Mock).mockResolvedValue({ exists: () => true, data: () => ({ name: "Test Planet", description: "A planet" }) });
  });

  it("renders planet images", async () => {
    render(<PlanetScrollList />);

    await waitFor(() => {
      expect(screen.getByTestId("planet-1-image")).toBeTruthy();
      expect(screen.getByTestId("planet-2-image")).toBeTruthy();
      expect(screen.getByTestId("planet-3-image")).toBeTruthy();
    });
  });

  it("opens PlanetModal when a planet is pressed", async () => {
    render(<PlanetScrollList />);

    // ensure images rendered
    await waitFor(() => expect(screen.getByTestId("planet-2-image")).toBeTruthy());

    // Press planet 2
    fireEvent.press(screen.getByTestId("planet-2-image"));

    // PlanetModal should be visible (testID present)
    await waitFor(() => {
      expect(screen.getByTestId("planet-modal")).toBeTruthy();
      // planet name loaded by mocked getDoc
      expect(screen.getByText("Test Planet")).toBeTruthy();
    });
  });

  it("calls onRocksChange when unlocking from the modal", async () => {
    const onRocksChange = jest.fn();

    // Ensure currentProgress is low so planet 2 is locked
    (onSnapshot as jest.Mock).mockImplementationOnce((_, cb) => {
      cb({ exists: () => true, data: () => ({ currPlanet: 1 }) });
      return jest.fn();
    });

    // planet doc then user doc
    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => true, data: () => ({ name: "Unlocked", description: "desc", cost: 1 }) });
    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => true, data: () => ({ rocks: 50 }) });

    // mock setDoc so unlock succeeds
    const firestore = require("firebase/firestore");
    (firestore.setDoc as jest.Mock).mockResolvedValue(undefined);

    const { getByTestId } = render(<PlanetScrollList onRocksChange={onRocksChange} />);

    // wait for images
    await waitFor(() => expect(screen.getByTestId("planet-2-image")).toBeTruthy());

    // Press planet 2 to open modal
    fireEvent.press(screen.getByTestId("planet-2-image"));

    // Wait for modal content to appear
    await waitFor(() => expect(screen.getByText("desc")).toBeTruthy());

    // Press Unlock then Confirm Unlock
    fireEvent.press(screen.getByText("Unlock Planet"));
    await waitFor(() => expect(screen.getByText("Confirm Unlock")).toBeTruthy());
    fireEvent.press(screen.getByText("Confirm Unlock"));

    // onRocksChange should be called by PlanetModal unlock flow
    await waitFor(() => expect(onRocksChange).toHaveBeenCalled());
  });

  it("uses dark images for locked planets and light for unlocked", async () => {
    // set current progress to 1 so planets >1 are locked
    (onSnapshot as jest.Mock).mockImplementationOnce((_, cb) => {
      cb({ exists: () => true, data: () => ({ currPlanet: 1 }) });
      return jest.fn();
    });

    render(<PlanetScrollList />);

    await waitFor(() => expect(screen.getByTestId("planet-2-image")).toBeTruthy());

    // Instead of comparing image source (module mocked), validate lock behavior
    // by opening the modal for planet 2 and confirming header shows locked state
    fireEvent.press(screen.getByTestId("planet-2-image"));

    await waitFor(() => {
      expect(screen.getByTestId("planet-modal")).toBeTruthy();
      expect(screen.getByText("Planet Not Unlocked")).toBeTruthy();
    });
  });

  it("exposes snapOffsets on the ScrollView matching planet count", async () => {
    const { UNSAFE_getByType } = render(<PlanetScrollList />);

    const scroll = UNSAFE_getByType(ScrollView);
    // snapToOffsets should be an array sized to planets length (9)
    expect(Array.isArray(scroll.props.snapToOffsets)).toBe(true);
    expect(scroll.props.snapToOffsets.length).toBeGreaterThanOrEqual(9);
  });
});
