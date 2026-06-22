import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchDeal } from '../../src/services/api';
import { normalizeText } from '../../src/utils/normalize-text';
import { colors } from '../../src/theme/colors';
import { sharedStyles } from '../../src/theme/styles';
import type { Deal } from '../../src/types';

function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-MA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const PRIORITY_BADGES = [
  'Offre éclair',
  'Le meilleur prix',
  'Bon prix',
  'Bon deal',
] as const;

function getVisibleTags(tags: string[]): string[] {
  const nonTransit = tags.filter((t) => !t.toLowerCase().startsWith('transit:'));
  const topBadge = PRIORITY_BADGES.find((badge) => nonTransit.includes(badge));
  return topBadge ? [topBadge] : [];
}

function getTransitAirport(tags: string[]): string | null {
  const tag = tags.find((t) => t.toLowerCase().startsWith('transit:'));
  return tag ? (tag.split(':')[1]?.trim().toUpperCase() ?? null) : null;
}

export default function DealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDeal(id);
      setDeal(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Impossible de charger cette offre.',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleBook = () => {
    if (deal?.bookingUrl) {
      Linking.openURL(deal.bookingUrl);
    }
  };

  return (
    <SafeAreaView style={sharedStyles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {deal ? `${deal.fromCity} → ${deal.toCity}` : 'Détail de l\'offre'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading && (
        <View style={sharedStyles.stateBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={sharedStyles.stateText}>Chargement de l&apos;offre…</Text>
        </View>
      )}

      {!loading && error && (
        <View style={sharedStyles.stateBox}>
          <Feather name="wifi-off" size={36} color={colors.muted} />
          <Text style={sharedStyles.stateText}>{error}</Text>
          <Pressable style={sharedStyles.retryButton} onPress={load}>
            <Text style={sharedStyles.retryButtonText}>Réessayer</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && deal && (
        <ScrollView
          style={sharedStyles.content}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero — route + badges */}
          <View style={styles.hero}>
            <View style={styles.heroBadgeRow}>
              <Text style={styles.countryCode}>{countryCodeToFlag(deal.countryCode)}</Text>
              {deal.isFlash && (
                <View style={styles.flashBadge}>
                  <Text style={styles.flashBadgeText}>⚡ Deal éclair</Text>
                </View>
              )}
              {deal.isFeatured && (
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>★ Coup de cœur</Text>
                </View>
              )}
            </View>

            <Text style={styles.routeTitle}>
              {deal.fromCity} → {deal.toCity}
            </Text>
            <Text style={styles.airportSubtitle}>
              {deal.fromAirport} → {deal.toAirport}
            </Text>

            {getTransitAirport(deal.tags) && (
              <View style={sharedStyles.transitBadge}>
                <Text style={sharedStyles.transitBadgeText}>
                  Escale {getTransitAirport(deal.tags)}
                </Text>
              </View>
            )}
          </View>

          {/* Prix */}
          <View style={[sharedStyles.card, styles.priceCard]}>
            <Text style={styles.priceLabel}>Prix à partir de</Text>
            <Text style={styles.price}>
              {(deal.priceMad ?? 0).toLocaleString('fr-MA')} MAD
            </Text>
          </View>

          {/* Infos vol */}
          <View style={sharedStyles.card}>
            <Text style={styles.sectionLabel}>Infos vol</Text>

            {deal.airline && (
              <InfoRow icon="airplay" label="Compagnie" value={deal.airline} />
            )}
            {deal.departureDate && (
              <InfoRow
                icon="calendar"
                label="Départ"
                value={formatDate(deal.departureDate)}
              />
            )}
            {deal.returnDate && (
              <InfoRow
                icon="calendar"
                label="Retour"
                value={formatDate(deal.returnDate)}
              />
            )}
            {!deal.departureDate && !deal.returnDate && (
              <Text style={styles.infoMuted}>
                Dates flexibles — voir sur le site de réservation
              </Text>
            )}
          </View>

          {/* Bagage */}
          {deal.fare && (
            <View style={sharedStyles.card}>
              <Text style={styles.sectionLabel}>Bagages inclus</Text>
              <InfoRow
                icon="package"
                label="Tarif"
                value={deal.fare.fareName}
              />
              {deal.fare.personalItem && (
                <InfoRow icon="briefcase" label="Bagage cabine" value="Inclus" />
              )}
              {deal.fare.cabinAllowed && (
                <InfoRow
                  icon="shopping-bag"
                  label="Bagage cabine"
                  value={
                    deal.fare.cabinWeightKg
                      ? `${deal.fare.cabinWeightKg} kg`
                      : 'Inclus'
                  }
                />
              )}
              {deal.fare.checkedAllowed && (
                <InfoRow
                  icon="archive"
                  label="Bagage en soute"
                  value={
                    deal.fare.checkedWeightKg
                      ? `${deal.fare.checkedWeightKg} kg`
                      : 'Inclus'
                  }
                />
              )}
            </View>
          )}

          {/* Tags */}
          {getVisibleTags(deal.tags).length > 0 && (
            <View style={styles.tagsRow}>
              {getVisibleTags(deal.tags).map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{normalizeText(tag)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Bouton réserver */}
          <Pressable
            style={({ pressed }) => [
              styles.bookButton,
              pressed && styles.bookButtonPressed,
            ]}
            onPress={handleBook}
          >
            <Text style={styles.bookButtonText}>Réserver →</Text>
          </Pressable>

          <Text style={styles.bookNote}>
            Tu seras redirigé vers le site de réservation.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

type InfoRowProps = {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
};

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={15} color={colors.muted} style={styles.infoIcon} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  backButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  headerTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: '900',
    marginHorizontal: 12,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  scroll: {
    padding: 18,
    paddingBottom: 48,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    marginBottom: 12,
    padding: 22,
  },
  heroBadgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  countryCode: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  flashBadge: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  flashBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  featuredBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  featuredBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  routeTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  airportSubtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 6,
  },
  priceCard: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoft,
    paddingVertical: 18,
  },
  priceLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  price: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: '900',
    marginTop: 4,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  infoRow: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingVertical: 10,
  },
  infoIcon: {
    marginRight: 10,
    width: 20,
  },
  infoLabel: {
    color: colors.muted,
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  infoValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
  },
  infoMuted: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
    marginTop: 4,
  },
  tag: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  bookButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    marginTop: 20,
    paddingVertical: 16,
  },
  bookButtonPressed: {
    opacity: 0.85,
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  bookNote: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
});
