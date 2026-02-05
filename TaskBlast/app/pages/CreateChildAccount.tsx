import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { auth, firestore } from "../../server/firebase";
import { collection, doc, setDoc, query, where, getDocs, collectionGroup, serverTimestamp } from "firebase/firestore";

export default function CreateChildAccount() {
  const router = useRouter();
  const starBackground = require("../../assets/backgrounds/starsAnimated.gif");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

const checkUsernameAvailable = async (username: string): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    
    // check children
    const childrenRef = collection(firestore, `users/${user.uid}/children`);
    const childrenQuery = query(
      childrenRef,
      where("username", "==", username.toLowerCase())
    );
    const snapshot = await getDocs(childrenQuery);
    return snapshot.empty;
  } catch (error) {
    console.error("Error checking username:", error);
    return false;
  }
};

  const handleCreateChild = async () => {
    // Validation
    if (!firstName || !lastName || !birthdate || !username || !pin || !confirmPin) {
      Alert.alert("Missing Information", "Please fill in all fields");
      return;
    }

    if (pin.length !== 4) {
      Alert.alert("Invalid PIN", "PIN must be 4 digits");
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert("PIN Mismatch", "PINs do not match");
      return;
    }

    // Check username format (alphanumeric only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      Alert.alert("Invalid Username", "Username can only contain letters, numbers, and underscores");
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in to create a child account");
        setLoading(false);
        return;
      }

      // Check if username is available
      const isAvailable = await checkUsernameAvailable(username);
      if (!isAvailable) {
        Alert.alert("Username Taken", "This username is already in use. Please choose another.");
        setLoading(false);
        return;
      }

      // Create child document
      const childrenRef = collection(firestore, `users/${user.uid}/children`);
      const newChildRef = doc(childrenRef);

      await setDoc(newChildRef, {
        username: username.toLowerCase(), // Store lowercase for consistent queries
        pin: pin,
        firstName: firstName,
        lastName: lastName,
        birthdate: birthdate,
        createdAt: serverTimestamp(),
      });

      Alert.alert(
        "Success!",
        `Child account created for ${firstName}!`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("Error creating child account:", error);
      Alert.alert("Error", "Failed to create child account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1">
      {/* Animated stars background */}
      <ImageBackground
        source={starBackground}
        className="absolute inset-0 w-full h-full"
        resizeMode="cover"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-6 mt-12 w-12 h-12 bg-white/10 rounded-full items-center justify-center"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <SpeakableText
            className="text-4xl font-orbitron-bold text-white mb-8 text-center"
            style={{
              textShadowColor: "rgba(147, 51, 234, 0.8)",
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 20,
            }}
          >
            Create Child Account
          </SpeakableText>

          {/* First Name */}
          <View className="mb-4">
            <SpeakableText className="text-white font-orbitron-semibold mb-2">First Name</SpeakableText>
            <TextInput
              className="bg-white/20 text-white font-orbitron p-4 rounded-xl"
              placeholder="Enter first name"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          {/* Last Name */}
          <View className="mb-4">
            <SpeakableText className="text-white font-orbitron-semibold mb-2">Last Name</SpeakableText>
            <TextInput
              className="bg-white/20 text-white font-orbitron p-4 rounded-xl"
              placeholder="Enter last name"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          {/* Birthdate */}
          <View className="mb-4">
            <SpeakableText className="text-white font-orbitron-semibold mb-2">Birthdate</SpeakableText>
            <TextInput
              className="bg-white/20 text-white font-orbitron p-4 rounded-xl"
              placeholder="MM/DD/YYYY"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={birthdate}
              onChangeText={setBirthdate}
            />
          </View>

          {/* Username */}
          <View className="mb-4">
            <SpeakableText className="text-white font-orbitron-semibold mb-2">Username</SpeakableText>
            <TextInput
              className="bg-white/20 text-white font-orbitron p-4 rounded-xl"
              placeholder="Choose a unique username"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={username}
              onChangeText={(text) => setUsername(text.toLowerCase())}
              autoCapitalize="none"
            />
          </View>

          {/* PIN */}
          <View className="mb-4">
            <SpeakableText className="text-white font-orbitron-semibold mb-2">4-Digit PIN</SpeakableText>
            <TextInput
              className="bg-white/20 text-white font-orbitron p-4 rounded-xl text-center text-2xl"
              placeholder="****"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={pin}
              onChangeText={setPin}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
            />
          </View>

          {/* Confirm PIN */}
          <View className="mb-8">
            <SpeakableText className="text-white font-orbitron-semibold mb-2">Confirm PIN</SpeakableText>
            <TextInput
              className="bg-white/20 text-white font-orbitron p-4 rounded-xl text-center text-2xl"
              placeholder="****"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={confirmPin}
              onChangeText={setConfirmPin}
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
            />
          </View>

          {/* Create Button */}
          <TouchableOpacity
            onPress={handleCreateChild}
            disabled={loading}
            className={`p-4 rounded-xl ${loading ? "opacity-50" : ""}`}
            style={{
              backgroundColor: "#16a34a",
              shadowColor: "#16a34a",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
            }}
          >
            <SpeakableText className="text-white text-center font-orbitron-bold text-xl">
              {loading ? "Creating..." : "Create Child Account"}
            </SpeakableText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}