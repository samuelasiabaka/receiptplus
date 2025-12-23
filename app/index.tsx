import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { initDb } from '@/lib/database';
import { getBusinessProfile } from '@/lib/storage';
import LoadingView from '@/components/loading-view';

export default function Index() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAndRedirect = async () => {
      const startTime = Date.now();
      const MIN_LOADING_TIME = 1500; // Minimum 1.5 seconds to allow icons to load
      
      try {
        await initDb();
        const profile = await getBusinessProfile();
        
        // Calculate remaining time to meet minimum loading duration
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MIN_LOADING_TIME - elapsed);
        
        // Wait for remaining time if needed
        if (remaining > 0) {
          await new Promise(resolve => setTimeout(resolve, remaining));
        }
        
        if (profile) {
          // Profile exists, go to home
          router.replace('/(tabs)');
        } else {
          // No profile, go to onboarding
          router.replace('/onboarding');
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        // On error, go to onboarding
        router.replace('/onboarding');
      } finally {
        setIsChecking(false);
      }
    };

    checkAndRedirect();
  }, [router]);

  if (isChecking) {
    return <LoadingView message="Loading..." />;
  }

  return null;
}

