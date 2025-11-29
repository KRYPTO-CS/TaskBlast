import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ImageBackground,
  AppState,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { useAudioPlayer } from "expo-audio";
import MainButton from "../components/MainButton";
import TaskListModal from "../components/TaskListModal";
import SettingsModal from "../components/SettingsModal";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [rocks, setRocks] = useState<number>(0);

  const starBackground = require("../../assets/backgrounds/starsAnimated.gif");

  // Background music player
  const musicPlayer = useAudioPlayer(
    require("../../assets/music/homeScreenMusic.mp3")
  );

  const loadScore = useCallback(async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setRocks(0);
        return;
      }

      const db = getFirestore();
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const rocksValue = userData.rocks || 0;
        setRocks(isNaN(rocksValue) ? 0 : Math.max(0, Math.floor(rocksValue)));
      } else {
        setRocks(0);
      }
    } catch (err) {
      console.warn("Failed to load rocks from database", err);
      setRocks(0);
    }
  }, []);

  // Play background music on mount and loop it
  useEffect(() => {
    if (musicPlayer) {
      try {
        musicPlayer.loop = true;
        musicPlayer.play();
      } catch (error) {
        console.warn("Failed to play music on mount:", error);
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
  }, [musicPlayer]);

  useEffect(() => {
    loadScore();

    const handleAppState = (nextState: string) => {
      if (nextState === "active") {
        loadScore();
        if (musicPlayer) {
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
  }, [loadScore, musicPlayer]);

  useFocusEffect(
    useCallback(() => {
      loadScore();
      // Resume music when screen comes into focus
      if (musicPlayer) {
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
    }, [loadScore, musicPlayer])
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
      <View className="flex-1 p-5">
        {/* Top Left Section - Profile & Settings */}
        <View className="absolute top-20 left-5 z-10">
          <TouchableOpacity
            testID="profile-button"
            className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full items-center justify-center mb-3 shadow-lg shadow-purple-500/50"
            onPress={() => router.push("/pages/ProfileScreen")}
          >
            <Ionicons name="person" size={26} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            testID="settings-button"
            className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-full items-center justify-center shadow-lg shadow-blue-500/50"
            onPress={() => setIsSettingsModalVisible(true)}
          >
            <Ionicons name="settings" size={26} color="white" />
          </TouchableOpacity>
        </View>

        {/* Top Row - Fuel Badge & Rocks */}
        <View className="flex-row justify-end items-center gap-4 mt-11">
          {/* Fuel Badge */}
          <View className="flex-row items-center bg-gradient-to-r from-orange-500 to-yellow-400 px-5 py-2.5 rounded-full shadow-lg shadow-orange-400/40 border-2 border-yellow-300/30">
            <Image
              testID="fuel-icon"
              source={require("../../assets/images/sprites/fuel.png")}
              className="w-7 h-7 mr-1"
              resizeMode="contain"
              style={{ transform: [{ scale: 1.4 }], marginBottom: 2 }}
            />
            <Text className="font-orbitron-bold text-white text-md ml-2">
              20/20
            </Text>
          </View>

          {/* Rocks */}
          <View className="flex-row items-center bg-gradient-to-r from-purple-600 to-pink-500 px-5 py-2.5 rounded-full shadow-lg shadow-purple-500/40 border-2 border-pink-300/30">
            <Image
              source={require("../../assets/images/sprites/rocks.png")}
              className="w-7 h-7 mr-1"
              resizeMode="contain"
              style={{ transform: [{ scale: 1.4 }] }}
            />
            <Text className="font-orbitron-bold text-white text-md ml-2">
              {String(rocks).padStart(4, "0")}
            </Text>
          </View>
        </View>

        {/* Task List Button - Aligned Right */}
        <View className="items-end mt-4 pr-0">
          <TouchableOpacity
            testID="task-button"
            className="flex-row  items-center px-6 py-3.5 rounded-2xl shadow-lg"
            onPress={() => setIsTaskModalVisible(true)}
          >
            <Image
              source={require("../../assets/images/sprites/task.png")}
              className="w-7 h-7 mt-2"
              resizeMode="contain"
              style={{ transform: [{ scale: 3.8 }] }}
            />
          </TouchableOpacity>
        </View>

        {/* Center - Planet Image */}
        <View className="flex-1 items-center justify-center">
          <Image
            testID="planet-image"
            source={require("../../assets/images/sprites/planet.png")}
            style={{ width: 128, height: 128 }}
          />
        </View>

        {/* Take Off Button - Bottom Center */}
        <View className="items-center mb-24">
          <MainButton
            title="Take Off"
            onPress={() => router.push("/pages/PomodoroScreen")}
          />
        </View>

        {/* Task List Modal */}
        <TaskListModal
          visible={isTaskModalVisible}
          onClose={() => setIsTaskModalVisible(false)}
          onRocksChange={loadScore}
        />

        {/* Settings Modal */}
        <SettingsModal
          visible={isSettingsModalVisible}
          onClose={() => setIsSettingsModalVisible(false)}
        />
      </View>
    </View>
  );
}
