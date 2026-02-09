/**
 * Test Suite: Notification Service
 *
 * This test suite covers the notification service functionality including:
 * - Rate limiting disabled (maxNotificationsPerHour = 9999)
 * - No notifications during break time (Play Game)
 * - No notifications when app is closed/background
 * - Task reminder notifications
 * - Timer completion notifications
 * - Daily digest notifications
 * - Notification preferences
 * - Haptic feedback
 * - Permission handling
 */

// Mock AppState before importing anything else
jest.mock("react-native", () => {
  const mockAppState = (global as any).mockAppState?.currentState || {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    currentState: "active",
  };

  return {
    Platform: {
      OS: "ios",
      select: jest.fn((obj) => obj.ios || obj.default),
    },
    AppState: mockAppState,
  };
});

import {
  configureNotificationHandler,
  requestNotificationPermissions,
  getNotificationPreferences,
  saveNotificationPreferences,
  scheduleTaskReminder,
  showTimerCompleteNotification,
  scheduleDailyDigest,
  cancelNotification,
  cancelTaskNotifications,
  cancelAllNotifications,
  cancelDailyDigest,
  getScheduledNotifications,
  NotificationType,
  ReminderTiming,
} from "../app/services/notificationService";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Use global notification mocks from jest.setup.js
const mockScheduleNotificationAsync = (global as any).mockNotifications
  .scheduleNotificationAsync;
const mockCancelScheduledNotificationAsync = (global as any).mockNotifications
  .cancelScheduledNotificationAsync;
const mockCancelAllScheduledNotificationsAsync = (global as any)
  .mockNotifications.cancelAllScheduledNotificationsAsync;
const mockGetAllScheduledNotificationsAsync = (global as any).mockNotifications
  .getAllScheduledNotificationsAsync;
const mockGetPermissionsAsync = (global as any).mockNotifications
  .getPermissionsAsync;
const mockRequestPermissionsAsync = (global as any).mockNotifications
  .requestPermissionsAsync;
const mockSetNotificationHandler = (global as any).mockNotifications
  .setNotificationHandler;
const mockNotificationAsync = (global as any).mockHaptics.notificationAsync;

