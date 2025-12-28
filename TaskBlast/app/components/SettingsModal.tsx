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
import { useRouter } from "expo-router";

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
  
  // Get audio context for global audio control
  const { soundEnabled, musicEnabled, setSoundEnabled, setMusicEnabled } =
    useAudio();

  // Other settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  
  // Child profile state
  const [activeChildProfile, setActiveChildProfile] = useState<string | null>(null);
  const [currentProfileType, setCurrentProfileType] = useState<"parent" | "child">("parent");

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
      ]
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
              Settings
            </Text>
            <TouchableOpacity
              testID="close-settings-modal"
              onPress={onClose}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{
                backgroundColor: "rgba(139, 92, 246, 0.3)",
                borderWidth: 1,
                borderColor: "rgba(167, 139, 250, 0.5)",
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
                    ? "rgba(59, 130, 246, 0.3)"
                    : "rgba(168, 85, 247, 0.3)",
                borderWidth: 1,
                borderColor:
                  currentProfileType === "parent"
                    ? "rgba(96, 165, 250, 0.5)"
                    : "rgba(192, 132, 252, 0.5)",
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
                backgroundColor: "rgba(59, 130, 246, 0.2)",
                borderWidth: 1,
                borderColor: "rgba(59, 130, 246, 0.3)",
              }}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons
                  name="volume-high"
                  size={24}
                  color="#60a5fa"
                  style={{ marginRight: 12 }}
                />
                <Text className="font-orbitron-semibold text-white text-base">
                  Sound Effects
                </Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={handleSoundToggle}
                trackColor={{ false: "#334155", true: "#8b5cf6" }}
                thumbColor={soundEnabled ? "#a855f7" : "#64748b"}
              />
            </View>

            {/* Music */}
            <View
              className="flex-row justify-between items-center p-4 rounded-xl mb-3"
              style={{
                backgroundColor: "rgba(59, 130, 246, 0.2)",
                borderWidth: 1,
                borderColor: "rgba(59, 130, 246, 0.3)",
              }}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons
                  name="musical-notes"
                  size={24}
                  color="#60a5fa"
                  style={{ marginRight: 12 }}
                />
                <Text className="font-orbitron-medium text-white text-base">
                  Music
                </Text>
              </View>
              <Switch
                value={musicEnabled}
                onValueChange={handleMusicToggle}
                trackColor={{ false: "#334155", true: "#8b5cf6" }}
                thumbColor={musicEnabled ? "#a855f7" : "#64748b"}
              />
            </View>

            {/* Notifications */}
            <View
              className="flex-row justify-between items-center p-4 rounded-xl mb-3"
              style={{
                backgroundColor: "rgba(59, 130, 246, 0.2)",
                borderWidth: 1,
                borderColor: "rgba(59, 130, 246, 0.3)",
              }}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons
                  name="notifications"
                  size={24}
                  color="#60a5fa"
                  style={{ marginRight: 12 }}
                />
                <Text className="font-orbitron-medium text-white text-base">
                  Notifications
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#334155", true: "#8b5cf6" }}
                thumbColor={notificationsEnabled ? "#a855f7" : "#64748b"}
              />
            </View>

            {/* Divider */}
            <View
              className="h-px my-4"
              style={{ backgroundColor: "rgba(139, 92, 246, 0.3)" }}
            />
            
            {/* Privacy - Only show for parent */}
            {currentProfileType === "parent" && (
              <TouchableOpacity
                className="flex-row items-center p-4 rounded-xl mb-3"
                style={{
                  backgroundColor: "rgba(236, 72, 153, 0.2)",
                  borderWidth: 1,
                  borderColor: "rgba(236, 72, 153, 0.3)",
                }}
                onPress={() => {
                  // Add privacy settings navigation
                  console.log("Privacy pressed");
                }}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={24}
                  color="#ec4899"
                  style={{ marginRight: 12 }}
                />
                <Text className="font-orbitron-semibold text-white text-base flex-1">
                  Privacy
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#ec4899" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              className="flex-row items-center p-4 rounded-xl mb-3"
              style={{
                backgroundColor: "rgba(236, 72, 153, 0.2)",
                borderWidth: 1,
                borderColor: "rgba(236, 72, 153, 0.3)",
              }}
              onPress={() => {
                // Add help & support navigation
                console.log("Help & Support pressed");
              }}
            >
              <Ionicons
                name="help-circle"
                size={24}
                color="#ec4899"
                style={{ marginRight: 12 }}
              />
              <Text className="font-orbitron-medium text-white text-base flex-1">
                Help & Support
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#ec4899" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center p-4 rounded-xl mb-3"
              style={{
                backgroundColor: "rgba(236, 72, 153, 0.2)",
                borderWidth: 1,
                borderColor: "rgba(236, 72, 153, 0.3)",
              }}
              onPress={() => {
                // Add about navigation
                console.log("About pressed");
              }}
            >
              <Ionicons
                name="information-circle"
                size={24}
                color="#ec4899"
                style={{ marginRight: 12 }}
              />
              <Text className="font-orbitron-semibold text-white text-base flex-1">
                About
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#ec4899" />
            </TouchableOpacity>

            {/* Logout/Switch Profile Button */}
            <TouchableOpacity
              testID="logout-button"
              className="flex-row items-center justify-center p-4 rounded-xl"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.2)",
                borderWidth: 1,
                borderColor: "rgba(239, 68, 68, 0.3)",
              }}
              onPress={handleLogout}
            >
              <Ionicons
                name={currentProfileType === "child" ? "swap-horizontal" : "log-out-outline"}
                size={24}
                color="#ef4444"
                style={{ marginRight: 12 }}
              />
              <Text className="font-orbitron-bold text-red-400 text-base">
                {currentProfileType === "child" ? "Switch Profile" : "Logout"}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* App Version */}
          <View className="items-center mt-6 pt-4 border-t border-purple-500/30">
            <Text className="font-orbitron text-gray-400 text-xs">
              TaskBlast v1.0.0
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}