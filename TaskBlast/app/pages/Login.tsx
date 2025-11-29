import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  ImageBackground,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MainButton from "../components/MainButton";
import ForgotPassword from "./ForgotPassword";
import VerifyCode from "./VerifyCode";
import ResetPassword from "./ResetPassword";
import SignUpBirthdate from "./SignUpBirthdate";
import SignUpAccountType from "./SignUpAccountType";
import SignUpManagerPin from "./SignUpManagerPin";
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

type Screen =
  | "login"
  | "forgotPassword"
  | "verifyCode"
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
  const [resetEmail, setResetEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [t, i18n] = useTranslation();

  const starBackground = require("../../assets/backgrounds/starsAnimated.gif");

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        // User is signed in and verified - go straight to home
        console.log("Auto-login: User already authenticated:", user.email);
        setCurrentScreen("homeScreen");
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    // Normalize inputs to make bypass resilient to whitespace/casing
    const u = username.trim().toLowerCase();
    const p = password.trim();

    // Bypass login for testing (case-insensitive username, trim whitespace)
    if (u === "admin" && p === "taskblaster") {
      console.log("Bypass login successful");
      setCurrentScreen("homeScreen");
      return;
    }

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
          setCurrentScreen("homeScreen");
        } else {
          Alert.alert(
            "Verify Your Email",
            "A verification email was sent. Please verify your email before signing in.",
            [{ text: "OK" }]
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
    setResetEmail(email);
    setCurrentScreen("verifyCode");
  };

  const handleCodeSubmit = (code: string) => {
    setVerificationCode(code);
    setCurrentScreen("resetPassword");
  };

  const handlePasswordReset = (newPassword: string) => {
    console.log("Password reset successful for:", resetEmail);
    // Reset state and return to login
    setResetEmail("");
    setVerificationCode("");
    setCurrentScreen("login");
  };

  const handleBackToLogin = () => {
    setCurrentScreen("login");
    setResetEmail("");
    setVerificationCode("");
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
    setCurrentScreen("signUpCreatePassword");
  };

  const handleSignUpPasswordSubmit = async (password: string) => {
    const payload = { ...signUpData, password };

    if (!payload.email) {
      console.error("Sign up error: email is required");
      return;
    }

    if (!password || password.length < 6) {
      console.error("Sign up error: password must be at least 6 characters");
      return;
    }

    setSignUpLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        payload.email,
        password
      );
      const user = userCredential.user;
      console.log("Sign up successful:", user.email);

      await updateProfile(user, {
        displayName: `${payload.firstName} ${payload.lastName}`,
      });

      // send email verification via Firebase
      try {
        await sendEmailVerification(user);
        console.log("Verification email sent to:", user.email);
        Alert.alert(
          "Verification Email Sent",
          "A verification email has been sent to your address. Please check your email and verify your account."
        );
      } catch (verifErr) {
        console.error("Failed to send verification email:", verifErr);
      }

      console.log(
        "auth.currentUser uid:",
        auth.currentUser?.uid,
        "created user uid:",
        user.uid
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
        });
      } catch (writeErr) {
        console.error("Failed to write user document:", writeErr);
        try {
          await user.delete();
          console.log("Deleted auth user due to Firestore write failure");
        } catch (deleteErr) {
          console.error(
            "Failed to delete auth user after write failure:",
            deleteErr
          );
        }
        throw writeErr;
      }

      // Clear sensitive data from state
      setSignUpData({ ...payload, password: "" });

      console.log("Sign up complete with data:", {
        ...payload,
        password: "***",
      });
      // only allow home screen if email verified (no code needed anymore)
      if (user.emailVerified) {
        setCurrentScreen("homeScreen");
      } else {
        setCurrentScreen("login");
      }
    } catch (error: any) {
      console.error("Sign up error:", error?.code ?? error?.message ?? error);
      return;
    } finally {
      setSignUpLoading(false);
    }
  };

  const handleBackToLoginFromSignUp = () => {
    setCurrentScreen("login");
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

  if (currentScreen === "verifyCode") {
    return (
      <VerifyCode
        email={resetEmail}
        onSubmit={handleCodeSubmit}
        onBack={() => setCurrentScreen("forgotPassword")}
      />
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
            title={t("Login.signUp")}
            variant="primary"
            size="medium"
            customStyle={{ width: "60%", alignSelf: "center", marginTop: -15 }}
            onPress={handleLogin}
          />

          {/* Bottom Links */}
          <View className="mt-8 items-center">
            <TouchableOpacity onPress={handleSignUp} className="my-2">
              <Text className="font-madimi text-sm text-white drop-shadow-md">
                {t("Login.noAccount")}{" "}
                <Text className="font-semibold text-yellow-300">
                  {t("Login.signUp")}
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 2,
                borderColor: "rgba(255,255,255,0.4)",
                backgroundColor: "rgba(255,255,255,0.15)",
                padding: 12,
                borderRadius: 16,
                marginVertical: 8,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <Image
                source={{
                  uri: "https://developers.google.com/identity/images/g-logo.png",
                }}
                style={{
                  width: 20,
                  height: 20,
                  marginRight: 10,
                }}
              />
              <Text className="font-madimi text-white">
                Sign in with Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleForgotPassword} className="my-2">
              <Text className="font-madimi text-sm text-white/80 drop-shadow-md">
                {t("Login.forgotPassword")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
