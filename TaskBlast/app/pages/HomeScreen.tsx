import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  ImageBackground,
  AppState,
  InteractionManager,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { Text } from "../../TTS";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import {
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { useAudioPlayer } from "expo-audio";
import MainButton from "../components/MainButton";
import PlanetScrollList from "../components/PlanetScrollList";
import TaskListModal from "../components/TaskListModal";
import SettingsModal from "../components/SettingsModal";
import ShopModal from "../components/ShopModal";
import { useRouter } from "expo-router";
import { useAudio } from "../context/AudioContext";
import { useTranslation } from "react-i18next";
import PlanetModal from "../components/PlanetModal";
import { useColorPalette } from "../styles/colorBlindThemes";
import {
  CoachmarkAnchor,
  useCoachmark,
  createTour,
} from "@edwardloopez/react-native-coachmark";
import IconCoachmarkTooltip from "../components/IconCoachmarkTooltip";
import Svg, { Circle, G } from "react-native-svg";
import { claimBattlePassReward } from "../services/economyService";
import { useActiveProfile } from "../context/ActiveProfileContext";

export default function HomeScreen() {
  const router = useRouter();
  const palette = useColorPalette();
  const { musicEnabled } = useAudio();
  const {
    activeChildUsername,
    childDocId,
    getProfileDocRef,
    isLoading: isProfileLoading,
  } = useActiveProfile();
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isPlanetModalVisible, setIsPlanetModalVisible] = useState(false);
  const [isShopModalVisible, setIsShopModalVisible] = useState(false);
  const [isLevelModalVisible, setIsLevelModalVisible] = useState(false);
  const [isSelectedPlanetLocked, setIsSelectedPlanetLocked] = useState(false);
  const [rocks, setRocks] = useState<number>(0);
  const [galaxyCrystals, setGalaxyCrystals] = useState<number>(0);
  const [currentExp, setCurrentExp] = useState<number>(0);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [claimedRewardLevels, setClaimedRewardLevels] = useState<number[]>([]);
  const [claimingLevel, setClaimingLevel] = useState<number | null>(null);
  const maxBattlePassLevel = 100;
  const getBattlePassReward = (level: number) =>
    250 + 50 * Math.floor(Math.max(0, level - 1) / 5);
  const neededExp = 30 + 5 * Math.floor(Math.max(0, currentLevel - 1) / 5);
  const clampedCurrentExp = Math.max(0, Math.min(currentExp, neededExp));
  const expProgress = neededExp > 0 ? clampedCurrentExp / neededExp : 0;

  const smallRingSize = 56;
  const smallRingStroke = 4;
  const smallRingRadius = (smallRingSize - smallRingStroke) / 2;
  const smallRingCircumference = 2 * Math.PI * smallRingRadius;
  const smallRingOffset =
    smallRingCircumference * (1 - Math.min(Math.max(expProgress, 0), 1));

  const modalRingSize = 96;
  const modalRingStroke = 6;
  const modalRingRadius = (modalRingSize - modalRingStroke) / 2;
  const modalRingCircumference = 2 * Math.PI * modalRingRadius;
  const modalRingOffset =
    modalRingCircumference * (1 - Math.min(Math.max(expProgress, 0), 1));
  const battlePassLevels = React.useMemo(
    () => Array.from({ length: maxBattlePassLevel }, (_, i) => i + 1),
    [maxBattlePassLevel],
  );
  const { t, i18n } = useTranslation();
  const { start } = useCoachmark();
  const onboardingTour = React.useMemo(
    () =>
      createTour("onboarding", [
        {
          id: "task-button",
          title: t("Home.coachMarktaskstitle"),
          description: t("Home.coachMarktasks"),
          renderTooltip: IconCoachmarkTooltip,
        },
        {
          id: "profile-button",
          title: t("Home.coachMarkProfiletitle"),
          description: t("Home.coachMarkProfile"),
          renderTooltip: IconCoachmarkTooltip,
        },
        {
          id: "settings-button",
          title: t("Settings.title"),
          description: t("Home.coachMarksettings"),
          renderTooltip: IconCoachmarkTooltip,
        },
        {
          id: "takeoff-button",
          title: t("Home.takeoff"),
          description: t("Home.coachMarktakeoff"),
          renderTooltip: IconCoachmarkTooltip,
        },
        {
          id: "shop-section",
          title: t("Shop.title"),
          description: t("Home.coachMarkshop"),
          renderTooltip: IconCoachmarkTooltip,
        },
        {
          id: "level-button",
          title: t("Home.playerLevel"),
          description: t("Home.coachMarklevel"),
          renderTooltip: IconCoachmarkTooltip,
        },
      ]),
    [t],
  );

  const starBackground = require("../../assets/backgrounds/starsAnimated.gif");

  // Background music player
  const musicPlayer = useAudioPlayer(
    require("../../assets/music/homeScreenMusic.mp3"),
  );

  const loadScore = useCallback(async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setRocks(0);
        setGalaxyCrystals(0);
        setCurrentExp(0);
        setCurrentLevel(1);
        return;
      }

      if (isProfileLoading) {
        return;
      }

      let userDoc;

      try {
        userDoc = await getDoc(getProfileDocRef());
      } catch (error) {
        console.warn("Failed to resolve active profile document", error);
        setRocks(0);
        setGalaxyCrystals(0);
        setCurrentExp(0);
        setCurrentLevel(1);
        setClaimedRewardLevels([]);
        return;
      }

      if (userDoc && userDoc.exists()) {
        const userData = userDoc.data();
        const rocksValue = userData.rocks || 0;
        const galaxyCrystalsValue = userData.galaxyCrystals || 0;
        const expValue = userData.currentExp || 0;
        const levelValue = userData.currentLevel || 1;
        setRocks(isNaN(rocksValue) ? 0 : Math.max(0, Math.floor(rocksValue)));
        setGalaxyCrystals(
          isNaN(galaxyCrystalsValue)
            ? 0
            : Math.max(0, Math.floor(galaxyCrystalsValue)),
        );
        setCurrentExp(isNaN(expValue) ? 0 : Math.max(0, Math.floor(expValue)));
        setCurrentLevel(
          isNaN(levelValue) ? 1 : Math.max(1, Math.floor(levelValue)),
        );
        const claimedLevelsRaw = Array.isArray(userData.claimedRewardLevels)
          ? userData.claimedRewardLevels
          : [];
        setClaimedRewardLevels(
          claimedLevelsRaw
            .map((v: unknown) => Number(v))
            .filter((v: number) => Number.isFinite(v) && v >= 1)
            .map((v: number) => Math.floor(v)),
        );
      } else {
        setRocks(0);
        setGalaxyCrystals(0);
        setCurrentExp(0);
        setCurrentLevel(1);
        setClaimedRewardLevels([]);
      }
    } catch (err) {
      console.warn("Failed to load rocks from database", err);
      setRocks(0);
      setGalaxyCrystals(0);
      setCurrentExp(0);
      setCurrentLevel(1);
      setClaimedRewardLevels([]);
    }
  }, [getProfileDocRef, isProfileLoading]);

  const handleClaimBattlePassReward = async (level: number) => {
    if (level < 1 || level > maxBattlePassLevel) return;

    const isGalaxyReward = level % 5 === 0;
    const rewardAmount = getBattlePassReward(level);

    try {
      setClaimingLevel(level);
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const result = await claimBattlePassReward({
        level,
        childDocId,
      });

      if (!result.success) {
        throw new Error(result.message || "FAILED_TO_CLAIM");
      }

      if (result.alreadyClaimed) {
        throw new Error("ALREADY_CLAIMED");
      }

      setClaimedRewardLevels((prev) => {
        if (Array.isArray(result.claimedRewardLevels)) {
          return result.claimedRewardLevels;
        }
        return [...new Set([...prev, level])].sort((a, b) => a - b);
      });

      if (typeof result.newGalaxyCrystals === "number") {
        setGalaxyCrystals(Math.max(0, Math.floor(result.newGalaxyCrystals)));
      } else if (isGalaxyReward) {
        setGalaxyCrystals((prev) => prev + 5);
      }

      if (typeof result.newRocks === "number") {
        setRocks(Math.max(0, Math.floor(result.newRocks)));
      } else if (!isGalaxyReward) {
        setRocks((prev) => prev + rewardAmount);
      }
    } catch (error: any) {
      const errorCode = String(error?.code || "").toLowerCase();
      const errorMessage = String(error?.message || "");

      if (
        errorMessage.includes("LEVEL_NOT_REACHED") ||
        errorCode.includes("failed-precondition")
      ) {
        Alert.alert("Level Rewards", "You need to reach this level first.");
      } else if (errorMessage.includes("ALREADY_CLAIMED")) {
        Alert.alert("Level Rewards", "This reward has already been claimed.");
      } else {
        console.warn("Failed to claim battle pass reward", error);
        Alert.alert(
          "Level Rewards",
          "Failed to claim reward. Please try again.",
        );
      }
    } finally {
      setClaimingLevel(null);
    }
  };

  // Play background music on mount and loop it
  useEffect(() => {
    if (musicPlayer && musicEnabled) {
      try {
        musicPlayer.loop = true;
        musicPlayer.play();
      } catch (error) {
        console.warn("Failed to play music on mount:", error);
      }
    } else if (musicPlayer && !musicEnabled) {
      try {
        musicPlayer.pause();
      } catch (error) {
        console.warn("Failed to pause music:", error);
      }
    }

    return () => {
      if (musicPlayer) {
        try {
          musicPlayer.pause();
        } catch (error) {
          console.warn("Failed to pause music on unmount:", error);
        }
      }
    };
  }, [musicPlayer, musicEnabled]);

  useEffect(() => {
    loadScore();

    const handleAppState = (nextState: string) => {
      if (nextState === "active") {
        loadScore();
        if (musicPlayer && musicEnabled) {
          try {
            musicPlayer.play();
          } catch (error) {
            console.warn("Failed to play music on app active:", error);
          }
        }
      } else {
        if (musicPlayer) {
          try {
            musicPlayer.pause();
          } catch (error) {
            console.warn("Failed to pause music on app inactive:", error);
          }
        }
      }
    };

    let sub: any;
    if (AppState && AppState.addEventListener) {
      sub = AppState.addEventListener("change", handleAppState);
    }

    return () => {
      if (sub && typeof sub.remove === "function") {
        sub.remove();
      }
    };
  }, [loadScore, musicPlayer, musicEnabled]);

  useFocusEffect(
    useCallback(() => {
      loadScore();
      // Resume music when screen comes into focus
      if (musicPlayer && musicEnabled) {
        try {
          musicPlayer.play();
        } catch (error) {
          console.warn("Failed to play music:", error);
        }
      }
      return () => {
        // Pause music when leaving the screen
        if (musicPlayer) {
          try {
            musicPlayer.pause();
          } catch (error) {
            console.warn("Failed to pause music:", error);
          }
        }
      };
    }, [loadScore, musicPlayer, musicEnabled]),
  );

  useFocusEffect(
    useCallback(() => {
      if (
        isTaskModalVisible ||
        isSettingsModalVisible ||
        isShopModalVisible ||
        isPlanetModalVisible
      ) {
        return;
      }

      let cancelled = false;
      const timeout = setTimeout(async () => {
        const alreadySeen = await AsyncStorage.getItem("onboardingSeen");

        if (!alreadySeen && !cancelled) {
          await AsyncStorage.setItem("onboardingSeen", "true");
          start(onboardingTour);
        }
      }, 700);

      return () => {
        cancelled = true;
        clearTimeout(timeout);
      };
    }, [
      isTaskModalVisible,
      isSettingsModalVisible,
      isShopModalVisible,
      isPlanetModalVisible,
      onboardingTour,
      start,
    ]),
  );
  return (
    <View className="flex-1">
      {/* Animated stars background */}
      <ImageBackground
        source={starBackground}
        className="absolute inset-0 w-full h-full"
        resizeMode="cover"
      />
      {/* All UI elements above the background */}
      <View className="flex-1">
        {/* Top Center - Level Button */}

        <View className="absolute top-14 self-center z-10 items-center">
          <CoachmarkAnchor id="level-button">
            <TouchableOpacity
              testID="level-button"
              className="w-14 h-14 rounded-full items-center justify-center"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0)",
                shadowColor: "#f472b6",
                shadowOpacity: 0.55,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 0 },
              }}
              onPress={() => setIsLevelModalVisible(true)}
            >
              <Svg
                width={smallRingSize}
                height={smallRingSize}
                style={{ position: "absolute", top: 0, left: 0 }}
              >
                <G
                  rotation="-90"
                  origin={`${smallRingSize / 2}, ${smallRingSize / 2}`}
                >
                  <Circle
                    cx={smallRingSize / 2}
                    cy={smallRingSize / 2}
                    r={smallRingRadius}
                    stroke="rgba(244, 114, 182, 0.25)"
                    strokeWidth={smallRingStroke}
                    fill="transparent"
                  />
                  <Circle
                    cx={smallRingSize / 2}
                    cy={smallRingSize / 2}
                    r={smallRingRadius}
                    stroke="rgba(74, 222, 128, 0.98)"
                    strokeWidth={smallRingStroke}
                    fill="transparent"
                    strokeLinecap="round"
                    strokeDasharray={`${smallRingCircumference} ${smallRingCircumference}`}
                    strokeDashoffset={smallRingOffset}
                  />
                </G>
              </Svg>
              <Text className="font-orbitron-bold text-pink-200 text-lg">
                {currentLevel}
              </Text>
            </TouchableOpacity>
          </CoachmarkAnchor>
          <Text className="font-orbitron text-pink-100/90 text-xs mt-1">
            {t("Home.level")}
          </Text>
        </View>

        {/* Top Right Section - Profile & Settings above Task Button */}
        <View className="absolute top-14 right-5 z-10 items-center">
          {/* Profile & Settings - Horizontal */}
          <View className="flex-row gap-1">
            <CoachmarkAnchor id="profile-button" shape="circle">
              <TouchableOpacity
                testID="profile-button"
                className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full items-center justify-center shadow-lg shadow-white/40"
                style={{ shadowOffset: { width: 0, height: 0 } }}
                onPress={() => router.push("/pages/ProfileScreen")}
              >
                <Image
                  source={require("../../assets/images/sprites/profile.png")}
                  className="w-7 h-7"
                  resizeMode="contain"
                  style={{ transform: [{ scale: 1.5 }] }}
                />
              </TouchableOpacity>
            </CoachmarkAnchor>
            <CoachmarkAnchor id="settings-button" shape="circle">
              <TouchableOpacity
                testID="settings-button"
                className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-full items-center justify-center shadow-lg shadow-white/40"
                style={{ shadowOffset: { width: 0, height: 0 } }}
                onPress={() => setIsSettingsModalVisible(true)}
              >
                <Image
                  source={require("../../assets/images/sprites/gear.png")}
                  className="w-7 h-7"
                  resizeMode="contain"
                  style={{ transform: [{ scale: 1.5 }] }}
                />
              </TouchableOpacity>
            </CoachmarkAnchor>
          </View>

          {/* Task List Button */}
          <CoachmarkAnchor id="task-button" shape="circle">
            <TouchableOpacity
              testID="task-button"
              onPress={() => setIsTaskModalVisible(true)}
              className="-mt-4"
            >
              <Image
                source={require("../../assets/images/sprites/task.png")}
                resizeMode="contain"
                style={{ transform: [{ scale: 0.75 }] }}
              />
            </TouchableOpacity>
          </CoachmarkAnchor>
        </View>

        {/* Top Left - Crystals & Galaxy Crystals */}

        <View className="justify-start items-start gap-3 mt-11 ml-0">
          <CoachmarkAnchor id="shop-section" shape="circle">
            {/* Crystals */}

            <TouchableOpacity
              className="flex-row items-center bg-gradient-to-r from-pink-600 to-pink-400 px-5 py-2.5 rounded-full shadow-lg shadow-pink-500/70 border-2 border-pink-300/30"
              style={{ shadowOffset: { width: 0, height: 0 }, width: 140 }}
              onPress={() => setIsShopModalVisible(true)}
            >
              <Image
                source={require("../../assets/images/sprites/crystal.png")}
                className="w-7 h-7 mr-1"
                resizeMode="contain"
                style={{ transform: [{ scale: 1.5 }] }}
              />
              <Text className="font-orbitron-bold text-white text-md ml-2">
                {String(rocks).padStart(4, "0")}
              </Text>
            </TouchableOpacity>
          </CoachmarkAnchor>
          {/* Galaxy Crystals */}
          <TouchableOpacity
            className="flex-row items-center bg-gradient-to-r from-indigo-900 to-indigo-700 px-5 py-2.5 rounded-full shadow-lg shadow-indigo-400/70 border-2 border-indigo-600/30"
            style={{ shadowOffset: { width: 0, height: 0 }, width: 140 }}
            onPress={() => setIsShopModalVisible(true)}
          >
            <Image
              testID="fuel-icon"
              source={require("../../assets/images/sprites/galaxyCrystal.png")}
              className="w-7 h-7 mr-1"
              resizeMode="contain"
              style={{ transform: [{ scale: 1.5 }], marginBottom: 2 }}
            />
            <Text className="font-orbitron-bold text-white text-md ml-2">
              {String(galaxyCrystals).padStart(4, "0")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Center - Planet Scroll List Component*/}

        <PlanetScrollList
          onRocksChange={loadScore}
          onActivePlanetChange={(isLocked) =>
            setIsSelectedPlanetLocked(isLocked)
          }
        />

        {/* Take Off Button - Bottom Center */}
        <CoachmarkAnchor id="takeoff-button" shape="circle">
          <View className="items-center mb-24">
            <MainButton
              // send out an alert if the selected planet is locked; this value comes from the PlanetScrollList component via the onActivePlanetChange callback
              // this will help the game crystal boost logic in the future
              title={t("Home.takeoff")}
              onPress={() => {
                if (isSelectedPlanetLocked) {
                  Alert.alert(
                    "Planet Locked",
                    "This planet is locked. Unlock it before taking off!",
                  );
                } else {
                  router.push("/pages/PomodoroScreen");
                }
              }}
            />
          </View>
        </CoachmarkAnchor>

        {/* Task List Modal */}
        <TaskListModal
          visible={isTaskModalVisible}
          onClose={() => setIsTaskModalVisible(false)}
          onRocksChange={loadScore}
          isSelectedPlanetLocked={isSelectedPlanetLocked}
        />

        {/* Planet Modal */}

        <PlanetModal
          visible={isPlanetModalVisible}
          onClose={() => setIsPlanetModalVisible(false)}
          onRocksChange={loadScore}
        />

        {/* Settings Modal */}
        <SettingsModal
          visible={isSettingsModalVisible}
          onClose={() => setIsSettingsModalVisible(false)}
        />

        {/* Shop Modal */}
        <ShopModal
          visible={isShopModalVisible}
          onClose={() => setIsShopModalVisible(false)}
          onRocksChange={loadScore}
        />

        {/* Level Modal (preview only) */}
        <Modal
          visible={isLevelModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsLevelModalVisible(false)}
        >
          <View className="flex-1 bg-black/50 items-center justify-center p-5">
            <View
              className="w-full max-w-md rounded-3xl p-6 border-2 shadow-2xl bg-[#1a1f3a]"
              style={{
                borderColor: palette.modalBorder,
              }}
            >
              <View className="flex-row justify-between items-center mb-4">
                <Text className="font-orbitron-bold text-white text-2xl">
                  {t("Home.playerLevel")}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsLevelModalVisible(false)}
                  className="rounded-full p-2"
                  style={{ backgroundColor: palette.accent }}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <View className="items-center my-5">
                <View
                  className="w-24 h-24 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0)",
                    shadowColor: "#f472b6",
                    shadowOpacity: 0.6,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 0 },
                  }}
                >
                  <Svg
                    width={modalRingSize}
                    height={modalRingSize}
                    style={{ position: "absolute", top: 0, left: 0 }}
                  >
                    <G
                      rotation="-90"
                      origin={`${modalRingSize / 2}, ${modalRingSize / 2}`}
                    >
                      <Circle
                        cx={modalRingSize / 2}
                        cy={modalRingSize / 2}
                        r={modalRingRadius}
                        stroke="rgba(244, 114, 182, 0.25)"
                        strokeWidth={modalRingStroke}
                        fill="transparent"
                      />
                      <Circle
                        cx={modalRingSize / 2}
                        cy={modalRingSize / 2}
                        r={modalRingRadius}
                        stroke="rgba(74, 222, 128, 0.98)"
                        strokeWidth={modalRingStroke}
                        fill="transparent"
                        strokeLinecap="round"
                        strokeDasharray={`${modalRingCircumference} ${modalRingCircumference}`}
                        strokeDashoffset={modalRingOffset}
                      />
                    </G>
                  </Svg>
                  <Text className="font-orbitron-bold text-pink-200 text-3xl">
                    {currentLevel}
                  </Text>
                </View>
              </View>

              <Text className="font-orbitron text-white/80 text-left">
                {t("Home.expLabel")}: {clampedCurrentExp}/{neededExp}
              </Text>

              <Text className="font-orbitron-bold text-white text-lg mt-5 mb-3">
                {t("Home.Level Rewards")}
              </Text>

              <ScrollView
                style={{ maxHeight: 220 }}
                showsVerticalScrollIndicator={false}
              >
                <View className="gap-2">
                  {battlePassLevels.map((level) => {
                    const isClaimed = claimedRewardLevels.includes(level);
                    const isUnlocked = level <= currentLevel;
                    const isClaiming = claimingLevel === level;
                    const isGalaxyReward = level % 5 === 0;
                    const rewardAmount = getBattlePassReward(level);

                    return (
                      <View
                        key={level}
                        className="rounded-xl px-3 py-2 flex-row items-center justify-between"
                        style={{
                          backgroundColor: isUnlocked
                            ? palette.secondarySoft
                            : "rgba(255,255,255,0.04)",
                          borderWidth: 1,
                          borderColor: isUnlocked
                            ? palette.secondarySoftBorder
                            : "rgba(255,255,255,0.12)",
                        }}
                      >
                        <View className="flex-row items-center">
                          <Text className="font-orbitron-bold text-white mr-2">
                            {t("Home.levelShort")} {level}
                          </Text>
                          <View className="flex-row items-center">
                            <Text className="font-orbitron text-white/80 text-xs mr-1">
                              {isGalaxyReward ? 5 : rewardAmount}
                            </Text>
                            <Image
                              source={
                                isGalaxyReward
                                  ? require("../../assets/images/sprites/galaxyCrystal.png")
                                  : require("../../assets/images/sprites/crystal.png")
                              }
                              style={{ width: 14, height: 14 }}
                              resizeMode="contain"
                            />
                          </View>
                        </View>

                        {isClaimed ? (
                          <View
                            className="px-3 py-1 rounded-full"
                            style={{ backgroundColor: "rgba(34,197,94,0.25)" }}
                          >
                            <Text className="font-orbitron-bold text-green-300 text-xs">
                              {t("Home.Claimed")}
                            </Text>
                          </View>
                        ) : isUnlocked ? (
                          <TouchableOpacity
                            onPress={() => handleClaimBattlePassReward(level)}
                            disabled={isClaiming}
                            className="px-3 py-1 rounded-full"
                            style={{
                              backgroundColor: palette.accent,
                              opacity: isClaiming ? 0.6 : 1,
                            }}
                          >
                            <Text className="font-orbitron-bold text-white text-xs">
                              {isClaiming ? t("Home.Claiming") : t("Home.Claim")}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <View
                            className="px-3 py-1 rounded-full"
                            style={{
                              backgroundColor: "rgba(148,163,184,0.22)",
                            }}
                          >
                            <Text className="font-orbitron-bold text-slate-300 text-xs">
                              {t("Home.Locked")}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}
