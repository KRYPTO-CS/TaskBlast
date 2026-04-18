/**
 * Notification Preferences Modal
 *
 * A neurodivergent-friendly UI for customizing notification settings.
 * Designed for both users and caregivers to easily control notification behavior.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Text } from '../../TTS';
import * as Notifications from "expo-notifications";
import { useNotifications } from "../context/NotificationContext";
import { useColorPalette } from "../styles/colorBlindThemes";
import { useTranslation } from "react-i18next";

interface NotificationPreferencesModalProps {
  visible: boolean;
  onClose: () => void;
}

// ─── Time Picker ────────────────────────────────────────────────────────────

/** Parse a "HH:MM" 24h string into a Date object (date portion is today) */
function timeStringToDate(time: string): Date {
  const [hStr, mStr] = time.split(":");
  const d = new Date();
  d.setHours(parseInt(hStr, 10), parseInt(mStr, 10), 0, 0);
  return d;
}

/** Convert a Date back to a "HH:MM" 24h string */
function dateToTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

interface TimePickerProps {
  value: string; // "HH:MM" 24h
  onChange: (value: string) => void;
  palette: ReturnType<typeof useColorPalette>;
}

function TimePicker({ value, onChange, palette }: TimePickerProps) {
  const { t } = useTranslation();
  const date = timeStringToDate(value);

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (selected) onChange(dateToTimeString(selected));
  };

  return (
    <View
      style={{
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: palette.rowBorderPrimary,
        backgroundColor: palette.secondaryMed,
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <Text
        style={{
          color: "#94a3b8",
          fontSize: 11,
          fontFamily: "Orbitron-Regular",
          letterSpacing: 1.5,
          textTransform: "uppercase",
          textAlign: "center",
          marginBottom: 4,
        }}
      >
        {t("NotificationPreferencesModal.reminderTime")}
      </Text>
      <DateTimePicker
        value={date}
        mode="time"
        display="spinner"
        onChange={handleChange}
        themeVariant="dark"
        style={{ alignSelf: "center" }}
      />
    </View>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export default function NotificationPreferencesModal({
  visible,
  onClose,
}: NotificationPreferencesModalProps) {
  const {
    preferences,
    permissionGranted,
    updatePreferences,
    requestPermissions,
  } = useNotifications();

  const [localPrefs, setLocalPrefs] = useState(preferences);
  const palette = useColorPalette();
  const { t } = useTranslation();

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleSave = async () => {
    await updatePreferences(localPrefs);
    Alert.alert(
      t("NotificationPreferencesModal.settingsSavedTitle"),
      t("NotificationPreferencesModal.settingsSavedBody"),
      [{ text: t("NotificationPreferencesModal.ok"), style: "default" }],
    );
    onClose();
  };

  const handleRequestPermissions = async () => {
    const granted = await requestPermissions();
    if (granted) {
      Alert.alert(t("NotificationPreferencesModal.permissionsGrantedTitle"), t("NotificationPreferencesModal.permissionsGrantedBody"), [
        { text: t("NotificationPreferencesModal.ok"), style: "default" },
      ]);
    } else {
      Alert.alert(
        t("NotificationPreferencesModal.permissionsNeededTitle"),
        t("NotificationPreferencesModal.permissionsNeededBody"),
        [{ text: t("NotificationPreferencesModal.ok"), style: "cancel" }],
      );
    }
  };

  const toggleEnabled = (enabled: boolean) => setLocalPrefs({ ...localPrefs, enabled });
  const toggleSound = (soundEnabled: boolean) => setLocalPrefs({ ...localPrefs, soundEnabled });
  const toggleVibration = (vibrationEnabled: boolean) => setLocalPrefs({ ...localPrefs, vibrationEnabled });
  const toggleDailyDigest = (dailyDigestEnabled: boolean) => setLocalPrefs({ ...localPrefs, dailyDigestEnabled });

  const handleTestDailyDigest = async () => {
    try {
      if (!permissionGranted) {
        Alert.alert(
          t("NotificationPreferencesModal.permissionsRequiredTitle"),
          t("NotificationPreferencesModal.permissionsRequiredBody"),
          [{ text: t("NotificationPreferencesModal.ok") }],
        );
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: t("NotificationPreferencesModal.testNotificationTitle"),
          body: t("NotificationPreferencesModal.testNotificationBody"),
          sound: localPrefs.soundEnabled ? "default" : false,
          data: {
            type: "DAILY_DIGEST",
            isTest: true,
          },
        },
        trigger: null,
      });

      Alert.alert(
        t("NotificationPreferencesModal.testSentTitle"),
        t("NotificationPreferencesModal.testSentBody"),
        [{ text: t("NotificationPreferencesModal.ok") }],
      );
    } catch (error) {
      console.error("Error sending test notification:", error);
      Alert.alert(
        t("NotificationPreferencesModal.testFailedTitle"),
        t("NotificationPreferencesModal.testFailedBody"),
        [{ text: t("NotificationPreferencesModal.ok") }],
      );
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
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
              {t("NotificationPreferencesModal.title")}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{
                backgroundColor: palette.accentSoft,
                borderWidth: 1,
                borderColor: palette.accentSoftBorder,
              }}
            >
              <Text className="text-white text-xl">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Permission Warning */}
          {!permissionGranted && (
            <View
              className="p-4 rounded-xl mb-5"
              style={{
                backgroundColor: "rgba(234, 179, 8, 0.15)",
                borderWidth: 1,
                borderColor: "rgba(234, 179, 8, 0.3)",
              }}
            >
              <Text className="font-orbitron-semibold text-yellow-400 mb-2">
                {t("NotificationPreferencesModal.permissionsRequiredTitle")}
              </Text>
              <Text className="font-orbitron text-gray-300 text-xs mb-3">
                {t("NotificationPreferencesModal.permissionsDisabledBody")}
              </Text>
              <TouchableOpacity
                onPress={handleRequestPermissions}
                className="p-3 rounded-lg items-center"
                style={{ backgroundColor: "rgba(234, 179, 8, 0.9)" }}
              >
                <Text className="font-orbitron-bold text-black text-sm">
                  {t("NotificationPreferencesModal.enableNotifications")}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} className="max-h-96">
            {/* Main Settings */}
            <View className="mb-5">
              <Text className="font-orbitron-semibold text-white text-base mb-3">
                {t("NotificationPreferencesModal.mainSettings")}
              </Text>
              <SettingRow
                label={t("NotificationPreferencesModal.enableNotifications")}
                description={t("NotificationPreferencesModal.enableNotificationsDescription")}
                value={localPrefs.enabled}
                onToggle={toggleEnabled}
              />
            </View>

            {/* Sensory Settings */}
            <View className="mb-5">
              <Text className="font-orbitron-semibold text-white text-base mb-2">
                {t("NotificationPreferencesModal.sensorySettings")}
              </Text>
              <Text className="font-orbitron text-gray-400 text-xs mb-3">
                {t("NotificationPreferencesModal.sensorySettingsDescription")}
              </Text>
              <SettingRow
                label={t("NotificationPreferencesModal.sound")}
                description={t("NotificationPreferencesModal.soundDescription")}
                value={localPrefs.soundEnabled}
                onToggle={toggleSound}
              />
              <SettingRow
                label={t("NotificationPreferencesModal.vibration")}
                description={t("NotificationPreferencesModal.vibrationDescription")}
                value={localPrefs.vibrationEnabled}
                onToggle={toggleVibration}
              />
            </View>

            {/* Daily Digest Reminder */}
            <View className="mb-5">
              <Text className="font-orbitron-semibold text-white text-base mb-2">
                {t("NotificationPreferencesModal.dailyReminderTitle")}
              </Text>
              <Text className="font-orbitron text-gray-400 text-xs mb-3">
                {t("NotificationPreferencesModal.dailyReminderDescription")}
              </Text>
              <SettingRow
                label={t("NotificationPreferencesModal.enableDailyReminder")}
                description={t("NotificationPreferencesModal.enableDailyReminderDescription")}
                value={localPrefs.dailyDigestEnabled}
                onToggle={toggleDailyDigest}
              />

              {localPrefs.dailyDigestEnabled && (
                <View className="mt-3">
                  {/* Scroll Wheel Time Picker */}
                  <TimePicker
                    value={localPrefs.dailyDigestTime}
                    onChange={(time) => setLocalPrefs({ ...localPrefs, dailyDigestTime: time })}
                    palette={palette}
                  />

                  {/* Test Button */}
                  <TouchableOpacity
                    onPress={handleTestDailyDigest}
                    className="mt-4 p-3 rounded-lg items-center"
                    style={{
                      backgroundColor: "rgba(34, 197, 94, 0.2)",
                      borderWidth: 1,
                      borderColor: "rgba(34, 197, 94, 0.4)",
                    }}
                  >
                    <Text className="font-orbitron-semibold text-green-400 text-sm">
                      {t("NotificationPreferencesModal.testButton")}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mt-6">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 p-4 rounded-xl items-center"
              style={{
                backgroundColor: "rgba(71, 85, 105, 0.3)",
                borderWidth: 1,
                borderColor: "rgba(100, 116, 139, 0.5)",
              }}
            >
              <Text className="font-orbitron-semibold text-white">
                {t("NotificationPreferencesModal.cancel")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              className="flex-[2] p-4 rounded-xl items-center"
              style={{
                backgroundColor: palette.accent,
                borderWidth: 1,
                borderColor: palette.accentActiveBorder,
              }}
            >
              <Text className="font-orbitron-bold text-white text-base">
                {t("NotificationPreferencesModal.save")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Setting Row ─────────────────────────────────────────────────────────────

interface SettingRowProps {
  label: string;
  description: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

function SettingRow({ label, description, value, onToggle }: SettingRowProps) {
  const palette = useColorPalette();
  return (
    <View
      className="flex-row justify-between items-center p-4 rounded-xl mb-3"
      style={{
        backgroundColor: palette.secondaryMed,
        borderWidth: 1,
        borderColor: palette.rowBorderPrimary,
      }}
    >
      <View className="flex-1 mr-4">
        <Text className="font-orbitron-semibold text-white text-sm mb-1">
          {label}
        </Text>
        <Text className="font-orbitron text-gray-400 text-xs">
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{
          false: palette.switchTrackOff,
          true: palette.switchTrackOn,
        }}
        thumbColor={value ? palette.switchThumbOn : palette.switchThumbOff}
      />
    </View>
  );
}