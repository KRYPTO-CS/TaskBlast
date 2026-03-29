import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import GameSelectionModal from "../app/components/GameSelectionModal";

jest.mock("../TTS", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    Text: ({ children }: { children: React.ReactNode }) =>
      React.createElement(Text, null, children),
  };
});

describe("GameSelectionModal", () => {
  it("renders all game options including MatchBlast", () => {
    const { getByTestId, getByText } = render(
      <GameSelectionModal
        visible
        onClose={jest.fn()}
        onSelectGame={jest.fn()}
      />,
    );

    expect(getByTestId("game-option-0")).toBeTruthy();
    expect(getByTestId("game-option-1")).toBeTruthy();
    expect(getByTestId("game-option-2")).toBeTruthy();
    expect(getByTestId("game-option-3")).toBeTruthy();
    expect(getByTestId("game-option-4")).toBeTruthy();
    expect(getByText("2048")).toBeTruthy();
    expect(getByText("MatchBlast")).toBeTruthy();
  });

  it("selects 2048 and closes modal", () => {
    const onClose = jest.fn();
    const onSelectGame = jest.fn();

    const { getByTestId } = render(
      <GameSelectionModal
        visible
        onClose={onClose}
        onSelectGame={onSelectGame}
      />,
    );

    fireEvent.press(getByTestId("game-option-3"));

    expect(onSelectGame).toHaveBeenCalledWith(3);
    expect(onClose).toHaveBeenCalled();
  });

  it("selects MatchBlast and closes modal", () => {
    const onClose = jest.fn();
    const onSelectGame = jest.fn();

    const { getByTestId } = render(
      <GameSelectionModal
        visible
        onClose={onClose}
        onSelectGame={onSelectGame}
      />,
    );

    fireEvent.press(getByTestId("game-option-4"));

    expect(onSelectGame).toHaveBeenCalledWith(4);
    expect(onClose).toHaveBeenCalled();
  });

  it("closes from close button", () => {
    const onClose = jest.fn();

    const { getByTestId } = render(
      <GameSelectionModal visible onClose={onClose} onSelectGame={jest.fn()} />,
    );

    fireEvent.press(getByTestId("close-modal-button"));

    expect(onClose).toHaveBeenCalled();
  });
});
