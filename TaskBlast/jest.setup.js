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

  return {
    useRouter: () => ({
      push: mockPush,
      replace: mockReplace,
      back: mockBack,
    }),
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

// Mock AudioContext
jest.mock("./app/context/AudioContext", () => ({
  AudioProvider: ({ children }) => children,
  useAudio: jest.fn(() => ({
    soundEnabled: true,
    musicEnabled: true,
    setSoundEnabled: jest.fn(),
    setMusicEnabled: jest.fn(),
    isLoading: false,
  })),
}));

// Mock NotificationContext
jest.mock("./app/context/NotificationContext", () => ({
  NotificationProvider: ({ children }) => children,
  useNotifications: jest.fn(() => ({
    notifyTimerComplete: jest.fn(),
    scheduleTaskReminder: jest.fn(),
    scheduleDailyDigest: jest.fn(),
  })),
}));

// Mock react-i18next
jest.mock("react-i18next", () => {
  const tFunc = (key) => key;
  const i18nObj = {
    changeLanguage: jest.fn(),
    language: "en",
  };

  // Create an array-like object that also has named properties
  // to support both [t, i18n] and {t, i18n} destructuring
  const mockReturn = Object.assign([tFunc, i18nObj], {
    t: tFunc,
    i18n: i18nObj,
  });

  return {
    useTranslation: () => mockReturn,
    initReactI18next: {
      type: "3rdParty",
      init: jest.fn(),
    },
  };
});

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Mock expo-notifications
const mockScheduleNotificationAsync = jest.fn(() =>
  Promise.resolve("notification-id-123"),
);
const mockCancelScheduledNotificationAsync = jest.fn(() => Promise.resolve());
const mockCancelAllScheduledNotificationsAsync = jest.fn(() =>
  Promise.resolve(),
);
const mockGetAllScheduledNotificationsAsync = jest.fn(() =>
  Promise.resolve([]),
);
const mockGetPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: "granted" }),
);
const mockRequestPermissionsAsync = jest.fn(() =>
  Promise.resolve({ status: "granted" }),
);
const mockSetNotificationHandler = jest.fn();
const mockAddNotificationResponseReceivedListener = jest.fn(() => ({
  remove: jest.fn(),
}));

jest.mock("expo-notifications", () => ({
  scheduleNotificationAsync: mockScheduleNotificationAsync,
  cancelScheduledNotificationAsync: mockCancelScheduledNotificationAsync,
  cancelAllScheduledNotificationsAsync:
    mockCancelAllScheduledNotificationsAsync,
  getAllScheduledNotificationsAsync: mockGetAllScheduledNotificationsAsync,
  getPermissionsAsync: mockGetPermissionsAsync,
  requestPermissionsAsync: mockRequestPermissionsAsync,
  setNotificationHandler: mockSetNotificationHandler,
  addNotificationResponseReceivedListener:
    mockAddNotificationResponseReceivedListener,
  AndroidNotificationPriority: {
    HIGH: "high",
    DEFAULT: "default",
  },
  SchedulableTriggerInputTypes: {
    DATE: "date",
    DAILY: "daily",
  },
}));

// Export notification mocks for tests
global.mockNotifications = {
  scheduleNotificationAsync: mockScheduleNotificationAsync,
  cancelScheduledNotificationAsync: mockCancelScheduledNotificationAsync,
  cancelAllScheduledNotificationsAsync:
    mockCancelAllScheduledNotificationsAsync,
  getAllScheduledNotificationsAsync: mockGetAllScheduledNotificationsAsync,
  getPermissionsAsync: mockGetPermissionsAsync,
  requestPermissionsAsync: mockRequestPermissionsAsync,
  setNotificationHandler: mockSetNotificationHandler,
  addNotificationResponseReceivedListener:
    mockAddNotificationResponseReceivedListener,
};

// Mock expo-haptics
const mockNotificationAsync = jest.fn(() => Promise.resolve());

jest.mock("expo-haptics", () => ({
  notificationAsync: mockNotificationAsync,
  NotificationFeedbackType: {
    Success: "success",
  },
}));

// Export haptics mocks for tests
global.mockHaptics = {
  notificationAsync: mockNotificationAsync,
};

// Mock Firebase
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({})),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendEmailVerification: jest.fn(),
  updateProfile: jest.fn(),
  onAuthStateChanged: jest.fn(() => jest.fn()), // Return unsubscribe function
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

// Mock react-native-webview
jest.mock("react-native-webview", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    WebView: (props) => {
      return React.createElement(View, { testID: "webview", ...props });
    },
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

// Create a mutable currentState that can be changed in tests
const mockAppState = {
  addEventListener: mockAppStateAddEventListener,
  removeEventListener: jest.fn(),
  currentState: "active",
};

jest.mock("react-native/Libraries/AppState/AppState", () => mockAppState);

// Export AppState helpers for tests
global.mockAppState = {
  listeners: mockAppStateListeners,
  currentState: mockAppState,
  setCurrentState: (newState) => {
    mockAppState.currentState = newState;
  },
  triggerAppStateChange: (newState) => {
    mockAppState.currentState = newState;
    mockAppStateListeners.forEach(({ event, handler }) => {
      if (event === "change") {
        handler(newState);
      }
    });
  },
  clear: () => {
    mockAppStateListeners.length = 0;
    mockAppState.currentState = "active";
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
        btn.text && btn.text.toLowerCase().includes(buttonText.toLowerCase()),
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
