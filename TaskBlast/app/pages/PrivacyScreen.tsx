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
  title: string;
  body: string;
}

const POLICY_SECTIONS: PolicySection[] = [
  {
    icon: "information-circle-outline",
    title: "Information We Collect",
    body:
      "We collect information you provide when creating an account, such as your name, email address, and date of birth. For child accounts, a parent or guardian must authorize the account. We also collect usage data such as tasks completed, time spent in focus sessions, and in-app purchases to improve your experience.",
  },
  {
    icon: "analytics-outline",
    title: "How We Use Your Information",
    body:
      "Your information is used to provide and improve the TaskBlast service, personalize your experience, send notifications you have opted into, and maintain account security. We do not sell your personal data to third parties.",
  },
  {
    icon: "share-social-outline",
    title: "Information Sharing",
    body:
      "We do not share your personal information with third parties except as required by law or to provide core app functionality (e.g., Firebase authentication and cloud storage). Any third-party services we use are bound by their own privacy policies.",
  },
  {
    icon: "lock-closed-outline",
    title: "Data Security",
    body:
      "We use industry-standard encryption and Firebase security rules to protect your data. Access to personal information is restricted to authorized personnel only. However, no method of transmission over the internet is 100% secure.",
  },
  {
    icon: "people-outline",
    title: "Children's Privacy",
    body:
      "TaskBlast is designed for users of all ages. Accounts for users under 13 are managed by a parent or guardian through the managed account feature. We do not knowingly collect personal information from children under 13 without verified parental consent.",
  },
  {
    icon: "notifications-outline",
    title: "Notifications",
    body:
      "We may send push notifications related to task reminders and app updates. You can manage your notification preferences at any time in the Settings menu.",
  },
  {
    icon: "create-outline",
    title: "Your Rights",
    body:
      "You may request access to, correction of, or deletion of your personal data at any time by contacting us. You may also delete your account directly from the app, which will remove all associated data from our systems.",
  },
  {
    icon: "refresh-outline",
    title: "Changes to This Policy",
    body:
      "We may update this Privacy Policy from time to time. We will notify you of any significant changes via email or an in-app notification. Continued use of TaskBlast after changes take effect constitutes your acceptance of the revised policy.",
  },
  {
    icon: "mail-outline",
    title: "Contact Us",
    body:
      "If you have any questions about this Privacy Policy, please contact us at {Email TBD}. We aim to respond to all inquiries within 5 business days.",
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
            Last updated: March 30, 2026
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
            At TaskBlast, your privacy matters to us. This Privacy Policy
            explains what information we collect, how we use it, and the choices
            you have. Please read it carefully.
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
