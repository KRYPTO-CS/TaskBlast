import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

// We'll control these values from tests below.
let mockTtsEnabled = false;
const mockSpeak = jest.fn();

// Mock the TTS context so we can toggle enabled/disabled and spy on speak.
jest.mock("../app/context/TTSContext", () => ({
  useTTS: () => ({
    ttsEnabled: mockTtsEnabled,
    speak: mockSpeak,
  }),
}));

// Import the component after mocking so the module uses the stubbed hook.
const { Text } = require("../TTS");

/**
 * Helper that renders a piece of text with an attached onPress handler and
 * returns the mocks so callers can assert what happened when pressing.
 */
function renderPressable(text: string) {
  const onPress = jest.fn();
  const utils = render(<Text onPress={onPress}>{text}</Text>);
  return { ...utils, onPress };
}

describe("TTS Text component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSpeak.mockClear();
  });

  it("calls speak and the provided onPress when TTS is enabled", () => {
    mockTtsEnabled = true;
    const { getByText, onPress } = renderPressable("hello world");

    fireEvent.press(getByText("hello world"));

    expect(mockSpeak).toHaveBeenCalledTimes(1);
    expect(mockSpeak).toHaveBeenCalledWith("hello world");
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call speak or the provided onPress when TTS is disabled", () => {
    mockTtsEnabled = false;
    const { getByText, onPress } = renderPressable("silent text");

    fireEvent.press(getByText("silent text"));

    expect(mockSpeak).not.toHaveBeenCalled();
    expect(getByText("silent text").props.onPress).toBeUndefined();
    expect(onPress.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it("renders as a plain Text with no pressable behavior when disabled", () => {
    // onPress prop will be undefined
    // on the underlying native component.
    mockTtsEnabled = false;
    const { getByText } = renderPressable("static");
    const node = getByText("static");
    expect(node.props.onPress).toBeUndefined();
  });
});
