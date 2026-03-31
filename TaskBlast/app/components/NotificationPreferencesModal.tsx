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
        Reminder Time
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

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleSave = async () => {
    await updatePreferences(localPrefs);
    Alert.alert(
      "✅ Settings Saved",
      "Your notification preferences have been updated!",
      [{ text: "OK", style: "default" }],
    );
    onClose();
  };

  const handleRequestPermissions = async () => {
    const granted = await requestPermissions();
    if (granted) {
      Alert.alert("✅ Permissions Granted", "Notifications are now enabled!", [
        { text:
           "OK", style: "default" },
      ]);
    } else {
      Alert.alert(
        "❌ Permissions Needed",
        "Please enable notifications in your device settings to use this feature.",
        [{ text: "OK", style: "cancel" }],
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
          "⚠️ Permissions Required",
          "Please enable notifications first to test the daily reminder.",
          [{ text: "OK" }],
        );
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "TaskBlast Reminder",
          body: "You have 3 tasks waiting! Ready to tackle them?",
          sound: localPrefs.soundEnabled ? "default" : false,
          data: {
            type: "DAILY_DIGEST",
            isTest: true,
          },
        },
        trigger: null,
      });

      Alert.alert(
        "✅ Test Sent!",
        "Check your notification tray to see what the daily reminder looks like.",
        [{ text: "OK" }],
      );
    } catch (error) {
      console.error("Error sending test notification:", error);
      Alert.alert(
        "❌ Test Failed",
        "Could not send test notification. Please try again.",
        [{ text: "OK" }],
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
              Notifications
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
                ⚠️ Permissions Required
              </Text>
              <Text className="font-orbitron text-gray-300 text-xs mb-3">
                Notifications are currently disabled. Enable them to receive
                task reminders.
              </Text>
              <TouchableOpacity
                onPress={handleRequestPermissions}
                className="p-3 rounded-lg items-center"
                style={{ backgroundColor: "rgba(234, 179, 8, 0.9)" }}
              >
                <Text className="font-orbitron-bold text-black text-sm">
                  Enable Notifications
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} className="max-h-96">
            {/* Main Settings */}
            <View className="mb-5">
              <Text className="font-orbitron-semibold text-white text-base mb-3">
                Main Settings
              </Text>
              <SettingRow
                label="Enable Notifications"
                description="Turn all notifications on or off"
                value={localPrefs.enabled}
                onToggle={toggleEnabled}
              />
            </View>

            {/* Sensory Settings */}
            <View className="mb-5">
              <Text className="font-orbitron-semibold text-white text-base mb-2">
                Sensory Settings
              </Text>
              <Text className="font-orbitron text-gray-400 text-xs mb-3">
                Control how notifications get your attention
              </Text>
              <SettingRow
                label="Sound"
                description="Play notification sound"
                value={localPrefs.soundEnabled}
                onToggle={toggleSound}
              />
              <SettingRow
                label="Vibration"
                description="Vibrate when notification arrives"
                value={localPrefs.vibrationEnabled}
                onToggle={toggleVibration}
              />
            </View>

            {/* Daily Digest Reminder */}
            <View className="mb-5">
              <Text className="font-orbitron-semibold text-white text-base mb-2">
                📅 Daily Task Reminder
              </Text>
              <Text className="font-orbitron text-gray-400 text-xs mb-3">
                Get a daily reminder about your incomplete tasks
              </Text>
              <SettingRow
                label="Enable Daily Reminder"
                description="Receive a daily notification with task count"
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
                      🧪 Send Test Notification
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
              <Text className="font-orbitron-semibold text-white">Cancel</Text>
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
                Save
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