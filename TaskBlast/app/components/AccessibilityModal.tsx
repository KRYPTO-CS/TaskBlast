import React from "react";
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
  type TextSize,
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

// ─── Text size data ────────────────────────────────────────────────────────────

const TEXT_SIZES: { value: TextSize; label: string; fontSize: number }[] = [
  { value: "small", label: "A", fontSize: 13 },
  { value: "medium", label: "A", fontSize: 17 },
  { value: "large", label: "A", fontSize: 22 },
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
    textSize,
    highContrast,
    reduceMotion,
    ttsEnabled,
    setLanguage,
    setColorBlindMode,
    setTextSize,
    setHighContrast,
    setReduceMotion,
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

            <View className="flex-row flex-wrap mb-4" style={{ gap: 8 }}>
              {LANGUAGES.map((lang) => {
                const active = language === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    onPress={() => setLanguage(lang.code)}
                    className="flex-row items-center px-3 py-2 rounded-xl"
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
                    <Text style={{ fontSize: 18, marginRight: 6 }}>
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
                  </TouchableOpacity>
                );
              })}
            </View>

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

            {/* ── Text Size ───────────────────────────────────────────────── */}
            <SectionHeader icon="text" label={t("Settings.textSize")} />

            <View className="flex-row mb-4" style={{ gap: 8 }}>
              {TEXT_SIZES.map((size) => {
                const active = textSize === size.value;
                return (
                  <TouchableOpacity
                    key={size.value}
                    onPress={() => setTextSize(size.value)}
                    className="flex-1 items-center py-3 rounded-xl"
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
                    <Text
                      style={{
                        fontSize: size.fontSize,
                        color: active ? "#fff" : "#94a3b8",
                        fontFamily: active
                          ? "Orbitron_700Bold"
                          : "Orbitron_400Regular",
                      }}
                    >
                      {size.label}
                    </Text>
                    <Text className="font-orbitron text-gray-400 text-xs mt-1 capitalize">
                      {size.value}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Divider />

            {/* ── Toggle Settings ─────────────────────────────────────────── */}
            <SectionHeader icon="options" label="Display & Motion" />

            <ToggleRow
              icon="contrast"
              iconColor="#f59e0b"
              label={t("Settings.highContrast")}
              description="Increase border and background intensity"
              value={highContrast}
              onToggle={setHighContrast}
            />

            <ToggleRow
              icon="stopwatch"
              iconColor="#34d399"
              label={t("Settings.reduceMotion")}
              description="Disable slide animations in modals"
              value={reduceMotion}
              onToggle={setReduceMotion}
            />

            <ToggleRow
              icon="volume-medium"
              iconColor={palette.secondary}
              label={t("Settings.tts")}
              description="Read screen content aloud"
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
