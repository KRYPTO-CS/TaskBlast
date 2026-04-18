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

interface PolicySection {
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  bodyKey: string;
}

const POLICY_SECTIONS: PolicySection[] = [
  {
    icon: "information-circle-outline",
    titleKey: "PrivacyScreen.sections.informationCollect.title",
    bodyKey: "PrivacyScreen.sections.informationCollect.body",
  },
  {
    icon: "analytics-outline",
    titleKey: "PrivacyScreen.sections.howUse.title",
    bodyKey: "PrivacyScreen.sections.howUse.body",
  },
  {
    icon: "share-social-outline",
    titleKey: "PrivacyScreen.sections.sharing.title",
    bodyKey: "PrivacyScreen.sections.sharing.body",
  },
  {
    icon: "lock-closed-outline",
    titleKey: "PrivacyScreen.sections.security.title",
    bodyKey: "PrivacyScreen.sections.security.body",
  },
  {
    icon: "people-outline",
    titleKey: "PrivacyScreen.sections.children.title",
    bodyKey: "PrivacyScreen.sections.children.body",
  },
  {
    icon: "notifications-outline",
    titleKey: "PrivacyScreen.sections.notifications.title",
    bodyKey: "PrivacyScreen.sections.notifications.body",
  },
  {
    icon: "create-outline",
    titleKey: "PrivacyScreen.sections.rights.title",
    bodyKey: "PrivacyScreen.sections.rights.body",
  },
  {
    icon: "refresh-outline",
    titleKey: "PrivacyScreen.sections.changes.title",
    bodyKey: "PrivacyScreen.sections.changes.body",
  },
  {
    icon: "mail-outline",
    titleKey: "PrivacyScreen.sections.contact.title",
    bodyKey: "PrivacyScreen.sections.contact.body",
  },
];

export default function PrivacyScreen() {
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
          name="shield-checkmark"
          size={26}
          color={palette.tertiary}
          style={{ marginRight: 10 }}
        />
        <Text className="font-orbitron-semibold text-white text-xl flex-1">
          {t("Settings.privacy")}
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Last updated banner */}
        <View
          className="rounded-2xl p-4 mb-5 flex-row items-center"
          style={{
            backgroundColor: palette.accentSoft,
            borderWidth: 1,
            borderColor: palette.accentSoftBorder,
          }}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={palette.accent}
            style={{ marginRight: 10 }}
          />
          <Text className="font-madimi text-white/80 text-sm">
            {t("PrivacyScreen.lastUpdated")}
          </Text>
        </View>

        {/* Intro */}
        <View
          className="rounded-2xl p-5 mb-5"
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.15)",
          }}
        >
          <Text className="font-madimi text-white/90 text-sm leading-6">
            {t("PrivacyScreen.intro")}
          </Text>
        </View>

        {/* Policy sections */}
        {POLICY_SECTIONS.map((section, index) => (
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

            {/* Body */}
            <Text className="font-madimi text-white/80 text-sm leading-6">
              {t(section.bodyKey)}
            </Text>
          </View>
        ))}

        {/* Back button */}
        <View className="mt-4">
          <MainButton
            title={t("PrivacyScreen.backToSettings")}
            variant="primary"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </View>
  );
}
