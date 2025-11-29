import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ImageBackground,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MainButton from "../components/MainButton";
import { auth } from "../../server/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useTranslation } from "react-i18next";

interface ForgotPasswordProps {
  onSubmit: (email: string) => void;
  onBack: () => void;
}

export default function ForgotPassword({
  onSubmit,
  onBack,
}: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [t, i18n] = useTranslation();

  const starBackground = require("../../assets/backgrounds/starsAnimated.gif");

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      const successText =
        "Check your email for a reset link. Please check your email and click the link to reset your password.";
      setSuccessMessage(successText);
      setEmailSent(true);

      // Show a system alert so the user knows to check their email
      Alert.alert("Reset Email Sent", successText, [{ text: "OK" }]);

      // Notify parent (Login) only after a successful send so it can navigate back to login
      onSubmit(trimmedEmail);
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        setErrorMessage("No account found with this email address.");
      } else if (error.code === "auth/too-many-requests") {
        setErrorMessage("Too many attempts. Please try again later.");
      } else if (
        error.message &&
        error.message.toLowerCase().includes("network")
      ) {
        setErrorMessage("Network error. Please check your connection.");
      } else {
        setErrorMessage("An error occurred. Please try again.");
      }
    }

    // note: onSubmit is only called on success above
  };

  const handleResend = async () => {
    await handleSubmit();
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View className="flex-1">
        {/* Animated stars background */}
        <ImageBackground
          source={starBackground}
          className="absolute inset-0 w-full h-full"
          resizeMode="cover"
        />

        {/* Content overlay */}
        <View className="flex-1 items-center justify-center p-5">
          {/* Forgot Password Container */}
          <View className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-3xl p-8 border-2 border-white/30 shadow-2xl">
            <Text className="text-4xl font-madimi font-semibold text-white mb-4 text-left drop-shadow-md">
              {t("ForgotPassword.title")}
            </Text>

            <Text className="font-madimi text-sm text-white/90 mb-8 text-left">
              {t("ForgotPassword.desc")}
            </Text>

            <View className="mb-8">
              <View className="flex-row items-center bg-white/20 border-2 border-white/40 rounded-2xl px-4 h-14 shadow-lg">
                <Ionicons
                  name="mail-outline"
                  size={22}
                  color="white"
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  className="font-madimi flex-1 text-base text-white"
                  placeholder={t('ForgotPassword.emailPlaceholder')}
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {successMessage ? (
              <Text className="font-madimi text-sm text-green-300 mb-4 text-center drop-shadow-md">
                {successMessage}
              </Text>
            ) : null}

            {errorMessage ? (
              <Text className="font-madimi text-sm text-red-300 mb-4 text-center drop-shadow-md">
                {errorMessage}
              </Text>
            ) : null}

            <MainButton
              title={t("ForgotPassword.submit")}
              variant="primary"
              size="medium"
              customStyle={{
                width: "60%",
                alignSelf: "flex-start",
                marginTop: 0,
              }}
              onPress={handleSubmit}
            />

            {emailSent && (
              <TouchableOpacity
                onPress={handleResend}
                style={{ marginTop: 16 }}
              >
                <Text className="font-madimi text-sm text-yellow-300 text-center drop-shadow-md">
                  Resend Email
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Back to Login Link */}
          <View className="mt-8 items-center">
            <Text
              className="font-madimi text-sm text-white drop-shadow-md cursor-pointer"
              onPress={onBack}
            >
              {t("language.backTo")}
              <Text className="font-semibold text-yellow-300">
                {" "}{t("language.Login")}
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
