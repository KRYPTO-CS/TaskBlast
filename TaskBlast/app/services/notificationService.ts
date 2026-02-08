/**
 * Notification Service
 * 
 * 
 * Features:
 * - Task reminder notifications (before task start time)
 * - Timer completion notifications (positive reinforcement)
 * - Customizable notification preferences
 * - Support for sound, vibration, and silent modes
 * - Consistent patterns for predictability
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Platform, AppState } from 'react-native';

// Notification types
export enum NotificationType {
  TASK_REMINDER = 'TASK_REMINDER',
  TIMER_COMPLETE = 'TIMER_COMPLETE',
  SESSION_START = 'SESSION_START',
  DAILY_DIGEST = 'DAILY_DIGEST',
}

// Reminder timing options (in minutes before task start) for user preferences LATER
export enum ReminderTiming {
  FIVE_MINUTES = 5,
  TEN_MINUTES = 10,
  FIFTEEN_MINUTES = 15,
  THIRTY_MINUTES = 30,
  AT_START_TIME = 0,
}

// Notification preferences interface
export interface NotificationPreferences {
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  visualOnly: boolean;
  reminderTiming: ReminderTiming;
  repeatNotifications: boolean;
  maxNotificationsPerHour: number;
  dailyDigestEnabled: boolean;
  dailyDigestTime: string; // Time in HH:mm format (24-hour)
}

// Default preferences (neurodivergent-friendly defaults)
const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  soundEnabled: false, // Default to silent for less overwhelm
  vibrationEnabled: true,
  visualOnly: false,
  reminderTiming: ReminderTiming.FIVE_MINUTES,
  repeatNotifications: false, // No repeats to avoid overwhelm
  maxNotificationsPerHour: 9999, // Rate limiting disabled
  dailyDigestEnabled: true,
  dailyDigestTime: '15:00', // 3 PM default
};

const PREFS_STORAGE_KEY = '@taskblast_notification_prefs';
const NOTIFICATION_HISTORY_KEY = '@taskblast_notification_history';

/**
 * Positive, encouraging messages for different notification types
 */
const POSITIVE_MESSAGES = {
  TASK_REMINDER: [
    "Time to start {taskName}! You've got this! 💪",
    "Ready to tackle {taskName}? Let's go! 🚀",
    "{taskName} is coming up! You're doing great! ⭐",
    "Gentle reminder: {taskName} is starting soon! 🌟",
  ],
  TIMER_COMPLETE: [
    "Amazing work! You completed {taskName}! 🎉",
    "Great job! Time for your game break! 🎮",
    "You did it! {taskName} is complete! ⭐",
    "Awesome! You finished {taskName}! Time to play! 🌟",
  ],
  SESSION_START: [
    "Starting your session! You've got this! 💪",
    "Let's do this! Session starting now! 🚀",
    "Session time! You're going to do great! ⭐",
  ],
  DAILY_DIGEST: [
    "You have {count} task{s} waiting! Ready to tackle them? 📋",
    "{count} task{s} on your list today! You've got this! 💪",
    "Task check-in: {count} task{s} to complete! Let's go! 🚀",
    "Friendly reminder: {count} task{s} ready for you! ⭐",
  ],
};

/**
 * Configure notification handler called at app startup
 */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false, // Sound controlled by preferences
      shouldSetBadge: false,
    }),
  });
}

/**
 * Request notification permissions called at app startup
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Get notification preferences from storage
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const stored = await AsyncStorage.getItem(PREFS_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Error loading notification preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save notification preferences to storage
 */
export async function saveNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  try {
    const current = await getNotificationPreferences();
    const updated = { ...current, ...preferences };
    await AsyncStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving notification preferences:', error);
  }
}

/**
 * Get a random positive message for a notification type
 */
function getPositiveMessage(
  type: NotificationType,
  taskName: string
): string {
  const messages = POSITIVE_MESSAGES[type] || POSITIVE_MESSAGES.TASK_REMINDER;
  const message = messages[Math.floor(Math.random() * messages.length)];
  
  // Replace {taskName} placeholder
  return message.replace('{taskName}', taskName);
}

/**
 * Trigger haptic feedback based on preferences
 */
