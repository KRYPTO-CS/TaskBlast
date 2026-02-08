# TaskBlast Test Suite Documentation

This directory contains comprehensive test cases for the TaskBlast application. All tests are written using Jest and React Native Testing Library.

## Test Files Overview

### 1. Login.test.tsx

Tests for the login process and authentication flow.

**Test Categories:**

- **UI Rendering**: Validates all login screen elements are present
- **Valid Login**: Tests successful login with valid credentials
- **Bypass Login**: Tests admin bypass functionality (admin/taskblaster)
- **Invalid Login**: Tests error handling for invalid credentials
- **Navigation**: Tests navigation to Forgot Password and Sign Up flows
- **Input Validation**: Tests email format and password masking

**Key Test Cases:**

- ✓ Render login screen with username, password, and submit button
- ✓ Successfully login with valid Firebase credentials
- ✓ Bypass login with admin/taskblaster (case-insensitive)
- ✓ Handle empty username/password validation
- ✓ Handle Firebase authentication errors (invalid-credential, user-not-found)
- ✓ Trim whitespace from inputs
- ✓ Navigate to Forgot Password screen
- ✓ Navigate to Sign Up flow

---

### 2. Logout.test.tsx

Tests for logout functionality and session cleanup.

**Test Categories:**

- **Settings Modal Logout**: Tests logout button in settings
- **Session Cleanup**: Tests clearing user data and state
- **Error Handling**: Tests error scenarios during logout
- **Logout Confirmation**: Tests confirmation dialog
- **State Reset**: Tests resetting user-specific state

**Key Test Cases:**

- ✓ Display logout option in settings modal
- ✓ Call Firebase signOut when logout is pressed
- ✓ Navigate to login screen after successful logout
- ✓ Clear AsyncStorage on logout
- ✓ Stop background music on logout
- ✓ Clear game score on logout
- ✓ Handle logout errors gracefully
- ✓ Show confirmation dialog before logout
- ✓ Allow cancel of logout action
- ✓ Reset all user-specific state (rocks, fuel)

---

### 3. ForgotPassword.test.tsx

Tests for the forgot password flow with email verification link (NOT PIN-based).

**Test Categories:**

- **Email Submission Screen**: Tests email input and validation
- **Email Validation**: Tests email format validation
- **Email Verification Link**: Tests sending reset email via Firebase (not PIN)
- **Password Reset Screen**: Tests password reset form
- **Navigation Flow**: Tests navigation between screens
- **Error Handling**: Tests network and Firebase errors

**Key Test Cases:**

- ✓ Render forgot password screen with email input
- ✓ Accept valid email format
- ✓ Reject empty or invalid email
- ✓ Trim whitespace from email
- ✓ Send password reset email via Firebase (sendPasswordResetEmail)
- ✓ Display success message after sending email
- ✓ Show instruction to check email for reset link
- ✓ Handle user-not-found error
- ✓ Allow resending reset email
- ✓ Validate password match on reset screen
- ✓ Enforce minimum password length (8 characters)
- ✓ Mask password inputs
- ✓ Navigate back to login after reset
- ✓ Handle network errors and too-many-requests

**Note:** Email verification uses a link sent via email, NOT a PIN code.

---

### 4. SignUp.test.tsx

Tests for the complete sign-up process with email verification via link.

**Test Categories:**

- **Step 1: Birthdate Input**: Tests age validation (COPPA compliance - 13+ years)
- **Step 2: Account Type**: Tests managed vs independent account selection
- **Step 3: Manager PIN**: Tests PIN input for managed accounts
- **Step 4: Name Input**: Tests first and last name validation
- **Step 5: Email Input**: Tests email validation
- **Step 6: Email Verification Link**: Tests email verification (NOT PIN)
- **Step 7: Password Creation**: Tests password validation and matching
- **Complete Sign Up Flow**: Tests Firebase account creation
- **Navigation Between Steps**: Tests back navigation

**Key Test Cases:**

