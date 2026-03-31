import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  useAccessibility,
  type ColorBlindMode,
} from "../context/AccessibilityContext";
import { useColorPalette, palettes } from "../styles/colorBlindThemes";

interface AccessibilityModalProps {
  visible: boolean;
  onClose: () => void;
}

// ─── Language data ─────────────────────────────────────────────────────────────

const LANGUAGES: { code: string; name: string; flag: string }[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇲🇽" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "bn", name: "বাংলা", flag: "🇧🇩" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  {code: "pi", name: "Piratese", flag: "🏴‍☠️"},
];

// ─── Color blind mode data ─────────────────────────────────────────────────────

const COLOR_BLIND_MODES: {
  value: ColorBlindMode;
  label: string;
  desc: string;
}[] = [
  { value: "none", label: "None", desc: "Default colors" },
  {
    value: "deuteranopia",
    label: "Deuteranopia",
    desc: "Red/green deficiency",
  },
  { value: "protanopia", label: "Protanopia", desc: "Red deficiency" },
  { value: "tritanopia", label: "Tritanopia", desc: "Blue/yellow deficiency" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AccessibilityModal({
  visible,
  onClose,
}: AccessibilityModalProps) {
  const { t } = useTranslation();
  const palette = useColorPalette();

  const {
    language,
    colorBlindMode,
    ttsEnabled,
    setLanguage,
    setColorBlindMode,
    setTtsEnabled,
  } = useAccessibility();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      testID="accessibility-modal"
    >
      <View className="flex-1 justify-center items-center bg-black/70">
        <View
          className="w-11/12 max-w-md rounded-3xl p-6"
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            borderWidth: 2,
            borderColor: palette.modalBorder,
            shadowColor: palette.modalShadow,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.6,
            shadowRadius: 20,
          }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text
              className="font-orbitron-semibold text-white text-2xl"
              style={{
                textShadowColor: palette.accentGlow,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 15,
              }}
            >
              {t("Settings.accessibility")}
            </Text>
            <TouchableOpacity
              testID="close-accessibility-modal"
              onPress={onClose}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{
                backgroundColor: palette.accentSoft,
                borderWidth: 1,
                borderColor: palette.accentSoftBorder,
              }}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            className="max-h-[500px]"
          >
            {/* ── Language ────────────────────────────────────────────────── */}
            <SectionHeader icon="language" label={t("Settings.language")} />

            <LanguageDropdown language={language} onSelect={setLanguage} />

            <Divider />

            {/* ── Color Blind Mode ────────────────────────────────────────── */}
            <SectionHeader
              icon="color-palette"
              label={t("Settings.colorBlind")}
            />

            <View className="mb-4" style={{ gap: 8 }}>
              {COLOR_BLIND_MODES.map((mode) => {
                const active = colorBlindMode === mode.value;
                return (
                  <TouchableOpacity
                    key={mode.value}
                    onPress={() => setColorBlindMode(mode.value)}
                    className="flex-row items-center justify-between p-3 rounded-xl"
                    style={{
                      backgroundColor: active
                        ? palette.accentActive
                        : palette.secondarySoft,
                      borderWidth: 1,
                      borderColor: active
                        ? palette.accentActiveBorder
                        : palette.secondarySoftBorder,
                    }}
                  >
                    <View className="flex-1">
                      <Text
                        className="text-white text-sm"
                        style={{
                          fontFamily: active
                            ? "Orbitron_600SemiBold"
                            : "Orbitron_400Regular",
                        }}
                      >
                        {mode.label}
                      </Text>
                      <Text className="font-orbitron text-gray-400 text-xs mt-0.5">
                        {mode.desc}
                      </Text>
                      {/* Color swatch preview */}
                      <View
                        style={{ flexDirection: "row", gap: 5, marginTop: 6 }}
                      >
                        {[
                          palettes[mode.value].accent,
                          palettes[mode.value].secondary,
                          palettes[mode.value].tertiary,
                        ].map((swatchColor, i) => (
                          <View
                            key={i}
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: 7,
                              backgroundColor: swatchColor,
                              borderWidth: 1,
                              borderColor: "rgba(255,255,255,0.3)",
                            }}
                          />
                        ))}
                      </View>
                    </View>
                    {active && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={palette.modalShadow}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Divider />

            {/* ── Toggle Settings ─────────────────────────────────────────── */}
            <SectionHeader icon="volume-medium" label="Voice" />

            <ToggleRow
              icon="volume-medium"
              iconColor={palette.secondary}
              label={t("Settings.tts")}
              description={t("Settings.ttsDesc")}
              value={ttsEnabled}
              onToggle={setTtsEnabled}
            />
          </ScrollView>

          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            className="mt-6 p-4 rounded-xl items-center"
            style={{
              backgroundColor: palette.accent,
              borderWidth: 1,
              borderColor: palette.accentActiveBorder,
            }}
          >
            <Text className="font-orbitron-bold text-white text-base">
              {t("Settings.done")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
}) {
  const palette = useColorPalette();
  return (
    <View className="flex-row items-center mb-3">
      <Ionicons
        name={icon}
        size={18}
        color={palette.sectionIcon}
        style={{ marginRight: 8 }}
      />
      <Text
        className="font-orbitron-semibold text-sm"
        style={{ color: palette.sectionTextColor }}
      >
        {label}
      </Text>
    </View>
  );
}

function Divider() {
  const palette = useColorPalette();
  return (
    <View className="h-px my-4" style={{ backgroundColor: palette.divider }} />
  );
}

function LanguageDropdown({
  language,
  onSelect,
}: {
  language: string;
  onSelect: (code: string) => Promise<void>;
}) {
  const palette = useColorPalette();
  const [open, setOpen] = useState(false);

  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  return (
    <View className="mb-4">
      {/* Trigger button */}
      <TouchableOpacity
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center justify-between px-4 py-3 rounded-xl"
        style={{
          backgroundColor: palette.accentActive,
          borderWidth: 1,
          borderColor: palette.accentActiveBorder,
        }}
      >
        <View className="flex-row items-center">
          <Text style={{ fontSize: 20, marginRight: 10 }}>{current.flag}</Text>
          <Text
            className="text-white text-sm"
            style={{ fontFamily: "Orbitron_600SemiBold" }}
          >
            {current.name}
          </Text>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color="white"
        />
      </TouchableOpacity>

      {/* Options list */}
      {open && (
        <View
          className="mt-1 rounded-xl overflow-hidden"
          style={{
            borderWidth: 1,
            borderColor: palette.secondarySoftBorder,
            backgroundColor: "rgba(15, 23, 42, 0.98)",
          }}
        >
          {LANGUAGES.map((lang, index) => {
            const active = language === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                onPress={() => {
                  onSelect(lang.code);
                  setOpen(false);
                }}
                className="flex-row items-center justify-between px-4 py-3"
                style={{
                  backgroundColor: active
                    ? palette.accentActive
                    : "transparent",
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: palette.divider,
                }}
              >
                <View className="flex-row items-center">
                  <Text style={{ fontSize: 18, marginRight: 10 }}>
                    {lang.flag}
                  </Text>
                  <Text
                    className="text-white text-xs"
                    style={{
                      fontFamily: active
                        ? "Orbitron_600SemiBold"
                        : "Orbitron_400Regular",
                    }}
                  >
                    {lang.name}
                  </Text>
                </View>
                {active && (
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={palette.modalShadow}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

interface ToggleRowProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
  label: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => Promise<void>;
}

function ToggleRow({
  icon,
  iconColor,
  label,
  description,
  value,
  onToggle,
}: ToggleRowProps) {
  const palette = useColorPalette();
  return (
    <View
      className="flex-row justify-between items-center p-4 rounded-xl mb-3"
      style={{
        backgroundColor: palette.secondarySoft,
        borderWidth: 1,
        borderColor: palette.secondarySoftBorder,
      }}
    >
      <View className="flex-row items-center flex-1 mr-3">
        <Ionicons
          name={icon}
          size={22}
          color={iconColor}
          style={{ marginRight: 12 }}
        />
        <View className="flex-1">
          <Text className="font-orbitron-semibold text-white text-sm">
            {label}
          </Text>
          <Text className="font-orbitron text-gray-400 text-xs mt-0.5">
            {description}
          </Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{
          false: palette.switchTrackOff,
          true: palette.switchTrackOn,
        }}
        thumbColor={value ? palette.switchThumbOn : palette.switchThumbOff}
      />
    </View>
  );
}
