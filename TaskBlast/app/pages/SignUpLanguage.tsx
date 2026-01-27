import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  Image,
} from "react-native";
import MainButton from "../components/MainButton";
import { useTranslation } from "react-i18next";



const Lang_Map = {
    English: "en",
    Spanish: "es",
    Portuguese: "pt",
    French: "fr",
  } as const;

type language = keyof typeof Lang_Map;

interface SignUpAccountTypeProps {
  onSubmit: (accountType: language) => void;
  onBack: () => void;
}

export default function SignUpAccountType({
  onSubmit,
  onBack,
}: SignUpAccountTypeProps) {
  const [selected, setSelected] = useState<language | null>(
    null
  );
  const [error, setError] = useState("");

  const starBackground = require("../../assets/backgrounds/starsAnimated.gif");
  const USA = require("../../assets/images/united-states.png");
  const Mexico = require("../../assets/images/mexico.png");
  const Brazil = require("../../assets/images/brazil-flag.png");
  const France = require("../../assets/images/france.png");
  const {t ,i18n} = useTranslation();
  

  const handleContinue = () => {
    setError("");
    if (!selected) {
      setError(t("language.selectLanguage"));
      return;
    }


    i18n.changeLanguage(Lang_Map[selected]);
    onSubmit(selected);
  };

  const Option = ({
    value,
    image,
    title,
  }: {
    value: "English" | "Spanish" | "Portuguese" | "French";
    image?: any;
    title: string;
  }) => {
    const active = selected === value;
    return (
      <TouchableOpacity
  activeOpacity={0.8}
  onPress={() => {
    setSelected(value);
  }}
  className={`w-full p-4 rounded-2xl border-2 flex-row items-center ${
    active
      ? "border-yellow-300 bg-yellow-300/20"
      : "border-white/40 bg-white/10"
  }`}
  style={{ marginBottom: 12, gap: 12 }}
>
        <Image source={image} className="w-10 h-10 mb-3" />
        <Text className="font-madimi text-base font-semibold text-white mb-1 drop-shadow-md">
          {title}
        </Text>
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
           {t("language.selectLanguage")}
          </Text>

          <Option
            value="English"
            image={USA}
            title="English"
          />

          <Option
            value="Spanish"
            image={Mexico}
            title="Español"
          />

          <Option
            value="Portuguese"
            image={Brazil}
            title="Português"
          />

          <Option
            value="French"
            image={France}
            title="Français"
          />

          {error ? (
            <Text className="font-madimi text-sm text-red-300 mb-4 text-left drop-shadow-md">
              {error}
            </Text>
          ) : null}

          <MainButton
            title={t("language.continue")}
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
              {t("language.backTo")}
              <Text className="font-semibold text-yellow-300">
                {" "}{t("language.Login")}
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
