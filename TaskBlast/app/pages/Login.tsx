import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  ImageBackground,
  Alert,
  ScrollView,
} from "react-native";
import { Text } from "../../TTS";
import { Ionicons } from "@expo/vector-icons";
import MainButton from "../components/MainButton";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import SignUpBirthdate from "./SignUpBirthdate";
import SignUpAccountType from "./SignUpAccountType";
import SignUpName from "./SignUpName";
import SignUpEmail from "./SignUpEmail";
import SignUpLanguage from "./SignUpLanguage";
// Skipping verification code entry screen; SignUpVerifyEmail removed from flow
import SignUpCreatePassword from "./SignUpCreatePassword";
import HomeScreen from "./HomeScreen";
import { auth, db, firestore } from "../../server/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  onAuthStateChanged,
} from "firebase/auth";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAdmin } from "../context/AdminContext";
import { normalizeAdminEmail } from "../services/adminService";
import { useActiveProfile } from "../context/ActiveProfileContext";
import { AccessibilityContext } from "../context/AccessibilityContext";

const SignUpManagerPin = require("./SignUpManagerPin").default;

const LOGIN_LANGUAGES: { code: string; name: string; flag: string }[] = [
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
  { code: "jp", name: "日本語", flag: "🇯🇵" },
  { code: "kr", name: "한국어", flag: "🇰🇷" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "vn", name: "Tiếng Việt", flag: "🇻🇳" },
  { code: "id", name: "Bahasa Indonesia", flag: "🇮🇩" },
  {code: "pi", name: "Piratese", flag: "🏴‍☠️"},
];

