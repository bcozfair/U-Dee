import { Stack } from 'expo-router';
import { useThemeContext } from '../../context/ThemeContext';

export default function AuthLayout() {
    const { isDark } = useThemeContext();

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                },
                headerTintColor: isDark ? '#ffffff' : '#1a1a1a',
                headerTitleStyle: {
                    fontFamily: 'InterBold',
                },
            }}
        >
            <Stack.Screen
                name="login"
                options={{
                    title: 'เข้าสู่ระบบ',
                    headerShown: false
                }}
            />
            <Stack.Screen
                name="register"
                options={{
                    title: 'ลงทะเบียน',
                    headerBackTitle: 'กลับ',
                }}
            />
        </Stack>
    );
}
