import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { FundlyColors } from '@/constants/theme';
import { AuthProvider } from '@/context/auth';

SplashScreen.preventAutoHideAsync();

/**
 * Root layout: wraps the entire app in a Stack so that screens pushed outside
 * the (tabs) group (add-transaction, auth, settings) fully cover the native
 * tab bar instead of rendering alongside it.
 */
export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: FundlyColors.background },
          }}>
          {/* (tabs) group — contains NativeTabs with the 5 primary screens */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* Full-screen stack screens — tab bar is hidden by the Stack overlay */}
          <Stack.Screen name="add-transaction" options={{ headerShown: false, animation: 'slide_from_bottom', presentation: 'modal' }} />
          <Stack.Screen name="settings" options={{ headerShown: false, animation: 'slide_from_right', presentation: 'modal' }} />
          <Stack.Screen name="auth" options={{ headerShown: false, presentation: 'modal' }} />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