- ✓ Accept valid birthdate (13+ years old)
- ✓ Reject birthdate under 13 years (COPPA compliance)
- ✓ Display message for underage users to give device to parent/guardian
- ✓ Validate date format (MM/DD/YYYY)
- ✓ Select managed or independent account type
- ✓ Require account type selection
- ✓ Accept 4-digit manager PIN for managed accounts
- ✓ Only accept numeric input for PIN
- ✓ Require both first and last names
- ✓ Trim whitespace from names
- ✓ Validate email format
- ✓ Send verification email via Firebase (sendEmailVerification)
- ✓ Show message about clicking email verification link
- ✓ Allow resending verification email
- ✓ Validate password match (password and confirm password)
- ✓ Enforce minimum password length (8 characters)
- ✓ Mask password inputs
- ✓ Create user account with Firebase (createUserWithEmailAndPassword)
- ✓ Save user data to Firestore
- ✓ Navigate to home screen after successful signup
- ✓ Handle email-already-in-use error
- ✓ Allow back navigation with data preservation

**Note:** Email verification uses a link sent via email, NOT a PIN code entry.

---

### 5. HomeScreen.test.tsx

Tests for the main home screen functionality.

**Test Categories:**

- **UI Rendering**: Tests all UI elements (profile, settings, fuel, rocks, task list)
- **Navigation**: Tests navigation to different screens
- **Background Music**: Tests music playback and lifecycle
- **Score Persistence**: Tests loading and saving score from AsyncStorage
- **Task List Modal**: Tests task modal functionality
- **Settings Modal**: Tests settings modal functionality
- **Fuel System**: Tests fuel display
- **Error Handling**: Tests error scenarios
- **App State Management**: Tests background/foreground handling

**Key Test Cases:**

- ✓ Render Take Off button, fuel indicator, rocks count
- ✓ Display rocks in 4-digit format with leading zeros (e.g., "0005")
- ✓ Render profile, settings, and task buttons
- ✓ Navigate to Pomodoro Screen when Take Off is pressed
- ✓ Navigate to Profile Screen when profile button is pressed
- ✓ Open settings modal when settings button is pressed
- ✓ Open task list modal when task button is pressed
- ✓ Play background music on mount and set to loop
- ✓ Pause music when app goes to background
- ✓ Resume music when app becomes active
- ✓ Load score from AsyncStorage on mount
- ✓ Default to 0 if no score exists
- ✓ Handle invalid score gracefully (default to 0)
- ✓ Reload score when screen comes into focus
- ✓ Floor score to integer
- ✓ Handle negative scores as zero
- ✓ Open and close task list modal
- ✓ Open and close settings modal
- ✓ Display fuel level (20/20)
- ✓ Handle AsyncStorage errors gracefully
- ✓ Handle audio player errors gracefully

---

### 6. PomodoroScreen.test.tsx

Tests for the Pomodoro timer screen.

**Test Categories:**

- **UI Rendering**: Tests timer display, progress bar, spaceship
- **Timer Countdown**: Tests countdown from 1 minute
- **Progress Bar**: Tests progress visualization
- **Pause/Resume Functionality**: Tests pause and resume
- **Background Music**: Tests music playback
- **Timer Completion**: Tests navigation to game on completion
- **App State Handling**: Tests background/foreground behavior
- **Spaceship Animation**: Tests floating animation
- **Background Scrolling**: Tests scrolling stars background
- **Error Handling**: Tests error scenarios
- **Time Formatting**: Tests MM:SS format

**Key Test Cases:**

- ✓ Display initial time (01:00)
- ✓ Render progress bar
- ✓ Render animated spaceship
- ✓ Render Pause button initially
- ✓ Countdown from 1 minute
- ✓ Format time correctly (MM:SS)
- ✓ Countdown to zero (00:00)
- ✓ Update every second
- ✓ Progress bar starts at 100%
- ✓ Progress decreases as time passes
- ✓ Progress reaches 0% when timer completes
- ✓ Pause timer when pause button is pressed
- ✓ Change button to "Land" when paused
- ✓ Pause music when paused
- ✓ Navigate back to home when Land is pressed
- ✓ Play background music on mount
- ✓ Pause music when timer completes
- ✓ Navigate to Game screen when timer reaches zero
- ✓ Stop timer at zero
- ✓ Pause timer when app goes to background
- ✓ Pause timer when app becomes inactive
- ✓ Apply floating animation to spaceship
- ✓ Continuously scroll background
- ✓ Handle navigation errors gracefully
- ✓ Format single digit seconds with leading zero
- ✓ Format single digit minutes with leading zero
- ✓ Call notification when work session completes
- ✓ NOT call notification during pause
- ✓ Pass correct task name to notification

