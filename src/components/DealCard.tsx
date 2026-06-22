import { useRouter } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { sharedStyles as styles } from '../theme/styles';
import type { Airline, AirlineFare, Deal } from '../types';
import { getTransitAirport } from '../utils/deals';
import { formatDate, formatMad } from '../utils/format';
import { normalizeText } from '../utils/normalize-text';
import { FavoriteButton } from './FavoriteButton';
import { VisaBadge } from './VisaBadge';

const PRIORITY_BADGES = [
  'Offre éclair',
  'Le meilleur prix',
  'Bon prix',
  'Bon deal',
] as const;

function getTopPriorityBadge(tags: string[]): string | null {
  return PRIORITY_BADGES.find((badge) => tags.includes(badge)) ?? null;
}

function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

type AirlineLogoData = Pick<Airline, 'code' | 'logoUrl'>;

function AirlineLogo({ airline }: { airline: AirlineLogoData | null }) {
  const [loadError, setLoadError] = useState(false);

  if (!airline) return null;

  const showImage = !!airline.logoUrl && !loadError;
  const hasCode = airline.code.length > 0;

  if (!showImage && !hasCode) return null;

  return (
    <View style={airlineLogoStyles.container}>
      {showImage ? (
        <Image
          source={{ uri: airline.logoUrl as string }}
          style={airlineLogoStyles.image}
          resizeMode="contain"
          onError={() => setLoadError(true)}
        />
      ) : (
        <Text style={airlineLogoStyles.fallbackText}>{airline.code}</Text>
      )}
    </View>
  );
}

type FeatherName = ComponentProps<typeof Feather>['name'];

function BaggageRow({ fare }: { fare: AirlineFare | null }) {
  if (!fare) return null;

  const items: Array<{ key: string; icon: FeatherName; label: string }> = [];

  if (fare.personalItem) {
    items.push({ key: 'personal', icon: 'shopping-bag', label: 'Sac à main' });
  }

  if (fare.cabinAllowed) {
    items.push({
      key: 'cabin',
      icon: 'briefcase',
      label:
        fare.cabinWeightKg != null
          ? `Cabine ${fare.cabinWeightKg}kg`
          : 'Cabine',
    });
  }

  if (fare.checkedAllowed) {
    const base =
      fare.checkedWeightKg != null
        ? `Soute ${fare.checkedWeightKg}kg`
        : 'Soute';
    const label = fare.checkedCount > 1 ? `${fare.checkedCount}× ${base}` : base;
    items.push({ key: 'checked', icon: 'package', label });
  }

  if (items.length === 0) {
    return (
      <View style={baggageStyles.row}>
        <Text style={baggageStyles.emptyLabel}>Aucun bagage inclus</Text>
      </View>
    );
  }

  return (
    <View style={baggageStyles.row}>
      {items.map((item) => (
        <View key={item.key} style={baggageStyles.item}>
          <Feather name={item.icon} size={14} color={colors.muted} />
          <Text style={baggageStyles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const dealCardStyles = StyleSheet.create({
  directBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  directBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent + '26',
    borderRadius: 999,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  priorityBadgeText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '900',
  },
});

const baggageStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: colors.muted,
  },
  emptyLabel: {
    fontSize: 12,
    color: colors.muted,
    fontStyle: 'italic',
  },
});

const airlineLogoStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    zIndex: 10,
  },
  image: {
    width: 40,
    height: 40,
  },
  fallbackText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
});

export function DealCard({ deal, compact }: { deal: Deal; compact?: boolean }) {
  const router = useRouter();
  const departureDate = formatDate(deal.departureDate);
  const returnDate = formatDate(deal.returnDate);
  const transitAirport = getTransitAirport(deal.tags);
  const topBadge = getTopPriorityBadge(deal.tags);

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/deal/${deal.id}`)}>
      <AirlineLogo airline={deal.airlineDetails} />
      <FavoriteButton deal={deal} />
      <View style={styles.cardTop}>
        <View style={styles.cardMain}>
          <View style={[styles.badgeRow, { paddingLeft: 40 }]}>
            <Text style={styles.countryCode}>{countryCodeToFlag(deal.countryCode)}</Text>
            <VisaBadge visaType={deal.visaType} />
          </View>
          <Text style={styles.cardTitle}>
            {deal.fromCity} → {deal.toCity}
          </Text>
          <Text style={styles.cardSubtitle}>
            {deal.fromAirport} → {deal.toAirport}
          </Text>
          {transitAirport ? (
            <View style={styles.transitBadge}>
              <Text style={styles.transitBadgeText}>
                Transit via {transitAirport}
              </Text>
            </View>
          ) : (
            <View style={dealCardStyles.directBadge}>
              <Text style={dealCardStyles.directBadgeText}>✈️ Vol direct</Text>
            </View>
          )}
          {topBadge && (
            <View style={dealCardStyles.priorityBadge}>
              <Text style={dealCardStyles.priorityBadgeText}>
                {normalizeText(topBadge)}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>À partir de</Text>
          <Text style={styles.price}>{formatMad(deal.priceMad)}</Text>
        </View>
      </View>

      {!compact && (
        <View style={styles.detailList}>
          {deal.airline && (
            <Text style={styles.detail}>Compagnie: {deal.airline}</Text>
          )}
          {departureDate && (
            <Text style={styles.detail}>Départ: {departureDate}</Text>
          )}
          {returnDate && (
            <Text style={styles.detail}>Retour: {returnDate}</Text>
          )}
        </View>
      )}

      {!compact && <BaggageRow fare={deal.fare} />}

      <Pressable
        style={styles.cardButton}
        onPress={() => {
          const url = deal.bookingUrl;
          if (!url.startsWith('https://') && !url.startsWith('http://')) return;
          Linking.canOpenURL(url)
            .then((supported) => {
              if (supported) Linking.openURL(url);
            })
            .catch(() => {});
        }}
      >
        <Text style={styles.cardButtonText}>Voir l'offre</Text>
      </Pressable>
    </Pressable>
  );
}
