import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ImageBackground,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MainButton from "../components/MainButton";
import { useTranslation } from "react-i18next";

interface ResetPasswordProps {
  onSubmit: (newPassword: string) => void;
  onBack: () => void;
}

export default function ResetPassword({
  onSubmit,
  onBack,
}: ResetPasswordProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [t, i18n] = useTranslation();

  const starBackground = require("../../assets/backgrounds/starsAnimated.gif");

  const handleSubmit = () => {
    setError("");

    if (!newPassword.trim() || !confirmPassword.trim()) {
     setError(t("birthdate.empty"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("Password.match"));
      return;
    }

    if (newPassword.length < 8) {
      setError(t("Password.length"));
      return;
    }

    console.log("Password reset successful");
    onSubmit(newPassword);
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
          {/* Reset Password Container */}
          <View className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-3xl p-8 border-2 border-white/30 shadow-2xl">
            <SpeakableText className="text-4xl font-madimi font-semibold text-white mb-4 text-left drop-shadow-md">
              {t("ResetPassword.title")}
            </SpeakableText>

            <SpeakableText className="font-madimi text-sm text-white/90 mb-8 text-left">
              {t("ResetPassword.desc")}
            </SpeakableText>

            <View className="mb-4">
              <View className="flex-row items-center bg-white/20 border-2 border-white/40 rounded-2xl px-4 h-14 shadow-lg">
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color="white"
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  className="font-madimi flex-1 text-base text-white"
                  placeholder={t("ResetPassword.newPasswordPlaceholder")}
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View className="mb-4">
              <View className="flex-row items-center bg-white/20 border-2 border-white/40 rounded-2xl px-4 h-14 shadow-lg">
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color="white"
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  className="font-madimi flex-1 text-base text-white"
                  placeholder={t("ResetPassword.confirmPasswordPlaceholder")}
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            </View>

            {error ? (
              <SpeakableText className="font-madimi text-sm text-red-300 mb-4 text-center drop-shadow-md">
                {error}
              </SpeakableText>
            ) : null}

            <MainButton
              title={t("ResetPassword.submit")}
              variant="primary"
              size="medium"
              customStyle={{
                width: "60%",
                alignSelf: "flex-start",
                marginTop: 0,
              }}
              onPress={handleSubmit}
            />
          </View>

          {/* Back Link */}
          <View className="mt-8 items-center">
            <SpeakableText
              className="font-madimi text-sm text-white drop-shadow-md cursor-pointer"
              onPress={onBack}
            >
              {t("language.backTo")}
              <SpeakableText className="font-semibold text-yellow-300">
                {" "}{t("language.Login")}
              </SpeakableText>
            </SpeakableText>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
