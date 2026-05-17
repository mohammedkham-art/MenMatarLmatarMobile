import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState } from '../../src/components/ErrorState';
import { FloatingTabBar } from '../../src/components/FloatingTabBar';
import { Header } from '../../src/components/Header';
import { LoadingState } from '../../src/components/LoadingState';
import { useAppData } from '../../src/context/AppDataContext';
import { sharedStyles as styles } from '../../src/theme/styles';

export default function TabsLayout() {
  const { isLoading, loadError, retry } = useAppData();

  if (isLoading || loadError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.appShell}>
          <Header />
          {isLoading ? (
            <LoadingState />
          ) : (
            <ErrorState message={loadError ?? ''} onRetry={retry} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.appShell}>
        <Header />
        <Tabs
          screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
          tabBar={(props) => <FloatingTabBar {...props} />}
        >
          <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
          <Tabs.Screen name="deals" options={{ title: 'Offres' }} />
          <Tabs.Screen name="destinations" options={{ title: 'Destinations' }} />
          <Tabs.Screen name="simulator" options={{ title: 'Simulateur IA' }} />
          <Tabs.Screen name="favorites" options={{ title: 'Favoris' }} />
        </Tabs>
      </View>
    </SafeAreaView>
  );
}
