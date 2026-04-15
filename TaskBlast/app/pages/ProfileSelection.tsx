import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { Text } from '../../TTS';
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { auth, firestore } from "../../server/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
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

  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [managerialPin, setManagerialPin] = useState<string | null>(null);
  // "parent" | childUsername | null
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [t] = useTranslation();
  const { clearActiveChildProfile, setActiveChildProfile } = useActiveProfile();

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
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
      setManagerialPin(parentDoc.data()?.managerialPin ?? null);
    } catch (error) {
      console.error("Error loading children:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleParentSelect = () => {
    setPendingSelection("parent");
    setPinInput("");
  };

  const handleChildSelect = (childUsername: string) => {
    setPendingSelection(childUsername);
    setPinInput("");
  };

  const handlePinSubmit = async () => {
    if (!pendingSelection) return;

    if (managerialPin && pinInput !== managerialPin) {
      Alert.alert("Incorrect PIN", "Please try again.");
      setPinInput("");
      return;
    }

    if (pendingSelection === "parent") {
      await clearActiveChildProfile();
      router.push("/pages/HomeScreen");
    } else {
      await setActiveChildProfile(pendingSelection);
      router.push("/pages/HomeScreen");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-900">
        <ActivityIndicator size="large" color="#a855f7" />
        <Text className="text-white text-lg font-orbitron mt-4">Loading profiles...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Animated stars background */}
      <ImageBackground
        source={starBackground}
        className="absolute inset-0 w-full h-full"
        resizeMode="cover"
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 p-6"
      >
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
          onPress={handleParentSelect}
          className="p-6 rounded-2xl mb-4 flex-row items-center"
          style={{
            backgroundColor: "rgba(59, 130, 246, 0.3)",
            borderWidth: 2,
            borderColor: "rgba(96, 165, 250, 0.5)",
            shadowColor: "#3b82f6",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
          }}
        >
          <Ionicons name="person-circle" size={48} color="white" />
          <View className="ml-4">
            <Text className="text-white text-xl font-orbitron-bold">{t("ProfileSelection.parentProfile")}</Text>
            <Text className="text-white/70 text-sm font-orbitron">{auth.currentUser?.email}</Text>
          </View>
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

            {/* Child Profiles */}
            <FlatList
              data={children}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleChildSelect(item.username)}
                  className="p-6 rounded-2xl mb-4 flex-row items-center"
                  style={{
                    backgroundColor: "rgba(168, 85, 247, 0.3)",
                    borderWidth: pendingSelection === item.username ? 4 : 2,
                    borderColor:
                      pendingSelection === item.username
                        ? "#fbbf24"
                        : "rgba(192, 132, 252, 0.5)",
                    shadowColor: "#a855f7",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                  }}
                >
                  <Ionicons name="happy" size={48} color="white" />
                  <Text className="text-white text-xl font-orbitron-bold ml-4">
                    {item.firstName || item.username}
                  </Text>
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

        {/* PIN Entry for Selected Child */}
        {pendingSelection && (
          <View
            className="mt-4 p-6 rounded-2xl"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderWidth: 2,
              borderColor: "rgba(255, 255, 255, 0.3)",
            }}
          >
            <Text className="text-white text-lg font-orbitron-semibold mb-4 text-center">
              {t("ProfileSelection.EnterPin")} {pendingSelection}
            </Text>
            <TextInput
              className="bg-white/20 text-white text-center text-2xl font-orbitron p-4 rounded-xl mb-4"
              placeholder="****"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={pinInput}
              onChangeText={setPinInput}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              autoFocus
            />
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
          </View>
        )}
      </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
}
