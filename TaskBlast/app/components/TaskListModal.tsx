import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { Text } from "../../TTS";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { useNotifications } from "../context/NotificationContext";
import { useTranslation } from "react-i18next";
import { useColorPalette } from "../styles/colorBlindThemes";
import {
  CoachmarkAnchor,
  useCoachmark,
  createTour,
} from "@edwardloopez/react-native-coachmark";
import IconCoachmarkTooltip from "./IconCoachmarkTooltip";
import { claimTaskReward } from "../services/economyService";
import { useActiveProfile } from "../context/ActiveProfileContext";

interface Task {
  id: string;
  name: string;
  description: string;
  reward: number;
  completed: boolean;
  allowMinimization: boolean;
  workTime: number;
  playTime: number;
  cycles: number;
  completedCycles: number;
  archived: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const toSafeInt = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
};

const getPlanetTaskMultiplier = (planetId: number) => {
  const safePlanetId = Math.max(
    1,
    Math.min(9, Math.floor(Number(planetId) || 1)),
  );
  const multiplierByPlanet: Record<number, number> = {
    1: 1.0,
    2: 1.1,
    3: 1.2,
    4: 1.4,
    5: 1.6,
    6: 1.8,
    7: 2.0,
    8: 2.5,
    9: 3.0,
  };

  return multiplierByPlanet[safePlanetId] ?? 1.0;
};

interface TaskListModalProps {
  visible: boolean;
  onClose: () => void;
  onRocksChange?: () => void;
  isSelectedPlanetLocked?: boolean;
}

