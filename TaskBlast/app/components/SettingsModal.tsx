import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../server/firebase";
import { signOut } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudio } from "../context/AudioContext";
import { useNotifications } from "../context/NotificationContext";
import NotificationPreferencesModal from "./NotificationPreferencesModal";
import AccessibilityModal from "./AccessibilityModal";
import { useAccessibility } from "../context/AccessibilityContext";
import { useColorPalette } from "../styles/colorBlindThemes";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onLogout?: () => void;
}

export default function SettingsModal({
  visible,
  onClose,
  onLogout,
}: SettingsModalProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  // Get audio context for global audio control
  const { soundEnabled, musicEnabled, setSoundEnabled, setMusicEnabled } =
    useAudio();

  // Get notification context
  const { preferences, updatePreferences } = useNotifications();

  // Get accessibility context
  const { language, colorBlindMode, reduceMotion } = useAccessibility();
  const palette = useColorPalette();

  // Modal state
  const [showNotificationPrefs, setShowNotificationPrefs] = useState(false);
  const [showAccessibilityPrefs, setShowAccessibilityPrefs] = useState(false);

  // Child profile state
  const [activeChildProfile, setActiveChildProfile] = useState<string | null>(
    null,
  );
  const [currentProfileType, setCurrentProfileType] = useState<
    "parent" | "child"
  >("parent");

  // Check for active child profile when modal opens
  useEffect(() => {
    const checkActiveProfile = async () => {
      if (visible) {
        const activeChild = await AsyncStorage.getItem("activeChildProfile");
        setActiveChildProfile(activeChild);
        setCurrentProfileType(activeChild ? "child" : "parent");
      }
    };

    checkActiveProfile();
  }, [visible]);

  const handleSoundToggle = async (value: boolean) => {
    await setSoundEnabled(value);
  };

  const handleNotificationToggle = async (value: boolean) => {
    await updatePreferences({ enabled: value });
  };

  const handleMusicToggle = async (value: boolean) => {
    await setMusicEnabled(value);
  };

  const handleLogout = () => {
    const isChild = currentProfileType === "child";

    Alert.alert(
      isChild ? "Switch Profile" : "Logout",
      isChild
        ? "Return to profile selection?"
        : "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: isChild ? "Switch" : "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              if (isChild) {
                // Child "logout" - just clear active child profile
                await AsyncStorage.removeItem("activeChildProfile");
                onClose();
                router.push("/pages/ProfileSelection");
              } else {
                // Parent logout - full logout
                await AsyncStorage.clear();
                await signOut(auth);
                if (onLogout) {
                  onLogout();
                }
                onClose();
              }
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          },
        },
      ],
    );
  };

  return (
    <Modal
      animationType={reduceMotion ? "fade" : "slide"}
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      testID="settings-modal"
    >
      <View className="flex-1 justify-center items-center bg-black/70">
        <View
          className="w-11/12 max-w-md rounded-3xl p-6"
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            borderWidth: 2,
            borderColor: palette.modalBorder,
            shadowColor: palette.modalShadow,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.6,
            shadowRadius: 20,
          }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text
              className="font-orbitron-semibold text-white text-2xl"
              style={{
                textShadowColor: palette.accentGlow,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 15,
              }}
            >
              {t("Settings.title")}
            </Text>
            <TouchableOpacity
              testID="close-settings-modal"
              onPress={onClose}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{
                backgroundColor: palette.accentSoft,
                borderWidth: 1,
                borderColor: palette.accentSoftBorder,
              }}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Current Profile Badge */}
          <View className="items-center mb-4">
            <View
              className="px-4 py-2 rounded-full"
              style={{
                backgroundColor:
                  currentProfileType === "parent"
                    ? palette.secondaryMed
                    : palette.accentSoft,
                borderWidth: 1,
                borderColor:
                  currentProfileType === "parent"
                    ? palette.secondarySoftBorder
                    : palette.accentSoftBorder,
              }}
            >
              <Text className="font-orbitron-semibold text-white text-xs">
                {currentProfileType === "parent"
                  ? "👤 Parent Account"
                  : `👶 ${activeChildProfile}`}
              </Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="max-h-96">
            {/* Sound Effects */}
            <View
              className="flex-row justify-between items-center p-4 rounded-xl mb-3"
              style={{
                backgroundColor: palette.secondaryMed,
                borderWidth: 1,
                borderColor: palette.rowBorderPrimary,
              }}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons
                  name="volume-high"
                  size={24}
                  color={palette.secondary}
                  style={{ marginRight: 12 }}
                />
                <Text className="font-orbitron-semibold text-white text-base">
                  {t("Settings.sound")}
                </Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={handleSoundToggle}
                trackColor={{
                  false: palette.switchTrackOff,
                  true: palette.switchTrackOn,
                }}
                thumbColor={
                  soundEnabled ? palette.switchThumbOn : palette.switchThumbOff
                }
              />
            </View>

            {/* Music */}
            <View
              className="flex-row justify-between items-center p-4 rounded-xl mb-3"
              style={{
                backgroundColor: palette.secondaryMed,
                borderWidth: 1,
                borderColor: palette.rowBorderPrimary,
              }}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons
                  name="musical-notes"
                  size={24}
                  color={palette.secondary}
                  style={{ marginRight: 12 }}
                />
                <Text className="font-orbitron-medium text-white text-base">
                  {t("Settings.music")}
                </Text>
              </View>
              <Switch
                value={musicEnabled}
                onValueChange={handleMusicToggle}
                trackColor={{
                  false: palette.switchTrackOff,
                  true: palette.switchTrackOn,
                }}
                thumbColor={
                  musicEnabled ? palette.switchThumbOn : palette.switchThumbOff
                }
              />
            </View>

            {/* Notifications */}
            <TouchableOpacity
              onPress={() => setShowNotificationPrefs(true)}
              className="flex-row justify-between items-center p-4 rounded-xl mb-3"
              style={{
                backgroundColor: palette.secondaryMed,
                borderWidth: 1,
                borderColor: palette.rowBorderPrimary,
              }}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons
                  name="notifications"
                  size={24}
                  color={palette.secondary}
                  style={{ marginRight: 12 }}
                />
                <View className="flex-1">
                  <Text className="font-orbitron-medium text-white text-base">
                    {t("Settings.notifications")}
                  </Text>
                  <Text className="font-orbitron text-gray-400 text-xs mt-1">
                    Tap to customize
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <Switch
                  value={preferences.enabled}
                  onValueChange={handleNotificationToggle}
                  trackColor={{
                    false: palette.switchTrackOff,
                    true: palette.switchTrackOn,
                  }}
                  thumbColor={
                    preferences.enabled
                      ? palette.switchThumbOn
                      : palette.switchThumbOff
                  }
                />
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={palette.secondary}
                  style={{ marginLeft: 8 }}
                />
              </View>
            </TouchableOpacity>

            {/* Accessibility */}
            <TouchableOpacity
              testID="accessibility-button"
              onPress={() => setShowAccessibilityPrefs(true)}
              className="flex-row justify-between items-center p-4 rounded-xl mb-3"
              style={{
                backgroundColor: palette.secondaryMed,
                borderWidth: 1,
                borderColor: palette.rowBorderPrimary,
              }}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons
                  name="accessibility"
                  size={24}
                  color={palette.secondary}
                  style={{ marginRight: 12 }}
                />
                <View className="flex-1">
                  <Text className="font-orbitron-medium text-white text-base">
                    {t("Settings.accessibility")}
                  </Text>
                  <Text
                    className="font-orbitron text-gray-400 text-xs mt-1"
                    numberOfLines={1}
                  >
                    {language.toUpperCase()} ·{" "}
                    {colorBlindMode === "none" ? "No filter" : colorBlindMode}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={palette.secondary}
              />
            </TouchableOpacity>

            {/* Divider */}
            <View
              className="h-px my-4"
              style={{ backgroundColor: palette.divider }}
            />

            {/* Privacy - Only show for parent */}
            {currentProfileType === "parent" && (
              <TouchableOpacity
                className="flex-row items-center p-4 rounded-xl mb-3"
                style={{
                  backgroundColor: palette.tertiarySoft,
                  borderWidth: 1,
                  borderColor: palette.tertiarySoftBorder,
                }}
                onPress={() => {
                  // Add privacy settings navigation
                  console.log("Privacy pressed");
                }}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={24}
                  color={palette.tertiary}
                  style={{ marginRight: 12 }}
                />
                <Text className="font-orbitron-semibold text-white text-base flex-1">
                  {t("Settings.privacy")}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={palette.tertiary}
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className="flex-row items-center p-4 rounded-xl mb-3"
              style={{
                backgroundColor: palette.tertiarySoft,
                borderWidth: 1,
                borderColor: palette.tertiarySoftBorder,
              }}
              onPress={() => {
                // Add help & support navigation
                console.log("Help & Support pressed");
              }}
            >
              <Ionicons
                name="help-circle"
                size={24}
                color={palette.tertiary}
                style={{ marginRight: 12 }}
              />
              <Text className="font-orbitron-medium text-white text-base flex-1">
                {t("Settings.Help")}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={palette.tertiary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center p-4 rounded-xl mb-3"
              style={{
                backgroundColor: palette.tertiarySoft,
                borderWidth: 1,
                borderColor: palette.tertiarySoftBorder,
              }}
              onPress={() => {
                // Add about navigation
                console.log("About pressed");
              }}
            >
              <Ionicons
                name="information-circle"
                size={24}
                color={palette.tertiary}
                style={{ marginRight: 12 }}
              />
              <Text className="font-orbitron-semibold text-white text-base flex-1">
                {t("Settings.About")}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={palette.tertiary}
              />
            </TouchableOpacity>

            {/* Logout/Switch Profile Button */}
            <TouchableOpacity
              testID="logout-button"
              className="flex-row items-center justify-center p-4 rounded-xl"
              style={{
                backgroundColor: palette.errorSoft,
                borderWidth: 1,
                borderColor: palette.errorSoftBorder,
              }}
              onPress={handleLogout}
            >
              <Ionicons
                name={
                  currentProfileType === "child"
                    ? "swap-horizontal"
                    : "log-out-outline"
                }
                size={24}
                color={palette.errorIcon}
                style={{ marginRight: 12 }}
              />
              <Text
                className="font-orbitron-bold text-base"
                style={{ color: palette.errorIcon }}
              >
                {currentProfileType === "child" ? "Switch Profile" : "Logout"}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* App Version */}
          <View
            className="items-center mt-6 pt-4"
            style={{ borderTopWidth: 1, borderTopColor: palette.divider }}
          >
            <Text className="font-orbitron text-gray-400 text-xs">
              TaskBlast v1.0.0
            </Text>
          </View>
        </View>
      </View>

      {/* Notification Preferences Modal */}
      <NotificationPreferencesModal
        visible={showNotificationPrefs}
        onClose={() => setShowNotificationPrefs(false)}
      />

      {/* Accessibility Modal */}
      <AccessibilityModal
        visible={showAccessibilityPrefs}
        onClose={() => setShowAccessibilityPrefs(false)}
      />
    </Modal>
  );
}
