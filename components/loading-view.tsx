import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Animated } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface LoadingViewProps {
  message?: string;
}

export default function LoadingView({ message = 'Loading...' }: LoadingViewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Create pulsing animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [scaleAnim]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.logoContainer}>
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={require('@/assets/images/receiptplus-logo-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
        <ActivityIndicator
          size="small"
          color={colors.tint}
          style={styles.loader}
        />
      </View>
      <Text style={[styles.appName, { color: colors.text }]}>receiptplus</Text>
      {message && (
        <Text style={[styles.message, { color: colors.tabIconDefault }]}>{message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 12,
  },
  loader: {
    marginTop: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'lowercase',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});

