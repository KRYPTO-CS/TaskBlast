import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { Text } from "../../TTS";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signOut } from "firebase/auth";
import { auth } from "../../server/firebase";
import MainButton from "../components/MainButton";
import { WebView } from "react-native-webview";
import { useFocusEffect } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import EditProfileModal from "../components/EditProfileModal";
import TraitsModal from "../components/TraitsModal";
import AnalyticsChartsModal from "../components/AnalyticsChartsModal";
import { updateProfilePicture } from "../../server/storageUtils";
import { useTranslation } from "react-i18next";
import { useColorPalette } from "../styles/colorBlindThemes";
import {
  getUserProfile,
  updateUserProfilePicture,
  type UserProfile,
} from "../../server/userProfileUtils";
import {
  CoachmarkAnchor,
  useCoachmark,
  createTour,
} from "@edwardloopez/react-native-coachmark";

export default function ProfileScreen() {
  const router = useRouter();
  const palette = useColorPalette();
  const starBackground = require("../../assets/backgrounds/starsAnimated.gif");

  const [currentProfileType, setCurrentProfileType] = useState<
    "parent" | "child"
  >("parent");
  const [currentChildUsername, setCurrentChildUsername] = useState<
    string | null
  >(null);

  // User data state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isTraitsModalVisible, setIsTraitsModalVisible] = useState(false);
  const [isAnalyticsModalVisible, setIsAnalyticsModalVisible] = useState(false);

  // Stats state
  const [statsValues, setStatsValues] = useState<number[]>([]);
  const [statsLabels, setStatsLabels] = useState<string[]>([]);
  const [workTimes, setWorkTimes] = useState<number[]>([]);
  const [workLabels, setWorkLabels] = useState<string[]>([]);
  const [playTimes, setPlayTimes] = useState<number[]>([]);
  const [playLabels, setPlayLabels] = useState<string[]>([]);
  const [totalRocksAllTime, setTotalRocksAllTime] = useState<number>(0);
  const [currentRocks, setCurrentRocks] = useState<number>(0);
  const [rocksSpent, setrocksSpent] = useState<number>(0);
  const [level, setLevel] = useState<number>(0);
  const [planets, setPlanets] = useState<number>(0);
  const { t, i18n } = useTranslation();
  const { start } = useCoachmark();
  const hasStartedTour = useRef(false);
  const onboardingTour = React.useMemo(
    () =>
      createTour("profile-onboarding", [
        {
          id: "edit-profile-button",
          title: t("Profile.editP"),
          description: t("Profile.coachMarkeditP"),
        },
        {
          id: "traits-section",
          title: t("Profile.coachMarkTraitsTitle"),
          description: t("Profile.coachMarkTraits"),
        },
        {
          id: "awards-section",
          title: t("Profile.coachMarkAwardsTitle"),
          description: t("Profile.coachMarkAwards"),
        },
        {
          id: "stats-section",
          title: t("Profile.coachMarkStatsTitle"),
          description: t("Profile.coachMarkStats"),
        },
      ]),
    [t],
  );

  // Load user profile on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const db = getFirestore();

        // Check if a child profile is active
        const activeChild = await AsyncStorage.getItem("activeChildProfile");

        let profileData = null;

        if (activeChild) {
          // Child is active - load from child's document
          const childrenRef = collection(
            db,
            "users",
            currentUser.uid,
            "children",
          );
          const childQuery = query(
            childrenRef,
            where("username", "==", activeChild),
          );
          const childSnapshot = await getDocs(childQuery);

          if (!childSnapshot.empty) {
            const childDoc = childSnapshot.docs[0];
            const childData = childDoc.data();

            // Map child data to UserProfile format
            profileData = {
              uid: currentUser.uid,
              firstName: childData.firstName || "",
              lastName: childData.lastName || "",
              displayName: childData.firstName || "Child", // Use firstName as display name for children
              email: currentUser.email || "",
              birthdate: childData.birthdate || "",
              profilePicture: childData.profilePicture,
              traits: childData.traits || [],
              awards: childData.awards || [],
            };
          }
        } else {
          // Parent is active - load from parent's document
          profileData = await getUserProfile(currentUser.uid);
        }

        if (profileData) {
          setUserProfile(profileData);
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
      } catch (error) {
        console.error("Error loading user profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadUserProfile();
    loadAllTimeStats();
  }, []);

  const loadAllTimeStats = useCallback(async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirestore();

      // Check if a child profile is active
      const activeChild = await AsyncStorage.getItem("activeChildProfile");

      let userDoc;

      if (activeChild) {
        // Child is active - load from child's document
        const { collection, query, where, getDocs } =
          await import("firebase/firestore");
        const childrenRef = collection(db, "users", user.uid, "children");
        const childQuery = query(
          childrenRef,
          where("username", "==", activeChild),
        );
        const childSnapshot = await getDocs(childQuery);

        if (!childSnapshot.empty) {
          const childDocData = childSnapshot.docs[0];
          userDoc = childDocData;
        } else {
          console.warn("Child profile not found");
          return;
        }
      } else {
        // Parent is active - load from parent's document
        userDoc = await getDoc(doc(db, "users", user.uid));
      }

      if (userDoc && userDoc.exists()) {
        const data = userDoc.data();
        const rocksArr: number[] = data.allTimeRocksArr || [];
        const wtArr: number[] = data.workTimeMinutesArr || [];
        const ptArr: number[] = data.playTimeMinutesArr || [];
        const totalAllTime = Number(data.allTimeRocks ?? 0);

        setTotalRocksAllTime(Number.isNaN(totalAllTime) ? 0 : Math.max(0, Math.floor(totalAllTime)));
        setrocksSpent(Number.isNaN(data.rocksSpent) ? 0 : Math.max(0, Math.floor(data.rocksSpent)));
        setLevel(Number.isNaN(data.level) ? 0 : Math.max(0, Math.floor(data.currentLevel)));
        setPlanets(Number.isNaN(data.planets) ? 0 : Math.max(0, Math.floor(data.currPlanet)));
        setCurrentRocks(
          Number.isNaN(data.rocks) ? 0 : Math.max(0, Math.floor(data.rocks)),
        );
        setStatsLabels(rocksArr.map((_, i) => `#${i + 1}`));
        setWorkLabels(wtArr.map((_, i) => `#${i + 1}`));
        setPlayLabels(ptArr.map((_, i) => `#${i + 1}`));
        setStatsValues(rocksArr);
        setWorkTimes(wtArr);
        setPlayTimes(ptArr);
      }
    } catch (e) {
      console.warn("Failed to load stats", e);
    }
  }, []);

  // Load current profile on mount
  useEffect(() => {
    loadCurrentProfile();
  }, []);

  const loadCurrentProfile = async () => {
    const activeChild = await AsyncStorage.getItem("activeChildProfile");
    if (activeChild) {
      setCurrentProfileType("child");
      setCurrentChildUsername(activeChild);
    } else {
      setCurrentProfileType("parent");
      setCurrentChildUsername(null);
    }
  };

  const handleSwitchProfile = () => {
    router.push("/pages/ProfileSelection");
  };

  const handleLogout = async () => {
    try {
      // Clear active profile
      await AsyncStorage.removeItem("activeChildProfile");
      // Sign out from Firebase
      await signOut(auth);
      // Navigate to login
      router.push("/pages/Login");
    } catch (error) {
      console.error("Logout error:", error);
    }
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
        userProfile.profilePicture || undefined,
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
  // useFocusEffect(
  //   useCallback(() => {
  //     if (hasStartedTour.current) return;

  //     const timeout = setTimeout(async () => {
  //       const seen = await AsyncStorage.getItem("profileOnboardingSeen");

  //       if (!seen) {
  //         await AsyncStorage.setItem("profileOnboardingSeen", "true");
  //         hasStartedTour.current = true;
  //         start(onboardingTour);
  //       }
  //     }, 700); // give ScrollView + WebViews time to mount

  //     return () => clearTimeout(timeout);
  //   }, [onboardingTour])
  // );

  useFocusEffect(
    useCallback(() => {
      if (hasStartedTour.current) return;

      let cancelled = false;
      const timeout = setTimeout(async () => {
        const seen = await AsyncStorage.getItem("profileOnboardingSeen");

        if (!seen && !cancelled) {
          await AsyncStorage.setItem("profileOnboardingSeen", "true");
          hasStartedTour.current = true;
          start(onboardingTour);
        }
      }, 700);

      return () => {
        cancelled = true;
        clearTimeout(timeout);
      };
    }, [onboardingTour, start]),
  );

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

          {/* Profile Type Badge */}
          <View className="items-center mt-2 mb-4">
            <View
              className="px-4 py-2 rounded-full"
              style={{
                backgroundColor:
                  currentProfileType === "parent"
                    ? palette.rowBgPrimary
                    : palette.accentActive,
                borderWidth: 1,
                borderColor:
                  currentProfileType === "parent"
                    ? palette.secondaryLightBorder
                    : palette.accentActiveBorder,
              }}
            >
              <Text className="font-orbitron-semibold text-white text-xs">
                {currentProfileType === "parent"
                  ? t("Settings.parentAccount")
                  : `👶 ${currentChildUsername}`}
              </Text>
            </View>
          </View>

          {/* User Name - Centered */}
          <Text
            className="font-orbitron-semibold text-xl text-white text-center text-3xl mt-4 mb-8"
            style={{
              textShadowColor: palette.accentGlow,
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
                backgroundColor: palette.accent,
                shadowColor: palette.modalShadow,
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
            <CoachmarkAnchor id="edit-profile-button" shape="circle">
              <TouchableOpacity
                className="flex-row items-center px-6 py-3 rounded-full"
                style={{
                  backgroundColor: palette.accentSoft,
                  borderWidth: 2,
                  borderColor: palette.accentSoftBorder,
                  shadowColor: palette.modalShadow,
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
                  {t("Profile.editP")}
                </Text>
              </TouchableOpacity>
            </CoachmarkAnchor>
          </View>

          {/* Traits Container */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <CoachmarkAnchor id="traits-section" shape="circle">
                <Text
                  className="font-orbitron-semibold text-xl text-white"
                  style={{
                    textShadowColor: palette.statsAccentGlow,
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 10,
                  }}
                >
                  {t("Profile.traits")}
                </Text>
              </CoachmarkAnchor>
              <TouchableOpacity
                onPress={() => setIsTraitsModalVisible(true)}
                className="flex-row items-center px-3 py-2 rounded-full"
                style={{
                  backgroundColor: palette.rowBgPrimary,
                  borderWidth: 1,
                  borderColor: palette.secondaryLightBorder,
                }}
              >
                <Ionicons
                  name="add"
                  size={16}
                  color="white"
                  style={{ marginRight: 4 }}
                />
                <Text className="font-orbitron-semibold text-white text-xs">
                  {t("Profile.edit")}
                </Text>
              </TouchableOpacity>
            </View>
            <View
              className="p-4 rounded-2xl"
              style={{
                backgroundColor: palette.secondaryDeepBg,
                borderWidth: 2,
                borderColor: palette.rowBorderPrimary,
                shadowColor: palette.secondary,
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
                      backgroundColor: palette.secondaryMedBold,
                      borderWidth: 1,
                      borderColor: palette.secondaryLightBorder,
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
            <CoachmarkAnchor id="awards-section" shape="circle">
              <Text
                className="font-orbitron-semibold text-xl text-white text-xl mb-4"
                style={{
                  textShadowColor: `${palette.tertiary}99`,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 10,
                }}
              >
                {t("Profile.awards")}
              </Text>
            </CoachmarkAnchor>
            <View
              className="p-4 rounded-2xl"
              style={{
                backgroundColor: palette.tertiarySoft,
                borderWidth: 2,
                borderColor: palette.tertiarySoftBorder,
                shadowColor: palette.tertiary,
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
                      backgroundColor: palette.tertiarySoftBorder,
                      borderWidth: 1,
                      borderColor: palette.tertiary,
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

          {/* Analytics Container */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-4">
              <CoachmarkAnchor id="stats-section" shape="circle">
                <Text
                  className="font-orbitron-semibold text-xl text-white"
                  style={{
                    textShadowColor: palette.statsAccentGlow,
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 10,
                  }}
                >
                  {t("Profile.YourStats")}
                </Text>
              </CoachmarkAnchor>
              <TouchableOpacity
                onPress={() => setIsAnalyticsModalVisible(true)}
                className="flex-row items-center px-3 py-2 rounded-full"
                style={{
                  backgroundColor: palette.rowBgPrimary,
                  borderWidth: 1,
                  borderColor: palette.secondaryLightBorder,
                }}
              >
                <Ionicons
                  name="add"
                  size={16}
                  color="white"
                  style={{ marginRight: 4 }}
                />
                <Text className="font-orbitron-semibold text-white text-xs">
                  {t("Profile.advanced")}
                </Text>
              </TouchableOpacity>
            </View>
            <View
              className="p-4 rounded-2xl"
              style={{
                backgroundColor: palette.statsBg,
                borderWidth: 2,
                borderColor: palette.statsBgBorder,
                shadowColor: palette.statsAccent,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
              }}
            >
              {/* Total Rocks */}
              <View
                className="px-4 py-2 rounded-full"
                style={{
                  backgroundColor: palette.statsAccentSoft,
                  borderWidth: 1,
                  borderColor: palette.statsAccentBorder,
                }}
              >
                <Text className="font-orbitron-semibold text-white">
                  {t("Profile.rocksEarned")}
                  {totalRocksAllTime}
                </Text>
              </View>
              {/* Rocks Spent */}
              <View
                className="px-4 py-2 rounded-full mt-2"
                style={{
                  backgroundColor: palette.statsAccentSoft,
                  borderWidth: 1,
                  borderColor: palette.statsAccentBorder,
                }}
              >
                <Text className="font-orbitron-semibold text-white">
                  {t("Profile.rocksSpent")}
                  {Math.max(0, rocksSpent)}
                </Text>
              </View>
              {/* Current Level */}
              <View
                className="px-4 py-2 rounded-full mt-2"
                style={{
                  backgroundColor: palette.statsAccentSoft,
                  borderWidth: 1,
                  borderColor: palette.statsAccentBorder,
                }}
              >
                <Text className="font-orbitron-semibold text-white">
                  {t("Profile.level")}
                  {Math.max(0, level) || "1"}
                </Text>
              </View>
              {/* Planets Discovered */}
              <View
                className="px-4 py-2 rounded-full mt-2"
                style={{
                  backgroundColor: palette.statsAccentSoft,
                  borderWidth: 1,
                  borderColor: palette.statsAccentBorder,
                }}
              >
                <Text className="font-orbitron-semibold text-white">
                  {t("Profile.planets")}
                  {Math.max(0, planets) || "0"}
                </Text>
              </View>
              {/* Averages */}
              <View className="flex-row flex-wrap gap-2 mt-2">
                <View
                  className="px-3 py-2 rounded-full"
                  style={{
                    backgroundColor: palette.statsAccentSoft,
                    borderWidth: 1,
                    borderColor: palette.statsAccentBorder,
                  }}
                >
                  <Text className="font-orbitron-semibold text-white text-xs">
                    {" "}
                    {t("Profile.AvgWorkCycle")}
                    {workTimes.length
                      ? Math.round(
                          workTimes.reduce((a, b) => a + b, 0) /
                            workTimes.length,
                        )
                      : 0}
                    m
                  </Text>
                </View>
                <View
                  className="px-3 py-2 rounded-full"
                  style={{
                    backgroundColor: palette.statsAccentSoft,
                    borderWidth: 1,
                    borderColor: palette.statsAccentBorder,
                  }}
                >
                  <Text className="font-orbitron-semibold text-white text-xs">
                    {t("Profile.AvgPlayCycle")}
                    {playTimes.length
                      ? Math.round(
                          playTimes.reduce((a, b) => a + b, 0) /
                            playTimes.length,
                        )
                      : 0}
                    m
                  </Text>
                </View>
                <View
                  className="px-3 py-2 rounded-full"
                  style={{
                    backgroundColor: palette.statsAccentSoft,
                    borderWidth: 1,
                    borderColor: palette.statsAccentBorder,
                  }}
                >
                  <Text className="font-orbitron-semibold text-white text-xs">
                    {t("Profile.work")}
                    {playTimes.length && workTimes.length
                      ? (
                          workTimes.reduce((a, b) => a + b, 0) /
                          workTimes.length /
                          (playTimes.reduce((a, b) => a + b, 0) /
                            playTimes.length)
                        ).toFixed(2)
                      : 0}
                  </Text>
                </View>
                <View
                  className="px-3 py-2 rounded-full"
                  style={{
                    backgroundColor: palette.statsAccentSoft,
                    borderWidth: 1,
                    borderColor: palette.statsAccentBorder,
                  }}
                >
                  <Text className="font-orbitron-semibold text-white text-xs">
                    {t("Profile.total")}
                    {(() => {
                      const t =
                        workTimes.reduce((a, b) => a + b, 0) +
                        playTimes.reduce((a, b) => a + b, 0);
                      return `${(t / 60).toFixed(1)}h`;
                    })()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Add Child Button - NEW */}
          <View className="items-center mb-4">
            <MainButton
              title={t("Profile.AddChildAccount")}
              variant="primary"
              onPress={() => router.push("/pages/CreateChildAccount")}
              customStyle={{ width: "80%" }}
            />
          </View>

          {/* Switch Profile Button */}
          <View className="items-center mb-4">
            <MainButton
              title={t("Profile.SwitchProfile")}
              variant="secondary"
              onPress={handleSwitchProfile}
              customStyle={{ width: "80%" }}
            />
          </View>

          {/* Logout Button */}
          <View className="items-center mb-8">
            <MainButton
              title={t("Profile.Logout")}
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

      {/* Analytics Charts Modal */}
      <AnalyticsChartsModal
        visible={isAnalyticsModalVisible}
        onClose={() => setIsAnalyticsModalVisible(false)}
        statsLabels={statsLabels}
        statsValues={statsValues}
        workLabels={workLabels}
        workTimes={workTimes}
        playLabels={playLabels}
        playTimes={playTimes}
      />
    </View>
  );
}
