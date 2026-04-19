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
  titleKey: string;
  bodyKey: string;
}

const ABOUT_SECTIONS: AboutSection[] = [
  {
    icon: "rocket-outline",
    titleKey: "AboutScreen.sections.mission.title",
    bodyKey: "AboutScreen.sections.mission.body",
  },
  {
    icon: "bulb-outline",
    titleKey: "AboutScreen.sections.howItWorks.title",
    bodyKey: "AboutScreen.sections.howItWorks.body",
  },
  {
    icon: "people-outline",
    titleKey: "AboutScreen.sections.forEveryone.title",
    bodyKey: "AboutScreen.sections.forEveryone.body",
  },
  {
    icon: "accessibility-outline",
    titleKey: "AboutScreen.sections.accessibility.title",
    bodyKey: "AboutScreen.sections.accessibility.body",
  },
  {
    icon: "globe-outline",
    titleKey: "AboutScreen.sections.languages.title",
    bodyKey: "AboutScreen.sections.languages.body",
  },
  {
    icon: "shield-checkmark-outline",
    titleKey: "AboutScreen.sections.privacy.title",
    bodyKey: "AboutScreen.sections.privacy.body",
  },
  {
    icon: "color-palette-outline",
    titleKey: "AboutScreen.sections.credits.title",
    bodyKey: "AboutScreen.sections.credits.body",
  },
  {
    icon: "star-outline",
    titleKey: "AboutScreen.sections.version.title",
    bodyKey: "AboutScreen.sections.version.body",
  },
];

const EXTRA_CREDITS = [
  "8-Bit Epic Space Shooter Music by HydroGene on opengameart.org",
  "8-Bit Space Adventure Theme by emanresU on opengameart.org",
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
          {t("AboutScreen.title")}
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
            {t("AboutScreen.tagline")}
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
                {t(section.titleKey)}
              </Text>
            </View>

            {/* Divider */}
            <View
              className="h-px mb-3"
              style={{ backgroundColor: palette.divider }}
            />

            {section.titleKey === "AboutScreen.sections.credits.title" ? (
              <View>
                {[t(section.bodyKey), ...EXTRA_CREDITS].map((credit) => (
                  <Text
                    key={credit}
                    className="font-madimi text-white/80 text-sm leading-6"
                  >
                    {`- ${credit}`}
                  </Text>
                ))}
              </View>
            ) : (
              <Text className="font-madimi text-white/80 text-sm leading-6">
                {t(section.bodyKey)}
              </Text>
            )}
          </View>
        ))}

        {/* Back button */}
        <View className="mt-4">
          <MainButton
            title={t("AboutScreen.back")}
            variant="primary"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </View>
  );
}
