import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ImageBackground,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import MainButton from "../components/MainButton";

export default function ProfileScreen() {
  const router = useRouter();
  const starBackground = require("../../assets/backgrounds/starsAnimated.gif");

  // Example data - replace with actual user data
  const [userName] = useState("Space Explorer");
  const [userTraits] = useState([
    "Focused",
    "Persistent",
    "Creative",
    "Goal-Oriented",
  ]);
  const [userAwards] = useState([
    "🏆 First Mission",
    "⭐ 10 Tasks Complete",
    "🚀 Speed Runner",
    "💎 Rock Collector",
  ]);

  const handleLogout = () => {
    // Add logout logic here
    console.log("Logging out...");
    router.push("/pages/Login");
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
            {userName}
          </Text>

          {/* Profile Image */}
          <View className="items-center mb-6">
            <View
              className="w-32 h-32 rounded-full items-center justify-center"
              style={{
                backgroundColor: "#7c3aed",
                shadowColor: "#a855f7",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.6,
                shadowRadius: 16,
              }}
            >
              <Ionicons name="person" size={64} color="white" />
            </View>
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
                // Add edit profile logic
                console.log("Edit profile pressed");
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
            <Text
              className="font-orbitron-semibold text-xl text-white text-xl mb-4"
              style={{
                textShadowColor: "rgba(59, 130, 246, 0.6)",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 10,
              }}
            >
              Traits
            </Text>
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
                {userTraits.map((trait, index) => (
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
                {userAwards.map((award, index) => (
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
    </View>
  );
}