type Screen =
  | "login"
  | "forgotPassword"
  | "resetPassword"
  | "signUpLanguage"
  | "signUpBirthdate"
  | "signUpAccountType"
  | "signUpManagerPin"
  | "signUpName"
  | "signUpEmail"
  | "signUpVerifyEmail"
  | "signUpCreatePassword"
  | "homeScreen";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const { t } = useTranslation();
  const { checkEligibility, clearAdminSession } = useAdmin();
  const { activeChildUsername, refreshProfile } = useActiveProfile();
  const accessibility = useContext(AccessibilityContext);
  const language = accessibility?.language ?? "en";
  const setLanguage = accessibility?.setLanguage ?? (async () => undefined);

  const starBackground = require("../../assets/backgrounds/starsAnimated.gif");
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);

  // Sign up state
  const [signUpData, setSignUpData] = useState({
    birthdate: "",
    firstName: "",
    lastName: "",
    email: "",
    verificationCode: "",
    password: "",
    accountType: "",
    managerialPin: null as string | null,
  });
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpSubmitError, setSignUpSubmitError] = useState("");

  const getSignUpErrorMessage = (error: any): string => {
    const code = error?.code;
    switch (code) {
      case "auth/email-already-in-use":
        return t("Password.emailInUseError");
      case "auth/invalid-email":
        return t("Password.invalidEmailError");
      case "auth/weak-password":
        return t("Password.weakPasswordError");
      default:
        return t("Password.signUpFailedError");
    }
  };

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user && user.emailVerified) {
          const normalizedEmail = normalizeAdminEmail(user.email ?? "");
          const eligibleForAdmin = await checkEligibility(normalizedEmail);
          if (!eligibleForAdmin) {
            await clearAdminSession();
          }

          await refreshProfile();

          if (activeChildUsername) {
            // Child profile is active - load child view
            console.log(
              "Auto-login: Child profile active:",
              activeChildUsername,
            );
            // TODO: Navigate to child home screen with activeChildProfile
            setCurrentScreen("homeScreen"); // For now - we'll make this child-specific later
          } else {
            // No child profile - default to parent view
            console.log("Auto-login: Parent profile active:", user.email);
            setCurrentScreen("homeScreen");
          }
        }
      });
      return () => unsubscribe();
    };

    checkAuthAndProfile();
  }, [activeChildUsername, checkEligibility, clearAdminSession, refreshProfile]);

  const handleLogin = () => {
    // Normalize inputs to make bypass resilient to whitespace/casing
    const u = username.trim().toLowerCase();
    const p = password.trim();

    if (!u || !p) {
      console.error("Login error: username and password are required");
      return;
    }

    // handle login logic here
    signInWithEmailAndPassword(auth, username.trim(), p)
      .then(async (userCredential) => {
        // Signed in
        const user = userCredential.user;
        console.log("Login successful:", user.email);
        // no home screen unless email verified
        if (user.emailVerified) {
          const normalizedEmail = normalizeAdminEmail(user.email ?? "");
          const eligibleForAdmin = await checkEligibility(normalizedEmail);
          if (!eligibleForAdmin) {
            await clearAdminSession();
          }

          setCurrentScreen("homeScreen");
        } else {
          Alert.alert(
            t("Login.verifyEmailTitle"),
            t("Login.verifyEmailBody"),
            [{ text: t("Login.ok") }],
          );
          setCurrentScreen("login");
        }
      })
      .catch((error) => {
        // display error to user here
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error("Login error:", errorCode, errorMessage);
      });
  };

  const handleForgotPassword = () => {
    setCurrentScreen("forgotPassword");
  };

  const handleSignUp = () => {
    // Navigate to sign up flow
    setCurrentScreen("signUpLanguage");
  };

  const handleEmailSubmit = (email: string) => {
    console.log("Password reset email sent to:", email);
    setCurrentScreen("login");
  };

  const handlePasswordReset = (newPassword: string) => {
    console.log("Password reset successful");
    // Reset state and return to login
    setCurrentScreen("login");
  };

  const handleBackToLogin = () => {
    setCurrentScreen("login");
  };

  // Sign Up Flow Handlers

  const handleLanguageSubmit = (language: string) => {
    // For future use - currently not stored
    setCurrentScreen("signUpBirthdate");
  };

  const handleBirthdateSubmit = (birthdate: string) => {
    setSignUpData({ ...signUpData, birthdate });
    setCurrentScreen("signUpAccountType");
  };

  const handleAccountTypeSubmit = (accountType: "managed" | "independent") => {
    setSignUpData({ ...signUpData, accountType });
    // If managed, prompt for managerial PIN; if independent, set PIN to null and continue
    if (accountType === "managed") {
      setCurrentScreen("signUpManagerPin");
    } else {
      setSignUpData({ ...signUpData, accountType, managerialPin: null });
      setCurrentScreen("signUpName");
    }
  };

  const handleManagerPinSubmit = (pin: string | null) => {
    setSignUpData({ ...signUpData, managerialPin: pin });
    setCurrentScreen("signUpName");
  };

  const handleNameSubmit = (firstName: string, lastName: string) => {
    setSignUpData({ ...signUpData, firstName, lastName });
    setCurrentScreen("signUpEmail");
  };

  const handleSignUpEmailSubmit = (email: string) => {
    // Save email and skip code entry screen: go straight to password creation
    setSignUpData({ ...signUpData, email });
    setSignUpSubmitError("");
    setCurrentScreen("signUpCreatePassword");
  };

  const handleSignUpPasswordSubmit = async (password: string) => {
    setSignUpSubmitError("");
    const payload = { ...signUpData, password };

    if (!payload.email) {
      console.error("Sign up error: email is required");
      setSignUpSubmitError(t("Password.emailRequiredError"));
      return;
    }

    if (!password || password.length < 6) {
      console.error("Sign up error: password must be at least 6 characters");
      setSignUpSubmitError(t("Password.weakPasswordError"));
      return;
    }

    setSignUpLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        payload.email,
        password,
      );
      const user = userCredential.user;
      console.log("Sign up successful:", user.email);

      await updateProfile(user, {
        displayName: `${payload.firstName} ${payload.lastName}`,
      });

      try {
        await sendEmailVerification(user);
        console.log("Verification email sent to:", user.email);
        Alert.alert(
          "Verification Email Sent",
          "A verification email has been sent to your address. Please check your email and verify your account.",
        );
      } catch (verifErr) {
        console.error("Failed to send verification email:", verifErr);
      }

      console.log(
        "auth.currentUser uid:",
        auth.currentUser?.uid,
        "created user uid:",
        user.uid,
      );

      const userDocRef = doc(firestore, "users", user.uid);
      try {
        await setDoc(userDocRef, {
          birthdate: payload.birthdate,
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          accountType: payload.accountType,
          managerialPin: payload.managerialPin,
          createdAt: serverTimestamp(),
          shopItems: {
            body: [true, false, false],
            wings: [false, true, false],
          },
          equipped: [0, 1],
        });
      } catch (writeErr) {
        console.error("Failed to write user document:", writeErr);
        try {
          await user.delete();
          console.log("Deleted auth user due to Firestore write failure");
        } catch (deleteErr) {
          console.error(
            "Failed to delete auth user after write failure:",
            deleteErr,
          );
        }
        throw writeErr;
      }

      setSignUpData({ ...payload, password: "" });

      console.log("Sign up complete with data:", {
        ...payload,
        password: "***",
      });

      if (user.emailVerified) {
        setCurrentScreen("homeScreen");
      } else {
        setCurrentScreen("login");
      }
    } catch (error: any) {
      console.error("Sign up error:", error?.code ?? error?.message ?? error);
      setSignUpSubmitError(getSignUpErrorMessage(error));
      return;
    } finally {
      setSignUpLoading(false);
    }
  };

  const handleBackToLoginFromSignUp = () => {
    setCurrentScreen("login");
    setSignUpSubmitError("");
    setSignUpData({
      birthdate: "",
      firstName: "",
      lastName: "",
      email: "",
      verificationCode: "",
      password: "",
      accountType: "",
      managerialPin: null,
    });
  };

  // Render forgot password flow screens
  if (currentScreen === "forgotPassword") {
    return (
      <ForgotPassword onSubmit={handleEmailSubmit} onBack={handleBackToLogin} />
    );
  }

  if (currentScreen === "resetPassword") {
    return (
      <ResetPassword
        onSubmit={handlePasswordReset}
        onBack={handleBackToLogin}
      />
    );
  }

  // Render sign up flow screens
  if (currentScreen === "signUpLanguage") {
    return (
      <SignUpLanguage
        onSubmit={handleLanguageSubmit}
        onBack={handleBackToLoginFromSignUp}
      />
    );
  }

  if (currentScreen === "signUpBirthdate") {
    return (
      <SignUpBirthdate
        onSubmit={handleBirthdateSubmit}
        onBack={() => setCurrentScreen("signUpLanguage")}
      />
    );
  }

  if (currentScreen === "signUpAccountType") {
    return (
      <SignUpAccountType
        onSubmit={handleAccountTypeSubmit}
        onBack={() => setCurrentScreen("signUpBirthdate")}
      />
    );
  }

  if (currentScreen === "signUpManagerPin") {
    return (
      <SignUpManagerPin
        onSubmit={handleManagerPinSubmit}
        onBack={() => setCurrentScreen("signUpAccountType")}
      />
    );
  }

  if (currentScreen === "signUpName") {
    return (
      <SignUpName
        onSubmit={handleNameSubmit}
        onBack={() => setCurrentScreen("signUpAccountType")}
      />
    );
  }

  if (currentScreen === "signUpEmail") {
    return (
      <SignUpEmail
        onSubmit={handleSignUpEmailSubmit}
        onBack={() => setCurrentScreen("signUpName")}
      />
    );
  }

  if (currentScreen === "signUpCreatePassword") {
    return (
      <SignUpCreatePassword
        onSubmit={handleSignUpPasswordSubmit}
        submitError={signUpSubmitError}
        // Since we skip the verification code screen, back should return to the email entry
        onBack={() => setCurrentScreen("signUpEmail")}
      />
    );
  }

  if (currentScreen === "homeScreen") {
    return <HomeScreen />;
  }

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
          {/* Logo Section */}
          <View className="mb-12 items-center">
            <Text
              className="text-6xl font-madimi text-white drop-shadow-lg"
              style={{
                textShadowColor: "rgba(0,0,0,0.3)",
                textShadowOffset: { width: 2, height: 2 },
                textShadowRadius: 4,
              }}
            >
              TaskBlast
            </Text>
          </View>

          {/* Login Container */}
          <View className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-3xl p-8 border-2 border-white/30 shadow-2xl">
            <Text className="text-4xl font-madimi font-semibold text-white mb-8 text-center drop-shadow-md">
              {t("Login.title")}
            </Text>

            <View className="mb-4">
              <View className="flex-row items-center bg-white/20 border-2 border-white/40 rounded-2xl px-4 h-14 shadow-lg">
                <Ionicons
                  name="person-outline"
                  size={22}
                  color="white"
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  className="font-madimi flex-1 text-base text-white"
                  placeholder={t("Login.emailPlaceholder")}
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>
            </View>

            <View className="mb-8">
              <View className="flex-row items-center bg-white/20 border-2 border-white/40 rounded-2xl px-4 h-14 shadow-lg">
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color="white"
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  className="font-madimi flex-1 text-base text-white"
                  placeholder={t("Login.passwordPlaceholder")}
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>
            </View>
          </View>

          <MainButton
            title={t("Login.loginButton")}
            variant="primary"
            size="medium"
            customStyle={{ width: "60%", alignSelf: "center", marginTop: -15 }}
            onPress={handleLogin}
          />

          {/* Bottom Links */}
          <View className="mt-8 items-center">
            <TouchableOpacity onPress={handleSignUp} className="my-2">
              <Text className="font-madimi text-sm text-white drop-shadow-md">
                {t("Login.noAccount")} {" "}
                <Text className="font-semibold text-yellow-300">
                  {t("Login.signUp")}
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleForgotPassword} className="my-2">
              <Text className="font-madimi text-sm text-white/80 drop-shadow-md">
                {t("Login.forgotPassword")}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="absolute bottom-6 left-0 right-0 items-center px-5">
            <LanguagePicker
              language={language}
              open={languageMenuOpen}
              setOpen={setLanguageMenuOpen}
              onSelect={setLanguage}
            />
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

