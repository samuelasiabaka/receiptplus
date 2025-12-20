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
      try {
        await initDb();
        const profile = await getBusinessProfile();
        
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

