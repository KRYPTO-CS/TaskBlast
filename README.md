
# TaskBlast

An app to help those with ADHD and other users with attention deficits to stay on task in a fun and engaging way.

## Table of Contents
- [Features](#features)
- [Getting Started](#getting-started)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Authors](#authors)
- [Acknowledgements](#acknowledgements)

## Features

- **Managed / Independent Account Types** - Support for both supervised and independent user accounts
- **Pomodoro Timer** - Focus timer to help maintain concentration
- **Task Management** - Organize and track tasks effectively
- **SpaceShooter Minigame** - Engaging reward system to keep users motivated
- **Multi-language Support** - Available in English and Spanish
- **Audio Feedback** - Sound effects and music to enhance user experience

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Android Emulator

### Installation

1. Clone the repository:
```bash
git clone https://github.com/KRYPTO-CS/TaskBlast.git
cd TaskBlast
```

2. Navigate to the project directory:
```bash
cd TaskBlast
```

3. Install dependencies:
```bash
npm install
```

## Running the Application

### Development Mode

Start the Expo development server:
```bash
npx expo start
```
or
```bash
npm start
```

This will open the Expo Developer Tools. From there, you can:
- Press `i` to open iOS Simulator (requires Xcode on Mac)
- Press `a` to open Android Emulator (requires Android Studio setup)
- Scan the QR code with the **Expo Go** app on your physical device (easiest method)

### Platform-Specific Commands

If you have an emulator/simulator set up, you can run directly on a specific platform:

Run on iOS (requires Mac with Xcode):
```bash
npm run ios
```

Run on Android (requires Android Studio):
```bash
npm run android
```

Run on Web:
```bash
npm run web
```

> **Note**: For most users without emulators, using `npx expo start` and scanning the QR code with the Expo Go app on your phone is the quickest way to test the app.

## Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

## Project Structure

```
TaskBlast/
├── app/                    # Main application code
│   ├── components/        # Reusable UI components
│   ├── context/          # React Context providers
│   ├── hooks/            # Custom React hooks
│   ├── locales/          # Internationalization files
│   ├── pages/            # Application screens/pages
│   └── styles/           # Global styles
├── assets/               # Static assets (images, music, backgrounds)
├── server/               # Backend utilities (Firebase, storage, user profiles)
└── __tests__/            # Test files
```

## Tech Stack

- **Framework**: React Native with Expo
- **Routing**: Expo Router
- **Styling**: NativeWind (TailwindCSS for React Native)
- **Backend**: Firebase
- **Internationalization**: i18next
- **Testing**: Jest & React Testing Library

## Authors

- Joshua Shapiro [@klaviette](https://github.com/klaviette)
- Sarah Lawton [@srah-law](https://github.com/srah-law)
- Jacob Pavlick [@Jankosta](https://github.com/Jankosta)
- Daniel Garcia [@DanielGar12](https://www.github.com/DanielGar12)
- Joey Ryan Suliguin [@vinbi](https://github.com/vinbi07e)

## Acknowledgements

**Sponsor**: David Keathly

## Additional Documentation

- [Testing Guide](TaskBlast/__tests__/README.md) - Comprehensive test suite documentation
- [Styling Guide](TaskBlast/STYLING_GUIDE.md) - NativeWind and TailwindCSS styling conventions
- [Fonts Guide](TaskBlast/FONTS_GUIDE.md) - Custom fonts and typography guide
