import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NOTIFICATION_KEYS, storage } from '../utils/storage';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export interface NotificationSettings {
    enabled: boolean;
    hour: number;
    minute: number;
}

// Get default notification time (9:00 AM)
export const getDefaultNotificationSettings = (): NotificationSettings => ({
    enabled: false,
    hour: 9,
    minute: 0,
});

// Request permission for notifications
export const requestNotificationPermission = async (): Promise<boolean> => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        return false;
    }

    // For Android, set notification channel
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('daily-reminder', {
            name: 'แจ้งเตือนประจำวัน',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#00ACC1',
        });
    }

    return true;
};

// Load notification settings from AsyncStorage
export const loadNotificationSettings = async (): Promise<NotificationSettings> => {
    try {
        const enabled = await storage.get<string | boolean>(NOTIFICATION_KEYS.ENABLED);
        const timeSettings = await storage.get<{ hour: number, minute: number }>(NOTIFICATION_KEYS.TIME);

        const defaultSettings = getDefaultNotificationSettings();

        return {
            enabled: enabled === 'true' || enabled === true,
            hour: timeSettings?.hour ?? defaultSettings.hour,
            minute: timeSettings?.minute ?? defaultSettings.minute,
        };
    } catch (error) {
        console.error('Error loading notification settings:', error);
        return getDefaultNotificationSettings();
    }
};

// Save notification settings
export const saveNotificationSettings = async (settings: Partial<NotificationSettings>): Promise<void> => {
    try {
        if (settings.enabled !== undefined) {
            await storage.save(NOTIFICATION_KEYS.ENABLED, settings.enabled.toString());
        }
        if (settings.hour !== undefined && settings.minute !== undefined) {
            await storage.save(NOTIFICATION_KEYS.TIME, JSON.stringify({
                hour: settings.hour,
                minute: settings.minute,
            }));
        }
    } catch (error) {
        console.error('Error saving notification settings:', error);
    }
};



// Schedule daily notification
export const scheduleDailyNotification = async (hour: number, minute: number): Promise<string | null> => {
    try {
        // Cancel any existing notification
        await cancelScheduledNotification();

        // Schedule new notification
        const identifier = await Notifications.scheduleNotificationAsync({
            content: {
                title: '💚 อยู่ดีไหม?',
                body: 'อย่าลืมเช็คอินวันนี้นะครับ 🌟',
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
            },
        });

        // Save notification ID
        await storage.save(NOTIFICATION_KEYS.ID, identifier);

        return identifier;
    } catch (error) {
        console.error('Error scheduling notification:', error);
        return null;
    }
};

// Cancel scheduled notification
export const cancelScheduledNotification = async (): Promise<void> => {
    try {
        const notificationId = await storage.get<string>(NOTIFICATION_KEYS.ID);

        if (notificationId) {
            await Notifications.cancelScheduledNotificationAsync(notificationId);
            await storage.remove(NOTIFICATION_KEYS.ID);
        }
    } catch (error) {
        console.error('Error canceling notification:', error);
    }
};

// Toggle notifications on/off
export const toggleNotifications = async (
    enabled: boolean,
    hour: number,
    minute: number
): Promise<boolean> => {
    if (enabled) {
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
            return false;
        }

        const id = await scheduleDailyNotification(hour, minute);
        if (!id) {
            return false;
        }
    } else {
        await cancelScheduledNotification();
    }

    await saveNotificationSettings({ enabled, hour, minute });
    return true;
};

// Format time for display
export const formatTime = (hour: number, minute: number): string => {
    const h = hour.toString().padStart(2, '0');
    const m = minute.toString().padStart(2, '0');
    return `${h}:${m}`;
};
