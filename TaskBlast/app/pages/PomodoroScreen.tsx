import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  ImageBackground,
  Animated,
  Image,
  AppState,
  Dimensions,
  Easing,
  TouchableOpacity,
} from "react-native";
import { Text } from "../../TTS";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import MainButton from "../components/MainButton";
import GameSelectionModal from "../components/GameSelectionModal";
import { useAudioPlayer } from "expo-audio";
// Audio context provider is set at app level; useAudio hook here
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  doc,
  updateDoc,
  increment,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudio } from "../context/AudioContext";
import { useTranslation } from "react-i18next";
import { useNotifications } from "../context/NotificationContext";
import { useColorPalette } from "../styles/colorBlindThemes";
import {
  CoachmarkAnchor,
  useCoachmark,
  createTour,
} from "@edwardloopez/react-native-coachmark";
import { getGameDefinition } from "../services/gameRegistry";
// Ship component image mappings
const BODY_IMAGES: { [key: number]: any } = {
  0: require("../../assets/images/ship_components/body/0.png"),
  1: require("../../assets/images/ship_components/body/1.png"),
  2: require("../../assets/images/ship_components/body/2.png"),
  3: require("../../assets/images/ship_components/body/3.png"),
};

const WING_IMAGES: { [key: number]: any } = {
  0: require("../../assets/images/ship_components/wing/0.png"),
  1: require("../../assets/images/ship_components/wing/1.png"),
  2: require("../../assets/images/ship_components/wing/2.png"),
  3: require("../../assets/images/ship_components/wing/3.png"),
};

