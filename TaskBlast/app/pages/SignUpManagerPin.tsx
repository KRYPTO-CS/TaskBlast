import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MainButton from "../components/MainButton";
import { useTranslation } from "react-i18next";

interface SignUpManagerPinProps {
  onSubmit: (pin: string | null) => void;
  onBack: () => void;
}

export default function SignUpManagerPin({
  onSubmit,
  onBack,
}: SignUpManagerPinProps) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [t, i18n] = useTranslation();

  const starBackground = require("../../assets/backgrounds/starsAnimated.gif");

  const handleContinue = () => {
    setError("");
    if (pin.length !== 4 || confirmPin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs do not match");
      return;
    }
    console.log("Managerial PIN created:", pin.replace(/./g, "*"));
    onSubmit(pin);
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
          <View className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-3xl p-8 border-2 border-white/30 shadow-2xl">
            <Text className="text-4xl font-madimi font-semibold text-white mb-4 text-left drop-shadow-md">
              {t("ManagedPIN.title")}
            </Text>

            <Text className="font-madimi text-sm text-white/90 mb-6 text-left">
              {t("ManagedPIN.desc")}
            </Text>

            <Text className="font-madimi text-xs text-white/80 mb-2">
              {t("ManagedPIN.pin")}
            </Text>
            <View className="mb-4">
              <View className="flex-row items-center bg-white/20 border-2 border-white/40 rounded-2xl px-4 h-14 shadow-lg">
                <Ionicons
                  name="key-outline"
                  size={22}
                  color="white"
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  className="font-madimi flex-1 text-base text-white"
                  placeholder="1234"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={pin}
                  onChangeText={(t) =>
                    setPin(t.replace(/[^0-9]/g, "").slice(0, 4))
                  }
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>
            </View>

            <Text className="font-madimi text-xs text-white/80 mb-2">
              {t("ManagedPIN.confirmPinPlaceholder")}
            </Text>
            <View className="mb-4">
              <View className="flex-row items-center bg-white/20 border-2 border-white/40 rounded-2xl px-4 h-14 shadow-lg">
                <Ionicons
                  name="key-outline"
                  size={22}
                  color="white"
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  className="font-madimi flex-1 text-base text-white"
                  placeholder={t("ManagedPIN.confirmPinPlaceholder")}
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={confirmPin}
                  onChangeText={(t) =>
                    setConfirmPin(t.replace(/[^0-9]/g, "").slice(0, 4))
                  }
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>
            </View>

            {error ? (
              <Text className="font-madimi text-sm text-red-300 mb-4 text-left drop-shadow-md">
                {error}
              </Text>
            ) : null}

            <MainButton
              title={t("ManagedPIN.continue")}
              variant="primary"
              size="medium"
              customStyle={{
                width: "60%",
                alignSelf: "flex-start",
                marginTop: 10,
              }}
              onPress={handleContinue}
            />

            <View className="mt-6">
              <Text
                className="font-madimi text-sm text-white drop-shadow-md cursor-pointer"
                onPress={onBack}
              >
                Back to{" "}
                <Text className="font-semibold text-yellow-300">
                  Previous Step
                </Text>
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
