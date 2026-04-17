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
    useFocusEffect: jest.fn((effect) => {
      if (typeof effect === "function") {
        effect();
      }
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
    notifyTimerComplete: jest.fn().mockResolvedValue(undefined),
    scheduleTaskReminder: jest.fn().mockResolvedValue("notification-id"),
    scheduleDailyDigest: jest.fn().mockResolvedValue("digest-id"),
    preferences: {
      enabled: true,
      soundEnabled: false,
      vibrationEnabled: true,
      visualOnly: false,
      reminderTiming: 5,
      repeatNotifications: false,
      maxNotificationsPerHour: 4,
      dailyDigestEnabled: true,
      dailyDigestTime: "15:00",
    },
    permissionGranted: true,
    updatePreferences: jest.fn().mockResolvedValue(undefined),
    requestPermissions: jest.fn().mockResolvedValue(true),
    cancelTaskNotifications: jest.fn().mockResolvedValue(undefined),
    cancelAllNotifications: jest.fn().mockResolvedValue(undefined),
    cancelDailyDigest: jest.fn(),
  })),
}));

// Mock TTSContext
jest.mock("./app/context/TTSContext", () => ({
  TTSProvider: ({ children }) => children,
  useTTS: jest.fn(() => ({
    ttsEnabled: true,
    settings: { rate: 1, pitch: 1, language: "en-US" },
    setSettings: jest.fn(),
    speak: jest.fn(),
    stop: jest.fn(),
    isSpeaking: false,
  })),
}));

// Mock AdminContext
jest.mock("./app/context/AdminContext", () => ({
  AdminProvider: ({ children }) => children,
  useAdmin: jest.fn(() => ({
    adminEmail: null,
    role: null,
    isAdminEligible: false,
    isAdminVerified: false,
    sessionExpiresAt: null,
    isLoading: false,
    error: null,
    checkEligibility: jest.fn().mockResolvedValue(false),
    verifyAdminPin: jest.fn().mockResolvedValue(true),
    clearAdminSession: jest.fn().mockResolvedValue(undefined),
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
  onSnapshot: jest.fn(() => jest.fn()), // Return unsubscribe function
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

const mockRefreshProfile = jest.fn().mockResolvedValue(undefined);
const mockSetActiveChildProfile = jest.fn().mockResolvedValue(undefined);
const mockClearActiveChildProfile = jest.fn().mockResolvedValue(undefined);
const mockGetProfilePathSegments = jest.fn((...segments) => [
  "users",
  "test-uid",
  ...segments,
]);
const mockGetProfileDocRef = jest.fn(() => ({ id: "mock-profile-doc" }));
const mockGetProfileCollectionRef = jest.fn(() => ({
  id: "mock-profile-collection",
}));
const mockGetParentDocRef = jest.fn(() => ({ id: "mock-parent-doc" }));
const mockGetChildDocRef = jest.fn(() => ({ id: "mock-child-doc" }));

const defaultActiveProfileMock = {
  isLoading: false,
  profileType: "parent",
  activeChildUsername: null,
  childDocId: null,
  childAccountType: null,
  parentAccountType: null,
  parentMangerialPinSet: false,
  refreshProfile: mockRefreshProfile,
  setActiveChildProfile: mockSetActiveChildProfile,
  clearActiveChildProfile: mockClearActiveChildProfile,
  getProfilePathSegments: mockGetProfilePathSegments,
  getProfileDocRef: mockGetProfileDocRef,
  getProfileCollectionRef: mockGetProfileCollectionRef,
  getParentDocRef: mockGetParentDocRef,
  getChildDocRef: mockGetChildDocRef,
};

jest.mock("./app/context/ActiveProfileContext", () => ({
  ActiveProfileProvider: ({ children }) => children,
  useActiveProfile: jest.fn(() => defaultActiveProfileMock),
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
      "ManagerPin.pin": "Enter PIN",
      "ManagerPin.confirmPinPlaceholder": "Confirm PIN",
      "ChildAccount.title": "Create Child Account",
      "ChildAccount.firstName": "Enter first name",
      "ChildAccount.lastName": "Enter last name",
      "ChildAccount.birthdate": "Birthdate",
      "ChildAccount.username": "Username",
      "ChildAccount.usernameDesc": "Choose a unique username",
      "ChildAccount.create": "Create Child Account",
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
      "Tasks.normal": "Normal",
      "Tasks.archive": "Archive",
      "Tasks.edit": "Edit",
      "Tasks.title": "Task List",
      "Tasks.button": "Add New Task",
      "Tasks.new": "New Task",
      "Tasks.managerAccess": "Manager Access",
      "Tasks.managerAccessDesc": "Enter the 4-digit PIN to access edit mode",
      "Tasks.cancel": "Cancel",
      "Tasks.unlock": "Unlock",
      "Tasks.noTasks": "No tasks yet. Add your first task!",
      "Tasks.empty": "No tasks yet. Add your first task!",
      "Tasks.archivedempty": "No archived tasks.",
      "Tasks.archivedTask": "Archived task",
      "Settings.parentAccount": "Parent Account",
      "Shop.title": "Shop",
      "Shop.body": "Body",
      "Shop.wings": "Wings",
      "Shop.toppers": "Topper",
      "Shop.equipped": "Equipped",
      "Shop.owned": "Owned",
      "Shop.bBody": "Blue Body",
      "Shop.rBody": "Red Body",
      "Shop.gBody": "Green Body",
      "Shop.yBody": "Yellow Body",
      "Shop.bWings": "Blue Wings",
      "Shop.rWings": "Red Wings",
      "Shop.gWings": "Green Wings",
      "Shop.yWings": "Yellow Wings",
      "Shop.dTopper": "Default Topper",
      "Shop.bTopper": "Blue Fire Topper",
      "Shop.aTopper": "Artemis Topper",
      "Profile.editP": "Edit Profile",
      "Profile.traits": "Traits",
      "Profile.awards": "Awards",
      "Profile.YourStats": "Your Stats",
      "Profile.switchProfile": "Switch Profile",
      "Profile.addChildAccount": "Add Child Account",
      "Profile.SwitchProfile": "Switch Profile",
      "Profile.AddChildAccount": "Add Child Account",
      "Profile.Logout": "Logout",
      "Settings.logout": "Logout",
      "Pomodoro.time": "Time Remaining",
      "Pomodoro.pause": "Pause",
      "Pomodoro.worksession": "Work Session",
      "Pomodoro.Pause": "Pause",
      "Pomodoro.Resume": "Resume",
      "Pomodoro.Play": "Play",
      "Pomodoro.Land": "Land",
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

  const mockPostMessage = jest.fn();
  const mockInjectJavaScript = jest.fn();

  global.mockWebView = {
    postMessage: mockPostMessage,
    injectJavaScript: mockInjectJavaScript,
  };

  return {
    WebView: React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({
        postMessage: mockPostMessage,
        injectJavaScript: mockInjectJavaScript,
      }));

      return React.createElement(View, { testID: "webview", ...props });
    }),
  };
});

// Mock coachmark library for tests that render screens without provider wiring
jest.mock("@edwardloopez/react-native-coachmark", () => {
  const React = require("react");

  return {
    CoachmarkProvider: ({ children }) => children,
    CoachmarkOverlay: ({ children }) => children,
    CoachmarkAnchor: ({ children }) => children,
    useCoachmark: () => ({
      start: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
      isRunning: false,
    }),
    createTour: jest.fn(() => ({
      start: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
    })),
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

// Suppress console errors in tests (tests can spy if needed)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  // Keep log for debugging
};
