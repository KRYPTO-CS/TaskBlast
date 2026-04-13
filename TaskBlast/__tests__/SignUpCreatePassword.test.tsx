import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import SignUpCreatePassword from "../app/pages/SignUpCreatePassword";

describe("SignUpCreatePassword", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows required error for whitespace-only passwords", () => {
    const onSubmit = jest.fn();
    const onBack = jest.fn();

    const { getByPlaceholderText, getByText } = render(
      <SignUpCreatePassword onSubmit={onSubmit} onBack={onBack} />,
    );

    fireEvent.changeText(getByPlaceholderText("Password"), "   ");
    fireEvent.changeText(getByPlaceholderText("Confirm Password"), "   ");
    fireEvent.press(getByText("Create Account"));

    expect(getByText("Field is required")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onBack from back link", () => {
    const onSubmit = jest.fn();
    const onBack = jest.fn();

    const { getByText } = render(
      <SignUpCreatePassword onSubmit={onSubmit} onBack={onBack} />,
    );

    fireEvent.press(getByText(/Back to\s+Previous Step/i));
    expect(onBack).toHaveBeenCalled();
  });
});
