import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import SignUpBirthdate from "../app/pages/SignUpBirthdate";

describe("SignUpBirthdate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("strips non-numeric characters from inputs", () => {
    const onSubmit = jest.fn();
    const onBack = jest.fn();

    const { getByPlaceholderText } = render(
      <SignUpBirthdate onSubmit={onSubmit} onBack={onBack} />,
    );

    const mm = getByPlaceholderText("MM");
    const dd = getByPlaceholderText("DD");
    const yyyy = getByPlaceholderText("YYYY");

    fireEvent.changeText(mm, "a1b2");
    fireEvent.changeText(dd, "x3y1");
    fireEvent.changeText(yyyy, "20a10b");

    expect(mm.props.value).toBe("12");
    expect(dd.props.value).toBe("31");
    expect(yyyy.props.value).toBe("2010");
  });

  it("accepts a valid exactly-13-years-old date", () => {
    const onSubmit = jest.fn();
    const onBack = jest.fn();

    const { getByPlaceholderText, getByText } = render(
      <SignUpBirthdate onSubmit={onSubmit} onBack={onBack} />,
    );

    const today = new Date();
    const y = String(today.getFullYear() - 13);
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");

    fireEvent.changeText(getByPlaceholderText("MM"), m);
    fireEvent.changeText(getByPlaceholderText("DD"), d);
    fireEvent.changeText(getByPlaceholderText("YYYY"), y);
    fireEvent.press(getByText("Continue"));

    expect(onSubmit).toHaveBeenCalledWith(`${m}/${d}/${y}`);
  });

  it("shows error for future year", () => {
    const onSubmit = jest.fn();
    const onBack = jest.fn();

    const { getByPlaceholderText, getByText } = render(
      <SignUpBirthdate onSubmit={onSubmit} onBack={onBack} />,
    );

    fireEvent.changeText(getByPlaceholderText("MM"), "01");
    fireEvent.changeText(getByPlaceholderText("DD"), "01");
    fireEvent.changeText(
      getByPlaceholderText("YYYY"),
      String(new Date().getFullYear() + 1),
    );
    fireEvent.press(getByText("Continue"));

    expect(getByText("Please enter a valid date")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onBack from back link", () => {
    const onSubmit = jest.fn();
    const onBack = jest.fn();

    const { getByText } = render(
      <SignUpBirthdate onSubmit={onSubmit} onBack={onBack} />,
    );

    fireEvent.press(getByText(/Back to\s+Previous Step/i));
    expect(onBack).toHaveBeenCalled();
  });
});
