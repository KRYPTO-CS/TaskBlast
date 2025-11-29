import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ImageBackground,
  Animated,
  Image,
  AppState,
  Dimensions,
  Easing,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import MainButton from "../components/MainButton";
import { useAudioPlayer } from "expo-audio";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, updateDoc, increment, getDoc } from "firebase/firestore";

export default function PomodoroScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Extract task parameters from route params
  const taskName = params.taskName as string || "Work Session";
  const workTime = params.workTime ? parseInt(params.workTime as string) : 25;
  const playTime = params.playTime ? parseInt(params.playTime as string) : 5;
  const cycles = params.cycles ? parseInt(params.cycles as string) : 1;
  const taskId = params.taskId as string;
  const allowMinimization = params.allowMinimization === "true" || false;

  // Timer state
  const [timeLeft, setTimeLeft] = useState(workTime * 60); // Convert minutes to seconds
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [hasPlayedGame, setHasPlayedGame] = useState(false);
  const [isTaskCompleted, setIsTaskCompleted] = useState(false);
  const [currentCompletedCycles, setCurrentCompletedCycles] = useState(0);
  const totalTime = workTime * 60; // Total duration in seconds
  const backgroundTime = useRef<number | null>(null);
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      })
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

  // Interpolate translateY from 0 -> windowHeight
  const translateY = scrollAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, windowHeight],
  });

  // Music state
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
      ])
    );
    floatLoop.start();
    return () => floatLoop.stop();
  }, [floatAnim]);

  // Play music on mount
  useEffect(() => {
    try {
      player.play();
    } catch (error) {
      console.warn("Failed to play music:", error);
    }
    return () => {
      // Cleanup is handled by expo-audio automatically
      // Don't manually pause/seek in cleanup to avoid stale reference issues
    };
  }, []);

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
        completedCycles: increment(1)
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
            completed: true
          });
          setIsTaskCompleted(true);
          console.log("Task marked as completed!");
        }
      }
    } catch (err) {
      console.warn("Failed to increment completed cycles:", err);
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
            try {
              player.pause();
            } catch (e) {
              console.warn("Audio player error on timer finish:", e);
            }
            setFinished(true);
            // Increment completed cycles
            incrementCompletedCycles();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused, timeLeft, router]);

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
          const elapsed = Math.floor((Date.now() - backgroundTime.current) / 1000);
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
        if (!isPaused) {
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
      } else {
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

  const handlePlayGame = () => {
    try {
      player.pause();
    } catch (e) {
      console.warn("Audio player error on play game:", e);
    }
    // Mark that we're entering game mode
    setHasPlayedGame(true);
    router.push({
      pathname: "/pages/GamePage",
      params: {
        playTime: playTime.toString(),
        taskId: taskId || "",
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
    try {
      player.play();
    } catch (e) {
      console.warn("Audio player error on resume:", e);
    }
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
              borderColor: "rgba(192, 132, 252, 0.5)",
            }}
          >
            <View
              testID="progress-bar-fill"
              className="h-full rounded-full"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: "#a855f7", // purple-500
              }}
            />
          </View>
        </View>

        {/* Time Left Display */}
        <View className="items-center mt-6">
          <View className="bg-gradient-to-br from-purple-600/80 to-pink-500/80 px-8 py-4 rounded-3xl shadow-lg shadow-purple-500/50 border-2 border-pink-300/30">
            <Text
              testID="timer-display"
              className="font-orbitron-bold text-white text-4xl"
            >
              {formatTime(timeLeft)}
            </Text>
          </View>
          <Text className="font-orbitron text-white/80 text-lg mt-2">
            Time Remaining
          </Text>
          {taskName && (
            <View className="bg-purple-500/20 border-2 border-purple-400/30 px-4 py-2 rounded-xl mt-3">
              <Text className="font-madimi text-white text-base">
                {taskName}
              </Text>
            </View>
          )}
          {taskId && (
            <View className="bg-purple-500/20 border-2 border-purple-400/30 px-4 py-2 rounded-xl mt-2">
              <Text className={`font-orbitron-bold text-base ${
                cycles === -1 ? "text-blue-400" : currentCompletedCycles >= cycles ? "text-green-400" : "text-yellow-400"
              }`}>
                {cycles === -1 ? `${currentCompletedCycles}/∞` : `${currentCompletedCycles}/${cycles}`}
              </Text>
            </View>
          )}
        </View>

        {/* Player Image - Centered */}
        <View className="flex-1 items-center justify-center">
          <TouchableOpacity onPress={handleRocketTap} activeOpacity={1}>
            <Animated.Image
              testID="spaceship-image"
              source={require("../../assets/images/sprites/shipAnimated.gif")}
              className="w-72 h-72"
              resizeMode="contain"
              style={{
                transform: [{ scale: 0.5 }, { translateY: translateFloat }],
              }}
            />
          </TouchableOpacity>
        </View>

        {/* Pause/Land Buttons */}
        <View className="items-center mb-24">
          <View className="flex-col gap-4 w-48">
            {hasPlayedGame ? (
              <MainButton
                title="Resume Task"
                onPress={handleResumeTask}
                variant="info"
                testID="resume-task-button"
                customStyle={{ width: 192 }}
              />
            ) : timeLeft === 0 ? (
              <MainButton
                title="Play Game"
                onPress={handlePlayGame}
                variant="info"
                testID="play-game-button"
                customStyle={{ width: 192 }}
              />
            ) : (
              <MainButton
                title={isPaused ? "Resume" : "Pause"}
                onPress={handlePause}
                variant={isPaused ? "info" : "warning"}
                testID="pause-button"
                customStyle={{ width: 192 }}
              />
            )}
            <MainButton
              title="Land"
              onPress={handleLand}
              variant={isTaskCompleted ? "success" : "error"}
              testID="land-button"
              customStyle={{ width: 192 }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
