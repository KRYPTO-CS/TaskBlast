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
        {/* Top Right Section - Task Button with Profile & Settings below */}
        <View className="absolute top-14 right-5 z-10 items-center">
          {/* Task List Button */}
          <TouchableOpacity
            testID="task-button"
            onPress={() => setIsTaskModalVisible(true)}
          >
            <Image
              source={require("../../assets/images/sprites/task.png")}
              resizeMode="contain"
              style={{ transform: [{ scale: 0.75 }] }}
            />
          </TouchableOpacity>
          
          {/* Profile & Settings - Horizontal */}
          <View className="flex-row gap-1 -mt-4">
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
          </View>
        </View>

        {/* Top Left - Crystals & Galaxy Crystals */}
        <View className="justify-start items-start gap-3 mt-11">
          {/* Crystals */}
          <View className="flex-row items-center bg-gradient-to-r from-pink-600 to-pink-400 px-5 py-2.5 rounded-full shadow-lg shadow-pink-500/70 border-2 border-pink-300/30" style={{ shadowOffset: { width: 0, height: 0 } }}>
            <Image
              source={require("../../assets/images/sprites/crystal.png")}
              className="w-7 h-7 mr-1"
              resizeMode="contain"
              style={{ transform: [{ scale: 1.5 }] }}
            />
            <Text className="font-orbitron-bold text-white text-md ml-2">
              {String(rocks).padStart(4, "0")}
            </Text>
          </View>

          {/* Galaxy Crystals */}
          <View className="flex-row items-center bg-gradient-to-r from-indigo-900 to-indigo-700 px-5 py-2.5 rounded-full shadow-lg shadow-indigo-400/70 border-2 border-indigo-600/30" style={{ shadowOffset: { width: 0, height: 0 } }}>
            <Image
              testID="fuel-icon"
              source={require("../../assets/images/sprites/galaxyCrystal.png")}
              className="w-7 h-7 mr-1"
              resizeMode="contain"
              style={{ transform: [{ scale: 1.5 }], marginBottom: 2 }}
            />
            <Text className="font-orbitron-bold text-white text-md ml-2">
              0000
            </Text>
          </View>
        </View>



        {/* Center - Planet Image */}
        <View className="flex-1 items-center justify-center">
          <Image
            testID="planet-image"
            source={require("../../assets/images/sprites/earthspin.gif")}
            style={{ width: 132, height: 132 }}
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
