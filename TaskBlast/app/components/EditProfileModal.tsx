import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { updateProfilePicture } from "../../server/storageUtils";
import {
  updateUserProfile,
  type UserProfile,
} from "../../server/userProfileUtils";
import { auth } from "../../server/firebase";

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onProfileUpdate: (updatedProfile: UserProfile) => void;
}

export default function EditProfileModal({
  visible,
  onClose,
  userProfile,
  onProfileUpdate,
}: EditProfileModalProps) {
  const [firstName, setFirstName] = useState(userProfile.firstName);
  const [lastName, setLastName] = useState(userProfile.lastName);
  const [displayName, setDisplayName] = useState(userProfile.displayName);
  const [email, setEmail] = useState(userProfile.email);
  const [birthdate, setBirthdate] = useState(userProfile.birthdate || "");
  const [profilePicture, setProfilePicture] = useState(
    userProfile.profilePicture
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Update local state when userProfile prop changes
  useEffect(() => {
    setFirstName(userProfile.firstName);
    setLastName(userProfile.lastName);
    setDisplayName(userProfile.displayName);
    setEmail(userProfile.email);
    setBirthdate(userProfile.birthdate || "");
    setProfilePicture(userProfile.profilePicture);
  }, [userProfile]);

  const handleProfilePicturePress = async () => {
    if (isUploadingImage) return;

    setIsUploadingImage(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("You must be logged in to update your profile picture");
        return;
      }

      const newImageUrl = await updateProfilePicture(
        profilePicture || undefined
      );
      if (newImageUrl) {
        setProfilePicture(newImageUrl);
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
      setError("Failed to update profile picture");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setError("");

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required");
      return;
    }

    if (!displayName.trim()) {
      setError("Display name is required");
      return;
    }

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSaving(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("You must be logged in to update your profile");
        return;
      }

      // Update profile in Firestore
      await updateUserProfile(currentUser.uid, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: displayName.trim(),
        email: email.trim(),
        birthdate: birthdate.trim(),
        profilePicture,
      });

      // Create updated profile object
      const updatedProfile: UserProfile = {
        ...userProfile,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: displayName.trim(),
        email: email.trim(),
        birthdate: birthdate.trim(),
        profilePicture,
      };

      onProfileUpdate(updatedProfile);
      onClose();
    } catch (error) {
      console.error("Error saving profile:", error);
      setError("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 bg-black/80">
          <View
            className="flex-1 mt-20 bg-[#0a0a1a] rounded-t-3xl"
            style={{
              shadowColor: "#9333ea",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
            }}
          >
            {/* Header */}
            <View
              className="flex-row items-center justify-between p-6 border-b-2"
              style={{ borderBottomColor: "rgba(147, 51, 234, 0.3)" }}
            >
              <Text className="font-orbitron-semibold text-2xl text-white">
                Edit Profile
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="flex-1 p-6"
              showsVerticalScrollIndicator={false}
            >
              {/* Profile Picture */}
              <View className="items-center mb-8">
                <TouchableOpacity
                  className="w-32 h-32 rounded-full items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: "#7c3aed",
                    shadowColor: "#a855f7",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.6,
                    shadowRadius: 16,
                  }}
                  onPress={handleProfilePicturePress}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? (
                    <ActivityIndicator size="large" color="white" />
                  ) : profilePicture ? (
                    <Image
                      source={{ uri: profilePicture }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="person" size={64} color="white" />
                  )}
                </TouchableOpacity>
                <View
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: "#a855f7",
                    borderWidth: 3,
                    borderColor: "#0a0a1a",
                  }}
                >
                  <Ionicons name="camera" size={20} color="white" />
                </View>
                <Text className="font-madimi text-sm text-white/60 mt-3">
                  Tap to change profile picture
                </Text>
              </View>

              {/* Error Message */}
              {error ? (
                <View
                  className="mb-4 p-3 rounded-lg"
                  style={{ backgroundColor: "rgba(239, 68, 68, 0.2)" }}
                >
                  <Text className="font-madimi text-red-400 text-sm text-center">
                    {error}
                  </Text>
                </View>
              ) : null}

              {/* First Name */}
              <View className="mb-4">
                <Text className="font-orbitron-semibold text-white text-sm mb-2">
                  First Name
                </Text>
                <View
                  className="flex-row items-center bg-white/10 border-2 rounded-xl px-4 h-14"
                  style={{ borderColor: "rgba(147, 51, 234, 0.4)" }}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="white"
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    className="font-madimi flex-1 text-base text-white"
                    placeholder="First Name"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Last Name */}
              <View className="mb-4">
                <Text className="font-orbitron-semibold text-white text-sm mb-2">
                  Last Name
                </Text>
                <View
                  className="flex-row items-center bg-white/10 border-2 rounded-xl px-4 h-14"
                  style={{ borderColor: "rgba(147, 51, 234, 0.4)" }}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="white"
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    className="font-madimi flex-1 text-base text-white"
                    placeholder="Last Name"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Display Name */}
              <View className="mb-4">
                <Text className="font-orbitron-semibold text-white text-sm mb-2">
                  Display Name (Nickname)
                </Text>
                <View
                  className="flex-row items-center bg-white/10 border-2 rounded-xl px-4 h-14"
                  style={{ borderColor: "rgba(147, 51, 234, 0.4)" }}
                >
                  <Ionicons
                    name="star-outline"
                    size={20}
                    color="white"
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    className="font-madimi flex-1 text-base text-white"
                    placeholder="Display Name"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={displayName}
                    onChangeText={setDisplayName}
                  />
                </View>
              </View>

              {/* Email */}
              <View className="mb-4">
                <Text className="font-orbitron-semibold text-white text-sm mb-2">
                  Email
                </Text>
                <View
                  className="flex-row items-center bg-white/10 border-2 rounded-xl px-4 h-14"
                  style={{ borderColor: "rgba(147, 51, 234, 0.4)" }}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="white"
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    className="font-madimi flex-1 text-base text-white"
                    placeholder="Email"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Birthdate */}
              <View className="mb-6">
                <Text className="font-orbitron-semibold text-white text-sm mb-2">
                  Birthdate (MM/DD/YYYY)
                </Text>
                <View
                  className="flex-row items-center bg-white/10 border-2 rounded-xl px-4 h-14"
                  style={{ borderColor: "rgba(147, 51, 234, 0.4)" }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color="white"
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    className="font-madimi flex-1 text-base text-white"
                    placeholder="MM/DD/YYYY"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={birthdate}
                    onChangeText={setBirthdate}
                  />
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                className="w-full py-4 rounded-xl items-center justify-center mb-6"
                style={{
                  backgroundColor: "#9333ea",
                  shadowColor: "#9333ea",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 12,
                }}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="font-orbitron-semibold text-white text-base">
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
