import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { TTSProvider } from "./context/TTSContext";

import { MadimiOne_400Regular } from "@expo-google-fonts/madimi-one";
import {
  Orbitron_400Regular,
  Orbitron_500Medium,
  Orbitron_600SemiBold,
  Orbitron_700Bold,
  Orbitron_800ExtraBold,
  Orbitron_900Black,
} from "@expo-google-fonts/orbitron";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "../global.css";
import { AudioProvider } from "./context/AudioContext";
import { NotificationProvider } from "./context/NotificationContext";
import { AccessibilityProvider } from "./context/AccessibilityContext";
import { AdminProvider } from "./context/AdminContext";
import {
  CoachmarkProvider,
  CoachmarkOverlay,
} from "@edwardloopez/react-native-coachmark";
// Prevent the splash screen from auto-hiding before fonts are loaded
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    MadimiOne_400Regular,
    Orbitron_400Regular,
    Orbitron_500Medium,
    Orbitron_600SemiBold,
    Orbitron_700Bold,
    Orbitron_800ExtraBold,
    Orbitron_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AccessibilityProvider>
      <AudioProvider>
        <TTSProvider>
          <NotificationProvider>
            <AdminProvider>
              <CoachmarkProvider
                theme={{
                  tooltip: {
                    maxWidth: 300,
                    radius: 15,
                    bg: "#rgba(15, 23, 42, 0.95)",
                    fg: "#eeee",
                    arrowSize: 10,
                    padding: 16,
                    buttonPrimaryBg: "#rgba(139, 92, 246, 0.5)",
                    buttonSecondaryBg: "#8E8E93",
                  },
                }}
              >
                <Stack
                  screenOptions={{
                    headerShown: false,
                  }}
                />
                <CoachmarkOverlay />
              </CoachmarkProvider>
            </AdminProvider>
          </NotificationProvider>
        </TTSProvider>
      </AudioProvider>
    </AccessibilityProvider>
  );
}
