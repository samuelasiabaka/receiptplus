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
        // Only check for updates if Updates is available and enabled
        if (!Updates.isEnabled) {
          console.log('Updates are not enabled');
          return;
        }

        const update = await Updates.checkForUpdateAsync();
        
        if (update.isAvailable) {
          console.log('Update available, downloading...');
          // Download the update
          const result = await Updates.fetchUpdateAsync();
          
          if (result.isNew) {
            console.log('New update downloaded, reloading app...');
            // Reload the app to apply the update
            await Updates.reloadAsync();
          } else {
            console.log('Update already downloaded');
          }
        } else {
          console.log('No updates available');
        }
      } catch (error) {
        // Log error but don't interrupt user experience
        console.error('Update check failed:', error);
      }
    };

    // Check for updates after a short delay to not block app startup
    const timeoutId = setTimeout(() => {
      checkForUpdates();
    }, 1000);

    return () => clearTimeout(timeoutId);
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
