import React, { useState, useEffect } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { Text } from "../../TTS";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../server/firebase";
import {
  signOut,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudio } from "../context/AudioContext";
import { useNotifications } from "../context/NotificationContext";
import NotificationPreferencesModal from "./NotificationPreferencesModal";
import AccessibilityModal from "./AccessibilityModal";
import { useAccessibility } from "../context/AccessibilityContext";
import { useColorPalette } from "../styles/colorBlindThemes";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAdmin } from "../context/AdminContext";
import { useActiveProfile } from "../context/ActiveProfileContext";
import { deleteChildAccount } from "../services/accountService";
import { resetManagerPin } from "../services/adminService";
import {
  CoachmarkAnchor,
  useCoachmark,
  createTour,
} from "@edwardloopez/react-native-coachmark";

const ACTIVE_CHILD_PROFILE_KEY = "activeChildProfile";

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
  const {
    isAdminVerified,
    isAdminEligible,
    checkEligibility,
    verifyAdminPin,
    clearAdminSession,
    error: adminError,
  } = useAdmin();
  const {
    activeChildUsername,
    childDocId,
    clearActiveChildProfile,
    profileType,
    refreshProfile,
  } = useActiveProfile();
  const activeChildProfile = activeChildUsername;
  const currentProfileType = profileType;

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
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState("");
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);
  const [isDisablingAdmin, setIsDisablingAdmin] = useState(false);
  const [isDeletingChild, setIsDeletingChild] = useState(false);
  const [showResetPinModal, setShowResetPinModal] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetNewPin, setResetNewPin] = useState("");
  const [resetConfirmPin, setResetConfirmPin] = useState("");
  const [isResettingPin, setIsResettingPin] = useState(false);
  const [resetPinError, setResetPinError] = useState("");
  const { start } = useCoachmark();

  // Check for active child profile when modal opens
  useEffect(() => {
    const checkActiveProfile = async () => {
      if (visible) {
        await refreshProfile();

        if (profileType === "parent" && auth.currentUser?.email) {
          await checkEligibility(auth.currentUser.email);
        }
      }
    };

    checkActiveProfile();
  }, [visible, profileType, refreshProfile, checkEligibility]);

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
    const isChild = profileType === "child";

    Alert.alert(
      isChild ? t("Settings.switchProfile") : t("Settings.logout"),
      isChild ? "Return to profile selection?" : t("Settings.logoutText"),
      [
        {
          text: t("Tasks.cancel"),
          style: "cancel",
        },
        {
          text: isChild ? t("Settings.switchProfile") : t("Settings.logout"),
          style: "destructive",
          onPress: async () => {
            try {
              if (isChild) {
                // Child "logout" - just clear active child profile
                await clearActiveChildProfile();
                await clearAdminSession();
                onClose();
                router.push("/pages/ProfileSelection");
              } else {
                // Parent logout - full logout
                await clearAdminSession();
                await AsyncStorage.removeItem(ACTIVE_CHILD_PROFILE_KEY);
                await signOut(auth);
                if (onLogout) {
                  onLogout();
                }
                onClose();
                router.replace("/pages/Login");
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

  const handleVerifyAdminAccess = async () => {
    const email = auth.currentUser?.email;
    if (!email) {
      Alert.alert(
        "Sign In Required",
        "Please sign in again to verify admin access.",
      );
      return;
    }

    if (!adminPinInput.trim()) {
      Alert.alert("PIN Required", "Please enter your admin PIN.");
      return;
    }

    setIsVerifyingAdmin(true);
    const verified = await verifyAdminPin(email, adminPinInput.trim());
    setIsVerifyingAdmin(false);

    if (verified) {
      setShowAdminPinModal(false);
      setAdminPinInput("");
      Alert.alert(
        "Admin Verified",
        "Admin access has been enabled for this session.",
      );
      return;
    }

    Alert.alert("Verification Failed", adminError || "Invalid admin PIN.");
  };

  const handleDisableAdminAccess = () => {
    Alert.alert(
      "Disable Admin Access",
      "Disable admin access for this session now?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disable",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDisablingAdmin(true);
              await clearAdminSession();
              Alert.alert(
                "Admin Access Disabled",
                "Admin controls are now locked.",
              );
            } catch (error) {
              console.error("Disable admin access failed", error);
              Alert.alert(
                "Disable Failed",
                "Could not disable admin access. Please try again.",
              );
            } finally {
              setIsDisablingAdmin(false);
            }
          },
        },
      ],
    );
  };

  const handleOpenResetPin = () => {
    setShowAdminPinModal(false);
    setResetPassword("");
    setResetNewPin("");
    setResetConfirmPin("");
    setResetPinError("");
    setShowResetPinModal(true);
  };

  const handleResetPinSubmit = async () => {
    setResetPinError("");
    const email = auth.currentUser?.email;
    if (!email) {
      setResetPinError(t("ResetManagerPin.errorNotSignedIn"));
      return;
    }
    if (!resetPassword) {
      setResetPinError(t("ResetManagerPin.errorPasswordRequired"));
      return;
    }
    if (!/^\d{4}$/.test(resetNewPin)) {
      setResetPinError(t("ResetManagerPin.errorPinLength"));
      return;
    }
    if (resetNewPin !== resetConfirmPin) {
      setResetPinError(t("ResetManagerPin.errorPinMismatch"));
      return;
    }

    setIsResettingPin(true);
    try {
      const credential = EmailAuthProvider.credential(email, resetPassword);
      await reauthenticateWithCredential(auth.currentUser!, credential);
      await resetManagerPin(resetNewPin);
      setShowResetPinModal(false);
      Alert.alert(t("ResetManagerPin.successTitle"), t("ResetManagerPin.successBody"));
    } catch (err: any) {
      const code = String(err?.code ?? "");
      if (code.includes("wrong-password") || code.includes("invalid-credential")) {
        setResetPinError(t("ResetManagerPin.errorWrongPassword"));
      } else {
        setResetPinError(err.message || t("ResetManagerPin.errorFailed"));
      }
    } finally {
      setIsResettingPin(false);
    }
  };

  const handleDeleteChildAccount = () => {
    if (!childDocId || !activeChildProfile) {
      Alert.alert(
        "Child Profile Unavailable",
        "We couldn't find the active child profile to delete.",
      );
      return;
    }

    Alert.alert(
      "Delete Child Account",
      `Delete ${activeChildProfile}'s account? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeletingChild(true);
              const result = await deleteChildAccount({ childDocId });

              if (!result.success) {
                throw new Error(
                  result.message || "Failed to delete child account",
                );
              }

              await clearActiveChildProfile();
              onClose();
              router.replace("/pages/ProfileSelection");
              Alert.alert("Deleted", "Child account deleted successfully.");
            } catch (error) {
              console.error("Error deleting child account:", error);
              Alert.alert(
                "Delete Failed",
                "Could not delete the child account. Please try again.",
              );
            } finally {
              setIsDeletingChild(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal
      animationType="fade"
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
                  profileType === "parent"
                    ? palette.secondaryMed
                    : palette.accentSoft,
                borderWidth: 1,
                borderColor:
                  profileType === "parent"
                    ? palette.secondarySoftBorder
                    : palette.accentSoftBorder,
              }}
            >
              <Text className="font-orbitron-semibold text-white text-xs">
                {profileType === "parent"
                  ? t("Settings.parentAccount")
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
                    {t("Settings.customize")}
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
                    {colorBlindMode === "none"
                      ? t("Settings.noFilter")
                      : colorBlindMode}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={palette.secondary}
              />
            </TouchableOpacity>
            <View
              className="flex-row justify-between items-center p-4 rounded-xl mb-3"
              style={{
                backgroundColor: palette.secondaryMed,
                borderWidth: 1,
                borderColor: palette.rowBorderPrimary,
              }}
            >
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await AsyncStorage.removeItem("onboardingSeen");
                    await AsyncStorage.removeItem("profileOnboardingSeen");
                    await AsyncStorage.removeItem("pomodoroOnboardingSeen");

                    onClose();

                    setTimeout(() => {
                      start(createTour("onboarding", []));
                    }, 300);
                  } catch (e) {
                    console.warn("Failed to restart tutorial", e);
                  }
                }}
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons
                    name="help-circle"
                    size={24}
                    color={palette.secondary}
                    style={{ marginRight: 12 }}
                  />
                  <Text className="font-orbitron-medium text-white text-base">
                    {t("Settings.replayTutorial")}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

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
                  router.push("/pages/PrivacyScreen");
                  onClose();
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

            {currentProfileType === "parent" &&
              isAdminEligible &&
              !isAdminVerified && (
                <TouchableOpacity
                  className="flex-row items-center p-4 rounded-xl mb-3"
                  style={{
                    backgroundColor: palette.secondaryMed,
                    borderWidth: 1,
                    borderColor: palette.rowBorderPrimary,
                  }}
                  onPress={() => {
                    setAdminPinInput("");
                    setShowAdminPinModal(true);
                  }}
                >
                  <Ionicons
                    name="shield-outline"
                    size={24}
                    color={palette.secondary}
                    style={{ marginRight: 12 }}
                  />
                  <Text className="font-orbitron-semibold text-white text-base flex-1">
                    Verify Admin Access
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={palette.secondary}
                  />
                </TouchableOpacity>
              )}

            {currentProfileType === "parent" && isAdminVerified && (
              <TouchableOpacity
                className="flex-row items-center p-4 rounded-xl mb-3"
                style={{
                  backgroundColor: palette.secondaryMed,
                  borderWidth: 1,
                  borderColor: palette.rowBorderPrimary,
                }}
                onPress={() => {
                  onClose();
                  router.push("/pages/AdminDashboard");
                }}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={24}
                  color={palette.secondary}
                  style={{ marginRight: 12 }}
                />
                <Text className="font-orbitron-semibold text-white text-base flex-1">
                  Admin Dashboard
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={palette.secondary}
                />
              </TouchableOpacity>
            )}

            {currentProfileType === "parent" && isAdminVerified && (
              <TouchableOpacity
                className="flex-row items-center p-4 rounded-xl mb-3"
                style={{
                  backgroundColor: palette.errorSoft,
                  borderWidth: 1,
                  borderColor: palette.errorSoftBorder,
                }}
                onPress={handleDisableAdminAccess}
                disabled={isDisablingAdmin}
              >
                {isDisablingAdmin ? (
                  <ActivityIndicator
                    color={palette.errorIcon}
                    style={{ marginRight: 12 }}
                  />
                ) : (
                  <Ionicons
                    name="shield-half"
                    size={24}
                    color={palette.errorIcon}
                    style={{ marginRight: 12 }}
                  />
                )}
                <Text className="font-orbitron-semibold text-white text-base flex-1">
                  Disable Admin Access
                </Text>
              </TouchableOpacity>
            )}

            {/*Support*/}
            <TouchableOpacity
              className="flex-row items-center p-4 rounded-xl mb-3"
              style={{
                backgroundColor: palette.tertiarySoft,
                borderWidth: 1,
                borderColor: palette.tertiarySoftBorder,
              }}
              onPress={() => {
                router.push("/pages/SupportScreen");
                onClose();
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

            {/*About us*/}
            <TouchableOpacity
              className="flex-row items-center p-4 rounded-xl mb-3"
              style={{
                backgroundColor: palette.tertiarySoft,
                borderWidth: 1,
                borderColor: palette.tertiarySoftBorder,
              }}
              onPress={() => {
                router.push("/pages/AboutUsScreen");
                onClose();
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

            {/* Reset Manager PIN - parent accounts */}
            {currentProfileType === "parent" && (
              <TouchableOpacity
                className="flex-row items-center p-4 rounded-xl mb-3"
                style={{
                  backgroundColor: "rgba(244, 63, 94, 0.22)",
                  borderWidth: 1,
                  borderColor: "rgba(244, 63, 94, 0.34)",
                }}
                onPress={handleOpenResetPin}
              >
                <Ionicons
                  name="key-outline"
                  size={24}
                  color="#f43f5e"
                  style={{ marginRight: 12 }}
                />
                <Text className="font-orbitron-semibold text-white text-base flex-1">
                  {t("ResetManagerPin.button")}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#f43f5e"
                />
              </TouchableOpacity>
            )}

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
                {currentProfileType === "child"
                  ? t("Settings.switchProfile")
                  : t("Settings.logout")}
              </Text>
            </TouchableOpacity>

            {currentProfileType === "child" && (
              <TouchableOpacity
                className="flex-row items-center justify-center p-4 rounded-xl mt-3"
                style={{
                  backgroundColor: palette.errorSoft,
                  borderWidth: 1,
                  borderColor: palette.errorSoftBorder,
                  opacity: isDeletingChild ? 0.7 : 1,
                }}
                onPress={handleDeleteChildAccount}
                disabled={isDeletingChild || !childDocId}
              >
                {isDeletingChild ? (
                  <ActivityIndicator
                    color={palette.errorIcon}
                    style={{ marginRight: 12 }}
                  />
                ) : (
                  <Ionicons
                    name="trash-outline"
                    size={24}
                    color={palette.errorIcon}
                    style={{ marginRight: 12 }}
                  />
                )}
                <Text
                  className="font-orbitron-semibold text-base"
                  style={{ color: palette.errorIcon }}
                >
                  {isDeletingChild
                    ? "Deleting Child Account..."
                    : "Delete Child Account"}
                </Text>
              </TouchableOpacity>
            )}
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

      <Modal
        animationType={reduceMotion ? "fade" : "slide"}
        transparent={true}
        visible={showAdminPinModal}
        onRequestClose={() => setShowAdminPinModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/70">
          <View
            className="w-10/12 max-w-sm rounded-3xl p-6"
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              borderWidth: 2,
              borderColor: palette.modalBorder,
            }}
          >
            <Text className="font-orbitron-semibold text-white text-xl text-center mb-2">
              Verify Admin PIN
            </Text>
            <Text className="font-orbitron text-gray-300 text-center mb-4">
              Enter your admin PIN to unlock admin actions.
            </Text>

            <TextInput
              value={adminPinInput}
              onChangeText={setAdminPinInput}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={8}
              placeholder="Enter PIN"
              placeholderTextColor="rgba(255,255,255,0.4)"
              className="bg-white/15 text-white text-center text-2xl rounded-xl p-4 mb-4"
              autoFocus
            />

            <TouchableOpacity
              onPress={handleVerifyAdminAccess}
              disabled={isVerifyingAdmin}
              className="rounded-xl p-4 mb-3"
              style={{ backgroundColor: palette.secondary }}
            >
              {isVerifyingAdmin ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="font-orbitron-semibold text-white text-center">
                  Verify
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (!isVerifyingAdmin) {
                  setShowAdminPinModal(false);
                }
              }}
              disabled={isVerifyingAdmin}
              className="rounded-xl p-4"
              style={{ backgroundColor: palette.tertiarySoft }}
            >
              <Text className="font-orbitron-semibold text-white text-center">
                {t("Tasks.cancel")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleOpenResetPin}
              disabled={isVerifyingAdmin}
              className="rounded-xl p-3 mt-1 items-center"
            >
              <Text className="font-orbitron text-gray-400 text-sm">
                {t("ResetManagerPin.forgotPin")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reset Manager PIN Modal */}
      <Modal
        animationType={reduceMotion ? "fade" : "slide"}
        transparent={true}
        visible={showResetPinModal}
        onRequestClose={() => !isResettingPin && setShowResetPinModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 justify-center items-center bg-black/70">
          <View
            className="w-10/12 max-w-sm rounded-3xl p-6"
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              borderWidth: 2,
              borderColor: palette.modalBorder,
            }}
          >
            <Text className="font-orbitron-semibold text-white text-xl text-center mb-1">
              {t("ResetManagerPin.title")}
            </Text>
            <Text className="font-orbitron text-gray-300 text-xs text-center mb-4">
              {t("ResetManagerPin.subtitle")}
            </Text>

            <TextInput
              value={resetPassword}
              onChangeText={setResetPassword}
              secureTextEntry
              placeholder={t("ResetManagerPin.passwordPlaceholder")}
              placeholderTextColor="rgba(255,255,255,0.4)"
              className="bg-white/15 text-white text-center rounded-xl p-4 mb-3"
              autoCapitalize="none"
              editable={!isResettingPin}
            />

            <TextInput
              value={resetNewPin}
              onChangeText={(v) => setResetNewPin(v.replace(/[^0-9]/g, "").slice(0, 4))}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={4}
              placeholder={t("ResetManagerPin.newPinPlaceholder")}
              placeholderTextColor="rgba(255,255,255,0.4)"
              className="bg-white/15 text-white text-center text-xl rounded-xl p-4 mb-3"
              editable={!isResettingPin}
            />

            <TextInput
              value={resetConfirmPin}
              onChangeText={(v) => setResetConfirmPin(v.replace(/[^0-9]/g, "").slice(0, 4))}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={4}
              placeholder={t("ResetManagerPin.confirmPinPlaceholder")}
              placeholderTextColor="rgba(255,255,255,0.4)"
              className="bg-white/15 text-white text-center text-xl rounded-xl p-4 mb-3"
              editable={!isResettingPin}
            />

            {resetPinError ? (
              <Text className="font-orbitron text-red-400 text-xs text-center mb-3">
                {resetPinError}
              </Text>
            ) : null}

            <TouchableOpacity
              onPress={handleResetPinSubmit}
              disabled={isResettingPin}
              className="rounded-xl p-4 mb-3"
              style={{ backgroundColor: palette.secondary }}
            >
              {isResettingPin ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="font-orbitron-semibold text-white text-center">
                  {t("ResetManagerPin.submit")}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowResetPinModal(false)}
              disabled={isResettingPin}
              className="rounded-xl p-4"
              style={{ backgroundColor: palette.tertiarySoft }}
            >
              <Text className="font-orbitron-semibold text-white text-center">
                {t("Tasks.cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Modal>
  );
}