---

### 7. NotificationService.test.tsx

Tests for the notification service with all recent updates including rate limiting disabled, no notifications during break time, and AppState checking.

**Test Categories:**

- **Configuration**: Tests notification handler and permission requests
- **Notification Preferences**: Tests default and custom preferences
- **Rate Limiting**: Verifies rate limiting is disabled (9999)
- **Task Reminder Notifications**: Tests scheduling task reminders
- **Timer Complete Notifications**: Tests completion notifications with AppState
- **Daily Digest Notifications**: Tests daily reminder scheduling
- **Canceling Notifications**: Tests various cancellation methods
- **Error Handling**: Tests error scenarios and graceful degradation
- **AppState Integration**: Tests background/foreground behavior
- **Notification Messages**: Tests message content and formatting

**Critical Test Cases:**

- ✓ Configure notification handler on app startup
- ✓ Request and check notification permissions
- ✓ Rate limiting disabled by default (maxNotificationsPerHour = 9999)
- ✓ Return default preferences with rate limiting at 9999
- ✓ Save and retrieve custom notification preferences
- ✓ Merge saved preferences with defaults
- ✓ Schedule task reminder for future times
- ✓ NOT schedule reminder for past times
- ✓ NOT schedule when notifications disabled
- ✓ Use custom reminder timing (5, 10, 15, 30 minutes)
- ✓ Show timer complete notification when app is ACTIVE
- ✓ NO notification during break time (isBreakTime = true)
- ✓ NO notification when app is in BACKGROUND
- ✓ NO notification when app is INACTIVE
- ✓ Trigger haptic feedback when vibration enabled
- ✓ NOT trigger haptic when vibration disabled
- ✓ Include positive reinforcement messages
- ✓ Schedule daily digest at custom time (default 3 PM)
- ✓ Show different message when no tasks
- ✓ Use singular/plural correctly for task counts
- ✓ Cancel existing daily digest before scheduling new one
- ✓ Cancel specific notification by ID
- ✓ Cancel all notifications for a specific task
- ✓ Cancel all scheduled notifications
- ✓ Cancel only daily digest notifications
- ✓ Retrieve all scheduled notifications
- ✓ Return empty array on error
- ✓ Handle AsyncStorage errors gracefully
- ✓ Handle notification scheduling errors gracefully
- ✓ Handle haptic feedback errors gracefully
- ✓ Check AppState for active/background/inactive states
- ✓ Include task name in notification body
- ✓ Use positive, encouraging language

**Key Features Tested:**

- **Rate Limiting Disabled**: maxNotificationsPerHour = 9999 (no limits)
- **Neurodivergent-Friendly Defaults**: Sound off, vibration on, visual notifications
- **AppState Checking**: Only show immediate notifications when app is active
- **Break Time Detection**: Skip notifications when "Play Game" is clicked
- **Positive Messaging**: Encouraging, supportive notification text
- **Proper Scheduling**: Date-based and daily recurring notifications
- **Error Resilience**: Graceful handling of storage, permission, and scheduling errors
- **Haptic Feedback**: Configurable vibration patterns

---

### 8. GamePage.test.tsx

Tests for the embedded game screen.

**Test Categories:**

- **UI Rendering**: Tests WebView and loading states
- **Navigation**: Tests back button functionality
- **Loading States**: Tests loading indicator
- **Score Updates**: Tests receiving score from game
- **Message Handling**: Tests WebView message handling
- **WebView Configuration**: Tests WebView settings
- **Error Handling**: Tests WebView errors
- **Game Integration**: Tests game loading
- **Performance**: Tests rapid updates
- **Safe Area**: Tests safe area rendering
- **Header**: Tests header rendering

**Key Test Cases:**

