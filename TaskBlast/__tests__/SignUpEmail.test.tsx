import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import SignUpEmail from "../app/pages/SignUpEmail";

describe("SignUpEmail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows required error when email is empty", () => {
    const onSubmit = jest.fn();
    const onBack = jest.fn();

    const { getByText } = render(
      <SignUpEmail onSubmit={onSubmit} onBack={onBack} />,
    );

    fireEvent.press(getByText("Send Link"));

    expect(getByText("Field is required")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows invalid email error for malformed email", () => {
    const onSubmit = jest.fn();
    const onBack = jest.fn();

    const { getByPlaceholderText, getByText } = render(
      <SignUpEmail onSubmit={onSubmit} onBack={onBack} />,
    );

    fireEvent.changeText(getByPlaceholderText("Email Address"), "not-an-email");
    fireEvent.press(getByText("Send Link"));

    expect(getByText("Please enter a valid email address")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits valid email", () => {
    const onSubmit = jest.fn();
    const onBack = jest.fn();

    const { getByPlaceholderText, getByText } = render(
      <SignUpEmail onSubmit={onSubmit} onBack={onBack} />,
    );

    fireEvent.changeText(
      getByPlaceholderText("Email Address"),
      "student@example.com",
    );
    fireEvent.press(getByText("Send Link"));

    expect(onSubmit).toHaveBeenCalledWith("student@example.com");
  });

  it("calls onBack from back link", () => {
    const onSubmit = jest.fn();
    const onBack = jest.fn();

    const { getByText } = render(
      <SignUpEmail onSubmit={onSubmit} onBack={onBack} />,
    );

    fireEvent.press(getByText(/Back to\s+Previous Step/i));
    expect(onBack).toHaveBeenCalled();
  });
});