function LanguagePicker({
  language,
  open,
  setOpen,
  onSelect,
}: {
  language: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onSelect: (code: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const current =
    LOGIN_LANGUAGES.find((entry) => entry.code === language) ?? LOGIN_LANGUAGES[0];

  return (
    <View className="relative w-full max-w-[260px]">
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => setOpen(!open)}
        className="flex-row items-center justify-between rounded-full border-2 border-white/30 bg-white/10 px-4 py-3"
      >
        <View className="flex-row items-center">
          <Text style={{ fontSize: 18, marginRight: 8 }}>{current.flag}</Text>
          <Text className="font-madimi text-sm text-white">
            {t("Settings.language")}: {current.name}
          </Text>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color="white"
        />
      </TouchableOpacity>

      {open && (
        <View className="absolute bottom-full mb-2 left-0 right-0 overflow-hidden rounded-2xl border border-white/20 bg-slate-950/95">
          <ScrollView
            style={{ maxHeight: 320 }}
            contentContainerStyle={{ paddingVertical: 2 }}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            {LOGIN_LANGUAGES.map((entry, index) => {
              const active = entry.code === language;
              return (
                <TouchableOpacity
                  key={entry.code}
                  accessibilityRole="button"
                  onPress={async () => {
                    await onSelect(entry.code);
                    setOpen(false);
                  }}
                  className="flex-row items-center justify-between px-4 py-3"
                  style={{
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderTopColor: "rgba(255,255,255,0.08)",
                    backgroundColor: active
                      ? "rgba(96, 165, 250, 0.18)"
                      : "transparent",
                  }}
                >
                  <View className="flex-row items-center">
                    <Text style={{ fontSize: 18, marginRight: 8 }}>{entry.flag}</Text>
                    <Text className="font-madimi text-xs text-white">
                      {entry.name}
                    </Text>
                  </View>
                  {active ? (
                    <Ionicons name="checkmark" size={16} color="#93c5fd" />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
