import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import SignUpManagerPin from "../app/pages/SignUpManagerPin";

describe("SignUpManagerPin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows mismatch error when PIN and confirm PIN differ", () => {
    const onSubmit = jest.fn();
    const onBack = jest.fn();

    const { getByPlaceholderText, getByText } = render(
      <SignUpManagerPin onSubmit={onSubmit} onBack={onBack} />,
    );

    fireEvent.changeText(getByPlaceholderText("1234"), "1234");
    fireEvent.changeText(getByPlaceholderText("Confirm PIN"), "9999");
    fireEvent.press(getByText("Continue"));

    expect(getByText("PINs do not match")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onBack from back link", () => {
    const onSubmit = jest.fn();
    const onBack = jest.fn();

    const { getByText } = render(
      <SignUpManagerPin onSubmit={onSubmit} onBack={onBack} />,
    );

    fireEvent.press(getByText(/Back to\s+Previous Step/i));
    expect(onBack).toHaveBeenCalled();
  });
});
