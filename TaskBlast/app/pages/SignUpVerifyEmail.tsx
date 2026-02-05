import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import MainButton from "../components/MainButton";
import { auth } from "../../server/firebase";
import { sendEmailVerification } from "firebase/auth";

interface SignUpVerifyEmailProps {
  email: string;
  onSubmit: (code: string) => void;
  onBack: () => void;
}

export default function SignUpVerifyEmail({
  email,
  onSubmit,
  onBack,
}: SignUpVerifyEmailProps) {
  const [code, setCode] = useState(["", "", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  const starBackground = require("../../assets/backgrounds/starsAnimated.gif");

  // Send verification email on mount
  useEffect(() => {
    sendVerificationEmail();
  }, []);

  const sendVerificationEmail = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setEmailSent(true);
        setError("");
      }
    } catch (error: any) {
      console.error("Error sending verification email:", error);
      setError("Failed to send verification email");
    }
  };

  const handleSubmit = () => {
    // For email link verification, no code is needed - just proceed
    console.log("Email verification acknowledged");
    onSubmit("");
  };

  const handleResend = async () => {
    console.log("Resending verification code to:", email);
    await sendVerificationEmail();
  };

  const handleCodeChange = (text: string, index: number) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, "");

    if (numericText.length > 0) {
      const newCode = [...code];
      newCode[index] = numericText[numericText.length - 1]; // Take only the last digit
      setCode(newCode);

      // Auto-focus next input
      if (index < 4) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === "Backspace") {
      const newCode = [...code];

      if (code[index] === "" && index > 0) {
        // If current box is empty, go back and clear previous box
        inputRefs.current[index - 1]?.focus();
        newCode[index - 1] = "";
      } else {
        // Clear current box
        newCode[index] = "";
      }

      setCode(newCode);
    }
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
          {/* Verify Email Container */}
          <View className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-3xl p-8 border-2 border-white/30 shadow-2xl">
            <SpeakableText className="text-4xl font-madimi font-semibold text-white mb-4 text-left drop-shadow-md">
              Verify Your Email
            </SpeakableText>

            <SpeakableText className="font-madimi text-sm text-white/90 mb-8 text-left">
              We've sent a verification email to {email}. Please click the link
              in the email to verify your account.
            </SpeakableText>

            {error ? (
              <SpeakableText className="font-madimi text-sm text-red-300 mb-4 text-left drop-shadow-md">
                {error}
              </SpeakableText>
            ) : null}

            {emailSent ? (
              <SpeakableText className="font-madimi text-sm text-green-300 mb-4 text-left drop-shadow-md">
                Verification email sent! Check your inbox.
              </SpeakableText>
            ) : null}

            <View className="flex-row justify-between mb-8" style={{ gap: 10 }}>
              {[0, 1, 2, 3, 4].map((index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  className="font-madimi flex-1 h-14 bg-white/20 border-2 border-white/40 rounded-2xl text-2xl text-white text-center shadow-lg"
                  placeholder="0"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={code[index]}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  onSubmitEditing={() => Keyboard.dismiss()}
                  maxLength={1}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={handleResend}
              style={{ marginBottom: 16 }}
            >
              <SpeakableText className="font-madimi text-xs text-white/80 text-left">
                Didn't receive the email?{" "}
                <SpeakableText className="font-semibold text-yellow-300">Resend</SpeakableText>
              </SpeakableText>
            </TouchableOpacity>

            <MainButton
              title="Verify"
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
            <SpeakableText
              className="font-madimi text-sm text-white drop-shadow-md cursor-pointer"
              onPress={onBack}
            >
              Back to{" "}
              <SpeakableText className="font-semibold text-yellow-300">
                Previous Step
              </SpeakableText>
            </SpeakableText>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
