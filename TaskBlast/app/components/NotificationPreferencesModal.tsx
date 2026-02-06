/**
 * Notification Preferences Modal
 *
 * A neurodivergent-friendly UI for customizing notification settings.
 * Designed for both users and caregivers to easily control notification behavior.
 */

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
import * as Notifications from "expo-notifications";
import { useNotifications } from "../context/NotificationContext";

interface NotificationPreferencesModalProps {
  visible: boolean;
  onClose: () => void;
}

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
        { text: "OK", style: "default" },
      ]);
    } else {
      Alert.alert(
        "❌ Permissions Needed",
        "Please enable notifications in your device settings to use this feature.",
        [{ text: "OK", style: "cancel" }],
      );
    }
  };

  const toggleEnabled = (enabled: boolean) => {
    setLocalPrefs({ ...localPrefs, enabled });
  };

  const toggleSound = (soundEnabled: boolean) => {
    setLocalPrefs({ ...localPrefs, soundEnabled });
  };

  const toggleVibration = (vibrationEnabled: boolean) => {
    setLocalPrefs({ ...localPrefs, vibrationEnabled });
  };

  const toggleVisualOnly = (visualOnly: boolean) => {
    setLocalPrefs({ ...localPrefs, visualOnly });
  };

  const toggleDailyDigest = (dailyDigestEnabled: boolean) => {
    setLocalPrefs({ ...localPrefs, dailyDigestEnabled });
  };

  const setDailyDigestTime = (dailyDigestTime: string) => {
    setLocalPrefs({ ...localPrefs, dailyDigestTime });
  };

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

      // Show a test notification immediately
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "TaskBlast Reminder",
          body: "You have 3 tasks waiting! Ready to tackle them?",
          sound: localPrefs.soundEnabled ? "default" : undefined,
          data: {
            type: "DAILY_DIGEST",
            isTest: true,
          },
        },
        trigger: null, // Immediate notification
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
            borderColor: "rgba(139, 92, 246, 0.5)",
            shadowColor: "#a855f7",
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
                textShadowColor: "rgba(139, 92, 246, 0.8)",
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
                backgroundColor: "rgba(139, 92, 246, 0.3)",
                borderWidth: 1,
                borderColor: "rgba(167, 139, 250, 0.5)",
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
                style={{
                  backgroundColor: "rgba(234, 179, 8, 0.9)",
                }}
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

              <SettingRow
                label="Visual Only Mode"
                description="Silent notifications (no sound or vibration)"
                value={localPrefs.visualOnly}
                onToggle={toggleVisualOnly}
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
                  <Text className="font-orbitron text-gray-400 text-xs mb-2">
                    Reminder Time
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {[
                      { label: "9 AM", value: "09:00" },
                      { label: "12 PM", value: "12:00" },
                      { label: "3 PM", value: "15:00" },
                      { label: "6 PM", value: "18:00" },
                      { label: "8 PM", value: "20:00" },
                    ].map((time) => (
                      <TouchableOpacity
                        key={time.value}
                        onPress={() => setDailyDigestTime(time.value)}
                        className="py-2 px-4 rounded-lg"
                        style={{
                          backgroundColor:
                            localPrefs.dailyDigestTime === time.value
                              ? "rgba(139, 92, 246, 0.9)"
                              : "rgba(59, 130, 246, 0.2)",
                          borderWidth: 1,
                          borderColor:
                            localPrefs.dailyDigestTime === time.value
                              ? "rgba(167, 139, 250, 0.8)"
                              : "rgba(59, 130, 246, 0.3)",
                        }}
                      >
                        <Text
                          className={`text-white text-sm ${
                            localPrefs.dailyDigestTime === time.value
                              ? "font-orbitron-bold"
                              : "font-orbitron"
                          }`}
                        >
                          {time.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

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
                backgroundColor: "rgba(139, 92, 246, 0.9)",
                borderWidth: 1,
                borderColor: "rgba(167, 139, 250, 0.8)",
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

// Helper component for setting rows
interface SettingRowProps {
  label: string;
  description: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

function SettingRow({ label, description, value, onToggle }: SettingRowProps) {
  return (
    <View
      className="flex-row justify-between items-center p-4 rounded-xl mb-3"
      style={{
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderWidth: 1,
        borderColor: "rgba(59, 130, 246, 0.3)",
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
        trackColor={{ false: "#334155", true: "#8b5cf6" }}
        thumbColor={value ? "#a855f7" : "#64748b"}
      />
    </View>
  );
}
