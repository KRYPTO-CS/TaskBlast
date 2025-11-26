import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import MainButton from "../components/MainButton";
import { useTranslation } from "react-i18next";



interface SignUpAccountTypeProps {
  onSubmit: (accountType: "managed" | "independent") => void;
  onBack: () => void;
}

export default function SignUpAccountType({
  onSubmit,
  onBack,
}: SignUpAccountTypeProps) {
  const [selected, setSelected] = useState<"managed" | "independent" | null>(
    null
  );
  const [error, setError] = useState("");
    const {t ,i18n} = useTranslation();

  const starBackground = require("../../assets/backgrounds/starsAnimated.gif");

  const handleContinue = () => {
    setError("");
    if (!selected) {
      setError("Please choose an account type to continue");
      return;
    }
    console.log("Account type submitted:", selected);
    onSubmit(selected);
  };

  const Option = ({
    value,
    title,
    description,
  }: {
    value: "managed" | "independent";
    title: string;
    description: string;
  }) => {
    const active = selected === value;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSelected(value)}
        className={`w-full p-4 rounded-2xl border-2 ${
          active
            ? "border-yellow-300 bg-yellow-300/20"
            : "border-white/40 bg-white/10"
        }`}
        style={{ marginBottom: 12 }}
      >
        <Text className="font-madimi text-base font-semibold text-white mb-1 drop-shadow-md">
          {title}
        </Text>
        <Text className="font-madimi text-sm text-white/80">{description}</Text>
      </TouchableOpacity>
    );
  };

  return (
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
            {t("AccountType.title")}
          </Text>

          <Text className="font-madimi text-sm text-white/90 mb-6 text-left">
            {t("AccountType.type")}
          </Text>

          <Option
            value="managed"
            title={t("AccountType.managetitle")}
            description={t("AccountType.managedesc")}
          />

          <Option
            value="independent"
            title={t("AccountType.indetitle")}
            description={t("AccountType.indedesc")}
          />

          {error ? (
            <Text className="font-madimi text-sm text-red-300 mb-4 text-left drop-shadow-md">
              {error}
            </Text>
          ) : null}

          <MainButton
            title={t("AccountType.continue")}
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
  );
}
