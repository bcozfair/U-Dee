import { Clock, Home, Settings, Users } from '@tamagui/lucide-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useThemeContext } from '../../context/ThemeContext';

export default function TabLayout() {
  const { isDark } = useThemeContext();

  const tabBarBg = isDark ? '#1a1a1a' : '#ffffff';
  const headerBg = isDark ? '#1a1a1a' : '#ffffff';
  const activeColor = isDark ? '#4cc9f0' : '#00ACC1';
  const inactiveColor = isDark ? '#888888' : '#999999';
  const borderColor = isDark ? '#333333' : '#e0e0e0';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopColor: borderColor,
          borderTopWidth: 1,
          height: Platform.OS === 'android' ? 75 : 60,
          paddingBottom: Platform.OS === 'android' ? 15 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: headerBg,
        },
        headerTintColor: isDark ? '#ffffff' : '#1a1a1a',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'อยู่ดี',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Home
              size={focused ? 28 : 24}
              color={color as any}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: 'ครอบครัว',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Users
              size={focused ? 28 : 24}
              color={color as any}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'ประวัติ',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Clock
              size={focused ? 28 : 24}
              color={color as any}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'ตั้งค่า',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Settings
              size={focused ? 28 : 24}
              color={color as any}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
    </Tabs>
  );
}