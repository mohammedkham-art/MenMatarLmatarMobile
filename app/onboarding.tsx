import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ensurePushTokenRegistered } from '../src/services/push-orchestration';
import { savePushState } from '../src/services/push-storage';
import { colors } from '../src/theme/colors';

type FeatherName = ComponentProps<typeof Feather>['name'];

const BENEFITS: Array<{ icon: FeatherName; label: string }> = [
  { icon: 'zap', label: 'Deals éclair envoyés en direct' },
  { icon: 'trending-down', label: 'Notification quand un prix descend dans ta région' },
  { icon: 'shield', label: 'Anti-spam : max 1 notification par jour' },
  { icon: 'gift', label: '100% gratuit, désactivable à tout moment' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const finishOnboarding = async () => {
    await savePushState({ onboardingDone: true });
    router.replace('/(tabs)');
  };

  const handleEnable = async () => {
    if (busy) return;
    setBusy(true);
    const result = await ensurePushTokenRegistered();

    if (result.reason === 'permission_denied') {
      setMessage('Tu peux activer plus tard depuis Réglages.');
      setTimeout(() => {
        void finishOnboarding();
      }, 2500);
      return;
    }

    // Includes 'first_register', 'skipped', 'no_device', 'error', etc.
    // In every case we proceed to the tabs — the onboarding screen
    // must never block the user.
    await finishOnboarding();
  };

  const handleLater = async () => {
    if (busy) return;
    setBusy(true);
    await finishOnboarding();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoWrap}>
          <Image
            source={require('../assets/logo-sticker.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Reste à jour sur les bons plans</Text>
        <Text style={styles.subtitle}>
          Active les notifications pour ne rater aucun deal éclair depuis le Maroc.
        </Text>

        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b.label} style={styles.benefitRow}>
              <View style={styles.iconBubble}>
                <Feather name={b.icon} size={18} color={colors.primary} />
              </View>
              <Text style={styles.benefitText}>{b.label}</Text>
            </View>
          ))}
        </View>

        {message && (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        )}

        <Pressable
          onPress={handleEnable}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Activer les notifications"
        >
          <Text style={styles.primaryBtnText}>
            {busy ? 'Activation…' : 'Activer les notifications'}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleLater}
          style={({ pressed }) => [styles.laterBtn, pressed && styles.pressed]}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Plus tard"
        >
          <Text style={styles.laterBtnText}>Plus tard</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    padding: 28,
    paddingBottom: 40,
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 26,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  benefits: {
    gap: 12,
    marginBottom: 24,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    flex: 1,
  },
  messageBox: {
    backgroundColor: colors.orangeSoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  messageText: {
    color: colors.orange,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  laterBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  laterBtnText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.7,
  },
});
