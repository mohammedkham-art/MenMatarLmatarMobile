import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppDataProvider } from '../src/context/AppDataContext';
import { FavoritesProvider } from '../src/context/FavoritesContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppDataProvider>
        <FavoritesProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </FavoritesProvider>
      </AppDataProvider>
    </SafeAreaProvider>
  );
}
