import AsyncStorage from '@react-native-async-storage/async-storage';

export const USER_KEYS = {
    AVATAR: 'user_avatar',
    NAME: 'user_name',
    EMERGENCY_CONTACT: 'emergency_contact',
    DARK_MODE: 'dark_mode',
};

export const DATA_KEYS = {
    HISTORY_LOG: 'history_log',
    LAST_LOCATION: 'last_location',
};

export const NOTIFICATION_KEYS = {
    ENABLED: 'notification_enabled',
    TIME: 'notification_time',
    ID: 'notification_id',
};

export const CHAT_KEYS = {
    HISTORY_PREFIX: 'mock_chat_history_',
};

/**
 * Generic Storage Utility
 */
export const storage = {
    /**
     * Save data to storage
     * @param key Storage key
     * @param value Data to save (string or object)
     */
    save: async (key: string, value: any): Promise<boolean> => {
        try {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            await AsyncStorage.setItem(key, stringValue);
            return true;
        } catch (error) {
            console.error(`Error saving data [${key}]:`, error);
            return false;
        }
    },

    /**
     * Get data from storage
     * @param key Storage key
     * @returns Parsed object or string, null if not found
     */
    get: async <T>(key: string): Promise<T | null> => {
        try {
            const value = await AsyncStorage.getItem(key);
            if (!value) return null;

            try {
                // Try to parse JSON
                return JSON.parse(value) as T;
            } catch {
                // Return raw string if not JSON
                return value as unknown as T;
            }
        } catch (error) {
            console.error(`Error loading data [${key}]:`, error);
            return null;
        }
    },

    /**
     * Remove data from storage
     * @param key Storage key
     */
    remove: async (key: string): Promise<boolean> => {
        try {
            await AsyncStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing data [${key}]:`, error);
            return false;
        }
    },

    /**
     * Clear multiple keys
     * @param keys Array of keys to remove
     */
    multiRemove: async (keys: string[]): Promise<boolean> => {
        try {
            await AsyncStorage.multiRemove(keys);
            return true;
        } catch (error) {
            console.error('Error removing multiple keys:', error);
            return false;
        }
    },

    /**
     * Clear all storage (use with caution)
     */
    clearAll: async (): Promise<boolean> => {
        try {
            await AsyncStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing all storage:', error);
            return false;
        }
    }
};
