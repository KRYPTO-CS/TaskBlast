import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

jest.unmock("../app/context/NotificationContext");

const mockConfigureNotificationHandler = jest.fn();
const mockRequestNotificationPermissions = jest.fn();
const mockGetNotificationPreferences = jest.fn();
const mockSaveNotificationPreferences = jest.fn();
const mockScheduleTaskReminder = jest.fn();
const mockShowTimerCompleteNotification = jest.fn();
const mockCancelTaskNotifications = jest.fn();
const mockCancelAllNotifications = jest.fn();
const mockAddNotificationResponseListener = jest.fn();
const mockScheduleDailyDigest = jest.fn();
const mockCancelDailyDigest = jest.fn();

jest.mock("../app/services/notificationService", () => ({
  ReminderTiming: {
    FIVE_MINUTES: 5,
  },
  configureNotificationHandler: () => mockConfigureNotificationHandler(),
  requestNotificationPermissions: () => mockRequestNotificationPermissions(),
  getNotificationPreferences: () => mockGetNotificationPreferences(),
  saveNotificationPreferences: (...args: any[]) =>
    mockSaveNotificationPreferences(...args),
  scheduleTaskReminder: (...args: any[]) => mockScheduleTaskReminder(...args),
  showTimerCompleteNotification: (...args: any[]) =>
    mockShowTimerCompleteNotification(...args),
  cancelTaskNotifications: (...args: any[]) =>
    mockCancelTaskNotifications(...args),
  cancelAllNotifications: () => mockCancelAllNotifications(),
  addNotificationResponseListener: (...args: any[]) =>
    mockAddNotificationResponseListener(...args),
  scheduleDailyDigest: (...args: any[]) => mockScheduleDailyDigest(...args),
  cancelDailyDigest: () => mockCancelDailyDigest(),
}));

import * as Notifications from "expo-notifications";
import {
  NotificationProvider,
  useNotifications,
} from "../app/context/NotificationContext";

function Probe() {
  const ctx = useNotifications();

  return (
    <>
      <Text testID="enabled">{ctx.preferences.enabled ? "yes" : "no"}</Text>
      <Text testID="granted">{ctx.permissionGranted ? "yes" : "no"}</Text>
      <TouchableOpacity
        testID="update"
        onPress={() => {
          void ctx.updatePreferences({ enabled: false });
        }}
      />
      <TouchableOpacity
        testID="request"
        onPress={() => {
          void ctx.requestPermissions();
        }}
      />
    </>
  );
}

describe("NotificationContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetNotificationPreferences.mockResolvedValue({
      enabled: true,
      soundEnabled: false,
      vibrationEnabled: true,
      visualOnly: false,
      reminderTiming: 5,
      repeatNotifications: false,
      maxNotificationsPerHour: 4,
      dailyDigestEnabled: true,
      dailyDigestTime: "15:00",
    });

    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: "granted",
    });

    mockAddNotificationResponseListener.mockReturnValue({
      remove: jest.fn(),
    });

    mockRequestNotificationPermissions.mockResolvedValue(true);
    mockSaveNotificationPreferences.mockResolvedValue(undefined);
    mockScheduleDailyDigest.mockResolvedValue("digest-id");
  });

  it("throws when useNotifications is used outside provider", () => {
    function BadConsumer() {
      useNotifications();
      return null;
    }

    expect(() => render(<BadConsumer />)).toThrow(
      "useNotifications must be used within a NotificationProvider",
    );
  });

  it("initializes handler, preferences, and permission state", async () => {
    const { getByTestId } = render(
      <NotificationProvider>
        <Probe />
      </NotificationProvider>,
    );

    await waitFor(() => {
      expect(mockConfigureNotificationHandler).toHaveBeenCalled();
      expect(getByTestId("enabled").props.children).toBe("yes");
      expect(getByTestId("granted").props.children).toBe("yes");
    });
  });

  it("updates preferences via updatePreferences", async () => {
    const { getByTestId } = render(
      <NotificationProvider>
        <Probe />
      </NotificationProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("enabled").props.children).toBe("yes");
    });

    fireEvent.press(getByTestId("update"));

    await waitFor(() => {
      expect(mockSaveNotificationPreferences).toHaveBeenCalledWith({
        enabled: false,
      });
      expect(getByTestId("enabled").props.children).toBe("no");
    });
  });

  it("requests notification permissions", async () => {
    const { getByTestId } = render(
      <NotificationProvider>
        <Probe />
      </NotificationProvider>,
    );

    fireEvent.press(getByTestId("request"));

    await waitFor(() => {
      expect(mockRequestNotificationPermissions).toHaveBeenCalled();
      expect(getByTestId("granted").props.children).toBe("yes");
    });
  });
});
