import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../../TTS";
import { Ionicons } from "@expo/vector-icons";
import { useAdmin } from "../context/AdminContext";

interface AdminPinVerificationProps {
  email: string;
  onVerified: () => void;
  onCancel: () => void;
}

export default function AdminPinVerification({
  email,
  onVerified,
  onCancel,
}: AdminPinVerificationProps) {
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { verifyAdminPin, error } = useAdmin();

  const starBackground = require("../../assets/backgrounds/starsAnimated.gif");

  const handleVerify = async () => {
    if (!pin.trim()) {
      Alert.alert("PIN Required", "Please enter your admin PIN to continue.");
      return;
    }

    setIsSubmitting(true);
    const verified = await verifyAdminPin(email, pin.trim());
    setIsSubmitting(false);

    if (verified) {
      setPin("");
      onVerified();
      return;
    }

    Alert.alert("Verification Failed", error || "Invalid PIN.");
    setPin("");
  };

  return (
    <View className="flex-1">
      <ImageBackground
        source={starBackground}
        className="absolute inset-0 w-full h-full"
        resizeMode="cover"
      />
      <View className="flex-1 justify-center p-6">
        <View className="bg-black/60 rounded-3xl p-6 border border-white/20">
          <View className="items-center mb-5">
            <Ionicons name="shield-checkmark" size={48} color="#93c5fd" />
            <Text className="font-orbitron-bold text-white text-2xl mt-3 text-center">
              Admin Verification
            </Text>
            <Text className="font-orbitron text-white/80 text-center mt-2">
              Enter your admin PIN for {email}
            </Text>
          </View>

          <TextInput
            value={pin}
            onChangeText={setPin}
            secureTextEntry
            keyboardType="number-pad"
            maxLength={8}
            placeholder="Enter PIN"
            placeholderTextColor="rgba(255,255,255,0.4)"
            className="bg-white/15 text-white text-center text-2xl rounded-xl p-4 mb-4"
            autoFocus
          />

          <TouchableOpacity
            onPress={handleVerify}
            disabled={isSubmitting}
            className="bg-blue-600 rounded-xl p-4 mb-3"
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="font-orbitron-bold text-white text-center text-base">
                Verify Admin PIN
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onCancel}
            disabled={isSubmitting}
            className="bg-white/15 rounded-xl p-4"
          >
            <Text className="font-orbitron-semibold text-white text-center">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
