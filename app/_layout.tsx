import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PortalProvider, TamaguiProvider, Theme } from 'tamagui';
import { CustomToast } from '../components/CustomToast';
import { ThemeProvider, useThemeContext } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import appConfig from '../tamagui.config';

function RootLayoutNav() {
  const { theme, isDark } = useThemeContext();

  return (
    <TamaguiProvider config={appConfig} defaultTheme={theme}>
      <PortalProvider shouldAddRootHost>
        <Theme name={theme}>
          <ToastProvider>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="map"
                options={{
                  title: 'ตำแหน่งของฉัน',
                  headerStyle: {
                    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                  },
                  headerTintColor: isDark ? '#ffffff' : '#1a1a1a',
                }}
              />
            </Stack>
            <CustomToast />
          </ToastProvider>
        </Theme>
      </PortalProvider>
    </TamaguiProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}