import React, { useState } from "react";
import {
  View,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Text } from "../../TTS";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import MainButton from "../components/MainButton";
import { useColorPalette } from "../styles/colorBlindThemes";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface FAQ {
  question: string;
  answer: string;
}

const FAQS: FAQ[] = [
  {
    question: "How do I add a new task?",
    answer:
      "Tap the task icon on the Home screen to open your Task List. Then tap 'Add New Task', fill in the task name, optional description, and a rock reward, and tap 'Add Task' to save it.",
  },
  {
    question: "How do focus sessions work?",
    answer:
      "TaskBlast uses the Pomodoro technique — alternating work and play cycles. Select a task and tap 'Take Off' to start a session. You can pause or land early at any time, and you'll earn rocks upon completion.",
  },
  {
    question: "What are Rocks and Galaxy Crystals?",
    answer:
      "Rocks are earned by completing tasks and focus sessions. Galaxy Crystals are a premium currency rewarded through level-up milestones. Both can be spent in the Shop to unlock avatar customizations.",
  },
  {
    question: "How do I create a child account?",
    answer:
      "From your Profile screen, tap 'Add Child Account'. You'll be prompted to set up a managed account with a Manager PIN. The child can then select their profile from the Profile Selection screen.",
  },
  {
    question: "I forgot my Manager PIN. What do I do?",
    answer:
      "Currently, Manager PINs are stored securely on your account. Please contact us at {Email TBD} with your registered email address and we'll help you regain access.",
  },
  {
    question: "How do I change the app language?",
    answer:
      "Go to Settings and tap 'Language'. You can choose from English, Spanish, Portuguese, French, German, Russian, Arabic, Bengali, Chinese, Hindi, and Pirate.",
  },
  {
    question: "The app looks different — what are colour-blind modes?",
    answer:
      "In Settings, tap 'Accessibility' to find colour-blind-safe themes (Deuteranopia, Protanopia, Tritanopia, Achromatopsia) as well as high-contrast mode and reduced motion toggles.",
  },
  {
    question: "How do I turn off notifications?",
    answer:
      "Go to Settings and tap 'Notifications'. You can toggle individual notification types on or off at any time.",
  },
  {
    question: "How do I delete my account?",
    answer:
      "To request account deletion, please contact us at {Email TBD} from your registered email address. We will process your request within 5 business days and remove all associated data.",
  },
];

interface ContactCard {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

const CONTACT_CARDS: ContactCard[] = [
  { icon: "mail-outline", label: "General Support", value: "{Email TBD}" },
  { icon: "shield-outline", label: "Privacy Enquiries", value: "{Email TBD}" },
];

function FAQItem({ item, palette }: { item: FAQ; palette: any }) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((prev) => !prev);
  };

  return (
    <TouchableOpacity
      onPress={toggle}
      activeOpacity={0.85}
      className="rounded-2xl mb-3 overflow-hidden"
      style={{
        backgroundColor: palette.rowBgPrimary,
        borderWidth: 1,
        borderColor: open ? palette.accentActiveBorder : palette.rowBorderPrimary,
      }}
    >
      <View className="flex-row items-center p-4">
        <View
          className="w-8 h-8 rounded-lg items-center justify-center mr-3"
          style={{ backgroundColor: palette.accentSoft }}
        >
          <Ionicons name="help-outline" size={16} color={palette.accent} />
        </View>
        <Text className="font-orbitron-semibold text-white text-xs flex-1 mr-2">
          {item.question}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={palette.accent}
        />
      </View>

      {open && (
        <>
          <View className="h-px mx-4" style={{ backgroundColor: palette.divider }} />
          <View className="px-4 pb-4 pt-3">
            <Text className="font-madimi text-white/80 text-sm leading-6">
              {item.answer}
            </Text>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

export default function SupportScreen() {
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
          name="help-circle"
          size={26}
          color={palette.tertiary}
          style={{ marginRight: 10 }}
        />
        <Text className="font-orbitron-semibold text-white text-xl flex-1">
          {t("Settings.Help")}
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro banner */}
        <View
          className="rounded-2xl p-5 mb-5 flex-row items-start"
          style={{
            backgroundColor: palette.accentSoft,
            borderWidth: 1,
            borderColor: palette.accentSoftBorder,
          }}
        >
          <Ionicons
            name="rocket-outline"
            size={22}
            color={palette.accent}
            style={{ marginRight: 12, marginTop: 2 }}
          />
          <Text className="font-madimi text-white/90 text-sm leading-6 flex-1">
            Need help navigating the Solar System? Browse the FAQs below or get in touch with our crew directly.
          </Text>
        </View>

        {/* FAQ section */}
        <View className="mb-2">
          <View className="flex-row items-center mb-4">
            <View
              className="w-1 h-5 rounded-full mr-3"
              style={{ backgroundColor: palette.accent }}
            />
            <Text className="font-orbitron-semibold text-white text-base">
              Frequently Asked Questions
            </Text>
          </View>

          {FAQS.map((faq, index) => (
            <FAQItem key={index} item={faq} palette={palette} />
          ))}
        </View>

        {/* Divider */}
        <View
          className="h-px my-5"
          style={{ backgroundColor: palette.divider }}
        />

        {/* Contact section */}
        <View className="mb-2">
          <View className="flex-row items-center mb-4">
            <View
              className="w-1 h-5 rounded-full mr-3"
              style={{ backgroundColor: palette.tertiary }}
            />
            <Text className="font-orbitron-semibold text-white text-base">
              Contact Us
            </Text>
          </View>

          {CONTACT_CARDS.map((card, index) => (
            <View
              key={index}
              className="rounded-2xl p-4 mb-3 flex-row items-center"
              style={{
                backgroundColor: palette.rowBgSecondary,
                borderWidth: 1,
                borderColor: palette.rowBorderSecondary,
              }}
            >
              <View
                className="w-10 h-10 rounded-xl items-center justify-center mr-4"
                style={{ backgroundColor: palette.tertiarySoft }}
              >
                <Ionicons name={card.icon} size={20} color={palette.tertiary} />
              </View>
              <View className="flex-1">
                <Text className="font-orbitron-semibold text-white text-xs mb-1">
                  {card.label}
                </Text>
                <Text className="font-madimi text-white/70 text-sm">
                  {card.value}
                </Text>
              </View>
            </View>
          ))}

          <View
            className="rounded-2xl p-4 mt-1"
            style={{
              backgroundColor: palette.secondaryMed,
              borderWidth: 1,
              borderColor: palette.rowBorderPrimary,
            }}
          >
            <Text className="font-madimi text-white/70 text-xs text-center leading-5">
              We aim to respond to all enquiries within 5 business days.
            </Text>
          </View>
        </View>

        {/* Back button */}
        <View className="mt-6">
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
