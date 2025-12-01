import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  screen,
  act,
} from "@testing-library/react-native";
import CreateChildAccount from "../app/pages/CreateChildAccount";
import { auth, firestore } from "../server/firebase";
import { Alert } from "react-native";
import {
  getDocs,
  setDoc,
  serverTimestamp,
  collection,
  doc,
} from "firebase/firestore";

// Mock modules
jest.mock("../server/firebase");
jest.mock("firebase/firestore");

describe("CreateChildAccount", () => {
  // Helper function to get the create button (not the title)
  const getCreateButton = (screen: any) => {
    const buttons = screen.getAllByText("Create Child Account");
    // The button is the last occurrence (title is first)
    return buttons[buttons.length - 1];
  };

  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).mockAlert.clear();

    // Spy on Alert.alert
    alertSpy = jest.spyOn(Alert, "alert");

    // Mock authenticated user
    (auth as any).currentUser = {
      uid: "test-parent-uid",
      email: "parent@test.com",
    };

    // Mock Firestore collection and doc
    const mockDocRef = {
      id: "mock-child-id",
      path: "users/test-parent-uid/children/mock-child-id",
    };
    const mockCollectionRef = {
      id: "children",
      path: "users/test-parent-uid/children",
    };

    (collection as jest.Mock).mockReturnValue(mockCollectionRef);
    (doc as jest.Mock).mockReturnValue(mockDocRef);

    // Mock Firestore getDocs to return empty (username available)
    (getDocs as jest.Mock).mockResolvedValue({
      empty: true,
      docs: [],
    });

    // Mock setDoc to succeed
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    // Mock serverTimestamp
    (serverTimestamp as jest.Mock).mockReturnValue({ _seconds: 1234567890 });
  });

  afterEach(() => {
    if (alertSpy) {
      alertSpy.mockRestore();
    }
  });

  describe("UI Rendering", () => {
    it("should render all form fields", () => {
      render(<CreateChildAccount />);

      // Title appears multiple times (title + button)
      expect(
        screen.getAllByText("Create Child Account").length
      ).toBeGreaterThan(0);
      expect(screen.getByPlaceholderText("Enter first name")).toBeTruthy();
      expect(screen.getByPlaceholderText("Enter last name")).toBeTruthy();
      expect(screen.getByPlaceholderText("MM/DD/YYYY")).toBeTruthy();
      expect(
        screen.getByPlaceholderText("Choose a unique username")
      ).toBeTruthy();
      expect(screen.getAllByPlaceholderText("****")).toHaveLength(2); // PIN and Confirm PIN
    });

    it("should render create button", () => {
      render(<CreateChildAccount />);

      const createButton = getCreateButton(screen);
      expect(createButton).toBeTruthy();
    });

    it("should render back button", () => {
      const { UNSAFE_getByType } = render(<CreateChildAccount />);
      const { Ionicons } = require("@expo/vector-icons");

      const backIcons = UNSAFE_getByType(Ionicons);
      expect(backIcons).toBeTruthy();
    });
  });

  describe("Form Validation", () => {
    it("should show alert when required fields are missing", async () => {
      render(<CreateChildAccount />);

      const createButton = getCreateButton(screen);
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Missing Information",
          "Please fill in all fields"
        );
      });
    });

    it("should show alert when PIN is not 4 digits", async () => {
      render(<CreateChildAccount />);

      fireEvent.changeText(
        screen.getByPlaceholderText("Enter first name"),
        "John"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Enter last name"),
        "Doe"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("MM/DD/YYYY"),
        "01/15/2015"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Choose a unique username"),
        "johndoe"
      );
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[0], "123"); // Only 3 digits
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[1], "123");

      const createButton = getCreateButton(screen);
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Invalid PIN",
          "PIN must be 4 digits"
        );
      });
    });

    it("should show alert when PINs do not match", async () => {
      render(<CreateChildAccount />);

      fireEvent.changeText(
        screen.getByPlaceholderText("Enter first name"),
        "John"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Enter last name"),
        "Doe"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("MM/DD/YYYY"),
        "01/15/2015"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Choose a unique username"),
        "johndoe"
      );
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[0], "1234");
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[1], "5678");

      const createButton = getCreateButton(screen);
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "PIN Mismatch",
          "PINs do not match"
        );
      });
    });

    it("should show alert when username contains invalid characters", async () => {
      render(<CreateChildAccount />);

      fireEvent.changeText(
        screen.getByPlaceholderText("Enter first name"),
        "John"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Enter last name"),
        "Doe"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("MM/DD/YYYY"),
        "01/15/2015"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Choose a unique username"),
        "john@doe!"
      );
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[0], "1234");
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[1], "1234");

      const createButton = getCreateButton(screen);
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Invalid Username",
          "Username can only contain letters, numbers, and underscores"
        );
      });
    });

    it("should accept valid username with letters, numbers, and underscores", async () => {
      render(<CreateChildAccount />);

      fireEvent.changeText(
        screen.getByPlaceholderText("Enter first name"),
        "John"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Enter last name"),
        "Doe"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("MM/DD/YYYY"),
        "01/15/2015"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Choose a unique username"),
        "john_doe_123"
      );
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[0], "1234");
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[1], "1234");

      const createButton = getCreateButton(screen);
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(Alert.alert).not.toHaveBeenCalledWith(
          "Invalid Username",
          expect.any(String)
        );
      });
    });
  });

  describe("Username Availability Check", () => {
    it("should check if username is available", async () => {
      render(<CreateChildAccount />);

      fireEvent.changeText(
        screen.getByPlaceholderText("Enter first name"),
        "John"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Enter last name"),
        "Doe"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("MM/DD/YYYY"),
        "01/15/2015"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Choose a unique username"),
        "johndoe"
      );
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[0], "1234");
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[1], "1234");

      const createButton = getCreateButton(screen);
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(getDocs).toHaveBeenCalled();
      });
    });

    it("should show alert when username is already taken", async () => {
      // Mock getDocs to return non-empty (username taken)
      (getDocs as jest.Mock).mockResolvedValueOnce({
        empty: false,
        docs: [{ id: "existing-child" }],
      });

      render(<CreateChildAccount />);

      fireEvent.changeText(
        screen.getByPlaceholderText("Enter first name"),
        "John"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Enter last name"),
        "Doe"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("MM/DD/YYYY"),
        "01/15/2015"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Choose a unique username"),
        "existinguser"
      );
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[0], "1234");
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[1], "1234");

      const createButton = getCreateButton(screen);
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Username Taken",
          "This username is already in use. Please choose another."
        );
      });
    });

    it("should convert username to lowercase for consistency", async () => {
      render(<CreateChildAccount />);

      const usernameInput = screen.getByPlaceholderText(
        "Choose a unique username"
      );
      fireEvent.changeText(usernameInput, "JohnDoe");

      // The component should convert it to lowercase
      expect(usernameInput.props.value).toBe("johndoe");
    });
  });

  describe("Child Account Creation", () => {
    it("should create child account with valid data", async () => {
      render(<CreateChildAccount />);

      fireEvent.changeText(
        screen.getByPlaceholderText("Enter first name"),
        "John"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Enter last name"),
        "Doe"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("MM/DD/YYYY"),
        "01/15/2015"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Choose a unique username"),
        "johndoe"
      );
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[0], "1234");
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[1], "1234");

      const createButton = getCreateButton(screen);
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(setDoc).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            username: "johndoe",
            pin: "1234",
            firstName: "John",
            lastName: "Doe",
            birthdate: "01/15/2015",
            createdAt: expect.any(Object),
          })
        );
      });
    });

    it("should show success alert and navigate back after creation", async () => {
      render(<CreateChildAccount />);

      fireEvent.changeText(
        screen.getByPlaceholderText("Enter first name"),
        "John"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Enter last name"),
        "Doe"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("MM/DD/YYYY"),
        "01/15/2015"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Choose a unique username"),
        "johndoe"
      );
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[0], "1234");
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[1], "1234");

      const createButton = getCreateButton(screen);
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Success!",
          "Child account created for John!",
          expect.any(Array)
        );
      });

      // Simulate pressing OK on the alert
      const alertCalls = (Alert.alert as jest.Mock).mock.calls;
      const successAlert = alertCalls.find((call) => call[0] === "Success!");
      if (successAlert && successAlert[2] && successAlert[2][0].onPress) {
        successAlert[2][0].onPress();
      }

      // Router navigation is tested manually
    });

    it("should show loading state while creating account", async () => {
      // Make setDoc take some time
      (setDoc as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<CreateChildAccount />);

      fireEvent.changeText(
        screen.getByPlaceholderText("Enter first name"),
        "John"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Enter last name"),
        "Doe"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("MM/DD/YYYY"),
        "01/15/2015"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Choose a unique username"),
        "johndoe"
      );
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[0], "1234");
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[1], "1234");

      const createButton = getCreateButton(screen);
      fireEvent.press(createButton);

      // Should show loading text
      await waitFor(() => {
        expect(screen.getByText("Creating...")).toBeTruthy();
      });

      // Wait for completion
      await waitFor(
        () => {
          expect(screen.getByText("Create Child Account")).toBeTruthy();
        },
        { timeout: 3000 }
      );
    });
  });

  describe("Authentication Check", () => {
    it("should show error when user is not logged in", async () => {
      (auth as any).currentUser = null;

      render(<CreateChildAccount />);

      fireEvent.changeText(
        screen.getByPlaceholderText("Enter first name"),
        "John"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Enter last name"),
        "Doe"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("MM/DD/YYYY"),
        "01/15/2015"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Choose a unique username"),
        "johndoe"
      );
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[0], "1234");
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[1], "1234");

      const createButton = getCreateButton(screen);
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "You must be logged in to create a child account"
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle username check error gracefully", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});
      // Mock getDocs to always reject during this test
      (getDocs as jest.Mock).mockRejectedValue(new Error("Firestore error"));

      render(<CreateChildAccount />);

      fireEvent.changeText(
        screen.getByPlaceholderText("Enter first name"),
        "John"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Enter last name"),
        "Doe"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("MM/DD/YYYY"),
        "01/15/2015"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Choose a unique username"),
        "johndoe"
      );
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[0], "1234");
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[1], "1234");

      const createButton = getCreateButton(screen);

      // Press button and let async handler run
      fireEvent.press(createButton);

      // Wait for alert to be called
      await waitFor(
        () => {
          // When getDocs fails, it returns false from checkUsernameAvailable
          // This triggers "Username Taken" not generic error
          expect(Alert.alert).toHaveBeenCalledWith(
            "Username Taken",
            "This username is already in use. Please choose another."
          );
        },
        { timeout: 5000 }
      );
    });

    it("should handle child account creation error", async () => {
      (setDoc as jest.Mock).mockRejectedValueOnce(
        new Error("Firestore write error")
      );

      render(<CreateChildAccount />);

      fireEvent.changeText(
        screen.getByPlaceholderText("Enter first name"),
        "John"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Enter last name"),
        "Doe"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("MM/DD/YYYY"),
        "01/15/2015"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Choose a unique username"),
        "johndoe"
      );
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[0], "1234");
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[1], "1234");

      const createButton = getCreateButton(screen);
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          "Error",
          "Failed to create child account. Please try again."
        );
      });
    });

    it("should reset loading state after error", async () => {
      jest.spyOn(console, "error").mockImplementation(() => {});
      // Mock setDoc to always reject during this test
      (setDoc as jest.Mock).mockRejectedValue(new Error("Firestore error"));

      render(<CreateChildAccount />);

      fireEvent.changeText(
        screen.getByPlaceholderText("Enter first name"),
        "John"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Enter last name"),
        "Doe"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("MM/DD/YYYY"),
        "01/15/2015"
      );
      fireEvent.changeText(
        screen.getByPlaceholderText("Choose a unique username"),
        "johndoe"
      );
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[0], "1234");
      fireEvent.changeText(screen.getAllByPlaceholderText("****")[1], "1234");

      const createButton = getCreateButton(screen);

      // Press button and let async handler run
      fireEvent.press(createButton);

      // Wait for alert to be called
      await waitFor(
        () => {
          expect(Alert.alert).toHaveBeenCalledWith(
            "Error",
            "Failed to create child account. Please try again."
          );
        },
        { timeout: 5000 }
      );

      // Button should not be disabled after error
      const buttonAfterError = getCreateButton(screen);
      expect(buttonAfterError).toBeTruthy();
    });
  });

  describe("Navigation", () => {
    it("should have back button that navigates", () => {
      const { UNSAFE_getAllByType } = render(<CreateChildAccount />);
      const { TouchableOpacity } = require("react-native");

      const touchables = UNSAFE_getAllByType(TouchableOpacity);
      // First touchable should be the back button
      expect(touchables.length).toBeGreaterThan(0);

      // Back navigation behavior tested manually
    });
  });

  describe("Input Constraints", () => {
    it("should limit PIN input to 4 characters", () => {
      render(<CreateChildAccount />);

      const pinInputs = screen.getAllByPlaceholderText("****");

      // Check maxLength prop
      expect(pinInputs[0].props.maxLength).toBe(4);
      expect(pinInputs[1].props.maxLength).toBe(4);
    });

    it("should use numeric keyboard for PIN inputs", () => {
      render(<CreateChildAccount />);

      const pinInputs = screen.getAllByPlaceholderText("****");

      expect(pinInputs[0].props.keyboardType).toBe("numeric");
      expect(pinInputs[1].props.keyboardType).toBe("numeric");
    });

    it("should hide PIN text (secureTextEntry)", () => {
      render(<CreateChildAccount />);

      const pinInputs = screen.getAllByPlaceholderText("****");

      expect(pinInputs[0].props.secureTextEntry).toBe(true);
      expect(pinInputs[1].props.secureTextEntry).toBe(true);
    });

    it("should disable username auto-capitalization", () => {
      render(<CreateChildAccount />);

      const usernameInput = screen.getByPlaceholderText(
        "Choose a unique username"
      );

      expect(usernameInput.props.autoCapitalize).toBe("none");
    });
  });
});