- ✓ Render game page with WebView
- ✓ Render back button
- ✓ Show loading indicator initially
- ✓ Load correct game URL (https://krypto-cs.github.io/SpaceShooter/)
- ✓ Navigate back when back button is pressed
- ✓ Show loading indicator while WebView loads
- ✓ Hide loading indicator after WebView loads
- ✓ Handle score update messages from game
- ✓ Persist score to AsyncStorage
- ✓ Handle multiple score updates
- ✓ Handle zero score
- ✓ Handle negative scores as zero
- ✓ Handle invalid JSON messages gracefully
- ✓ Handle non-score messages (log only)
- ✓ Enable JavaScript in WebView
- ✓ Allow inline media playback
- ✓ Not require user action for media playback
- ✓ Whitelist all origins for WebView
- ✓ Display message when WebView is not installed
- ✓ Handle WebView load errors
- ✓ Handle AsyncStorage errors when saving score
- ✓ Load Space Shooter game
- ✓ Handle rapid score updates
- ✓ Render within safe area
- ✓ Respect top and bottom safe areas

---

## Running the Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test Login.test.tsx
npm test Logout.test.tsx
npm test ForgotPassword.test.tsx
npm test SignUp.test.tsx
npm test HomeScreen.test.tsx
npm test PomodoroScreen.test.tsx
npm test NotificationService.test.tsx
npm test GamePage.test.tsx
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

---

## Test Configuration

### Required Dependencies

```json
{
  "@testing-library/react-native": "^12.x",
  "@testing-library/jest-native": "^5.x",
  "jest": "^29.x",
  "react-test-renderer": "^19.x"
}
```

### Jest Configuration

Add to `package.json`:

```json
{
  "jest": {
    "preset": "react-native",
    "setupFilesAfterEnv": ["@testing-library/jest-native/extend-expect"],
    "transformIgnorePatterns": [
      "node_modules/(?!(react-native|@react-native|expo|@expo|@unimodules|react-native-webview)/)"
    ]
  }
}
```

---

## Important Notes

### Email Verification

⚠️ **Important:** The email verification process uses **email links**, NOT PIN codes. Tests reflect this:

- `sendEmailVerification()` is used instead of PIN verification
- Users click a link in their email to verify
- No PIN input is required during signup or password reset

### COPPA Compliance

The signup process enforces COPPA compliance:

- Users must be 13+ years old
- Under 13 shows message: "Please give the device to a parent or guardian"

### Bypass Login

For testing purposes, bypass credentials are:

- Username: `admin` (case-insensitive)
- Password: `taskblaster`

### Mocked Dependencies

The following are mocked in tests:

- Firebase Auth (`firebase/auth`)
- Firebase Firestore (`firebase/firestore`)
- AsyncStorage (`@react-native-async-storage/async-storage`)
- Expo Router (`expo-router`)
- Expo Audio (`expo-audio`)
- React Native WebView (`react-native-webview`)

---

## Test Coverage Goals

| Component       | Target Coverage |
| --------------- | --------------- |
| Login Process   | 90%+            |
| Logout Process  | 90%+            |
| Forgot Password | 90%+            |
| Sign Up Process | 90%+            |
| HomeScreen      | 85%+            |
| PomodoroScreen  | 85%+            |
| GamePage        | 85%+            |

---

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

- GitHub Actions
- GitLab CI
- CircleCI
- Jenkins

Example GitHub Actions workflow:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm install
      - run: npm test -- --coverage
```

---

## Contributing

When adding new tests:

1. Follow existing test structure
2. Group tests by category using `describe` blocks
3. Use descriptive test names starting with "should"
4. Mock external dependencies
5. Clean up after each test with `beforeEach` and `afterEach`
6. Aim for at least 85% code coverage

---

## Troubleshooting

### Common Issues

**Issue: Tests timeout**

- Solution: Increase Jest timeout in test file: `jest.setTimeout(10000)`

**Issue: Firebase mock not working**

- Solution: Ensure mock is at top of file, before imports

**Issue: AsyncStorage errors**

- Solution: Clear all mocks in `beforeEach`: `jest.clearAllMocks()`

**Issue: Timer tests failing**

- Solution: Use fake timers: `jest.useFakeTimers()`

---

## Test Maintenance

- Review and update tests when features change
- Remove obsolete tests
- Keep mocks up to date with library versions
- Run tests locally before pushing
- Monitor CI/CD test results

---

For questions or issues with tests, please contact the development team.