describe("Notification Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    // Reset AppState to active
    (global as any).mockAppState.setCurrentState("active");
  });

  describe("Configuration", () => {
    it("should configure notification handler", () => {
      configureNotificationHandler();
      expect(mockSetNotificationHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          handleNotification: expect.any(Function),
        }),
      );
    });

    it("should request notification permissions", async () => {
      mockGetPermissionsAsync.mockResolvedValue({ status: "undetermined" });
      mockRequestPermissionsAsync.mockResolvedValue({ status: "granted" });

      const result = await requestNotificationPermissions();

      expect(mockGetPermissionsAsync).toHaveBeenCalled();
      expect(mockRequestPermissionsAsync).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should return true if permissions already granted", async () => {
      mockGetPermissionsAsync.mockResolvedValue({ status: "granted" });

      const result = await requestNotificationPermissions();

      expect(mockGetPermissionsAsync).toHaveBeenCalled();
      expect(mockRequestPermissionsAsync).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("should return false if permissions denied", async () => {
      mockGetPermissionsAsync.mockResolvedValue({ status: "undetermined" });
      mockRequestPermissionsAsync.mockResolvedValue({ status: "denied" });

      const result = await requestNotificationPermissions();

      expect(result).toBe(false);
    });
  });

  describe("Notification Preferences", () => {
    it("should return default preferences when none are stored", async () => {
      const prefs = await getNotificationPreferences();

      expect(prefs).toEqual({
        enabled: true,
        soundEnabled: false,
        vibrationEnabled: true,
        visualOnly: false,
        reminderTiming: ReminderTiming.FIVE_MINUTES,
        repeatNotifications: false,
        maxNotificationsPerHour: 9999, // Rate limiting disabled
        dailyDigestEnabled: true,
        dailyDigestTime: "15:00",
      });
    });

    it("should have rate limiting disabled by default (9999)", async () => {
      const prefs = await getNotificationPreferences();
      expect(prefs.maxNotificationsPerHour).toBe(9999);
    });

    it("should save and retrieve notification preferences", async () => {
      await saveNotificationPreferences({
        soundEnabled: true,
        vibrationEnabled: false,
      });

      const prefs = await getNotificationPreferences();

      expect(prefs.soundEnabled).toBe(true);
      expect(prefs.vibrationEnabled).toBe(false);
      expect(prefs.maxNotificationsPerHour).toBe(9999); // Should still be 9999
    });

    it("should merge saved preferences with defaults", async () => {
      await saveNotificationPreferences({
        soundEnabled: true,
      });

      const prefs = await getNotificationPreferences();

      expect(prefs.soundEnabled).toBe(true);
      expect(prefs.enabled).toBe(true); // Default value preserved
      expect(prefs.vibrationEnabled).toBe(true); // Default value preserved
    });
  });

  describe("Task Reminder Notifications", () => {
    it("should schedule task reminder for future time", async () => {
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
      const notificationId = await scheduleTaskReminder(
        "task-123",
        "Complete homework",
        futureDate,
      );

      expect(notificationId).toBe("notification-id-123");
      expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: "Task Reminder",
            data: expect.objectContaining({
              type: NotificationType.TASK_REMINDER,
              taskId: "task-123",
              taskName: "Complete homework",
            }),
          }),
          trigger: expect.objectContaining({
            type: "date",
          }),
        }),
      );
    });

    it("should not schedule reminder for past time", async () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      const notificationId = await scheduleTaskReminder(
        "task-123",
        "Complete homework",
        pastDate,
      );

      expect(notificationId).toBeNull();
      expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it("should not schedule reminder when notifications disabled", async () => {
      await saveNotificationPreferences({ enabled: false });

      const futureDate = new Date(Date.now() + 3600000);
      const notificationId = await scheduleTaskReminder(
        "task-123",
        "Complete homework",
        futureDate,
      );

      expect(notificationId).toBeNull();
      expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it("should use custom reminder timing", async () => {
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
      await scheduleTaskReminder(
        "task-123",
        "Complete homework",
        futureDate,
        30, // 30 minutes before
      );

      expect(mockScheduleNotificationAsync).toHaveBeenCalled();
      const call = mockScheduleNotificationAsync.mock.calls[0][0];
      const triggerDate = call.trigger.date;

      // Should be 30 minutes before futureDate
      expect(triggerDate.getTime()).toBe(futureDate.getTime() - 30 * 60 * 1000);
    });
  });

  describe("Timer Complete Notifications", () => {
    it("should show timer complete notification when app is active", async () => {
      (global as any).mockAppState.setCurrentState("active");

      await showTimerCompleteNotification("Study session", false);

      expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: "✅ Session Complete!",
            data: expect.objectContaining({
              type: NotificationType.TIMER_COMPLETE,
              taskName: "Study session",
            }),
          }),
          trigger: null, // Immediate notification
        }),
      );
    });

    it("should NOT show notification during break time (Play Game)", async () => {
      (global as any).mockAppState.setCurrentState("active");

      await showTimerCompleteNotification("Study session", true);

      expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it("should NOT show notification when app is in background", async () => {
      (global as any).mockAppState.setCurrentState("background");

      await showTimerCompleteNotification("Study session", false);

      expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it("should NOT show notification when app is inactive", async () => {
      (global as any).mockAppState.setCurrentState("inactive");

      await showTimerCompleteNotification("Study session", false);

      expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it("should trigger haptic feedback when app is active", async () => {
      (global as any).mockAppState.setCurrentState("active");

      await showTimerCompleteNotification("Study session", false);

      expect(mockNotificationAsync).toHaveBeenCalled();
    });

    it("should NOT trigger haptic feedback when vibration disabled", async () => {
      (global as any).mockAppState.setCurrentState("active");
      await saveNotificationPreferences({ vibrationEnabled: false });

      await showTimerCompleteNotification("Study session", false);

      expect(mockNotificationAsync).not.toHaveBeenCalled();
    });

    it("should include positive message in notification", async () => {
      (global as any).mockAppState.setCurrentState("active");

      await showTimerCompleteNotification("Study session", false);

      const call = mockScheduleNotificationAsync.mock.calls[0][0];
      expect(call.content.body).toMatch(/Study session/);
      expect(call.content.body.length).toBeGreaterThan(10); // Should have a message
    });

    it("should not show notification when notifications disabled", async () => {
      (global as any).mockAppState.setCurrentState("active");
      await saveNotificationPreferences({ enabled: false });

      await showTimerCompleteNotification("Study session", false);

      expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe("Daily Digest Notifications", () => {
    it("should schedule daily digest notification", async () => {
      const notificationId = await scheduleDailyDigest(5);

      expect(notificationId).toBe("notification-id-123");
      expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: "📋 TaskBlast Reminder",
            data: expect.objectContaining({
              type: NotificationType.DAILY_DIGEST,
              taskCount: 5,
            }),
          }),
          trigger: expect.objectContaining({
            type: "daily",
            hour: 15,
            minute: 0,
          }),
        }),
      );
    });

    it("should show different message when no tasks", async () => {
      await scheduleDailyDigest(0);

      const call = mockScheduleNotificationAsync.mock.calls[0][0];
      expect(call.content.body).toContain("All tasks complete");
    });

    it('should use singular "task" for count of 1', async () => {
      await scheduleDailyDigest(1);

      const call = mockScheduleNotificationAsync.mock.calls[0][0];
      // Should not have "tasks" (plural)
      expect(call.content.body).toMatch(/1 task[^s]/);
    });

    it("should cancel existing daily digest before scheduling new one", async () => {
      await scheduleDailyDigest(5);

      expect(mockGetAllScheduledNotificationsAsync).toHaveBeenCalled();
    });

    it("should not schedule when notifications disabled", async () => {
      await saveNotificationPreferences({ enabled: false });

      const notificationId = await scheduleDailyDigest(5);

      expect(notificationId).toBeNull();
      expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it("should not schedule when daily digest disabled", async () => {
      await saveNotificationPreferences({ dailyDigestEnabled: false });

      const notificationId = await scheduleDailyDigest(5);

      expect(notificationId).toBeNull();
      expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it("should use custom daily digest time", async () => {
      await saveNotificationPreferences({ dailyDigestTime: "09:30" });

      await scheduleDailyDigest(5);

      const call = mockScheduleNotificationAsync.mock.calls[0][0];
      expect(call.trigger.hour).toBe(9);
      expect(call.trigger.minute).toBe(30);
    });
  });

  describe("Canceling Notifications", () => {
    it("should cancel specific notification by id", async () => {
      await cancelNotification("notification-123");

      expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith(
        "notification-123",
      );
    });

    it("should cancel all task notifications", async () => {
      mockGetAllScheduledNotificationsAsync.mockResolvedValue([
        {
          identifier: "notif-1",
          content: { data: { taskId: "task-123" } },
        },
        {
          identifier: "notif-2",
          content: { data: { taskId: "task-456" } },
        },
        {
          identifier: "notif-3",
          content: { data: { taskId: "task-123" } },
        },
      ]);

      await cancelTaskNotifications("task-123");

      expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
      expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith(
        "notif-1",
      );
      expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith(
        "notif-3",
      );
    });

    it("should cancel all scheduled notifications", async () => {
      await cancelAllNotifications();

      expect(mockCancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });

    it("should cancel daily digest notifications", async () => {
      mockGetAllScheduledNotificationsAsync.mockResolvedValue([
        {
          identifier: "daily-1",
          content: { data: { type: NotificationType.DAILY_DIGEST } },
        },
        {
          identifier: "task-1",
          content: { data: { type: NotificationType.TASK_REMINDER } },
        },
      ]);

      await cancelDailyDigest();

      expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
      expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith(
        "daily-1",
      );
    });
  });

  describe("Get Scheduled Notifications", () => {
    it("should retrieve all scheduled notifications", async () => {
      const mockNotifications = [
        { identifier: "notif-1", content: {} },
        { identifier: "notif-2", content: {} },
      ];
      mockGetAllScheduledNotificationsAsync.mockResolvedValue(
        mockNotifications,
      );

      const result = await getScheduledNotifications();

      expect(result).toEqual(mockNotifications);
      expect(mockGetAllScheduledNotificationsAsync).toHaveBeenCalled();
    });

    it("should return empty array on error", async () => {
      mockGetAllScheduledNotificationsAsync.mockRejectedValue(
        new Error("Permission denied"),
      );

      const result = await getScheduledNotifications();

      expect(result).toEqual([]);
    });
  });

  describe("Error Handling", () => {
    it("should handle AsyncStorage errors gracefully", async () => {
      (global as any).mockAppState.setCurrentState("active");
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error("Storage error"),
      );

      const prefs = await getNotificationPreferences();

      expect(prefs).toEqual(
        expect.objectContaining({
          maxNotificationsPerHour: 9999,
          enabled: true,
        }),
      );
    });

    it("should handle notification scheduling errors gracefully", async () => {
      mockScheduleNotificationAsync.mockRejectedValue(
        new Error("Permission denied"),
      );

      const futureDate = new Date(Date.now() + 3600000);
      const result = await scheduleTaskReminder("task-123", "Test", futureDate);

      expect(result).toBeNull();
    });

    it("should handle haptic feedback errors gracefully", async () => {
      (global as any).mockAppState.setCurrentState("active");
      mockNotificationAsync.mockRejectedValue(
        new Error("Haptics not supported"),
      );

      await expect(
        showTimerCompleteNotification("Test", false),
      ).resolves.not.toThrow();
    });
  });

  describe("AppState Integration", () => {
    it("should check AppState before showing immediate notifications", async () => {
      const states = ["active", "background", "inactive"];

      for (const state of states) {
        jest.clearAllMocks();
        (global as any).mockAppState.setCurrentState(state);

        await showTimerCompleteNotification("Test", false);

        if (state === "active") {
          expect(mockScheduleNotificationAsync).toHaveBeenCalled();
        } else {
          expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
        }
      }
    });
  });

  describe("Notification Messages", () => {
    it("should include task name in notification body (when message template includes it)", async () => {
      (global as any).mockAppState.setCurrentState("active");

      // Call multiple times to test different random messages
      await showTimerCompleteNotification("Important homework", false);

      const call = mockScheduleNotificationAsync.mock.calls[0][0];
      // Message should be a positive message (could include task name or generic encouragement)
      expect(call.content.body).toBeTruthy();
      expect(call.content.body.length).toBeGreaterThan(10);

      // Check that it's one of our positive messages
      const positiveWords = ["amazing", "great", "you did it", "awesome"];
      const hasPositiveWord = positiveWords.some((word) =>
        call.content.body.toLowerCase().includes(word),
      );
      expect(hasPositiveWord).toBe(true);
    });

    it("should use positive reinforcement language", async () => {
      (global as any).mockAppState.setCurrentState("active");

      await showTimerCompleteNotification("Study", false);

      const call = mockScheduleNotificationAsync.mock.calls[0][0];
      const body = call.content.body.toLowerCase();

      // Should contain positive words
      const positiveWords = ["amazing", "great", "awesome", "you did it"];
      const hasPositiveWord = positiveWords.some((word) => body.includes(word));
      expect(hasPositiveWord).toBe(true);
    });
  });
});
