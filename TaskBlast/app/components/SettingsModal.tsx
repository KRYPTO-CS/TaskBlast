import React, { useState, useEffect } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { Text } from "../../TTS";
import { Ionicons } from "@expo/vector-icons";
import { auth, firestore } from "../../server/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useActiveProfile } from "../context/ActiveProfileContext";
import { useAudio } from "../context/AudioContext";
import { useNotifications } from "../context/NotificationContext";
import NotificationPreferencesModal from "./NotificationPreferencesModal";
import AccessibilityModal from "./AccessibilityModal";
import { useAccessibility } from "../context/AccessibilityContext";
import { useColorPalette } from "../styles/colorBlindThemes";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAdmin } from "../context/AdminContext";

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

  // Managed mode state
  const [accountType, setAccountType] = useState<string | null>(null);
  const [managerialPin, setManagerialPin] = useState<string | null>(null);
  const [showDisableManagedModal, setShowDisableManagedModal] = useState(false);
  const [disableManagedPinInput, setDisableManagedPinInput] = useState("");
  const [disableManagedError, setDisableManagedError] = useState("");
  const [isDisablingManaged, setIsDisablingManaged] = useState(false);

  const { activeChildProfile, refresh } = useActiveProfile();
  const currentProfileType = activeChildProfile ? "child" : "parent";

  useEffect(() => {
    const handleVisible = async () => {
      if (visible) {
        await refresh();
        const user = auth.currentUser;
        if (user) {
          if (!activeChildProfile && user.email) {
            await checkEligibility(user.email);
          }
          const userDoc = await getDoc(doc(firestore, "users", user.uid));
          if (userDoc.exists()) {
            setAccountType(userDoc.data().accountType ?? null);
            setManagerialPin(userDoc.data().managerialPin ?? null);
          }
        }
      }
    };
    handleVisible();
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
      isChild ? t("Settings.switchProfile") : t("Settings.logout"),
      isChild
        ? "Return to profile selection?"
        : t("Settings.logoutText"),
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
                // Route to ProfileSelection — it will gate the switch behind the managerial PIN
                await clearAdminSession();
                onClose();
                router.push("/pages/ProfileSelection");
              } else {
                // Parent logout - full logout
                await clearAdminSession();
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

  const handleDisableManagedMode = async (pinOverride?: string) => {
    const pin = pinOverride ?? disableManagedPinInput;
    if (pin !== managerialPin) {
      setDisableManagedError("Incorrect PIN");
      setDisableManagedPinInput("");
      return;
    }
    setIsDisablingManaged(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      await updateDoc(doc(firestore, "users", user.uid), {
        accountType: "independent",
        managerialPin: null,
      });
      setAccountType("independent");
      setManagerialPin(null);
      setShowDisableManagedModal(false);
      setDisableManagedPinInput("");
      setDisableManagedError("");
      Alert.alert("Managed Mode Disabled", "This account is now independent.");
    } catch (error) {
      console.error("Failed to disable managed mode", error);
      setDisableManagedError("Failed to update. Please try again.");
    } finally {
      setIsDisablingManaged(false);
    }
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
                    {colorBlindMode === "none" ? t("Settings.noFilter") : colorBlindMode}
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

            {/* Disable Managed Mode - only show for parent profile on a managed account */}
            {currentProfileType === "parent" && accountType === "managed" && (
              <TouchableOpacity
                className="flex-row items-center p-4 rounded-xl mb-3"
                style={{
                  backgroundColor: palette.errorSoft,
                  borderWidth: 1,
                  borderColor: palette.errorSoftBorder,
                }}
                onPress={() => {
                  setDisableManagedPinInput("");
                  setDisableManagedError("");
                  setShowDisableManagedModal(true);
                }}
              >
                <Ionicons
                  name="shield-half-outline"
                  size={24}
                  color={palette.errorIcon}
                  style={{ marginRight: 12 }}
                />
                <Text className="font-orbitron-semibold text-white text-base flex-1">
                  Disable Managed Mode
                </Text>
                <Ionicons name="chevron-forward" size={20} color={palette.errorIcon} />
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
                {currentProfileType === "child" ? t("Settings.switchProfile") : t("Settings.logout")}
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
          </View>
        </View>
      </Modal>
      {/* Disable Managed Mode PIN Modal */}
      <Modal
        animationType={reduceMotion ? "fade" : "slide"}
        transparent={true}
        visible={showDisableManagedModal}
        onRequestClose={() => setShowDisableManagedModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/70">
          <View
            className="w-10/12 max-w-sm rounded-3xl p-6"
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              borderWidth: 2,
              borderColor: palette.errorSoftBorder,
            }}
          >
            <Text className="font-orbitron-semibold text-white text-xl text-center mb-2">
              Disable Managed Mode
            </Text>
            <Text className="font-orbitron text-gray-300 text-center text-xs mb-4">
              Enter your managerial PIN to remove managed mode from this account.
            </Text>
            <TextInput
              value={disableManagedPinInput}
              onChangeText={(text) => {
                setDisableManagedPinInput(text);
                if (text.length === 4) {
                  Keyboard.dismiss();
                  handleDisableManagedMode(text);
                }
              }}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={4}
              returnKeyType="done"
              onSubmitEditing={() => handleDisableManagedMode()}
              placeholder="****"
              placeholderTextColor="rgba(255,255,255,0.4)"
              className="bg-white/15 text-white text-center text-2xl rounded-xl p-4 mb-2"
              autoFocus
            />
            {disableManagedError ? (
              <Text className="text-red-400 text-center font-orbitron text-xs mb-3">
                {disableManagedError}
              </Text>
            ) : <View className="mb-3" />}
            <TouchableOpacity
              onPress={() => handleDisableManagedMode()}
              disabled={isDisablingManaged}
              className="rounded-xl p-4 mb-3"
              style={{ backgroundColor: palette.errorSoft, borderWidth: 1, borderColor: palette.errorSoftBorder, opacity: isDisablingManaged ? 0.5 : 1 }}
            >
              {isDisablingManaged ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="font-orbitron-semibold text-white text-center">
                  Confirm
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => !isDisablingManaged && setShowDisableManagedModal(false)}
              disabled={isDisablingManaged}
              className="rounded-xl p-4"
              style={{ backgroundColor: palette.tertiarySoft }}
            >
              <Text className="font-orbitron-semibold text-white text-center">
                {t("Tasks.cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
