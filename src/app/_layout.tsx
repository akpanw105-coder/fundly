import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/context/auth';

SplashScreen.preventAutoHideAsync();

/**
 * Root layout: wraps the entire app in a Stack so that screens pushed outside
 * the (tabs) group (add-transaction, auth, settings) fully cover the native
 * tab bar instead of rendering alongside it.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          {/* (tabs) group — contains NativeTabs with the 5 primary screens */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* Full-screen stack screens — tab bar is hidden by the Stack overlay */}
          <Stack.Screen name="add-transaction" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="settings" options={{ headerShown: false, animation: 'slide_from_right' }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
