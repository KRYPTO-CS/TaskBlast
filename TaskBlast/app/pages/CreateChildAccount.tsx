import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  KeyboardAvoidingView,
  Modal,
  ActivityIndicator,
  Platform,
  ScrollView,
  ImageBackground,
} from "react-native";
import { Text } from '../../TTS';
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { auth, firestore } from "../../server/firebase";
import { collection, doc, setDoc, updateDoc, query, where, getDocs, collectionGroup, serverTimestamp } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { useActiveProfile } from "../context/ActiveProfileContext";


export default function CreateChildAccount() {
  const router = useRouter();
  const starBackground = require("../../assets/backgrounds/starsAnimated.gif");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [username, setUsername] = useState("");
  const [accountType, setAccountType] = useState<"managed" | "independent" | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinModalPin, setPinModalPin] = useState("");
  const [pinModalConfirm, setPinModalConfirm] = useState("");
  const [pinModalLoading, setPinModalLoading] = useState(false);
  const [pinModalError, setPinModalError] = useState("");
  const [t, i18n] = useTranslation();
  const { isLoading: isProfileLoading, profileType, parentMangerialPinSet } = useActiveProfile();

  useEffect(() => {
    if (!isProfileLoading && !parentMangerialPinSet) {
      setShowPinModal(true);
    }
  }, [isProfileLoading, parentMangerialPinSet]);

  const handleSetManagerialPin = async () => {
    setPinModalError("");
    if (!pinModalPin || !pinModalConfirm) {
      setPinModalError("Please enter and confirm your PIN.");
      return;
    }
    if (pinModalPin.length !== 4) {
      setPinModalError("PIN must be exactly 4 digits.");
      return;
    }
    if (pinModalPin !== pinModalConfirm) {
      setPinModalError("PINs do not match.");
      return;
    }
    const user = auth.currentUser;
    if (!user) return;
    setPinModalLoading(true);
    try {
      await updateDoc(doc(firestore, "users", user.uid), { managerialPin: pinModalPin });
      setShowPinModal(false);
    } catch (e) {
      setPinModalError("Failed to save PIN. Please try again.");
    } finally {
      setPinModalLoading(false);
    }
  };

  // Prevent child profiles from creating new profiles
  useEffect(() => {
    const checkActiveChild = async () => {
      if (isProfileLoading) return;
      if (profileType === "child") {
        console.log("[CreateChildAccount] Child profile cannot create new profiles");
        Alert.alert(
          "Not Allowed",
          "Child profiles cannot create new profiles",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      }
    };

    checkActiveChild();
  }, [isProfileLoading, profileType, router]);

const checkUsernameAvailable = async (username: string): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    
    // check children
    const childrenRef = collection(firestore, `users/${user.uid}/children`);
    const childrenQuery = query(
      childrenRef,
      where("username", "==", username.toLowerCase())
    );
    const snapshot = await getDocs(childrenQuery);
    return snapshot.empty;
  } catch (error) {
    console.error("Error checking username:", error);
    return false;
  }
};

  const handleCreateChild = async () => {
    // Validation
    if (!firstName || !lastName || !birthdate || !username || !accountType) {
      Alert.alert("Missing Information", "Please fill in all fields");
      return;
    }

    // Check username format (alphanumeric only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      Alert.alert("Invalid Username", "Username can only contain letters, numbers, and underscores");
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in to create a child account");
        setLoading(false);
        return;
      }

      // Check if username is available
      const isAvailable = await checkUsernameAvailable(username);
      if (!isAvailable) {
        Alert.alert("Username Taken", "This username is already in use. Please choose another.");
        setLoading(false);
        return;
      }

      // Create child document
      const childrenRef = collection(firestore, `users/${user.uid}/children`);
      const newChildRef = doc(childrenRef);

      await setDoc(newChildRef, {
        username: username.toLowerCase(),
        firstName: firstName,
        lastName: lastName,
        birthdate: birthdate,
        accountType: accountType,
        createdAt: serverTimestamp(),
      });

      Alert.alert(
        "Success!",
        `Child account created for ${firstName}!`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("Error creating child account:", error);
      Alert.alert("Error", "Failed to create child account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1">
      {/* Animated stars background */}
      <ImageBackground
        source={starBackground}
        className="absolute inset-0 w-full h-full"
        resizeMode="cover"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-6 mt-12 w-12 h-12 bg-white/10 rounded-full items-center justify-center"
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
            className="text-4xl font-orbitron-bold text-white mb-8 text-center"
            style={{
              textShadowColor: "rgba(147, 51, 234, 0.8)",
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 20,
            }}
          >
            {t("ChildAccount.title")}
          </Text>

          {/* First Name */}
          <View className="mb-4">
            <Text className="text-white font-orbitron-semibold mb-2">{t("Name.firstName")}</Text>
            <TextInput
              className="bg-white/20 text-white font-orbitron p-4 rounded-xl"
              placeholder={t("ChildAccount.firstName")}
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          {/* Last Name */}
          <View className="mb-4">
            <Text className="text-white font-orbitron-semibold mb-2">{t("Name.lastName")}</Text>
            <TextInput
              className="bg-white/20 text-white font-orbitron p-4 rounded-xl"
              placeholder={t("ChildAccount.lastName")}
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          {/* Birthdate */}
          <View className="mb-4">
            <Text className="text-white font-orbitron-semibold mb-2">{t("ChildAccount.birthdate")}</Text>
            <TextInput
              className="bg-white/20 text-white font-orbitron p-4 rounded-xl"
              placeholder="MM/DD/YYYY"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={birthdate}
              onChangeText={setBirthdate}
            />
          </View>

          {/* Username */}
          <View className="mb-4">
            <Text className="text-white font-orbitron-semibold mb-2">{t("ChildAccount.username")}</Text>
            <TextInput
              className="bg-white/20 text-white font-orbitron p-4 rounded-xl"
              placeholder={t("ChildAccount.usernameDesc")}
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={username}
              onChangeText={(text) => setUsername(text.toLowerCase())}
              autoCapitalize="none"
            />
          </View>

          {/* Account Type */}
          <View className="mb-8">
            <Text className="text-white font-orbitron-semibold mb-2">{t("AccountType.title")}</Text>
            {(["managed", "independent"] as const).map((type) => (
              <TouchableOpacity
                key={type}
                activeOpacity={0.8}
                onPress={() => setAccountType(type)}
                className="w-full p-4 rounded-2xl border-2 mb-3"
                style={{
                  borderColor: accountType === type ? "#fde047" : "rgba(255,255,255,0.4)",
                  backgroundColor: accountType === type ? "rgba(253,224,71,0.2)" : "rgba(255,255,255,0.1)",
                }}
              >
                <Text className="font-madimi text-base font-semibold text-white mb-1">
                  {type === "managed" ? t("AccountType.managetitle") : t("AccountType.indetitle")}
                </Text>
                <Text className="font-madimi text-sm text-white/80">
                  {type === "managed" ? t("AccountType.managedesc") : t("AccountType.indedesc")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Create Button */}
          <TouchableOpacity
            onPress={handleCreateChild}
            disabled={loading}
            className={`p-4 rounded-xl ${loading ? "opacity-50" : ""}`}
            style={{
              backgroundColor: "#16a34a",
              shadowColor: "#16a34a",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
            }}
          >
            <Text className="text-white text-center font-orbitron-bold text-xl">
              {loading ? "Creating..." : t("ChildAccount.create")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Master PIN Setup Modal */}
      <Modal visible={showPinModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
        >
          <View
            className="w-5/6 rounded-3xl p-7"
            style={{
              backgroundColor: "#1a0533",
              borderWidth: 2,
              borderColor: "rgba(168,85,247,0.5)",
              shadowColor: "#a855f7",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 24,
            }}
          >
            {/* Icon */}
            <View className="items-center mb-4">
              <Ionicons name="key" size={40} color="#a855f7" />
            </View>

            {/* Title */}
            <Text
              className="font-orbitron-bold text-white text-xl text-center mb-3"
              style={{ textShadowColor: "#a855f7", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }}
            >
              Create Your Master PIN
            </Text>

            {/* Explanation */}
            <Text className="font-madimi text-white/80 text-sm text-center mb-6">
              Before adding child accounts, you need a{" "}
              <Text className="text-yellow-300 font-semibold">Master PIN</Text>.
              {"\n\n"}
              This PIN protects all child profiles — you'll need it to switch into any child account and to return to your parent account.
              {"\n\n"}
              Keep it safe. You won't be able to access child profiles without it.
            </Text>

            {/* PIN input */}
            <Text className="text-white font-orbitron-semibold text-sm mb-2">New PIN</Text>
            <TextInput
              className="bg-white/10 text-white text-center text-2xl font-orbitron p-4 rounded-xl mb-4"
              placeholder="••••"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={pinModalPin}
              onChangeText={(v) => { setPinModalPin(v); setPinModalError(""); }}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
            />

            {/* Confirm input */}
            <Text className="text-white font-orbitron-semibold text-sm mb-2">Confirm PIN</Text>
            <TextInput
              className="bg-white/10 text-white text-center text-2xl font-orbitron p-4 rounded-xl mb-4"
              placeholder="••••"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={pinModalConfirm}
              onChangeText={(v) => { setPinModalConfirm(v); setPinModalError(""); }}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
            />

            {/* Error */}
            {pinModalError ? (
              <Text className="text-red-400 font-madimi text-sm text-center mb-3">
                {pinModalError}
              </Text>
            ) : null}

            {/* Confirm button */}
            <TouchableOpacity
              onPress={handleSetManagerialPin}
              disabled={pinModalLoading}
              className="p-4 rounded-xl items-center"
              style={{
                backgroundColor: "#7c3aed",
                shadowColor: "#a855f7",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 12,
                opacity: pinModalLoading ? 0.6 : 1,
              }}
            >
              {pinModalLoading
                ? <ActivityIndicator color="white" />
                : <Text className="text-white font-orbitron-bold text-base">Set Master PIN</Text>
              }
            </TouchableOpacity>

            {/* Go back link */}
            <TouchableOpacity onPress={() => router.back()} className="mt-4 items-center">
              <Text className="text-white/50 font-madimi text-sm">Go back</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