export default function PomodoroScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { notifyTimerComplete } = useNotifications();
  const palette = useColorPalette();

  const getSingleParam = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const { t, i18n } = useTranslation();
  // Extract task parameters from route params
  const taskName = getSingleParam(params.taskName) || t("Pomodoro.worksession");
  const workTime = Number.parseInt(getSingleParam(params.workTime) || "25", 10);
  const playTime = Number.parseInt(getSingleParam(params.playTime) || "5", 10);
  const cycles = Number.parseInt(getSingleParam(params.cycles) || "1", 10);
  const taskId = getSingleParam(params.taskId) || "";
  const allowMinimization = params.allowMinimization === "true" || false;
  const { start } = useCoachmark();
  //const { t, i18n } = useTranslation();
  const onboardingTour = React.useMemo(
    () =>
      createTour("onboarding", [
        {
          id: "time-section",
          title: t("Pomodoro.time"),
          description: t("Pomodoro.coachMarkTime"),
        },
        {
          id: "pause-button",
          title: t("Pomodoro.Pause"),
          description: t("Pomodoro.coachMarkPause"),
        },
        {
          id: "land-button",
          title: t("Pomodoro.Land"),
          description: t("Pomodoro.coachMarkLand"),
        },
      ]),
    [t],
  );

  // Timer state
  const [timeLeft, setTimeLeft] = useState(workTime * 60); // Convert minutes to seconds
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [hasPlayedGame, setHasPlayedGame] = useState(false);
  const [isTaskCompleted, setIsTaskCompleted] = useState(false);
  const [currentCompletedCycles, setCurrentCompletedCycles] = useState(0);
  const [equipped, setEquipped] = useState<number[]>([0, 1]);
  const [showGameSelection, setShowGameSelection] = useState(false);
  const [inFreeTimeMode, setInFreeTimeMode] = useState(false);
  const totalTime = workTime * 60; // Total duration in seconds
  const backgroundTime = useRef<number | null>(null);
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRecordedRef = useRef(false);

  const starBackground = require("../../assets/backgrounds/starsAnimated.gif");

  // Scrolling background animation
  const windowHeight = Dimensions.get("window").height;
  const scrollAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // duration controls scroll speed (ms). Increase for slower scroll.
    const duration = 20000;
    const loop = Animated.loop(
      Animated.timing(scrollAnim, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [scrollAnim]);

  // Check if task is already completed on mount
  useEffect(() => {
    const checkTaskCompletion = async () => {
      if (!taskId) return;

      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const db = getFirestore();
        const taskRef = doc(db, "users", user.uid, "tasks", taskId);
        const taskDoc = await getDoc(taskRef);

        if (taskDoc.exists()) {
          const taskData = taskDoc.data();
          setIsTaskCompleted(taskData.completed || false);
          setCurrentCompletedCycles(taskData.completedCycles || 0);
        }
      } catch (err) {
        console.warn("Failed to check task completion:", err);
      }
    };

    checkTaskCompletion();
  }, [taskId]);

  // Load equipped items from Firebase
  useEffect(() => {
    const loadEquippedItems = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const db = getFirestore();
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.equipped && Array.isArray(userData.equipped)) {
            setEquipped(userData.equipped);
          }
        }
      } catch (err) {
        console.warn("Failed to load equipped items:", err);
      }
    };

    loadEquippedItems();
  }, []);

  // Interpolate translateY from 0 -> windowHeight
  const translateY = scrollAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, windowHeight],
  });

  // Music state via global settings
  const { musicEnabled } = useAudio();
  const player = useAudioPlayer(require("../../assets/music/pomodoroLoop.mp3"));

  // Player floating animation
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Interpolated float value for smooth oscillation between -15 and 15
  const translateFloat = floatAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [-15, 0, 15],
  });

  // Player floating animation effect
  useEffect(() => {
    const duration = 2000; // half-cycle duration
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    floatLoop.start();
    return () => floatLoop.stop();
  }, [floatAnim]);

  // Apply music preference
  useEffect(() => {
    if (!player) return;
    try {
      if (musicEnabled && !isPaused) {
        player.play();
      } else {
        player.pause();
      }
    } catch (error) {
      console.warn("Failed to apply pomodoro music state:", error);
    }
  }, [player, musicEnabled, isPaused]);

  // Function to increment completedCycles in database
  const incrementCompletedCycles = async () => {
    if (!taskId) return;

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirestore();
      const taskRef = doc(db, "users", user.uid, "tasks", taskId);

      await updateDoc(taskRef, {
        completedCycles: increment(1),
      });

      console.log("Incremented completed cycles for task");

      // Check if all cycles are now completed (but not for infinite cycles)
      const taskDoc = await getDoc(taskRef);
      if (taskDoc.exists()) {
        const taskData = taskDoc.data();
        const completedCycles = taskData.completedCycles || 0;
        const totalCycles = taskData.cycles || 1;

        setCurrentCompletedCycles(completedCycles);

        // Only auto-complete if cycles is not infinite (-1) and cycles are met
        if (totalCycles !== -1 && completedCycles >= totalCycles) {
          // Mark task as completed
          await updateDoc(taskRef, {
            completed: true,
          });
          setIsTaskCompleted(true);
          console.log("Task marked as completed!");
        }
      }
    } catch (err) {
      console.warn("Failed to increment completed cycles:", err);
    }
  };

  // Record completed work session minutes to user profile for stats
  const recordWorkSession = async (minutes: number) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirestore();
      const value = Math.max(0, Math.floor(minutes));
      const getNeededExpForLevel = (level: number) =>
        30 + 5 * Math.floor(Math.max(0, level - 1) / 5);

      const activeChild = await AsyncStorage.getItem("activeChildProfile");

      let profileRef;
      if (activeChild) {
        const childrenRef = collection(db, "users", user.uid, "children");
        const childQuery = query(
          childrenRef,
          where("username", "==", activeChild),
        );
        const childSnapshot = await getDocs(childQuery);

        if (!childSnapshot.empty) {
          profileRef = childSnapshot.docs[0].ref;
        } else {
          console.warn("Child profile not found for EXP update, using parent");
          profileRef = doc(db, "users", user.uid);
        }
      } else {
        profileRef = doc(db, "users", user.uid);
      }

      await runTransaction(db, async (tx) => {
        const snap = await tx.get(profileRef);
        const data = snap.exists() ? snap.data() : ({} as any);

        const currentArr = Array.isArray(data.workTimeMinutesArr)
          ? [...data.workTimeMinutesArr]
          : [];
        currentArr.push(value);

        const prevExp = Number.isFinite(Number(data.currentExp))
          ? Math.max(0, Math.floor(Number(data.currentExp)))
          : 0;
        const prevLevel = Number.isFinite(Number(data.currentLevel))
          ? Math.max(1, Math.floor(Number(data.currentLevel)))
          : 1;

        // Normalize existing data if stored EXP already exceeds current threshold.
        let workingLevel = prevLevel;
        let workingExp = prevExp;
        while (workingExp >= getNeededExpForLevel(workingLevel)) {
          workingExp -= getNeededExpForLevel(workingLevel);
          workingLevel += 1;
        }

        // Apply gained EXP with dynamic thresholds that scale every 5 levels.
        let remainingExpGain = value;
        while (remainingExpGain > 0) {
          const neededThisLevel = getNeededExpForLevel(workingLevel);
          const expToNextLevel = neededThisLevel - workingExp;

          if (remainingExpGain >= expToNextLevel) {
            remainingExpGain -= expToNextLevel;
            workingLevel += 1;
            workingExp = 0;
          } else {
            workingExp += remainingExpGain;
            remainingExpGain = 0;
          }
        }

        const newExp = workingExp;
        const newLevel = workingLevel;

        tx.set(
          profileRef,
          {
            workTimeMinutesArr: currentArr,
            currentExp: newExp,
            currentLevel: newLevel,
          },
          { merge: true },
        );
      });

      console.log(`Recorded work session: ${minutes} minutes`);
    } catch (err) {
      console.warn("Failed to record work session", err);
    }
  };

  // Timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer finished
            setIsRunning(false);
            console.log("Timer finished");
            try {
              player.pause();
            } catch (e) {
              console.warn("Audio player error on timer finish:", e);
            }

            // Handle free time mode completion
            if (inFreeTimeMode) {
              setInFreeTimeMode(false);
              notifyTimerComplete("Free Time", false).catch((err) =>
                console.warn("Notification error:", err),
              );
              setFinished(true);
              return 0;
            }

            setFinished(true);

            // restore original flow
            if (!hasRecordedRef.current) {
              // Increment completed cycles
              incrementCompletedCycles();

              // Record this work session (in minutes)
              recordWorkSession(workTime);
              hasRecordedRef.current = true;
            }

            // Show completion notification
            notifyTimerComplete(taskName, false).catch((err) =>
              console.warn("Notification error:", err),
            );

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused, timeLeft, router, inFreeTimeMode]);

  // Handle app state changes (pause when app goes to background)
  useEffect(() => {
    const handleAppState = (nextState: string) => {
      if (nextState === "background" || nextState === "inactive") {
        // Pause music when backgrounded
        try {
          player.pause();
        } catch (e) {
          console.warn("Audio player pause error:", e);
        }
        // Record the time when going to background if minimization is allowed and timer is running
        if (allowMinimization && !isPaused) {
          backgroundTime.current = Date.now();
        } else if (!allowMinimization) {
          // Only pause timer if minimization is not allowed
          setIsPaused(true);
        }
      } else if (nextState === "active") {
        // Calculate elapsed time if timer was running in background
        if (allowMinimization && backgroundTime.current !== null && !isPaused) {
          const elapsed = Math.floor(
            (Date.now() - backgroundTime.current) / 1000,
          );
          setTimeLeft((prev) => {
            const newTime = prev - elapsed;
            if (newTime <= 0) {
              setIsRunning(false);
              setFinished(true);
              return 0;
            }
            return newTime;
          });
          backgroundTime.current = null;
        }
        // Resume music when app becomes active, but only if timer is not paused
        if (!isPaused && musicEnabled) {
          try {
            player.play();
          } catch (e) {
            console.warn("Audio player play error:", e);
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
  }, [allowMinimization, isPaused, player]);

  // Toggle pause
  const handlePause = async () => {
    setIsPaused(!isPaused);
    try {
      if (!isPaused) {
        player.pause();
      } else if (musicEnabled) {
        player.play();
      }
    } catch (e) {
      console.warn("Audio player pause/play error:", e);
    }
  };

  const handleLand = async () => {
    // Land - go back to home
    try {
      player.pause();
    } catch (e) {
      console.warn("Audio player error on land:", e);
    }
    router.back();
  };

  const handlePlayGame = (gameId: number) => {
    try {
      player.pause();
    } catch (e) {
      console.warn("Audio player error on play game:", e);
    }

    const selectedGame = getGameDefinition(gameId);

    // Handle Free Time mode
    if (selectedGame.isFreeTime) {
      setShowGameSelection(false);
      setInFreeTimeMode(true);
      setHasPlayedGame(true);
      setTimeLeft(playTime * 60); // Set timer to free time duration
      setIsRunning(true);
      setIsPaused(false);
      return;
    }

    // Mark that we're entering game mode
    setHasPlayedGame(true);
    router.push({
      pathname: "/pages/GamePage",
      params: {
        playTime: playTime.toString(),
        taskId: taskId || "",
        gameId: gameId.toString(),
      },
    });
  };

  const handleResumeTask = () => {
    // Reset timer to work time and restart
    setTimeLeft(workTime * 60);
    setIsRunning(true);
    setIsPaused(false);
    setFinished(false);
    setHasPlayedGame(false);
    hasRecordedRef.current = false;
    try {
      if (musicEnabled) player.play();
    } catch (e) {
      console.warn("Audio player error on resume:", e);
    }
  };

  const handleStartTask = () => {
    // Exit free time and start the next task
    setInFreeTimeMode(false);
    handleResumeTask();
  };

  const handleRocketTap = () => {
    tapCount.current += 1;

    // Clear existing timer
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
    }

    // Check if triple tap achieved
    if (tapCount.current === 3) {
      // Admin bypass: set timer to 3 seconds
      setTimeLeft(3);
      tapCount.current = 0;
    } else {
      // Reset tap count after 500ms if not triple tapped
      tapTimer.current = setTimeout(() => {
        tapCount.current = 0;
      }, 500);
    }
  };

  // Calculate progress percentage (starts at 100% and decreases to 0%)
  const progressPercentage = (timeLeft / totalTime) * 100;

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const timeout = setTimeout(async () => {
        const alreadySeen = await AsyncStorage.getItem(
          "pomodoroOnboardingSeen",
        );

        if (!alreadySeen && !cancelled) {
          await AsyncStorage.setItem("pomodoroOnboardingSeen", "true");
          start(onboardingTour);
        }
      }, 700);

      return () => {
        cancelled = true;
        clearTimeout(timeout);
      };
    }, [onboardingTour]),
  );

  return (
    <View className="flex-1" style={{ backgroundColor: "#0d1b2a" }}>
      {/* Animated stars background - two stacked images that translate down and loop */}
      <View
        className="absolute inset-0 w-full h-full"
        style={{ overflow: "hidden" }}
      >
        <Animated.View
          testID="star-background"
          style={{
            transform: [{ translateY }],
            width: "100%",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          <Image
            source={starBackground}
            style={{
              width: "100%",
              height: windowHeight,
              position: "absolute",
              top: -windowHeight,
            }}
            resizeMode="cover"
          />
          <Image
            source={starBackground}
            style={{
              width: "100%",
              height: windowHeight,
              position: "absolute",
              top: 0,
            }}
            resizeMode="cover"
          />
        </Animated.View>
      </View>

      {/* Content */}
      <View className="flex-1 p-5 pt-20">
        {/* Progress Bar - Top Center */}
        <View className="items-center mt-8">
          <View
            testID="progress-bar-container"
            className="w-11/12 h-8 rounded-full border-2 overflow-hidden"
            style={{
              backgroundColor: "rgba(31, 41, 55, 0.7)",
              borderColor: palette.accentSoftBorder,
            }}
          >
            <View
              testID="progress-bar-fill"
              className="h-full rounded-full"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: palette.accent,
              }}
            />
          </View>
        </View>

        {/* Time Left Display */}
        <View className="items-center mt-6">
          <View className="bg-gradient-to-br from-purple-600/80 to-pink-500/80 px-8 py-4 rounded-3xl shadow-lg shadow-purple-500/50 border-2 border-pink-300/30">
            <CoachmarkAnchor id="time-section" shape="circle">
              <Text
                testID="timer-display"
                className="font-orbitron-bold text-white text-4xl"
              >
                {formatTime(timeLeft)}
              </Text>
            </CoachmarkAnchor>
          </View>
          <Text className="font-orbitron text-white/80 text-lg mt-2">
            {t("Pomodoro.time")}
          </Text>
          {(inFreeTimeMode || taskName) && (
            <View
              className="px-4 py-2 rounded-xl mt-3"
              style={{
                backgroundColor: inFreeTimeMode
                  ? "rgba(34, 197, 94, 0.3)"
                  : palette.accentSoft,
                borderWidth: 2,
                borderColor: inFreeTimeMode
                  ? "rgba(34, 197, 94, 0.5)"
                  : palette.accentSoftBorder,
              }}
            >
              <Text className="font-madimi text-white text-base">
                {inFreeTimeMode ? t("Pomodoro.freeTime") : taskName}
              </Text>
            </View>
          )}
          {taskId && (
            <View
              className="px-4 py-2 rounded-xl mt-2"
              style={{
                backgroundColor: palette.accentSoft,
                borderWidth: 2,
                borderColor: palette.accentSoftBorder,
              }}
            >
              <Text
                className={`font-orbitron-bold text-base ${
                  cycles === -1
                    ? "text-blue-400"
                    : currentCompletedCycles >= cycles
                      ? "text-green-400"
                      : "text-yellow-400"
                }`}
              >
                {cycles === -1
                  ? `${currentCompletedCycles}/∞`
                  : `${currentCompletedCycles}/${cycles}`}
              </Text>
            </View>
          )}
        </View>

        {/* Player Image - Centered */}
        <View className="flex-1 items-center justify-center">
          <TouchableOpacity onPress={handleRocketTap} activeOpacity={1}>
            <Animated.View
              testID="spaceship-image"
              className="w-72 h-72"
              style={{
                transform: [{ scale: 0.5 }, { translateY: translateFloat }],
              }}
            >
              <Image
                source={WING_IMAGES[equipped[1]] || WING_IMAGES[0]}
                className="w-72 h-72 absolute"
                resizeMode="contain"
              />
              <Image
                source={BODY_IMAGES[equipped[0]] || BODY_IMAGES[0]}
                className="w-72 h-72 absolute"
                resizeMode="contain"
              />
              <Image
                source={require("../../assets/images/ship_components/shipDetails.gif")}
                className="w-72 h-72 absolute"
                resizeMode="contain"
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Pause/Land Buttons */}
        <View className="items-center mb-24">
          <View className="flex-col gap-4 w-48">
            <CoachmarkAnchor id="pause-button" shape="circle">
              {inFreeTimeMode ? (
                <MainButton
                  title={t("Pomodoro.startTask")}
                  onPress={handleStartTask}
                  variant="warning"
                  testID="start-task-button"
                  customStyle={{ width: 192 }}
                />
              ) : hasPlayedGame ? (
                <MainButton
                  title={t("Pomodoro.Resume")}
                  onPress={handleResumeTask}
                  variant="info"
                  testID="resume-task-button"
                  customStyle={{ width: 192 }}
                />
              ) : timeLeft === 0 ? (
                <MainButton
                  title={t("Pomodoro.Play")}
                  onPress={() => setShowGameSelection(true)}
                  variant="info"
                  testID="play-game-button"
                  customStyle={{ width: 192 }}
                />
              ) : (
                <MainButton
                  title={isPaused ? t("Pomodoro.Resume") : t("Pomodoro.Pause")}
                  onPress={handlePause}
                  variant={isPaused ? "info" : "warning"}
                  testID="pause-button"
                  customStyle={{ width: 192 }}
                />
              )}
            </CoachmarkAnchor>
            <CoachmarkAnchor id="land-button" shape="circle">
              <MainButton
                title={t("Pomodoro.Land")}
                onPress={handleLand}
                variant={isTaskCompleted ? "success" : "error"}
                testID="land-button"
                customStyle={{ width: 192 }}
              />
            </CoachmarkAnchor>
          </View>
        </View>
      </View>

      {/* Game Selection Modal */}
      <GameSelectionModal
        visible={showGameSelection}
        onClose={() => setShowGameSelection(false)}
        onSelectGame={handlePlayGame}
      />
    </View>
  );
}
