import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PortalProvider, TamaguiProvider, Theme } from 'tamagui';
import { CustomToast } from '../components/CustomToast';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useThemeContext } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import appConfig from '../tamagui.config';

function RootLayoutNav() {
  const { theme, isDark } = useThemeContext();
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!session && !inAuthGroup) {
      // Redirect to the sign-in page.
      router.replace('/auth/login');
    } else if (session && inAuthGroup) {
      // Redirect away from the sign-in page.
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  return (
    <TamaguiProvider config={appConfig} defaultTheme={theme}>
      <PortalProvider shouldAddRootHost>
        <Theme name={theme}>
          <ToastProvider>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="family" options={{ headerShown: false }} />
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
      <AuthProvider>
        <ThemeProvider>
          <RootLayoutNav />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}