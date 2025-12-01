// Mock Expo's __ExpoImportMetaRegistry for import.meta support
global.__ExpoImportMetaRegistry = {
  register: jest.fn(),
  get: jest.fn(() => ({ url: "", env: {} })),
};

// Mock structuredClone for Expo
global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));

// Mock expo-router
jest.mock("expo-router", () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockBack = jest.fn();

  // Default params that can be overridden per test
  const mockUseLocalSearchParams = jest.fn(() => ({
    workTime: "1", // Default to 1 minute for tests
    playTime: "5",
    cycles: "1",
  }));

  return {
    useRouter: () => ({
      push: mockPush,
      replace: mockReplace,
      back: mockBack,
    }),
    useLocalSearchParams: mockUseLocalSearchParams,
    Link: "Link",
    router: {
      push: mockPush,
      replace: mockReplace,
      back: mockBack,
    },
  };
});

// Mock expo-audio with shared mock functions
const mockPlay = jest.fn();
const mockPause = jest.fn();
const mockStop = jest.fn();

jest.mock("expo-audio", () => ({
  useAudioPlayer: jest.fn(() => ({
    play: mockPlay,
    pause: mockPause,
    stop: mockStop,
    loop: false,
    isLoaded: true,
  })),
}));

// Export audio mocks for tests
global.mockAudioPlayer = {
  play: mockPlay,
  pause: mockPause,
  stop: mockStop,
};

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Mock Firebase
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({
    currentUser: {
      uid: "test-uid",
      email: "test@example.com",
      emailVerified: true,
    },
  })),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendEmailVerification: jest.fn(),
  updateProfile: jest.fn(),
  onAuthStateChanged: jest.fn((auth, callback) => {
    // Return unsubscribe function
    return jest.fn();
  }),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  increment: jest.fn((value) => value),
}));

jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(),
}));

// Mock server/firebase
jest.mock("./server/firebase", () => ({
  auth: {
    currentUser: {
      uid: "test-uid",
      email: "test@example.com",
    },
  },
  db: {},
  firestore: {},
}));

// Mock AudioContext
jest.mock("./app/context/AudioContext", () => ({
  AudioProvider: ({ children }) => children,
  useAudio: jest.fn(() => ({
    musicEnabled: true,
    soundEnabled: true,
    setMusicEnabled: jest.fn(),
    setSoundEnabled: jest.fn(),
  })),
}));

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => {
    const translations = {
      "Login.title": "Login",
      "Login.emailPlaceholder": "Email or Username",
      "Login.passwordPlaceholder": "Password",
      "Login.forgotPassword": "Forgot Your Password?",
      "Login.loginButton": "Submit",
      "Login.noAccount": "Don't have an account?",
      "Login.signUp": "Sign Up",
      "ForgotPassword.title": "Forgot Your Password?",
      "ForgotPassword.desc":
        "Enter your email address and we'll send you a code to reset your password",
      "ForgotPassword.emailPlaceholder": "Email Address",
      "ForgotPassword.submit": "Submit",
      "ResetPassword.title": "Create New Password",
      "ResetPassword.desc": "Enter your new password below",
      "ResetPassword.newPasswordPlaceholder": "New Password",
      "ResetPassword.confirmPasswordPlaceholder": "Confirm Password",
      "ResetPassword.submit": "Reset Password",
      "birthdate.title": "What's Your Birthdate",
      "AccountType.title": "Who will be using TaskBlast?",
      "Name.title": "What's your name?",
      "Email.title": "What's Your Email?",
      "Password.title": "Create a Password",
      "Password.passwordPlaceholder": "Password",
      "Password.ConfirmPasswordPlaceholder": "Confirm Password",
      "Password.submit": "Create Account",
      "Password.match": "Passwords do not match",
      "Password.length": "Password must be at least 8 characters long",
      "Name.title": "What's Your Name?",
      "Name.firstName": "First Name",
      "Name.lastName": "Last Name",
      "Name.desc": "Let us know what to call you while using TaskBlast",
      "Name.continue": "Continue",
      "Name.empty": "Please enter both first and last name",
      "Name.error": "Please enter both first and last name",
      "Email.title": "What's Your Email?",
      "Email.desc": "We'll send you a verification link",
      "Email.emailPlaceholder": "Email Address",
      "Email.send": "Send Link",
      "Email.empty": "Email is required",
      "Email.invalid": "Please enter a valid email address",
      "Email.error": "Please enter your email",
      "ManagedPIN.title": "Create Manager PIN",
      "ManagedPIN.desc": "This PIN will be used to access manager features",
      "ManagedPIN.pin": "Enter PIN",
      "ManagedPIN.confirmPinPlaceholder": "Confirm PIN",
      "ManagedPIN.continue": "Continue",
      "Password.desc": "Choose a strong password for your account",
      "birthdate.title": "What's Your Birthdate",
      "birthdate.previousStep": "Previous Step",
      "birthdate.empty": "Field is required",
      "birthdate.month": "Month",
      "birthdate.day": "Day",
      "birthdate.year": "Year",
      "birthdate.notice": "We need your age to comply with COPPA regulations",
      "birthdate.continue": "Continue",
      "birthdate.age": "Please give the device to a parent or guardian",
      "birthdate.error": "Please enter a valid date",
      "birthdate.fill": "Please fill in all fields",
      "AccountType.title": "Who will be using TaskBlast?",
      "AccountType.type": "Select Account Type",
      "AccountType.managetitle": "Managed Account",
      "AccountType.managedesc": "For dependents under parental supervision",
      "AccountType.indetitle": "Independent Account",
      "AccountType.indedesc": "For individual learners",
      "AccountType.continue": "Continue",
      "AccountType.error": "Please choose an account type",
      "language.backTo": "Back to",
      "language.Login": "Login",
    };

    const tFunction = (key) => translations[key] || key;
    const i18nObject = { language: "en", changeLanguage: jest.fn() };

    // Return an object that works with both array and object destructuring
    const result = {
      t: tFunction,
      i18n: i18nObject,
      // Make it iterable for array destructuring [t, i18n]
      [Symbol.iterator]: function* () {
        yield tFunction;
        yield i18nObject;
      },
    };

    return result;
  },
  initReactI18next: {
    type: "3rdParty",
    init: jest.fn(),
  },
}));

