import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  disablePushNotifications,
  ensurePushTokenRegistered,
} from '../src/services/push-orchestration';
import { loadPushState, type PushState } from '../src/services/push-storage';
import { colors } from '../src/theme/colors';

export default function SettingsScreen() {
  const router = useRouter();
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [permissionHint, setPermissionHint] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setState(await loadPushState());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleEnable = async () => {
    if (busy) return;
    setBusy(true);
    setPermissionHint(null);
    const result = await ensurePushTokenRegistered();
    if (result.reason === 'permission_denied') {
      setPermissionHint(
        "Tu as refusé les notifications dans les paramètres système. Ouvre les paramètres Android pour les autoriser, puis reviens ici.",
      );
    }
    await refresh();
    setBusy(false);
  };

  const handleDisable = () => {
    if (busy) return;
    Alert.alert(
      'Désactiver les notifications',
      'Tu ne recevras plus de notifications. Tu peux réactiver à tout moment.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Désactiver',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            const result = await disablePushNotifications();
            if (!result.ok) {
              Alert.alert(
                'Échec de la désactivation',
                'La désactivation n’a pas pu aboutir. Vérifie ta connexion et réessaie.',
              );
            }
            await refresh();
            setBusy(false);
          },
        },
      ],
    );
  };

  const handleOpenSystemSettings = () => {
    void Linking.openSettings();
  };

  const enabled = state?.token != null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={10}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Réglages</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Notifications</Text>

        <View style={styles.card}>
          <View style={styles.statusRow}>
            <Feather
              name={enabled ? 'check-circle' : 'bell-off'}
              size={20}
              color={enabled ? colors.green : colors.muted}
            />
            <Text
              style={[
                styles.statusText,
                enabled ? styles.statusOn : styles.statusOff,
              ]}
            >
              {enabled
                ? 'Notifications activées'
                : 'Notifications désactivées'}
            </Text>
          </View>

          <Text style={styles.statusHint}>
            {enabled
              ? 'Tu reçois jusqu’à 1 notification par jour pour les meilleurs deals depuis le Maroc.'
              : 'Active-les pour ne rater aucun deal éclair, sans spam (max 1/jour).'}
          </Text>

          {permissionHint && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>{permissionHint}</Text>
              <Pressable
                onPress={handleOpenSystemSettings}
                style={({ pressed }) => [
                  styles.warningBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.warningBtnText}>
                  Ouvrir les paramètres système
                </Text>
              </Pressable>
            </View>
          )}

          {enabled ? (
            <Pressable
              onPress={handleDisable}
              style={({ pressed }) => [
                styles.dangerBtn,
                pressed && styles.pressed,
                busy && styles.disabledBtn,
              ]}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Désactiver les notifications"
            >
              <Text style={styles.dangerBtnText}>
                {busy ? 'Désactivation…' : 'Désactiver les notifications'}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleEnable}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.pressed,
                busy && styles.disabledBtn,
              ]}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Activer les notifications"
            >
              <Text style={styles.primaryBtnText}>
                {busy ? 'Activation…' : 'Activer les notifications'}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  headerSpacer: {
    width: 36,
  },
  scroll: {
    padding: 18,
    paddingBottom: 40,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '900',
  },
  statusOn: {
    color: colors.green,
  },
  statusOff: {
    color: colors.muted,
  },
  statusHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  warningBox: {
    backgroundColor: colors.orangeSoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    color: colors.orange,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginBottom: 10,
  },
  warningBtn: {
    backgroundColor: colors.orange,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  warningBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  dangerBtn: {
    backgroundColor: colors.dangerSoft,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  dangerBtnText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '900',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.75,
  },
});
