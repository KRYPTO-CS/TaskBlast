import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import SignUpAccountType from "../app/pages/SignUpAccountType";

describe("SignUpAccountType", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows validation error when continuing without selection", () => {
    const onSubmit = jest.fn();
    const onBack = jest.fn();

    const { getByText } = render(
      <SignUpAccountType onSubmit={onSubmit} onBack={onBack} />,
    );

    fireEvent.press(getByText("Continue"));

    expect(getByText("Please choose an account type")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits managed account selection", () => {
    const onSubmit = jest.fn();
    const onBack = jest.fn();

    const { getByText } = render(
      <SignUpAccountType onSubmit={onSubmit} onBack={onBack} />,
    );

    fireEvent.press(getByText("Managed Account"));
    fireEvent.press(getByText("Continue"));

    expect(onSubmit).toHaveBeenCalledWith("managed");
  });

  it("submits independent account selection", () => {
    const onSubmit = jest.fn();
    const onBack = jest.fn();

    const { getByText } = render(
      <SignUpAccountType onSubmit={onSubmit} onBack={onBack} />,
    );

    fireEvent.press(getByText("Independent Account"));
    fireEvent.press(getByText("Continue"));

    expect(onSubmit).toHaveBeenCalledWith("independent");
  });

  it("calls onBack from back link", () => {
    const onSubmit = jest.fn();
    const onBack = jest.fn();

    const { getByText } = render(
      <SignUpAccountType onSubmit={onSubmit} onBack={onBack} />,
    );

    fireEvent.press(getByText(/Back to\s+Previous Step/i));
    expect(onBack).toHaveBeenCalled();
  });
});
