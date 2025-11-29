import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ImageBackground,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import MainButton from "../components/MainButton";
import EditProfileModal from "../components/EditProfileModal";
import TraitsModal from "../components/TraitsModal";
import { updateProfilePicture } from "../../server/storageUtils";
import { auth } from "../../server/firebase";
import {
  getUserProfile,
  updateUserProfilePicture,
  type UserProfile,
} from "../../server/userProfileUtils";

export default function ProfileScreen() {
  const router = useRouter();
  const starBackground = require("../../assets/backgrounds/starsAnimated.gif");

  // User data state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isTraitsModalVisible, setIsTraitsModalVisible] = useState(false);

  // Load user profile on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const profile = await getUserProfile(currentUser.uid);
          if (profile) {
            setUserProfile(profile);
          } else {
            // Set default profile if none exists
            setUserProfile({
              uid: currentUser.uid,
              firstName: "Space",
              lastName: "Explorer",
              displayName: "Space",
              email: currentUser.email || "",
              traits: ["Focused", "Persistent", "Creative", "Goal-Oriented"],
              awards: [
                "🏆 First Mission",
                "⭐ 10 Tasks Complete",
                "🚀 Speed Runner",
                "💎 Rock Collector",
              ],
            });
          }
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, []);

  const handleLogout = () => {
    // Add logout logic here
    console.log("Logging out...");
    router.push("/pages/Login");
  };

  const handleProfilePicturePress = async () => {
    if (isUploadingImage || !userProfile) return;

    setIsUploadingImage(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("You must be logged in to update your profile picture");
        return;
      }

      const newImageUrl = await updateProfilePicture(
        userProfile.profilePicture || undefined
      );

      if (newImageUrl) {
        // Save to Firestore
        await updateUserProfilePicture(currentUser.uid, newImageUrl);

        // Update local state
        setUserProfile({
          ...userProfile,
          profilePicture: newImageUrl,
        });

        console.log("Profile picture updated successfully!");
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
      alert("Failed to update profile picture. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  };

  return (
    <View className="flex-1">
      {/* Animated stars background */}
      <ImageBackground
        source={starBackground}
        className="absolute inset-0 w-full h-full"
        resizeMode="cover"
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-1 p-5 pt-16">
          {/* Back Button */}
          <TouchableOpacity
            className="absolute top-12 left-5 z-10 w-12 h-12 bg-white/10 rounded-full items-center justify-center"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          {/* User Name - Centered */}
          <Text
            className="font-orbitron-semibold text-xl text-white text-center text-3xl mt-8 mb-8"
            style={{
              textShadowColor: "rgba(147, 51, 234, 0.8)",
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 20,
            }}
          >
            {userProfile?.displayName ||
              userProfile?.firstName ||
              "Space Explorer"}
          </Text>

          {/* Profile Image */}
          <View className="items-center mb-6">
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
              ) : userProfile?.profilePicture ? (
                <Image
                  source={{ uri: userProfile.profilePicture }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={64} color="white" />
              )}
            </TouchableOpacity>
          </View>

          {/* Edit Profile Button */}
          <View className="items-center mb-8">
            <TouchableOpacity
              className="flex-row items-center px-6 py-3 rounded-full"
              style={{
                backgroundColor: "rgba(139, 92, 246, 0.3)",
                borderWidth: 2,
                borderColor: "rgba(167, 139, 250, 0.5)",
                shadowColor: "#a855f7",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
              }}
              onPress={() => {
                setIsEditModalVisible(true);
              }}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text className="font-orbitron-semibold text-xl text-white text-base">
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>

          {/* Traits Container */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text
                className="font-orbitron-semibold text-xl text-white"
                style={{
                  textShadowColor: "rgba(59, 130, 246, 0.6)",
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 10,
                }}
              >
                Traits
              </Text>
              <TouchableOpacity
                onPress={() => setIsTraitsModalVisible(true)}
                className="flex-row items-center px-3 py-2 rounded-full"
                style={{
                  backgroundColor: "rgba(59, 130, 246, 0.3)",
                  borderWidth: 1,
                  borderColor: "rgba(96, 165, 250, 0.5)",
                }}
              >
                <Ionicons
                  name="add"
                  size={16}
                  color="white"
                  style={{ marginRight: 4 }}
                />
                <Text className="font-orbitron-semibold text-white text-xs">
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
            <View
              className="p-4 rounded-2xl"
              style={{
                backgroundColor: "rgba(30, 58, 138, 0.3)",
                borderWidth: 2,
                borderColor: "rgba(59, 130, 246, 0.3)",
                shadowColor: "#3b82f6",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <View className="flex-row flex-wrap gap-2">
                {userProfile?.traits?.map((trait: string, index: number) => (
                  <View
                    key={index}
                    className="px-4 py-2 rounded-full"
                    style={{
                      backgroundColor: "rgba(59, 130, 246, 0.4)",
                      borderWidth: 1,
                      borderColor: "rgba(96, 165, 250, 0.6)",
                    }}
                  >
                    <Text className="font-orbitron-semibold text-xl text-white text-sm">
                      {trait}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Awards Container */}
          <View className="mb-8">
            <Text
              className="font-orbitron-semibold text-xl text-white text-xl mb-4"
              style={{
                textShadowColor: "rgba(236, 72, 153, 0.6)",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
              }}
            >
              Awards
            </Text>
            <View
              className="p-4 rounded-2xl"
              style={{
                backgroundColor: "rgba(131, 24, 67, 0.3)",
                borderWidth: 2,
                borderColor: "rgba(236, 72, 153, 0.3)",
                shadowColor: "#ec4899",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <View className="flex-row flex-wrap gap-2">
                {userProfile?.awards?.map((award: string, index: number) => (
                  <View
                    key={index}
                    className="px-4 py-2 rounded-full"
                    style={{
                      backgroundColor: "rgba(236, 72, 153, 0.4)",
                      borderWidth: 1,
                      borderColor: "rgba(244, 114, 182, 0.6)",
                    }}
                  >
                    <Text className="font-orbitron-semibold text-white text-">
                      {award}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Logout Button */}
          <View className="items-center mb-8">
            <MainButton
              title="Logout"
              variant="error"
              onPress={handleLogout}
              customStyle={{ width: "80%" }}
            />
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      {userProfile && (
        <EditProfileModal
          visible={isEditModalVisible}
          onClose={() => setIsEditModalVisible(false)}
          userProfile={userProfile}
          onProfileUpdate={handleProfileUpdate}
        />
      )}

      {/* Traits Modal */}
      {userProfile && (
        <TraitsModal
          visible={isTraitsModalVisible}
          onClose={() => setIsTraitsModalVisible(false)}
          userProfile={userProfile}
          onTraitsUpdate={handleProfileUpdate}
        />
      )}
    </View>
  );
}
