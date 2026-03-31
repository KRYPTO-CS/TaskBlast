import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Keyboard,
} from "react-native";
import { Text } from '../../TTS';
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, firestore } from "../../server/firebase";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { useActiveProfile } from "../context/ActiveProfileContext";

interface ChildProfile {
  id: string;
  username: string;
  firstName: string;
}

export default function ProfileSelection() {
  const router = useRouter();
  const starBackground = require("../../assets/backgrounds/starsAnimated.gif");
  const { activeChildProfile, refresh } = useActiveProfile();
  const [t] = useTranslation();

  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [managerialPin, setManagerialPin] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Which card was tapped: "parent" or a child username
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  // Inline PIN creation (when managerialPin is null)
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [isSavingPin, setIsSavingPin] = useState(false);

  const confirmPinRef = useRef<TextInput>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Auto-submit when existing PIN reaches 4 digits
  useEffect(() => {
    if (pinInput.length === 4 && !isSettingPin) {
      Keyboard.dismiss();
      handlePinSubmit();
    }
  }, [pinInput]);

  // Auto-focus confirm field when new PIN is complete
  useEffect(() => {
    if (newPin.length === 4) {
      confirmPinRef.current?.focus();
    }
  }, [newPin]);

  // Auto-submit when confirm PIN reaches 4 digits
  useEffect(() => {
    if (confirmNewPin.length === 4 && newPin.length === 4) {
      Keyboard.dismiss();
      handleCreatePin();
    }
  }, [confirmNewPin]);

  const loadData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push("/pages/Login");
        return;
      }

      const [childrenSnapshot, parentDoc] = await Promise.all([
        getDocs(collection(firestore, `users/${user.uid}/children`)),
        getDoc(doc(firestore, "users", user.uid)),
      ]);

      const childList: ChildProfile[] = [];
      childrenSnapshot.forEach((d) => {
        childList.push({ id: d.id, ...d.data() } as ChildProfile);
      });
      setChildren(childList);

      if (parentDoc.exists()) {
        setManagerialPin(parentDoc.data().managerialPin ?? null);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileTap = (profile: "parent" | string) => {
    // Tapping the parent card when already in parent mode — go straight home
    if (profile === "parent" && !activeChildProfile) {
      router.push("/pages/HomeScreen");
      return;
    }

    setSelectedProfile(profile);
    setPinInput("");
    setPinError("");
    setIsSettingPin(managerialPin === null);
    setNewPin("");
    setConfirmNewPin("");
  };

  const handleCreatePin = async () => {
    if (newPin.length !== 4) {
      setPinError("PIN must be 4 digits");
      return;
    }
    if (newPin !== confirmNewPin) {
      setPinError("PINs do not match");
      return;
    }

    setIsSavingPin(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      await updateDoc(doc(firestore, "users", user.uid), {
        managerialPin: newPin,
        accountType: "managed",
      });

      setManagerialPin(newPin);
      setIsSettingPin(false);
      // Now proceed as if they just entered the correct PIN
      await proceedWithSwitch(selectedProfile!);
    } catch (error) {
      console.error("Error saving managerial PIN:", error);
      setPinError("Failed to save PIN. Please try again.");
    } finally {
      setIsSavingPin(false);
    }
  };

  const handlePinSubmit = async () => {
    if (pinInput !== managerialPin) {
      setPinError("Incorrect PIN");
      setPinInput("");
      return;
    }
    await proceedWithSwitch(selectedProfile!);
  };

  const proceedWithSwitch = async (profile: string) => {
    if (profile === "parent") {
      await AsyncStorage.removeItem("activeChildProfile");
    } else {
      await AsyncStorage.setItem("activeChildProfile", profile);
    }
    await refresh();
    router.push("/pages/HomeScreen");
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-900">
        <ActivityIndicator size="large" color="#a855f7" />
        <Text className="text-white text-lg font-orbitron mt-4">Loading profiles...</Text>
      </View>
    );
  }

  const pinSection = selectedProfile !== null && (
    <View
      className="mt-4 p-6 rounded-2xl"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 2,
        borderColor: "rgba(255, 255, 255, 0.3)",
      }}
    >
      {isSettingPin ? (
        <>
          <Text className="text-white text-lg font-orbitron-semibold mb-2 text-center">
            Set a Managerial PIN
          </Text>
          <Text className="text-white/60 text-xs font-orbitron mb-4 text-center">
            This PIN protects all account switching. The person who knows it is in charge.
          </Text>
          <TextInput
            className="bg-white/20 text-white text-center text-2xl font-orbitron p-4 rounded-xl mb-3"
            placeholder="New PIN"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={newPin}
            onChangeText={setNewPin}
            secureTextEntry
            keyboardType="numeric"
            maxLength={4}
            returnKeyType="next"
            autoFocus
          />
          <TextInput
            ref={confirmPinRef}
            className="bg-white/20 text-white text-center text-2xl font-orbitron p-4 rounded-xl mb-3"
            placeholder="Confirm PIN"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={confirmNewPin}
            onChangeText={setConfirmNewPin}
            secureTextEntry
            keyboardType="numeric"
            maxLength={4}
            returnKeyType="done"
            onSubmitEditing={handleCreatePin}
          />
          {pinError ? (
            <Text className="text-red-400 text-center font-orbitron text-xs mb-3">{pinError}</Text>
          ) : null}
          <TouchableOpacity
            onPress={handleCreatePin}
            disabled={isSavingPin}
            className="bg-purple-600 p-4 rounded-xl"
            style={{ opacity: isSavingPin ? 0.5 : 1 }}
          >
            <Text className="text-white text-center font-orbitron-bold text-lg">
              {isSavingPin ? "Saving..." : "Set PIN & Continue"}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text className="text-white text-lg font-orbitron-semibold mb-4 text-center">
            Enter Managerial PIN
          </Text>
          <TextInput
            className="bg-white/20 text-white text-center text-2xl font-orbitron p-4 rounded-xl mb-3"
            placeholder="****"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={pinInput}
            onChangeText={setPinInput}
            secureTextEntry
            keyboardType="numeric"
            maxLength={4}
            returnKeyType="done"
            onSubmitEditing={handlePinSubmit}
            autoFocus
          />
          {pinError ? (
            <Text className="text-red-400 text-center font-orbitron text-xs mb-3">{pinError}</Text>
          ) : null}
          <TouchableOpacity
            onPress={handlePinSubmit}
            className="bg-green-600 p-4 rounded-xl"
            style={{
              shadowColor: "#16a34a",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
            }}
          >
            <Text className="text-white text-center font-orbitron-bold text-lg">
              {t("Name.continue")}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <View className="flex-1">
      <ImageBackground
        source={starBackground}
        className="absolute inset-0 w-full h-full"
        resizeMode="cover"
      />

      <View className="flex-1 p-6">
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-12 mb-6 w-12 h-12 bg-white/10 rounded-full items-center justify-center"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text
          className="text-4xl font-orbitron-bold text-white text-center mb-8"
          style={{
            textShadowColor: "rgba(147, 51, 234, 0.8)",
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 20,
          }}
        >
          {t("ProfileSelection.title")}
        </Text>

        {/* Parent Profile */}
        <TouchableOpacity
          onPress={() => handleProfileTap("parent")}
          className="p-6 rounded-2xl mb-4 flex-row items-center"
          style={{
            backgroundColor:
              selectedProfile === "parent"
                ? "rgba(59, 130, 246, 0.5)"
                : "rgba(59, 130, 246, 0.3)",
            borderWidth: selectedProfile === "parent" ? 4 : 2,
            borderColor:
              selectedProfile === "parent"
                ? "#fbbf24"
                : "rgba(96, 165, 250, 0.5)",
            shadowColor: "#3b82f6",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
          }}
        >
          <Ionicons name="person-circle" size={48} color="white" />
          <View className="ml-4 flex-1">
            <Text className="text-white text-xl font-orbitron-bold">{t("ProfileSelection.parentProfile")}</Text>
            <Text className="text-white/70 text-sm font-orbitron">{auth.currentUser?.email}</Text>
          </View>
          {activeChildProfile && (
            <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.5)" />
          )}
        </TouchableOpacity>

        {/* Children Section */}
        {children.length > 0 && (
          <>
            <View className="flex-row items-center my-4">
              <View className="flex-1 h-px bg-white/30" />
              <Text className="text-white/70 text-sm font-orbitron-semibold mx-3">
                {t("ProfileSelection.text")}
              </Text>
              <View className="flex-1 h-px bg-white/30" />
            </View>

            <FlatList
              data={children}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleProfileTap(item.username)}
                  className="p-6 rounded-2xl mb-4 flex-row items-center"
                  style={{
                    backgroundColor: "rgba(168, 85, 247, 0.3)",
                    borderWidth: selectedProfile === item.username ? 4 : 2,
                    borderColor:
                      selectedProfile === item.username
                        ? "#fbbf24"
                        : "rgba(192, 132, 252, 0.5)",
                    shadowColor: "#a855f7",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                  }}
                >
                  <Ionicons name="happy" size={48} color="white" />
                  <Text className="text-white text-xl font-orbitron-bold ml-4 flex-1">
                    {item.firstName || item.username}
                  </Text>
                  {/* Managed badge */}
                  <View
                    className="px-2 py-1 rounded-full flex-row items-center"
                    style={{
                      backgroundColor: "rgba(168, 85, 247, 0.4)",
                      borderWidth: 1,
                      borderColor: "rgba(192, 132, 252, 0.6)",
                    }}
                  >
                    <Ionicons name="shield-checkmark" size={12} color="#c084fc" style={{ marginRight: 4 }} />
                    <Text className="text-purple-300 text-xs font-orbitron-semibold">MANAGED</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </>
        )}

        {children.length === 0 && (
          <Text className="text-white/50 text-center py-8 font-orbitron">
            {t("ProfileSelection.desc")},{"\n"}{t("ProfileSelection.desc2")}.
          </Text>
        )}

        {/* PIN / Set-PIN entry */}
        {pinSection}
      </View>
    </View>
  );
}
