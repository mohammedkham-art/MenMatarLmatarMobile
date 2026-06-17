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

  // Effect 1 — load push state, decide if onboarding is needed, then mark ready.
  // Navigation is intentionally NOT triggered here: calling router.replace before
  // <Stack> is mounted (ready=false) caused Expo Router to unmount/remount the
  // root layout in an infinite loop.
  useEffect(() => {
    let cancelled = false;
    let rotationSubscription: { remove: () => void } | null = null;

    (async () => {
      try {
        const state = await loadPushState();
        if (cancelled) return;

        if (!state.onboardingDone) {
          setPendingRoute('/onboarding');
        } else if (state.token !== null) {
          // Background refresh + token-rotation listener: only if we
          // already have a token (i.e. permission was granted before).
          ensurePushTokenRegistered().catch(() => undefined);
          rotationSubscription = subscribeToTokenRotation();
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

  // Effect 2 — navigate only after <Stack> is mounted (ready=true).
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
