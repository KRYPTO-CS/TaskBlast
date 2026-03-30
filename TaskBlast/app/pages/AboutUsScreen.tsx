import React from "react";
import {
  View,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import { Text } from "../../TTS";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import MainButton from "../components/MainButton";
import { useColorPalette } from "../styles/colorBlindThemes";

interface AboutSection {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}

const ABOUT_SECTIONS: AboutSection[] = [
  {
    icon: "rocket-outline",
    title: "Our Mission",
    body:
      "TaskBlast was built to make productivity fun. We believe that focus and accomplishment shouldn't feel like a chore — so we wrapped them in a space adventure. Our mission is to help learners of all ages build healthy habits through gamified task management.",
  },
  {
    icon: "bulb-outline",
    title: "How It Works",
    body:
      "Add tasks, blast off into focus sessions powered by the Pomodoro technique, and land on new planets as you complete your goals. Earn Rocks and Galaxy Crystals, level up, and unlock cosmetic rewards along the way.",
  },
  {
    icon: "people-outline",
    title: "Built for Everyone",
    body:
      "TaskBlast supports both independent learners and managed accounts for younger users. Parents and guardians can create child accounts, assign tasks, and set a manager PIN to keep things on track — all without disrupting the fun.",
  },
  {
    icon: "accessibility-outline",
    title: "Accessibility First",
    body:
      "We're committed to an inclusive experience. TaskBlast includes colour-blind-safe themes, high-contrast mode, adjustable text sizes, reduced motion support, and a full text-to-speech system so every user can enjoy the app comfortably.",
  },
  {
    icon: "globe-outline",
    title: "Multi-Language Support",
    body:
      "TaskBlast is available in English, Spanish, Portuguese, French, German, Russian, Arabic, Bengali, Chinese, Hindi, and even Pirate 🏴‍☠️. We're continuously working to expand our language support.",
  },
  {
    icon: "shield-checkmark-outline",
    title: "Privacy & Safety",
    body:
      "We take your data seriously. TaskBlast uses Firebase's industry-standard security infrastructure and never sells your personal information. Child accounts are fully managed by parents or guardians.",
  },
  {
    icon: "star-outline",
    title: "Version",
    body:
      "TaskBlast v1.0.0\nBuilt with React Native & Expo.\n© 2026 TaskBlast. All rights reserved.",
  },
];

export default function AboutUsScreen() {
  const router = useRouter();
  const palette = useColorPalette();
  const { t } = useTranslation();

  const starBackground = require("../../assets/backgrounds/starsAnimated.gif");

  return (
    <View className="flex-1">
      <ImageBackground
        source={starBackground}
        className="absolute inset-0 w-full h-full"
        resizeMode="cover"
      />

      {/* Header */}
      <View
        className="flex-row items-center px-5 pt-14 pb-4"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4 p-2 rounded-xl"
          style={{
            backgroundColor: palette.accentSoft,
            borderWidth: 1,
            borderColor: palette.accentSoftBorder,
          }}
        >
          <Ionicons name="chevron-back" size={22} color="white" />
        </TouchableOpacity>

        <Ionicons
          name="information-circle"
          size={26}
          color={palette.tertiary}
          style={{ marginRight: 10 }}
        />
        <Text className="font-orbitron-semibold text-white text-xl flex-1">
          {t("Settings.About")}
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View
          className="rounded-3xl p-6 mb-5 items-center"
          style={{
            backgroundColor: palette.accentSoft,
            borderWidth: 1.5,
            borderColor: palette.accentSoftBorder,
          }}
        >
          <Ionicons name="rocket" size={52} color={palette.accent} />
          <Text className="font-orbitron-semibold text-white text-2xl mt-3 text-center">
            TaskBlast
          </Text>
          <Text className="font-madimi text-white/70 text-sm mt-1 text-center">
            Blast off. Stay focused. Level up.
          </Text>
        </View>

        {/* About sections */}
        {ABOUT_SECTIONS.map((section, index) => (
          <View
            key={index}
            className="rounded-2xl p-5 mb-4"
            style={{
              backgroundColor:
                index % 2 === 0 ? palette.rowBgPrimary : palette.rowBgSecondary,
              borderWidth: 1,
              borderColor:
                index % 2 === 0
                  ? palette.rowBorderPrimary
                  : palette.rowBorderSecondary,
            }}
          >
            {/* Section header */}
            <View className="flex-row items-center mb-3">
              <View
                className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: palette.accentSoft }}
              >
                <Ionicons
                  name={section.icon}
                  size={18}
                  color={palette.accent}
                />
              </View>
              <Text className="font-orbitron-semibold text-white text-sm flex-1">
                {section.title}
              </Text>
            </View>

            {/* Divider */}
            <View
              className="h-px mb-3"
              style={{ backgroundColor: palette.divider }}
            />

            {/* Body */}
            <Text className="font-madimi text-white/80 text-sm leading-6">
              {section.body}
            </Text>
          </View>
        ))}

        {/* Back button */}
        <View className="mt-4">
          <MainButton
            title="Back to Settings"
            variant="primary"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </View>
  );
}
