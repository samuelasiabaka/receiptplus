import { useEffect } from 'react';
import { Platform } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useShakeDetection } from '@/hooks/use-shake-detection';
import { initDb } from '@/lib/database';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useShakeDetection(); // Enable shake to open help guide

  useEffect(() => {
    // Initialize database on app start (native platforms only)
    // Web platform uses a stub that does nothing
    initDb();

    // Check for updates on app launch (only in production builds)
    if (__DEV__) {
      // In development, skip update checking
      return;
    }

    const checkForUpdates = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        
        if (update.isAvailable) {
          // Download the update in the background
          await Updates.fetchUpdateAsync();
          // Reload the app to apply the update
          await Updates.reloadAsync();
        }
      } catch (error) {
        // Silently fail - don't interrupt user experience
        console.log('Update check failed:', error);
      }
    };

    checkForUpdates();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="create-receipt" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="receipt-preview" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="business-profile" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="inventory" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="help-guide" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
