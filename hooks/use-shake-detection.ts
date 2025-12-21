import { useEffect } from 'react';
import { Accelerometer } from 'expo-sensors';
import { useRouter } from 'expo-router';

const SHAKE_THRESHOLD = 1.5;
const SHAKE_TIMEOUT = 1000;

let lastShakeTime = 0;
let lastX = 0;
let lastY = 0;
let lastZ = 0;

export function useShakeDetection() {
  const router = useRouter();

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const handleAccelerometer = (data: { x: number; y: number; z: number }) => {
      const { x, y, z } = data;
      const currentTime = Date.now();

      // Calculate acceleration difference
      const deltaX = Math.abs(x - lastX);
      const deltaY = Math.abs(y - lastY);
      const deltaZ = Math.abs(z - lastZ);

      // Check if shake threshold is exceeded
      if (deltaX > SHAKE_THRESHOLD || deltaY > SHAKE_THRESHOLD || deltaZ > SHAKE_THRESHOLD) {
        // Prevent multiple shakes within timeout period
        if (currentTime - lastShakeTime > SHAKE_TIMEOUT) {
          lastShakeTime = currentTime;
          // Navigate to help guide
          router.push('/help-guide' as any);
        }
      }

      lastX = x;
      lastY = y;
      lastZ = z;
    };

    // Set update interval to 100ms for responsive detection
    Accelerometer.setUpdateInterval(100);
    subscription = Accelerometer.addListener(handleAccelerometer);

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [router]);
}

