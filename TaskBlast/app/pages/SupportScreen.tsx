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

interface ContactCard {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

const CONTACT_CARDS: ContactCard[] = [
  { icon: "mail-outline", label: "", value: "" },
  { icon: "shield-outline", label: "", value: "" },
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
  const supportEmail = "kryptocapstone@gmail.com";

  const faqIds = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const faqs: FAQ[] = faqIds.map((id) => ({
    question: t(`SupportScreen.faq.items.${id}.question`),
    answer: t(`SupportScreen.faq.items.${id}.answer`, { email: supportEmail }),
  }));

  const contactCards: ContactCard[] = CONTACT_CARDS.map((card, index) => ({
    ...card,
    label:
      index === 0
        ? t("SupportScreen.contactCards.generalSupport")
        : t("SupportScreen.contactCards.privacyEnquiries"),
    value: supportEmail,
  }));

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
          {t("SupportScreen.title")}
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
            {t("SupportScreen.intro")}
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
              {t("SupportScreen.faqHeading")}
            </Text>
          </View>

          {faqs.map((faq, index) => (
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
              {t("SupportScreen.contactHeading")}
            </Text>
          </View>

          {contactCards.map((card, index) => (
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
              {t("SupportScreen.responseTime")}
            </Text>
          </View>
        </View>

        {/* Back button */}
        <View className="mt-6">
          <MainButton
            title={t("SupportScreen.back")}
            variant="primary"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </View>
  );
}
