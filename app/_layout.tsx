import { type Href, Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppDataProvider } from '../src/context/AppDataContext';
import { FavoritesProvider } from '../src/context/FavoritesContext';
import {
  ensurePushTokenRegistered,
  subscribeToTokenRotation,
} from '../src/services/push-orchestration';
import { loadPushState } from '../src/services/push-storage';

export default function RootLayout() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<Href | null>(null);

  useEffect(() => {
    let cancelled = false;
    let rotationSubscription: { remove: () => void } | null = null;

    (async () => {
      try {
        const state = await loadPushState();
        if (cancelled) return;

        if (!state.onboardingDone && !__DEV__) {
          setPendingRoute('/onboarding');
        } else {
          // Toujours tenter l'enregistrement après l'onboarding :
          // gère le premier enregistrement, le changement de token,
          // le refresh 24h et le changement de version.
          ensurePushTokenRegistered().catch(() => undefined);
          if (state.token !== null) {
            // L'écouteur de rotation n'est utile qu'une fois qu'on a un token.
            rotationSubscription = subscribeToTokenRotation();
          }
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
      rotationSubscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (ready && pendingRoute !== null) {
      router.replace(pendingRoute);
    }
  }, [ready, pendingRoute, router]);

  return (
    <SafeAreaProvider>
      <AppDataProvider>
        <FavoritesProvider>
          <StatusBar style="dark" />
          {ready ? (
            <Stack screenOptions={{ headerShown: false }} />
          ) : (
            <View style={{ flex: 1, backgroundColor: '#ffffff' }} />
          )}
        </FavoritesProvider>
      </AppDataProvider>
    </SafeAreaProvider>
  );
}