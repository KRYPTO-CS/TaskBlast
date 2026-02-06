/**
 * Notification Context for TaskBlast
 *
 * Provides notification state and preferences management across the app.
 * Allows users and caregivers to customize notification behavior.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import * as Notifications from "expo-notifications";
import {
  NotificationPreferences,
  ReminderTiming,
  configureNotificationHandler,
  requestNotificationPermissions,
  getNotificationPreferences,
  saveNotificationPreferences,
  scheduleTaskReminder,
  showTimerCompleteNotification,
  cancelTaskNotifications,
  cancelAllNotifications,
  addNotificationResponseListener,
  scheduleDailyDigest,
  cancelDailyDigest,
} from "../services/notificationService";

interface NotificationContextType {
  preferences: NotificationPreferences;
  permissionGranted: boolean;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  scheduleTaskReminder: (
    taskId: string,
    taskName: string,
    taskStartTime: Date,
    reminderMinutes?: number,
  ) => Promise<string | null>;
  notifyTimerComplete: (
    taskName: string,
    isBreakTime?: boolean,
  ) => Promise<void>;
  cancelTaskNotifications: (taskId: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  scheduleDailyDigest: (taskCount: number) => Promise<string | null>;
  cancelDailyDigest: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    soundEnabled: false,
    vibrationEnabled: true,
    visualOnly: false,
    reminderTiming: ReminderTiming.FIVE_MINUTES,
    repeatNotifications: false,
    maxNotificationsPerHour: 4,
    dailyDigestEnabled: true,
    dailyDigestTime: "15:00",
  });
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Initialize notification system
  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    // Configure notification handler
    configureNotificationHandler();

    // Load saved preferences
    const savedPrefs = await getNotificationPreferences();
    setPreferences(savedPrefs);

    // Check permissions
    const hasPermission = await checkPermissions();
    setPermissionGranted(hasPermission);

    // Setup notification response listener
    const subscription = addNotificationResponseListener(
      handleNotificationResponse,
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.remove();
    };
  };

  const checkPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Error checking notification permissions:", error);
      return false;
    }
  };

  const handleNotificationResponse = (
    response: Notifications.NotificationResponse,
  ) => {
    // Handle notification tap
    const data = response.notification.request.content.data;
    console.log("Notification tapped:", data);

    // You can add navigation logic here based on notification type
    // For example, navigate to the task or timer screen
  };

  const updatePreferences = async (prefs: Partial<NotificationPreferences>) => {
    try {
      await saveNotificationPreferences(prefs);
      const updated = { ...preferences, ...prefs };
      setPreferences(updated);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    const granted = await requestNotificationPermissions();
    setPermissionGranted(granted);
    return granted;
  };

  const contextValue: NotificationContextType = {
    preferences,
    permissionGranted,
    updatePreferences,
    requestPermissions,
    scheduleTaskReminder,
    notifyTimerComplete: showTimerCompleteNotification,
    cancelTaskNotifications,
    cancelAllNotifications,
    scheduleDailyDigest: (taskCount: number) =>
      scheduleDailyDigest(taskCount, preferences),
    cancelDailyDigest,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to use notification context
 */
export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}
