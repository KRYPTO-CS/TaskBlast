import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  ImageBackground,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import MainButton from "../components/MainButton";
import { useTranslation } from "react-i18next";

interface SignUpBirthdateProps {
  onSubmit: (birthdate: string) => void;
  onBack: () => void;
}

export default function SignUpBirthdate({
  onSubmit,
  onBack,
}: SignUpBirthdateProps) {
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState("");
  const {t ,i18n} = useTranslation();

  // Refs for birthdate inputs to implement auto-advance
  const monthRef = useRef<TextInput | null>(null);
  const dayRef = useRef<TextInput | null>(null);
  const yearRef = useRef<TextInput | null>(null);

  const starBackground = require("../../assets/backgrounds/starsAnimated.gif");

  const handleSubmit = () => {
    setError("");

    if (!month.trim() || !day.trim() || !year.trim()) {
      setError(t("birthdate.empty"));
      return;
    }

    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    const yearNum = parseInt(year);

    // Validate date format
    if (
      isNaN(monthNum) ||
      isNaN(dayNum) ||
      isNaN(yearNum) ||
      monthNum < 1 ||
      monthNum > 12 ||
      dayNum < 1 ||
      dayNum > 31 ||
      yearNum < 1900 ||
      yearNum > new Date().getFullYear()
    ) {
      setError(t("birthdate.error"));
      return;
    }

    // Calculate age
    const birthDate = new Date(yearNum, monthNum - 1, dayNum);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    // COPPA compliance - must be 13 or older
    if (age < 13) {
      setError(t("birthdate.age"));
      return;
    }

    const birthdate = `${month.padStart(2, "0")}/${day.padStart(
      2,
      "0"
    )}/${year}`;
    console.log("Birthdate submitted:", birthdate);
    onSubmit(birthdate);
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <View className="flex-1">
        {/* Animated stars background */}
        <ImageBackground
          source={starBackground}
          className="absolute inset-0 w-full h-full"
          resizeMode="cover"
        />

        {/* Content overlay */}
        <View className="flex-1 items-center justify-center p-5">
          {/* Birthdate Container */}
          <View className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-3xl p-8 border-2 border-white/30 shadow-2xl">
            <Text className="text-4xl font-madimi font-semibold text-white mb-4 text-left drop-shadow-md">
             {t("birthdate.title")}
            </Text>

            <Text className="font-madimi text-sm text-white/90 mb-8 text-left">
              {t("birthdate.notice")}
            </Text>

            <View className="flex-row justify-between mb-4" style={{ gap: 10 }}>
              <View className="flex-1">
                <Text className="font-madimi text-xs text-white/80 mb-2">
                  {t("birthdate.month")}
                </Text>
                <TextInput
                  className="font-madimi w-full h-12 bg-white/20 border-2 border-white/40 rounded-2xl px-4 text-base text-white shadow-lg"
                  placeholder="MM"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={month}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, "");
                    setMonth(cleaned);
                    // Auto-advance to day when month is filled (2 digits)
                    if (cleaned.length >= 2) {
                      dayRef.current?.focus();
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                  ref={(ref) => { monthRef.current = ref; }}
                  onSubmitEditing={() => dayRef.current?.focus()}
                  onKeyPress={(e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
                    // If user deletes from empty, nothing to do here for month
                  }}
                />
              </View>

              <View className="flex-1">
                <Text className="font-madimi text-xs text-white/80 mb-2">
                  {t("birthdate.day")}
                </Text>
                <TextInput
                  className="font-madimi w-full h-12 bg-white/20 border-2 border-white/40 rounded-2xl px-4 text-base text-white shadow-lg"
                  placeholder="DD"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={day}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, "");
                    setDay(cleaned);
                    // Auto-advance to year when day is filled (2 digits)
                    if (cleaned.length >= 2) {
                      yearRef.current?.focus();
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                  ref={(ref) => { dayRef.current = ref; }}
                  onSubmitEditing={() => yearRef.current?.focus()}
                  onKeyPress={(e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
                    // If user presses backspace on empty day, move focus to month
                    if (e.nativeEvent.key === "Backspace" && day.length === 0) {
                      monthRef.current?.focus();
                    }
                  }}
                />
              </View>

              <View className="flex-1">
                <Text className="font-madimi text-xs text-white/80 mb-2">
                  {t("birthdate.year")}
                </Text>
                <TextInput
                  className="font-madimi w-full h-12 bg-white/20 border-2 border-white/40 rounded-2xl px-4 text-base text-white shadow-lg"
                  placeholder="YYYY"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={year}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, "");
                    setYear(cleaned);
                    // Optionally blur when year is complete
                    if (cleaned.length >= 4) {
                      yearRef.current?.blur();
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={4}
                  ref={(ref) => { yearRef.current = ref; }}
                  onSubmitEditing={() => Keyboard.dismiss()}
                  onKeyPress={(e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
                    // If user presses backspace on empty year, move focus to day
                    if (e.nativeEvent.key === "Backspace" && year.length === 0) {
                      dayRef.current?.focus();
                    }
                  }}
                />
              </View>
            </View>

            {error ? (
              <Text className="font-madimi text-sm text-red-300 mb-4 text-left drop-shadow-md">
                {error}
              </Text>
            ) : null}

            <MainButton
              title={t("birthdate.continue")}
              variant="primary"
              size="medium"
              customStyle={{
                width: "60%",
                alignSelf: "flex-start",
                marginTop: 10,
              }}
              onPress={handleSubmit}
            />
          </View>

          {/* Back Link */}
          <View className="mt-8 items-center">
            <Text
              className="font-madimi text-sm text-white drop-shadow-md cursor-pointer"
              onPress={onBack}
            >
              {t("language.backTo")}
              <Text className="font-semibold text-yellow-300"> {t("birthdate.previousStep")}</Text>
            </Text>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