export default function TaskListModal({
  visible,
  onClose,
  onRocksChange,
  isSelectedPlanetLocked = false,
}: TaskListModalProps) {
  const router = useRouter();
  const { scheduleDailyDigest, preferences } = useNotifications();
  const palette = useColorPalette();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountType, setAccountType] = useState<string>("");
  const [managerialPin, setManagerialPin] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showUnarchivePinModal, setShowUnarchivePinModal] = useState(false);
  const [pendingUnarchiveTaskId, setPendingUnarchiveTaskId] = useState<
    string | null
  >(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const pinRefs = useRef<Array<TextInput | null>>([null, null, null, null]);
  const auth = getAuth();
  const { t, i18n } = useTranslation();
  const { start } = useCoachmark();
  const {
    activeChildUsername,
    childDocId,
    getParentDocRef,
    getProfileCollectionRef,
    getProfileDocRef,
    isLoading: isProfileLoading,
  } = useActiveProfile();

  const onboardingTour = createTour(
    "onboarding",
    [
      {
        id: "task-button",
        title: t("Tasks.title"),
        description: t("Tasks.coachMarkdesc"),
        renderTooltip: IconCoachmarkTooltip,
      },
    ],
  );

  // Helper to get the correct tasks collection reference
  const getTasksCollectionRef = () => {
    return getProfileCollectionRef("tasks");
  };

  // Helper to get task document reference
  const getTaskDocRef = (taskId: string) => {
    return getProfileDocRef("tasks", taskId);
  };

  // Reset to normal mode when modal becomes visible
  useEffect(() => {
    if (visible) {
      setIsEditMode(false);
      setIsArchiveMode(false);
      setIsAddingTask(false);
      setEditingTaskId(null);
    }
  }, [visible]);

  // Load parent account metadata used for managed-account protections
  useEffect(() => {
    const loadProfileMetadata = async () => {
      if (!auth.currentUser) {
        setError("Please log in to view tasks");
        setLoading(false);
        return;
      }

      try {
        if (isProfileLoading) {
          return;
        }

        const userDoc = await getDoc(getParentDocRef());
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setAccountType(userData.accountType || "");
          setManagerialPin(userData.managerialPin || null);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        setError("Failed to load profile");
        setLoading(false);
      }
    };

    loadProfileMetadata();
  }, [auth.currentUser, getParentDocRef, isProfileLoading]);

  // Separate useEffect for tasks listener (runs after childDocId is set)
  useEffect(() => {
    if (!auth.currentUser) return;
    if (isProfileLoading) {
      return;
    }

    try {
      const tasksRef = getTasksCollectionRef();
      const unsubscribe = onSnapshot(
        tasksRef,
        (snapshot: any) => {
          const taskList: Task[] = [];
          snapshot.forEach((doc: any) => {
            const data = doc.data();
            taskList.push({
              id: doc.id,
              name: data.name,
              description: data.description || "",
              reward: data.reward,
              completed: data.completed,
              allowMinimization: data.allowMinimization || false,
              workTime: data.workTime || 25,
              playTime: data.playTime || 5,
              cycles: data.cycles || 1,
              completedCycles: data.completedCycles || 0,
              archived: data.archived || false,
              createdAt: data.createdAt || Timestamp.now(),
              updatedAt: data.updatedAt || Timestamp.now(),
            });
          });
          const filteredTasks = taskList;
          filteredTasks.sort(
            (a, b) => b.createdAt.seconds - a.createdAt.seconds,
          );
          setTasks(filteredTasks);
          setLoading(false);
          setError(null);
        },
        (error: Error) => {
          console.error("Error fetching tasks:", error);
          setError("Failed to load tasks");
          setLoading(false);
        },
      );
      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up task listener:", error);
      setError("Failed to initialize task system");
      setLoading(false);
    }
  }, [auth.currentUser, childDocId, activeChildUsername, getProfileCollectionRef, isProfileLoading]);

  // Schedule daily digest when tasks or preferences change
  useEffect(() => {
    if (!loading && preferences.dailyDigestEnabled) {
      // Count incomplete, non-archived tasks
      const incompleteTaskCount = tasks.filter(
        (task) => !task.completed && !task.archived,
      ).length;

      // Schedule daily digest with current task count
      scheduleDailyDigest(incompleteTaskCount);
    }
  }, [
    tasks,
    preferences.dailyDigestEnabled,
    preferences.dailyDigestTime,
    loading,
  ]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isArchiveMode, setIsArchiveMode] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskReward, setNewTaskReward] = useState("");
  const [newTaskAllowMinimization, setNewTaskAllowMinimization] =
    useState(false);
  const [newTaskWorkTime, setNewTaskWorkTime] = useState(25);
  const [newTaskPlayTime, setNewTaskPlayTime] = useState(5);
  const [newTaskCycles, setNewTaskCycles] = useState(1);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showTaskFormModal, setShowTaskFormModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const taskTapCount = useRef<{ [key: string]: number }>({});
  const taskTapTimer = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>(
    {},
  );

  // Filter tasks based on current mode
  const displayedTasks = isArchiveMode
    ? tasks.filter((task) => task.archived)
    : tasks.filter((task) => !task.archived);

  const handleCompleteTask = async (taskId: string) => {
    if (!auth.currentUser) return;
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        const cyclesValue = toSafeInt(task.cycles, 1);
        const completedCyclesValue = toSafeInt(task.completedCycles, 0);
        // Prevent marking as complete if cycles aren't fulfilled (only in normal mode)
        // Allow completion if cycles are infinite (-1) or cycles are met
        if (
          !isEditMode &&
          !task.completed &&
          cyclesValue !== -1 &&
          completedCyclesValue < cyclesValue
        ) {
          return;
        }

        const taskRef = getTaskDocRef(taskId);
        await updateDoc(taskRef, {
          completed: !task.completed,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error updating task:", error);
      Alert.alert("Error", "Failed to update task");
    }
  };

  const handleArchiveTask = async (taskId: string) => {
    if (!auth.currentUser) return;
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      //database for correct account type
      const profileRef = getProfileDocRef();
      const profileSnap = await getDoc(profileRef);
      const unlockedPlanet = profileSnap.exists()
        ? toSafeInt(profileSnap.data()?.currPlanet, 1)
        : 1;
      const multiplier = getPlanetTaskMultiplier(unlockedPlanet);
      const baseReward = Math.max(0, toSafeInt(task.reward, 0));
      const scaledReward = Math.max(
        0,
        Math.min(5000, Math.floor(baseReward * multiplier)),
      );

      await claimTaskReward({
        taskId,
        reward: scaledReward,
        childDocId,
      });

      // Notify parent component to update rocks display
      if (onRocksChange) {
        onRocksChange();
      }
    } catch (error) {
      console.error("Error archiving task:", error);
      Alert.alert("Error", "Failed to archive task");
    }
  };

  const handleUnarchiveTask = async (taskId: string) => {
    if (!auth.currentUser) return;
    try {
      const taskRef = getTaskDocRef(taskId);
      await updateDoc(taskRef, {
        archived: false,
        completed: false,
        completedCycles: 0,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error unarchiving task:", error);
      Alert.alert("Error", "Failed to unarchive task");
    }
  };

  const handleUnarchivePress = (taskId: string) => {
    if (accountType === "managed") {
      setPendingUnarchiveTaskId(taskId);
      setShowUnarchivePinModal(true);
      setPinInput("");
      setPinError("");
    } else {
      handleUnarchiveTask(taskId);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!auth.currentUser) return;
    try {
      const taskRef = getTaskDocRef(taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error("Error deleting task:", error);
      Alert.alert("Error", "Failed to delete task");
    }
  };

  const handleAddTask = async () => {
    if (!auth.currentUser) return;
    if (newTaskName.trim() && newTaskReward.trim()) {
      try {
        const tasksRef = getTasksCollectionRef();
        await addDoc(tasksRef, {
          name: newTaskName,
          description: newTaskDescription,
          reward: parseInt(newTaskReward) || 0,
          completed: false,
          allowMinimization: newTaskAllowMinimization,
          workTime: newTaskWorkTime,
          playTime: newTaskPlayTime,
          cycles: newTaskCycles,
          completedCycles: 0,
          archived: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setNewTaskName("");
        setNewTaskDescription("");
        setNewTaskReward("");
        setNewTaskAllowMinimization(false);
        setNewTaskWorkTime(25);
        setNewTaskPlayTime(5);
        setNewTaskCycles(1);
        setIsAddingTask(false);
        setShowTaskFormModal(false);
      } catch (error) {
        console.error("Error adding task:", error);
        Alert.alert("Error", "Failed to add task");
      }
    }
  };

  const handleEditTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setNewTaskName(task.name);
      setNewTaskDescription(task.description || "");
      setNewTaskReward(task.reward.toString());
      setNewTaskAllowMinimization(task.allowMinimization);
      setNewTaskWorkTime(task.workTime || 25);
      setNewTaskPlayTime(task.playTime || 5);
      setNewTaskCycles(task.cycles || 1);
      setEditingTaskId(taskId);
      setIsAddingTask(true);
      setShowTaskFormModal(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!auth.currentUser) return;
    if (editingTaskId && newTaskName.trim() && newTaskReward.trim()) {
      try {
        const taskRef = getTaskDocRef(editingTaskId);
        await updateDoc(taskRef, {
          name: newTaskName,
          description: newTaskDescription,
          reward: parseInt(newTaskReward) || 0,
          allowMinimization: newTaskAllowMinimization,
          workTime: newTaskWorkTime,
          playTime: newTaskPlayTime,
          cycles: newTaskCycles,
          updatedAt: serverTimestamp(),
        });
        setNewTaskName("");
        setNewTaskDescription("");
        setNewTaskReward("");
        setNewTaskAllowMinimization(false);
        setNewTaskWorkTime(25);
        setNewTaskPlayTime(5);
        setNewTaskCycles(1);
        setIsAddingTask(false);
        setShowTaskFormModal(false);
        setEditingTaskId(null);
      } catch (error) {
        console.error("Error updating task:", error);
        Alert.alert("Error", "Failed to update task");
      }
    }
  };

  const handleCancelAdd = () => {
    setNewTaskName("");
    setNewTaskDescription("");
    setNewTaskReward("");
    setNewTaskAllowMinimization(false);
    setNewTaskWorkTime(25);
    setNewTaskPlayTime(5);
    setNewTaskCycles(1);
    setIsAddingTask(false);
    setShowTaskFormModal(false);
    setEditingTaskId(null);
  };

  const handleEditModeToggle = () => {
    // If trying to switch to edit mode and account is managed, show PIN modal
    if (!isEditMode && accountType === "managed") {
      setShowPinModal(true);
      setPinInput("");
      setPinError("");
      setIsArchiveMode(false);
    } else {
      // Independent account or switching back to normal mode
      setIsEditMode(!isEditMode);
      setIsArchiveMode(false);
      setIsAddingTask(false);
      setEditingTaskId(null);
    }
  };

  const handlePinSubmit = () => {
    if (pinInput === managerialPin) {
      setIsEditMode(true);
      setShowPinModal(false);
      setPinInput("");
      setPinError("");
    } else {
      setPinError("Incorrect PIN. Please try again.");
    }
  };

  const handlePinCancel = () => {
    setShowPinModal(false);
    setPinInput("");
    setPinError("");
  };

  const handleUnarchivePinSubmit = () => {
    if (pinInput === managerialPin) {
      setShowUnarchivePinModal(false);
      setPinInput("");
      setPinError("");
      if (pendingUnarchiveTaskId) {
        handleUnarchiveTask(pendingUnarchiveTaskId);
        setPendingUnarchiveTaskId(null);
      }
    } else {
      setPinError("Incorrect PIN. Please try again.");
    }
  };

  const handleUnarchivePinCancel = () => {
    setShowUnarchivePinModal(false);
    setPendingUnarchiveTaskId(null);
    setPinInput("");
    setPinError("");
  };

  const handlePinDigitChange = (digit: string, index: number) => {
    // Only allow single digit
    const sanitized = digit.replace(/[^0-9]/g, "").slice(0, 1);

    const pinArray = pinInput.padEnd(4, " ").split("");
    pinArray[index] = sanitized;
    const newPin = pinArray.join("").replace(/\s/g, "");

    setPinInput(newPin);

    // Auto-focus next input if digit entered
    if (sanitized && index < 3) {
      // Small delay to prevent the number from showing
      setTimeout(() => {
        pinRefs.current[index + 1]?.focus();
      }, 0);
    }
  };

  const handlePinKeyPress = (e: any, index: number) => {
    // Handle backspace to delete current and move to previous
    if (e.nativeEvent.key === "Backspace") {
      const pinArray = pinInput.padEnd(4, " ").split("");

      if (pinInput[index]) {
        // Clear current digit
        pinArray[index] = "";
        const newPin = pinArray.join("").replace(/\s/g, "");
        setPinInput(newPin);

        // Move to previous box (unless it's the last box)
        if (index > 0 && index < 3) {
          setTimeout(() => {
            pinRefs.current[index - 1]?.focus();
          }, 0);
        }
      } else if (index > 0) {
        // Current is empty, move to previous and clear it
        pinArray[index - 1] = "";
        const newPin = pinArray.join("").replace(/\s/g, "");
        setPinInput(newPin);
        pinRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleShowInfo = (task: Task) => {
    setSelectedTask(task);
    setShowInfoModal(true);
  };

  const handleCloseInfo = () => {
    setShowInfoModal(false);
    setSelectedTask(null);
  };

  const handleStartTask = (task: Task) => {
    // Check if planet is locked
    if (isSelectedPlanetLocked) {
      Alert.alert(
        "Planet Locked",
        "This planet is locked. Unlock it before playing tasks!",
      );
      return;
    }
    // Close the modal and navigate to Pomodoro screen with task data
    onClose();
    router.push({
      pathname: "/pages/PomodoroScreen",
      params: {
        taskId: task.id,
        taskName: task.name,
        workTime: task.workTime.toString(),
        playTime: task.playTime.toString(),
        cycles: task.cycles.toString(),
        taskReward: task.reward.toString(),
        childDocId: childDocId || "",
        allowMinimization: task.allowMinimization.toString(),
      },
    });
  };

  const handleTaskTap = async (taskId: string) => {
    if (!taskTapCount.current[taskId]) {
      taskTapCount.current[taskId] = 0;
    }

    taskTapCount.current[taskId] += 1;

    // Clear existing timer for this task
    if (taskTapTimer.current[taskId]) {
      clearTimeout(taskTapTimer.current[taskId]);
    }

    // Check if triple tap achieved
    if (taskTapCount.current[taskId] === 3) {
      // Admin bypass: reset completedCycles to 0
      try {
        if (!auth.currentUser) return;
        const taskRef = getTaskDocRef(taskId);
        await updateDoc(taskRef, {
          completedCycles: 0,
          updatedAt: serverTimestamp(),
        });
        console.log("Reset completedCycles to 0 for task:", taskId);
      } catch (error) {
        console.error("Error resetting completedCycles:", error);
      }
      taskTapCount.current[taskId] = 0;
    } else {
      // Reset tap count after 500ms if not triple tapped
      taskTapTimer.current[taskId] = setTimeout(() => {
        taskTapCount.current[taskId] = 0;
      }, 500);
    }
  };

  //  useEffect(() => {
  //   if (!visible) return;

  //   const timeout = setTimeout(() => {
  //     start(onboardingTour);
  //   }, 500);

  //   return () => clearTimeout(timeout);
  // }, [visible]);
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      testID="task-modal"
    >
      <View className="flex-1 bg-black/50 items-center justify-center p-5">
        <View
          className={`w-full max-w-md rounded-3xl p-6 border-2 shadow-2xl ${
            isEditMode
              ? "bg-[#2a2416]"
              : isArchiveMode
                ? "bg-[#1a1a1a]"
                : "bg-[#1a1f3a]"
          }`}
          style={{
            borderColor: isEditMode
              ? "rgba(234, 179, 8, 0.5)"
              : isArchiveMode
                ? "rgba(107, 114, 128, 0.5)"
                : palette.modalBorder,
          }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-orbitron-bold text-white text-2xl">
              {t("Tasks.title")}
            </Text>

            <TouchableOpacity
              testID="close-task-modal"
              onPress={onClose}
              className="w-10 h-10 items-center justify-center"
            >
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>

          {/* Mode Toggle */}
          <View
            className={`flex-row mb-6 rounded-2xl p-1 border-2 ${
              isEditMode
                ? "bg-yellow-900/40 border-yellow-400/30"
                : isArchiveMode
                  ? "bg-gray-800/40 border-gray-400/30"
                  : "bg-indigo-900/40 border-indigo-400/30"
            }`}
          >
            <TouchableOpacity
              onPress={() => {
                setIsEditMode(false);
                setIsArchiveMode(false);
                setIsAddingTask(false);
                setEditingTaskId(null);
              }}
              className="flex-1 py-3 rounded-xl items-center"
              style={{
                backgroundColor:
                  !isEditMode && !isArchiveMode
                    ? palette.accent
                    : "transparent",
              }}
            >
              <Text className="font-orbitron-bold text-white text-sm">
                {t("Tasks.normal")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEditModeToggle}
              className={`flex-1 py-3 rounded-xl items-center ${
                isEditMode ? "bg-yellow-600" : "bg-transparent"
              }`}
            >
              <Text className="font-orbitron-bold text-white text-sm">
                {t("Tasks.edit")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setIsEditMode(false);
                setIsArchiveMode(true);
                setIsAddingTask(false);
                setEditingTaskId(null);
              }}
              className={`flex-1 py-3 rounded-xl items-center ${
                isArchiveMode ? "bg-gray-600" : "bg-transparent"
              }`}
            >
              <Text className="font-orbitron-bold text-white text-sm">
                {t("Tasks.archive")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error && (
            <View className="bg-red-500/20 border-2 border-red-400/30 p-4 rounded-2xl mb-4">
              <Text className="font-madimi text-white text-base">{error}</Text>
            </View>
          )}

          {/* Loading State */}
          {loading ? (
            <View className="items-center justify-center p-4">
              <Text className="font-madimi text-white text-base">
                Loading tasks...
              </Text>
            </View>
          ) : (
            /* Task List */
            <ScrollView className="max-h-96 mb-4">
              {displayedTasks.length === 0 ? (
                <View className="items-center justify-center p-4">
                  <Text className="font-madimi text-white text-base">
                    {isArchiveMode
                      ? t("Tasks.archivedempty")
                      : t("Tasks.empty")}
                  </Text>
                </View>
              ) : (
                displayedTasks.map((task) => (
                  <View
                    key={task.id}
                    className={`flex-row items-center justify-between p-4 mb-3 rounded-2xl border-2 ${
                      task.completed
                        ? "bg-green-500/20 border-green-400/30"
                        : isEditMode
                          ? "bg-yellow-600/20 border-yellow-500/40"
                          : isArchiveMode
                            ? "bg-gray-700/20 border-gray-500/40"
                            : ""
                    }`}
                    style={
                      !task.completed && !isEditMode && !isArchiveMode
                        ? {
                            backgroundColor: palette.accentSoft,
                            borderColor: palette.accentSoftBorder,
                          }
                        : undefined
                    }
                  >
                    <TouchableOpacity
                      className="flex-1"
                      onPress={() => handleTaskTap(task.id)}
                      activeOpacity={1}
                    >
                      <Text
                        className={`font-madimi text-white text-base ${
                          task.completed ? "line-through opacity-60" : ""
                        }`}
                      >
                        {task.name}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Image
                          source={require("../../assets/images/sprites/crystal.png")}
                          className="w-7 h-7 mr-1"
                          resizeMode="contain"
                          style={{ transform: [{ scale: 1 }] }}
                        />
                        <Text
                          className={`font-orbitron-bold text-sm ml-1 ${
                            isEditMode
                              ? "text-yellow-300"
                              : isArchiveMode
                                ? "text-gray-300"
                                : ""
                          }`}
                          style={
                            !isEditMode && !isArchiveMode
                              ? { color: palette.sectionTextColor }
                              : undefined
                          }
                        >
                          {task.reward}
                        </Text>
                        <Text
                          className={`font-orbitron-bold text-sm ml-3 ${
                            task.cycles === -1
                              ? "text-blue-400"
                              : task.completedCycles >= task.cycles
                                ? "text-green-400"
                                : "text-yellow-400"
                          }`}
                        >
                          {task.cycles === -1
                            ? `${task.completedCycles}/∞`
                            : `${task.completedCycles}/${task.cycles}`}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Action Buttons */}
                    <View className="flex-row gap-2">
                      {isArchiveMode ? (
                        <View className="flex-row">
                          <TouchableOpacity
                            onPress={() => handleUnarchivePress(task.id)}
                            className="w-10 h-10 rounded-full bg-gray-600/60 border-2 border-gray-400/60 items-center justify-center mr-1"
                          >
                            <Ionicons
                              name="arrow-undo"
                              size={18}
                              color="#d1d5db"
                            />
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleShowInfo(task)}
                            className="w-10 h-10 rounded-full border-2 items-center justify-center"
                            style={{
                              backgroundColor: palette.accentSoft,
                              borderColor: palette.accentSoftBorder,
                            }}
                          >
                            <Ionicons
                              name="information-circle"
                              size={20}
                              color="white"
                            />
                          </TouchableOpacity>
                        </View>
                      ) : isEditMode ? (
                        <View className="flex-row">
                          <TouchableOpacity
                            onPress={() => handleArchiveTask(task.id)}
                            className="w-10 h-10 rounded-full items-center justify-center mr-1 bg-yellow-600/40 border-2 border-yellow-500/40"
                          >
                            <Ionicons
                              name="archive"
                              size={20}
                              color="#fbbf24"
                            />
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleEditTask(task.id)}
                            className="w-10 h-10 rounded-full bg-orange-600/40 border-2 border-orange-500/40 items-center justify-center mr-1"
                          >
                            <Ionicons name="pencil" size={18} color="#fb923c" />
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleDeleteTask(task.id)}
                            className="w-10 h-10 rounded-full bg-red-600/40 border-2 border-red-500/40 items-center justify-center"
                          >
                            <Ionicons name="trash" size={18} color="#f87171" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View className="flex-row">
                          <TouchableOpacity
                            onPress={() => handleCompleteTask(task.id)}
                            disabled={
                              !task.completed &&
                              toSafeInt(task.cycles, 1) !== -1 &&
                              toSafeInt(task.completedCycles, 0) <
                                toSafeInt(task.cycles, 1)
                            }
                            className={`w-10 h-10 rounded-full items-center justify-center mr-1 ${
                              task.completed
                                ? "bg-green-500"
                                : toSafeInt(task.cycles, 1) === -1 ||
                                    toSafeInt(task.completedCycles, 0) >=
                                      toSafeInt(task.cycles, 1)
                                  ? "bg-green-500/30 border-2 border-green-400/30"
                                  : "bg-gray-500/20 border-2 border-gray-400/20"
                            }`}
                          >
                            <Ionicons
                              name={
                                task.completed
                                  ? "checkmark"
                                  : "checkmark-outline"
                              }
                              size={20}
                              color={
                                !task.completed &&
                                toSafeInt(task.cycles, 1) !== -1 &&
                                toSafeInt(task.completedCycles, 0) <
                                  toSafeInt(task.cycles, 1)
                                  ? "#666"
                                  : "white"
                              }
                            />
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleStartTask(task)}
                            className="w-10 h-10 rounded-full bg-blue-500/30 border-2 border-blue-400/30 items-center justify-center mr-1"
                          >
                            <Ionicons name="play" size={18} color="white" />
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleShowInfo(task)}
                            className="w-10 h-10 rounded-full border-2 items-center justify-center"
                            style={{
                              backgroundColor: palette.accentSoft,
                              borderColor: palette.accentSoftBorder,
                            }}
                          >
                            <Ionicons
                              name="information-circle"
                              size={20}
                              color="white"
                            />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          {/* Add Task Button */}
          {isEditMode && (
            <TouchableOpacity
              onPress={() => {
                setIsAddingTask(true);
                setShowTaskFormModal(true);
              }}
              className="bg-gradient-to-r from-yellow-600 to-amber-600 py-4 rounded-2xl items-center border-2 border-yellow-400/40 shadow-lg"
            >
              <View className="flex-row items-center">
                <Ionicons name="add-circle" size={24} color="white" />
                <Text className="font-orbitron-bold text-white text-lg ml-2">
                  {t("Tasks.button")}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Task Form Modal */}
      <Modal
        visible={showTaskFormModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelAdd}
      >
        <View className="flex-1 bg-black/70 items-center justify-center p-5">
          <View className="bg-[#2a2416] w-full max-w-md rounded-3xl p-6 border-2 border-yellow-500/50 shadow-2xl">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-orbitron-bold text-yellow-300 text-2xl">
                {editingTaskId ? t("Tasks.editTask") : t("Tasks.new")}
              </Text>
              <TouchableOpacity
                onPress={handleCancelAdd}
                className="w-10 h-10 items-center justify-center"
              >
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-96">
              <TextInput
                className="font-madimi w-full h-12 bg-white/10 border border-yellow-400/30 rounded-lg px-4 mb-3 text-base text-white"
                placeholder={t("Tasks.new")}
                placeholderTextColor="#999"
                value={newTaskName}
                onChangeText={setNewTaskName}
              />
              <TextInput
                className="font-madimi w-full bg-white/10 border border-yellow-400/30 rounded-lg px-4 py-3 mb-3 text-base text-white"
                placeholder={t("Tasks.desc")}
                placeholderTextColor="#999"
                value={newTaskDescription}
                onChangeText={(text) =>
                  setNewTaskDescription(text.slice(0, 200))
                }
                multiline
                numberOfLines={3}
                maxLength={200}
                textAlignVertical="top"
              />
              <TextInput
                className="font-madimi w-full h-12 bg-white/10 border border-yellow-400/30 rounded-lg px-4 mb-3 text-base text-white"
                placeholder={t("Tasks.reward")}
                placeholderTextColor="#999"
                value={newTaskReward}
                onChangeText={setNewTaskReward}
                keyboardType="numeric"
              />
              <TouchableOpacity
                onPress={() =>
                  setNewTaskAllowMinimization(!newTaskAllowMinimization)
                }
                className="flex-row items-center justify-between bg-white/10 border border-yellow-400/30 rounded-lg px-4 py-3 mb-3"
              >
                <Text className="font-madimi text-white text-base">
                  {t("Tasks.min")}
                </Text>
                <View
                  className={`w-12 h-6 rounded-full flex-row items-center px-1 ${
                    newTaskAllowMinimization ? "bg-green-500" : "bg-gray-500"
                  }`}
                >
                  <View
                    className={`w-4 h-4 rounded-full bg-white ${
                      newTaskAllowMinimization ? "ml-auto" : "ml-0"
                    }`}
                  />
                </View>
              </TouchableOpacity>

              {/* Pomodoro Settings */}
              <Text className="font-madimi text-yellow-200 text-sm mb-2">
                {t("Tasks.settings")}
              </Text>

              {/* Work Time */}
              <View className="bg-white/10 border border-yellow-400/30 rounded-lg px-4 py-3 mb-3">
                <Text className="font-madimi text-white text-sm mb-2">
                  {t("Tasks.worktime")}
                </Text>
                <View className="flex-row items-center justify-between">
                  <TouchableOpacity
                    onPress={() =>
                      setNewTaskWorkTime(Math.max(5, newTaskWorkTime - 5))
                    }
                    className="w-10 h-10 bg-yellow-600/40 border border-yellow-500/50 rounded-lg items-center justify-center"
                  >
                    <Ionicons name="remove" size={20} color="white" />
                  </TouchableOpacity>
                  <Text className="font-orbitron-bold text-white text-xl">
                    {newTaskWorkTime}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setNewTaskWorkTime(newTaskWorkTime + 5)}
                    className="w-10 h-10 bg-yellow-600/40 border border-yellow-500/50 rounded-lg items-center justify-center"
                  >
                    <Ionicons name="add" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Play Time */}
              <View className="bg-white/10 border border-yellow-400/30 rounded-lg px-4 py-3 mb-3">
                <Text className="font-madimi text-white text-sm mb-2">
                  {t("Tasks.playtime")}
                </Text>
                <View className="flex-row items-center justify-between">
                  <TouchableOpacity
                    onPress={() =>
                      setNewTaskPlayTime(Math.max(5, newTaskPlayTime - 5))
                    }
                    className="w-10 h-10 bg-yellow-600/40 border border-yellow-500/50 rounded-lg items-center justify-center"
                  >
                    <Ionicons name="remove" size={20} color="white" />
                  </TouchableOpacity>
                  <Text className="font-orbitron-bold text-white text-xl">
                    {newTaskPlayTime}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setNewTaskPlayTime(newTaskPlayTime + 5)}
                    className="w-10 h-10 bg-yellow-600/40 border border-yellow-500/50 rounded-lg items-center justify-center"
                  >
                    <Ionicons name="add" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Cycles */}
              <View className="bg-white/10 border border-yellow-400/30 rounded-lg px-4 py-3 mb-3">
                <Text className="font-madimi text-white text-sm mb-2">
                  {t("Tasks.cycles")}
                </Text>
                <View className="flex-row items-center justify-between">
                  <TouchableOpacity
                    onPress={() =>
                      setNewTaskCycles(
                        newTaskCycles <= 1 ? -1 : newTaskCycles - 1,
                      )
                    }
                    className="w-10 h-10 bg-yellow-600/40 border border-yellow-500/50 rounded-lg items-center justify-center"
                  >
                    <Ionicons name="remove" size={20} color="white" />
                  </TouchableOpacity>
                  <Text className="font-orbitron-bold text-white text-xl">
                    {newTaskCycles === -1 ? "∞" : newTaskCycles}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setNewTaskCycles(
                        newTaskCycles === -1 ? 1 : newTaskCycles + 1,
                      )
                    }
                    className="w-10 h-10 bg-yellow-600/40 border border-yellow-500/50 rounded-lg items-center justify-center"
                  >
                    <Ionicons name="add" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View className="flex-row gap-2 mt-4">
              <TouchableOpacity
                onPress={handleCancelAdd}
                className="flex-1 bg-gray-500/30 py-3 rounded-xl items-center border-2 border-gray-400/30"
              >
                <Text className="font-orbitron-bold text-white text-base">
                  {t("Tasks.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={editingTaskId ? handleSaveEdit : handleAddTask}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 py-3 rounded-xl items-center border-2 border-green-300/30"
              >
                <Text className="font-orbitron-bold text-white text-base">
                  {editingTaskId ? t("Tasks.save") : t("Tasks.add")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PIN Verification Modal */}
      <Modal
        visible={showPinModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handlePinCancel}
      >
        <View className="flex-1 bg-black/70 items-center justify-center p-5">
          <View className="bg-[#2a2416] w-full max-w-sm rounded-3xl p-6 border-2 border-yellow-500/50 shadow-2xl">
            <View className="items-center mb-4">
              <View className="bg-yellow-500/20 rounded-full p-3 mb-3">
                <Ionicons name="shield-checkmark" size={40} color="#fbbf24" />
              </View>
              <Text className="font-orbitron-bold text-yellow-300 text-2xl text-center">
                {t("Tasks.managerAccess")}
              </Text>
            </View>
            <Text className="font-madimi text-yellow-100/80 text-sm mb-6 text-center">
              {t("Tasks.managerAccessDesc")}
            </Text>

            <View className="mb-4">
              <View className="flex-row justify-center gap-3">
                {[0, 1, 2, 3].map((index) => (
                  <View
                    key={index}
                    className="bg-yellow-900/30 border-2 border-yellow-500/40 rounded-xl w-16 h-16 items-center justify-center"
                  >
                    <TextInput
                      ref={(ref) => {
                        pinRefs.current[index] = ref;
                      }}
                      className="font-orbitron-bold text-3xl text-yellow-100 text-center w-full opacity-0"
                      value={pinInput[index] || ""}
                      onChangeText={(digit) =>
                        handlePinDigitChange(digit, index)
                      }
                      onKeyPress={(e) => handlePinKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      autoFocus={index === 0}
                      selectTextOnFocus
                      caretHidden={true}
                    />
                    <View className="absolute inset-0 items-center justify-center pointer-events-none">
                      <Text className="font-orbitron-bold text-3xl text-yellow-100">
                        {pinInput[index] ? "•" : ""}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {pinError && (
              <View className="bg-red-500/20 border-2 border-red-400/30 p-3 rounded-xl mb-4">
                <Text className="font-madimi text-red-200 text-sm text-center">
                  {pinError}
                </Text>
              </View>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handlePinCancel}
                className="flex-1 bg-gray-500/30 py-3 rounded-xl items-center border-2 border-gray-400/30"
              >
                <Text className="font-orbitron-bold text-white text-base">
                  ({t("Tasks.cancel")})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePinSubmit}
                disabled={pinInput.length !== 4}
                className={`flex-1 py-3 rounded-xl items-center border-2 ${
                  pinInput.length === 4
                    ? "bg-gradient-to-r from-yellow-600 to-amber-600 border-yellow-400/50"
                    : "bg-gray-500/20 border-gray-400/20"
                }`}
              >
                <Text className="font-orbitron-bold text-white text-base">
                  {t("Tasks.unlock")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Unarchive PIN Verification Modal */}
      <Modal
        visible={showUnarchivePinModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleUnarchivePinCancel}
      >
        <View className="flex-1 bg-black/70 items-center justify-center p-5">
          <View className="bg-[#2a2416] w-full max-w-sm rounded-3xl p-6 border-2 border-yellow-500/50 shadow-2xl">
            <View className="items-center mb-4">
              <View className="bg-yellow-500/20 rounded-full p-3 mb-3">
                <Ionicons name="shield-checkmark" size={40} color="#fbbf24" />
              </View>
              <Text className="font-orbitron-bold text-yellow-300 text-2xl text-center">
                {t("Tasks.managerAccess")}
              </Text>
            </View>
            <Text className="font-madimi text-yellow-100/80 text-sm mb-6 text-center">
              {t("Tasks.managerAccessDesc")}
            </Text>

            <View className="mb-4">
              <View className="flex-row justify-center gap-3">
                {[0, 1, 2, 3].map((index) => (
                  <View
                    key={index}
                    className="bg-yellow-900/30 border-2 border-yellow-500/40 rounded-xl w-16 h-16 items-center justify-center"
                  >
                    <TextInput
                      ref={(ref) => {
                        pinRefs.current[index] = ref;
                      }}
                      className="font-orbitron-bold text-3xl text-yellow-100 text-center w-full opacity-0"
                      value={pinInput[index] || ""}
                      onChangeText={(digit) =>
                        handlePinDigitChange(digit, index)
                      }
                      onKeyPress={(e) => handlePinKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      autoFocus={index === 0}
                      selectTextOnFocus
                      caretHidden={true}
                    />
                    <View className="absolute inset-0 items-center justify-center pointer-events-none">
                      <Text className="font-orbitron-bold text-3xl text-yellow-100">
                        {pinInput[index] ? "•" : ""}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {pinError && (
              <View className="bg-red-500/20 border-2 border-red-400/30 p-3 rounded-xl mb-4">
                <Text className="font-madimi text-red-200 text-sm text-center">
                  {pinError}
                </Text>
              </View>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleUnarchivePinCancel}
                className="flex-1 bg-gray-500/30 py-3 rounded-xl items-center border-2 border-gray-400/30"
              >
                <Text className="font-orbitron-bold text-white text-base">
                  ({t("Tasks.cancel")})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUnarchivePinSubmit}
                disabled={pinInput.length !== 4}
                className={`flex-1 py-3 rounded-xl items-center border-2 ${
                  pinInput.length === 4
                    ? "bg-gradient-to-r from-yellow-600 to-amber-600 border-yellow-400/50"
                    : "bg-gray-500/20 border-gray-400/20"
                }`}
              >
                <Text className="font-orbitron-bold text-white text-base">
                  {t("Tasks.unlock")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Task Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseInfo}
      >
        <View className="flex-1 bg-black/70 items-center justify-center p-5">
          <View className="bg-[#1a1f3a] w-full max-w-sm rounded-3xl p-6 border-2 border-purple-500/30 shadow-2xl">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-orbitron-bold text-white text-2xl">
                {t("Tasks.details")}
              </Text>
              <TouchableOpacity
                onPress={handleCloseInfo}
                className="w-10 h-10 items-center justify-center"
              >
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
            </View>

            {selectedTask && (
              <View>
                <View className="bg-purple-500/10 border-2 border-purple-400/30 rounded-2xl p-4 mb-4">
                  <Text className="font-madimi text-purple-300 text-sm mb-1">
                    {t("Tasks.TaskName")}
                  </Text>
                  <Text className="font-orbitron-bold text-white text-lg mb-4">
                    {selectedTask.name}
                  </Text>

                  {selectedTask.description && (
                    <>
                      <Text className="font-madimi text-purple-300 text-sm mb-1">
                        {t("Tasks.description")}
                      </Text>
                      <Text className="font-madimi text-white text-base mb-4">
                        {selectedTask.description}
                      </Text>
                    </>
                  )}

                  <Text className="font-madimi text-purple-300 text-sm mb-1">
                    {t("Tasks.reward2")}
                  </Text>
                  <View className="flex-row items-center mb-4">
                    <Image
                      source={require("../../assets/images/sprites/crystal.png")}
                      className="w-8 h-8 mr-2"
                      resizeMode="contain"
                      style={{ transform: [{ scale: 1 }] }}
                    />
                    <Text className="font-orbitron-bold text-white text-xl">
                      {selectedTask.reward}
                    </Text>
                  </View>

                  <Text className="font-madimi text-purple-300 text-sm mb-1">
                    {t("Tasks.status")}
                  </Text>
                  <View className="flex-row items-center mb-4">
                    <View
                      className={`px-3 py-1 rounded-full ${
                        selectedTask.completed
                          ? "bg-green-500/30 border border-green-400/50"
                          : "bg-gray-500/30 border border-gray-400/50"
                      }`}
                    >
                      <Text
                        className={`font-orbitron-bold text-sm ${
                          selectedTask.completed
                            ? "text-green-300"
                            : "text-gray-300"
                        }`}
                      >
                        {selectedTask.completed
                          ? t("Tasks.complete")
                          : t("Tasks.incomplete")}
                      </Text>
                    </View>
                  </View>

                  <Text className="font-madimi text-purple-300 text-sm mb-1">
                    {t("Tasks.min")}
                  </Text>
                  <View className="flex-row items-center mb-4">
                    <View
                      className={`px-3 py-1 rounded-full ${
                        selectedTask.allowMinimization
                          ? "bg-green-500/30 border border-green-400/50"
                          : "bg-red-500/30 border border-red-400/50"
                      }`}
                    >
                      <Text
                        className={`font-orbitron-bold text-sm ${
                          selectedTask.allowMinimization
                            ? "text-green-300"
                            : "text-red-300"
                        }`}
                      >
                        {selectedTask.allowMinimization
                          ? t("Tasks.yes")
                          : t("Tasks.no")}
                      </Text>
                    </View>
                  </View>

                  <Text className="font-madimi text-purple-300 text-sm mb-1">
                    {t("Tasks.settings")}
                  </Text>
                  <View className="flex-row justify-between mb-4">
                    <View className="bg-purple-600/20 border border-purple-500/40 rounded-lg px-3 py-2 flex-1 mr-2">
                      <Text className="font-madimi text-purple-300 text-xs mb-1">
                        {t("Tasks.workTime")}
                      </Text>
                      <Text className="font-orbitron-bold text-white text-base">
                        {selectedTask.workTime} min
                      </Text>
                    </View>
                    <View className="bg-purple-600/20 border border-purple-500/40 rounded-lg px-3 py-2 flex-1 mr-2">
                      <Text className="font-madimi text-purple-300 text-xs mb-1">
                        {t("Tasks.playTime")}
                      </Text>
                      <Text className="font-orbitron-bold text-white text-base">
                        {selectedTask.playTime} min
                      </Text>
                    </View>
                    <View className="bg-purple-600/20 border border-purple-500/40 rounded-lg px-3 py-2 flex-1">
                      <Text className="font-madimi text-purple-300 text-xs mb-1">
                        {t("Tasks.Cycles")}
                      </Text>
                      <Text className="font-orbitron-bold text-white text-base">
                        {selectedTask.cycles === -1
                          ? `${selectedTask.completedCycles}/∞`
                          : `${selectedTask.completedCycles}/${selectedTask.cycles}`}
                      </Text>
                    </View>
                  </View>

                  <Text className="font-madimi text-purple-300 text-sm mb-1">
                    {t("Tasks.created")}
                  </Text>
                  <Text className="font-madimi text-white text-base mb-4">
                    {new Date(
                      selectedTask.createdAt.seconds * 1000,
                    ).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleCloseInfo}
                  className="bg-purple-500 py-3 rounded-xl items-center border-2 border-purple-400/30"
                >
                  <Text className="font-orbitron-bold text-white text-base">
                    {t("Tasks.close")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