// Mock react-native-webview
jest.mock("react-native-webview", () => {
  const React = require("react");
  const { View } = require("react-native");

  // Mock WebView ref with postMessage
  const mockPostMessage = jest.fn();

  return {
    WebView: React.forwardRef((props, ref) => {
      // Set up ref with postMessage method
      React.useImperativeHandle(ref, () => ({
        postMessage: mockPostMessage,
      }));

      return React.createElement(View, { testID: "webview", ...props });
    }),
  };
});

// Mock @react-navigation/native
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useFocusEffect: jest.fn((callback) => callback()),
}));

// Mock Expo Font
jest.mock("expo-font", () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
}));

// Mock Expo Asset
jest.mock("expo-asset", () => ({
  Asset: {
    loadAsync: jest.fn(() => Promise.resolve()),
  },
}));

// Mock Reanimated
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Safe Area Context
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mock AppState with accessible listeners
const mockAppStateListeners = [];
const mockAppStateAddEventListener = jest.fn((event, handler) => {
  mockAppStateListeners.push({ event, handler });
  return { remove: jest.fn() };
});

jest.mock("react-native/Libraries/AppState/AppState", () => ({
  addEventListener: mockAppStateAddEventListener,
  removeEventListener: jest.fn(),
  currentState: "active",
}));

// Export AppState helpers for tests
global.mockAppState = {
  listeners: mockAppStateListeners,
  triggerAppStateChange: (newState) => {
    mockAppStateListeners.forEach(({ event, handler }) => {
      if (event === "change") {
        handler(newState);
      }
    });
  },
  clear: () => {
    mockAppStateListeners.length = 0;
  },
};

// Mock Alert with controllable button callbacks
let lastAlertButtons = [];
const mockAlertFn = jest.fn((title, message, buttons) => {
  lastAlertButtons = buttons || [];
  // Store the alert info for test access
  mockAlertFn.lastCall = { title, message, buttons };

  // Do NOT auto-trigger - tests should manually trigger if needed
  // Tests can use mockAlert.pressButtonByText() to trigger buttons
});

global.Alert = {
  alert: mockAlertFn,
};

// Replace Alert in react-native after it's loaded
const RN = require("react-native");
RN.Alert = {
  alert: mockAlertFn,
};

// Helper to access and trigger alert buttons in tests
global.mockAlert = {
  alert: mockAlertFn,
  pressButton: (buttonIndex) => {
    if (
      lastAlertButtons[buttonIndex] &&
      lastAlertButtons[buttonIndex].onPress
    ) {
      lastAlertButtons[buttonIndex].onPress();
    }
  },
  pressButtonByText: (buttonText) => {
    const button = lastAlertButtons.find(
      (btn) =>
        btn.text && btn.text.toLowerCase().includes(buttonText.toLowerCase())
    );
    if (button && button.onPress) {
      button.onPress();
    }
  },
  getLastAlert: () => mockAlertFn.lastCall,
  clear: () => {
    lastAlertButtons = [];
    mockAlertFn.mockClear();
    delete mockAlertFn.lastCall;
  },
};

// Increase timeout for async tests
jest.setTimeout(10000);

// Global test utilities
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};
