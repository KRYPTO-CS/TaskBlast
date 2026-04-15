module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|firebase|@firebase/.*|@edwardloopez/react-native-coachmark)",
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: [
    "**/__tests__/**/*.test.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
  ],
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "!app/**/*.d.ts",
    "!app/_layout.tsx",
    "!app/index.tsx",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/app/$1",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/__mocks__/fileMock.js",
    "^firebase-admin$": "<rootDir>/__mocks__/firebase-admin-stub.js",
    "^firebase-admin/(.*)$": "<rootDir>/__mocks__/firebase-admin-stub.js",
    "^firebase-functions/v2/https$":
      "<rootDir>/__mocks__/firebase-functions-v2-https-stub.js",
    "^bcryptjs$": "<rootDir>/__mocks__/bcryptjs-stub.js",
  },
  testEnvironment: "node",
  globals: {
    "ts-jest": {
      tsconfig: {
        jsx: "react",
      },
    },
  },
  fakeTimers: {
    enableGlobally: false,
  },
};
