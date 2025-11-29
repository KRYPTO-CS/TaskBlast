import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDoc,
  increment,
} from "firebase/firestore";

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

interface TaskListModalProps {
  visible: boolean;
  onClose: () => void;
  onRocksChange?: () => void;
}

export default function TaskListModal({
  visible,
  onClose,
  onRocksChange,
}: TaskListModalProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountType, setAccountType] = useState<string>("");
  const [managerialPin, setManagerialPin] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showUnarchivePinModal, setShowUnarchivePinModal] = useState(false);
  const [pendingUnarchiveTaskId, setPendingUnarchiveTaskId] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const pinRefs = useRef<Array<TextInput | null>>([null, null, null, null]);
  const auth = getAuth();
  const db = getFirestore();

  // Reset to normal mode when modal becomes visible
  useEffect(() => {
    if (visible) {
      setIsEditMode(false);
      setIsArchiveMode(false);
      setIsAddingTask(false);
      setEditingTaskId(null);
    }
  }, [visible]);

  useEffect(() => {
    if (!auth.currentUser) {
      setError("Please log in to view tasks");
      setLoading(false);
      return;
    }

    // Fetch user data to get accountType and managerialPin
    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, "users", auth.currentUser!.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setAccountType(userData.accountType || "");
          setManagerialPin(userData.managerialPin || null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();

    try {
      const userTasksRef = collection(
        db,
        "users",
        auth.currentUser.uid,
        "tasks"
      );
      const unsubscribe = onSnapshot(
        userTasksRef,
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
          // Filter tasks based on mode and sort by creation date, newest first
          const filteredTasks = taskList;
          filteredTasks.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
          setTasks(filteredTasks);
          setLoading(false);
          setError(null);
        },
        (error: Error) => {
          console.error("Error fetching tasks:", error);
          setError("Failed to load tasks");
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up task listener:", error);
      setError("Failed to initialize task system");
      setLoading(false);
    }
  }, [auth.currentUser]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isArchiveMode, setIsArchiveMode] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskReward, setNewTaskReward] = useState("");
  const [newTaskAllowMinimization, setNewTaskAllowMinimization] = useState(false);
  const [newTaskWorkTime, setNewTaskWorkTime] = useState(25);
  const [newTaskPlayTime, setNewTaskPlayTime] = useState(5);
  const [newTaskCycles, setNewTaskCycles] = useState(1);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showTaskFormModal, setShowTaskFormModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const taskTapCount = useRef<{[key: string]: number}>({});
  const taskTapTimer = useRef<{[key: string]: ReturnType<typeof setTimeout>}>({});

  // Filter tasks based on current mode
  const displayedTasks = isArchiveMode 
    ? tasks.filter(task => task.archived)
    : tasks.filter(task => !task.archived);

  const handleCompleteTask = async (taskId: string) => {
    if (!auth.currentUser) return;
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        // Prevent marking as complete if cycles aren't fulfilled (only in normal mode)
        // Allow completion if cycles are infinite (-1) or cycles are met
        if (!isEditMode && !task.completed && task.cycles !== -1 && task.completedCycles < task.cycles) {
          return;
        }
        
        const taskRef = doc(db, "users", auth.currentUser.uid, "tasks", taskId);
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

      // Update task to archived
      const taskRef = doc(db, "users", auth.currentUser.uid, "tasks", taskId);
      await updateDoc(taskRef, {
        archived: true,
        updatedAt: serverTimestamp(),
      });

      // Add rocks to user's account
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        rocks: increment(task.reward),
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
      const taskRef = doc(db, "users", auth.currentUser.uid, "tasks", taskId);
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
      const taskRef = doc(db, "users", auth.currentUser.uid, "tasks", taskId);
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
        const userTasksRef = collection(
          db,
          "users",
          auth.currentUser.uid,
          "tasks"
        );
        await addDoc(userTasksRef, {
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
        const taskRef = doc(
          db,
          "users",
          auth.currentUser.uid,
          "tasks",
          editingTaskId
        );
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
        const taskRef = doc(db, "users", auth.currentUser.uid, "tasks", taskId);
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
              ? "bg-[#2a2416] border-yellow-500/50"
              : isArchiveMode
              ? "bg-[#1a1a1a] border-gray-500/50"
              : "bg-[#1a1f3a] border-purple-500/30"
          }`}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-orbitron-bold text-white text-2xl">
              Task List
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
              className={`flex-1 py-3 rounded-xl items-center ${
                !isEditMode && !isArchiveMode ? "bg-purple-500" : "bg-transparent"
              }`}
            >
              <Text className="font-orbitron-bold text-white text-sm">
                Normal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEditModeToggle}
              className={`flex-1 py-3 rounded-xl items-center ${
                isEditMode ? "bg-yellow-600" : "bg-transparent"
              }`}
            >
              <Text className="font-orbitron-bold text-white text-sm">
                Edit
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
                Archive
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
                    {isArchiveMode ? "No archived tasks." : "No tasks yet. Add your first task!"}
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
                        : "bg-purple-500/10 border-purple-400/30"
                    }`}
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
                          source={require("../../assets/images/sprites/rocks.png")}
                          className="w-7 h-7 mr-1"
                          resizeMode="contain"
                          style={{ transform: [{ scale: 1 }] }}
                        />
                        <Text
                          className={`font-orbitron-bold text-sm ml-1 ${
                            isEditMode ? "text-yellow-300" : isArchiveMode ? "text-gray-300" : "text-purple-300"
                          }`}
                        >
                          {task.reward}
                        </Text>
                        <Text className={`font-orbitron-bold text-sm ml-3 ${
                          task.cycles === -1 ? "text-blue-400" : task.completedCycles >= task.cycles ? "text-green-400" : "text-yellow-400"
                        }`}>
                          {task.cycles === -1 ? `${task.completedCycles}/∞` : `${task.completedCycles}/${task.cycles}`}
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
                            className="w-10 h-10 rounded-full bg-purple-500/30 border-2 border-purple-400/30 items-center justify-center"
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
                            disabled={!task.completed && task.cycles !== -1 && task.completedCycles < task.cycles}
                            className={`w-10 h-10 rounded-full items-center justify-center mr-1 ${
                              task.completed
                                ? "bg-green-500"
                                : task.cycles === -1 || task.completedCycles >= task.cycles
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
                              color={!task.completed && task.cycles !== -1 && task.completedCycles < task.cycles ? "#666" : "white"}
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
                            className="w-10 h-10 rounded-full bg-purple-500/30 border-2 border-purple-400/30 items-center justify-center"
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
                  Add New Task
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
                {editingTaskId ? "Edit Task" : "New Task"}
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
                placeholder="Task name"
                placeholderTextColor="#999"
                value={newTaskName}
                onChangeText={setNewTaskName}
              />
              <TextInput
                className="font-madimi w-full bg-white/10 border border-yellow-400/30 rounded-lg px-4 py-3 mb-3 text-base text-white"
                placeholder="Description (optional, max 200 characters)"
                placeholderTextColor="#999"
                value={newTaskDescription}
                onChangeText={(text) => setNewTaskDescription(text.slice(0, 200))}
                multiline
                numberOfLines={3}
                maxLength={200}
                textAlignVertical="top"
              />
              <TextInput
                className="font-madimi w-full h-12 bg-white/10 border border-yellow-400/30 rounded-lg px-4 mb-3 text-base text-white"
                placeholder="Reward (rocks)"
                placeholderTextColor="#999"
                value={newTaskReward}
                onChangeText={setNewTaskReward}
                keyboardType="numeric"
              />
              <TouchableOpacity
                onPress={() => setNewTaskAllowMinimization(!newTaskAllowMinimization)}
                className="flex-row items-center justify-between bg-white/10 border border-yellow-400/30 rounded-lg px-4 py-3 mb-3"
              >
                <Text className="font-madimi text-white text-base">
                  Allow Minimization
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
                Pomodoro Settings
              </Text>
              
              {/* Work Time */}
              <View className="bg-white/10 border border-yellow-400/30 rounded-lg px-4 py-3 mb-3">
                <Text className="font-madimi text-white text-sm mb-2">
                  Work Time (minutes)
                </Text>
                <View className="flex-row items-center justify-between">
                  <TouchableOpacity
                    onPress={() => setNewTaskWorkTime(Math.max(5, newTaskWorkTime - 5))}
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
                  Play Time (minutes)
                </Text>
                <View className="flex-row items-center justify-between">
                  <TouchableOpacity
                    onPress={() => setNewTaskPlayTime(Math.max(5, newTaskPlayTime - 5))}
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
                  Number of Cycles
                </Text>
                <View className="flex-row items-center justify-between">
                  <TouchableOpacity
                    onPress={() => setNewTaskCycles(newTaskCycles <= 1 ? -1 : newTaskCycles - 1)}
                    className="w-10 h-10 bg-yellow-600/40 border border-yellow-500/50 rounded-lg items-center justify-center"
                  >
                    <Ionicons name="remove" size={20} color="white" />
                  </TouchableOpacity>
                  <Text className="font-orbitron-bold text-white text-xl">
                    {newTaskCycles === -1 ? "∞" : newTaskCycles}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setNewTaskCycles(newTaskCycles === -1 ? 1 : newTaskCycles + 1)}
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
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={editingTaskId ? handleSaveEdit : handleAddTask}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 py-3 rounded-xl items-center border-2 border-green-300/30"
              >
                <Text className="font-orbitron-bold text-white text-base">
                  {editingTaskId ? "Save" : "Add"}
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
                Manager Access
              </Text>
            </View>
            <Text className="font-madimi text-yellow-100/80 text-sm mb-6 text-center">
              Enter the 4-digit PIN to access edit mode with elevated
              permissions.
            </Text>

            <View className="mb-4">
              <View className="flex-row justify-center gap-3">
                {[0, 1, 2, 3].map((index) => (
                  <View
                    key={index}
                    className="bg-yellow-900/30 border-2 border-yellow-500/40 rounded-xl w-16 h-16 items-center justify-center"
                  >
                    <TextInput
                      ref={(ref) => { pinRefs.current[index] = ref; }}
                      className="font-orbitron-bold text-3xl text-yellow-100 text-center w-full opacity-0"
                      value={pinInput[index] || ""}
                      onChangeText={(digit) => handlePinDigitChange(digit, index)}
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
                  Cancel
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
                  Unlock
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
                Manager Access
              </Text>
            </View>
            <Text className="font-madimi text-yellow-100/80 text-sm mb-6 text-center">
              Enter the 4-digit PIN to unarchive this task.
            </Text>

            <View className="mb-4">
              <View className="flex-row justify-center gap-3">
                {[0, 1, 2, 3].map((index) => (
                  <View
                    key={index}
                    className="bg-yellow-900/30 border-2 border-yellow-500/40 rounded-xl w-16 h-16 items-center justify-center"
                  >
                    <TextInput
                      ref={(ref) => { pinRefs.current[index] = ref; }}
                      className="font-orbitron-bold text-3xl text-yellow-100 text-center w-full opacity-0"
                      value={pinInput[index] || ""}
                      onChangeText={(digit) => handlePinDigitChange(digit, index)}
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
                  Cancel
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
                  Unlock
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
                Task Info
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
                    Task Name
                  </Text>
                  <Text className="font-orbitron-bold text-white text-lg mb-4">
                    {selectedTask.name}
                  </Text>

                  {selectedTask.description && (
                    <>
                      <Text className="font-madimi text-purple-300 text-sm mb-1">
                        Description
                      </Text>
                      <Text className="font-madimi text-white text-base mb-4">
                        {selectedTask.description}
                      </Text>
                    </>
                  )}

                  <Text className="font-madimi text-purple-300 text-sm mb-1">
                    Reward
                  </Text>
                  <View className="flex-row items-center mb-4">
                    <Image
                      source={require("../../assets/images/sprites/rocks.png")}
                      className="w-8 h-8 mr-2"
                      resizeMode="contain"
                      style={{ transform: [{ scale: 1 }] }}
                    />
                    <Text className="font-orbitron-bold text-white text-xl">
                      {selectedTask.reward}
                    </Text>
                  </View>

                  <Text className="font-madimi text-purple-300 text-sm mb-1">
                    Status
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
                        {selectedTask.completed ? "Complete" : "Incomplete"}
                      </Text>
                    </View>
                  </View>

                  <Text className="font-madimi text-purple-300 text-sm mb-1">
                    Allow Minimization
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
                        {selectedTask.allowMinimization ? "Yes" : "No"}
                      </Text>
                    </View>
                  </View>

                  <Text className="font-madimi text-purple-300 text-sm mb-1">
                    Pomodoro Settings
                  </Text>
                  <View className="flex-row justify-between mb-4">
                    <View className="bg-purple-600/20 border border-purple-500/40 rounded-lg px-3 py-2 flex-1 mr-2">
                      <Text className="font-madimi text-purple-300 text-xs mb-1">
                        Work Time
                      </Text>
                      <Text className="font-orbitron-bold text-white text-base">
                        {selectedTask.workTime} min
                      </Text>
                    </View>
                    <View className="bg-purple-600/20 border border-purple-500/40 rounded-lg px-3 py-2 flex-1 mr-2">
                      <Text className="font-madimi text-purple-300 text-xs mb-1">
                        Play Time
                      </Text>
                      <Text className="font-orbitron-bold text-white text-base">
                        {selectedTask.playTime} min
                      </Text>
                    </View>
                    <View className="bg-purple-600/20 border border-purple-500/40 rounded-lg px-3 py-2 flex-1">
                      <Text className="font-madimi text-purple-300 text-xs mb-1">
                        Cycles
                      </Text>
                      <Text className="font-orbitron-bold text-white text-base">
                        {selectedTask.cycles === -1 ? `${selectedTask.completedCycles}/∞` : `${selectedTask.completedCycles}/${selectedTask.cycles}`}
                      </Text>
                    </View>
                  </View>

                  <Text className="font-madimi text-purple-300 text-sm mb-1">
                    Created
                  </Text>
                  <Text className="font-madimi text-white text-base mb-4">
                    {new Date(selectedTask.createdAt.seconds * 1000).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleCloseInfo}
                  className="bg-purple-500 py-3 rounded-xl items-center border-2 border-purple-400/30"
                >
                  <Text className="font-orbitron-bold text-white text-base">
                    Close
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
