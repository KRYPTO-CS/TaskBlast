import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  ImageBackground,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Keyboard,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Text } from "../../TTS";
import { Ionicons } from "@expo/vector-icons";
import MainButton from "../components/MainButton";
import { useRouter, useLocalSearchParams } from "expo-router";
import { auth } from "../../server/firebase";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import {
  getPinResetEmail,
  clearPinResetEmail,
  resetManagerPinFromLink,
} from "../services/adminService";

type Step = "verifying" | "setPin" | "error";

export default function ResetManagerPin() {
  const router = useRouter();
  const { emailLink: rawEmailLink } = useLocalSearchParams<{ emailLink?: string }>();

  const [step, setStep] = useState<Step>("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const starBackground = require("../../assets/backgrounds/starsAnimated.gif");

  useEffect(() => {
    const verifyLink = async () => {
      try {
        if (!rawEmailLink) {
          setErrorMessage("No reset link found. Please request a new one from the app.");
          setStep("error");
          return;
        }

        const emailLink = decodeURIComponent(String(rawEmailLink));

        if (!isSignInWithEmailLink(auth, emailLink)) {
          setErrorMessage("Invalid or expired reset link. Please request a new one.");
          setStep("error");
          return;
        }

        const savedEmail = await getPinResetEmail();
        if (!savedEmail) {
          setErrorMessage(
            "Email address not found. Please request a new reset link from the app.",
          );
          setStep("error");
          return;
        }

        await signInWithEmailLink(auth, savedEmail, emailLink);
        await clearPinResetEmail();
        setStep("setPin");
      } catch (err: any) {
        console.error("Email link verification failed:", err);
        setErrorMessage(err.message || "Verification failed. Please request a new reset link.");
        setStep("error");
      }
    };

    verifyLink();
  }, [rawEmailLink]);

  const handleSubmit = async () => {
    setPinError("");

    if (!/^\d{4}$/.test(newPin)) {
      setPinError("PIN must be exactly 4 digits.");
      return;
    }

    if (newPin !== confirmPin) {
      setPinError("PINs do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetManagerPinFromLink(newPin);
      Alert.alert(
        "PIN Reset Successful",
        "Your manager PIN has been updated. Use your new PIN to access admin features.",
        [{ text: "OK", onPress: () => router.replace("/pages/HomeScreen") }],
      );
    } catch (err: any) {
      setPinError(err.message || "Failed to reset PIN. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "verifying") {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: "#0f172a" }}>
        <ImageBackground
          source={starBackground}
          className="absolute inset-0 w-full h-full"
          resizeMode="cover"
        />
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text className="font-orbitron text-white text-base mt-4">Verifying reset link...</Text>
      </View>
    );
  }

  if (step === "error") {
    return (
      <View className="flex-1 items-center justify-center p-6" style={{ backgroundColor: "#0f172a" }}>
        <ImageBackground
          source={starBackground}
          className="absolute inset-0 w-full h-full"
          resizeMode="cover"
        />
        <View className="w-full max-w-md bg-white/10 rounded-3xl p-8 border-2 border-white/30">
          <Ionicons
            name="alert-circle"
            size={48}
            color="#ef4444"
            style={{ alignSelf: "center", marginBottom: 16 }}
          />
          <Text className="font-orbitron-semibold text-white text-xl text-center mb-4">
            Reset Failed
          </Text>
          <Text className="font-orbitron text-white/80 text-sm text-center mb-6">
            {errorMessage}
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/pages/HomeScreen")}
            className="rounded-xl p-4 items-center"
            style={{ backgroundColor: "rgba(139, 92, 246, 0.6)" }}
          >
            <Text className="font-orbitron-semibold text-white">Back to App</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1">
        <ImageBackground
          source={starBackground}
          className="absolute inset-0 w-full h-full"
          resizeMode="cover"
        />
        <View className="flex-1 items-center justify-center p-5">
          <View className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-3xl p-8 border-2 border-white/30 shadow-2xl">
            <Text className="font-orbitron-semibold text-white text-3xl mb-2">
              Reset Manager PIN
            </Text>
            <Text className="font-orbitron text-white/80 text-sm mb-6">
              Enter a new 4-digit manager PIN for your account.
            </Text>

            <Text className="font-orbitron text-xs text-white/80 mb-2">New PIN</Text>
            <View className="mb-4">
              <View className="flex-row items-center bg-white/20 border-2 border-white/40 rounded-2xl px-4 h-14 shadow-lg">
                <Ionicons
                  name="key-outline"
                  size={22}
                  color="white"
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  className="flex-1 text-base text-white"
                  placeholder="1234"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={newPin}
                  onChangeText={(v) => setNewPin(v.replace(/[^0-9]/g, "").slice(0, 4))}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                />
              </View>
            </View>

            <Text className="font-orbitron text-xs text-white/80 mb-2">Confirm New PIN</Text>
            <View className="mb-4">
              <View className="flex-row items-center bg-white/20 border-2 border-white/40 rounded-2xl px-4 h-14 shadow-lg">
                <Ionicons
                  name="key-outline"
                  size={22}
                  color="white"
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  className="flex-1 text-base text-white"
                  placeholder="1234"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={confirmPin}
                  onChangeText={(v) => setConfirmPin(v.replace(/[^0-9]/g, "").slice(0, 4))}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                />
              </View>
            </View>

            {pinError ? (
              <Text className="font-orbitron text-red-300 text-sm mb-4">{pinError}</Text>
            ) : null}

            <MainButton
              title={isSubmitting ? "Saving..." : "Set New PIN"}
              variant="primary"
              size="medium"
              customStyle={{ width: "60%", alignSelf: "flex-start", marginTop: 8 }}
              onPress={handleSubmit}
              disabled={isSubmitting}
            />
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
