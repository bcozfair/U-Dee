import { Stack } from 'expo-router';
import { useThemeContext } from '../../context/ThemeContext';

export default function FamilyLayout() {
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
                headerBackTitle: 'กลับ',
            }}
        >
            <Stack.Screen
                name="create"
                options={{ title: 'สร้างครอบครัว' }}
            />
            <Stack.Screen
                name="join"
                options={{ title: 'เข้าร่วมครอบครัว' }}
            />
        </Stack>
    );
}
