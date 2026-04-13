import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import SignUpName from "../app/pages/SignUpName";

describe("SignUpName", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows required error for empty names", () => {
    const onSubmit = jest.fn();
    const onBack = jest.fn();

    const { getByText } = render(
      <SignUpName onSubmit={onSubmit} onBack={onBack} />,
    );

    fireEvent.press(getByText("Continue"));

    expect(getByText("Field is required")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("trims names before submit", () => {
    const onSubmit = jest.fn();
    const onBack = jest.fn();

    const { getByPlaceholderText, getByText } = render(
      <SignUpName onSubmit={onSubmit} onBack={onBack} />,
    );

    fireEvent.changeText(getByPlaceholderText("First Name"), "  John  ");
    fireEvent.changeText(getByPlaceholderText("Last Name"), "  Doe  ");
    fireEvent.press(getByText("Continue"));

    expect(onSubmit).toHaveBeenCalledWith("John", "Doe");
  });

  it("does not submit when one name is whitespace only", () => {
    const onSubmit = jest.fn();
    const onBack = jest.fn();

    const { getByPlaceholderText, getByText } = render(
      <SignUpName onSubmit={onSubmit} onBack={onBack} />,
    );

    fireEvent.changeText(getByPlaceholderText("First Name"), "John");
    fireEvent.changeText(getByPlaceholderText("Last Name"), "   ");
    fireEvent.press(getByText("Continue"));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(getByText("Field is required")).toBeTruthy();
  });

  it("calls onBack from back link", () => {
    const onSubmit = jest.fn();
    const onBack = jest.fn();

    const { getByText } = render(
      <SignUpName onSubmit={onSubmit} onBack={onBack} />,
    );

    fireEvent.press(getByText(/Back to\s+Previous Step/i));
    expect(onBack).toHaveBeenCalled();
  });
});