async function triggerHaptics(preferences: NotificationPreferences): Promise<void> {
  if (!preferences.vibrationEnabled) return;
  
  try {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch (error) {
    console.error('Error triggering haptics:', error);
  }
}

/**
 * Schedule a task reminder notification
 */
export async function scheduleTaskReminder(
  taskId: string,
  taskName: string,
  taskStartTime: Date,
  reminderMinutes?: number
): Promise<string | null> {
  try {
    const preferences = await getNotificationPreferences();
    
    if (!preferences.enabled) {
      return null;
    }
    
    
    // Calculate trigger time
    const reminderTime = reminderMinutes ?? preferences.reminderTiming;
    const triggerDate = new Date(taskStartTime.getTime() - reminderTime * 60 * 1000);
    
    // Don't schedule if in the past
    if (triggerDate < new Date()) {
      return null;
    }
    
    // Get positive message
    const message = getPositiveMessage(
      NotificationType.TASK_REMINDER,
      taskName
    );
    
    // Schedule notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Task Reminder',
        body: message,
        sound: preferences.soundEnabled ? 'default' : undefined,
        data: {
          type: NotificationType.TASK_REMINDER,
          taskId,
          taskName,
        },
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error scheduling task reminder:', error);
    return null;
  }
}

/**
 * Show immediate timer completion notification
 * Only shows when app is in foreground
 */
export async function showTimerCompleteNotification(
  taskName: string,
  isBreakTime: boolean = false
): Promise<void> {
  try {
    // Don't show notifications during break time (Play Game)
    if (isBreakTime) {
      return;
    }
    
    // Don't show notifications when app is closed/in background
    const currentState = AppState.currentState;
    if (currentState !== 'active') {
      return;
    }
    
    const preferences = await getNotificationPreferences();
    
    if (!preferences.enabled) {
      return;
    }
    
    // Trigger haptic feedback
    await triggerHaptics(preferences);
    // Get positive message
    const type = NotificationType.TIMER_COMPLETE;
    const message = getPositiveMessage(type, taskName);
    
    // Show notification immediately
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Session Complete!',
        body: message,
        sound: preferences.soundEnabled ? 'default' : undefined,
        data: {
          type,
          taskName,
        },
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Immediate notification
    });
  } catch (error) {
    console.error('Error showing timer complete notification:', error);
  }
}

/**
 * Schedule daily digest notification
 * Shows a reminder at a specific time each day with task count
 */
export async function scheduleDailyDigest(
  taskCount: number,
  preferences?: NotificationPreferences
): Promise<string | null> {
  try {
    const prefs = preferences || await getNotificationPreferences();
    
    if (!prefs.enabled || !prefs.dailyDigestEnabled) {
      return null;
    }
    
    // Parse time (format: "HH:mm")
    const [hours, minutes] = prefs.dailyDigestTime.split(':').map(Number);
    
    // Create date for today at the specified time
    const now = new Date();
    const triggerDate = new Date();
    triggerDate.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (triggerDate <= now) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }
    
    // Cancel any existing daily digest notifications
    await cancelDailyDigest();
    
    // Get message with task count
    const messages = POSITIVE_MESSAGES[NotificationType.DAILY_DIGEST];
    const messageTemplate = messages[Math.floor(Math.random() * messages.length)];
    const message = messageTemplate
      .replace('{count}', taskCount.toString())
      .replace('{s}', taskCount === 1 ? '' : 's');
    
    // Schedule repeating daily notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📋 TaskBlast Reminder',
        body: taskCount === 0 
          ? "Great job! All tasks complete! Time to add new ones? 🌟"
          : message,
        sound: prefs.soundEnabled ? 'default' : undefined,
        data: {
          type: NotificationType.DAILY_DIGEST,
          taskCount,
        },
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
    });
    
    console.log(`Daily digest scheduled for ${prefs.dailyDigestTime} with ${taskCount} tasks`);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling daily digest:', error);
    return null;
  }
}

/**
 * Cancel daily digest notification
 */
export async function cancelDailyDigest(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const digestNotifications = scheduled.filter(
      (notif: Notifications.NotificationRequest) => 
        notif.content.data?.type === NotificationType.DAILY_DIGEST
    );
    
    for (const notif of digestNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  } catch (error) {
    console.error('Error canceling daily digest:', error);
  }
}

/**
 * Cancel a specific scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}

/**
 * Cancel all notifications for a specific task
 */
export async function cancelTaskNotifications(taskId: string): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const taskNotifications = scheduled.filter(
      (notif: Notifications.NotificationRequest) => notif.content.data?.taskId === taskId
    );
    
    for (const notif of taskNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  } catch (error) {
    console.error('Error canceling task notifications:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}

/**
 * Setup notification response listener
 * This handles what happens when a user taps on a notification
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Show a gentle countdown notification (visual progress indicator)
 * This can be used for tasks with visual countdowns
 */
export async function showCountdownNotification(
  taskName: string,
  minutesRemaining: number
): Promise<void> {
  try {
    const preferences = await getNotificationPreferences();
    
    if (!preferences.enabled || preferences.visualOnly === false) {
      return;
    }
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏱️ ${taskName}`,
        body: `${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''} remaining`,
        sound: false, // Silent for countdown updates
        data: {
          type: 'COUNTDOWN',
          taskName,
        },
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error showing countdown notification:', error);
  }
}
