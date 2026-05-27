import { useState, type ComponentProps } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { sharedStyles as styles } from '../theme/styles';
import type { Airline, AirlineFare, Deal } from '../types';
import { getFreshnessLabel, getTransitAirport } from '../utils/deals';
import { formatDate, formatMad } from '../utils/format';
import { FavoriteButton } from './FavoriteButton';
import { VisaBadge } from './VisaBadge';

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
    width: 32,
    height: 32,
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
    width: 28,
    height: 28,
  },
  fallbackText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
});

export function DealCard({ deal, compact }: { deal: Deal; compact?: boolean }) {
  const departureDate = formatDate(deal.departureDate);
  const returnDate = formatDate(deal.returnDate);
  const transitAirport = getTransitAirport(deal.tags);

  return (
    <View style={styles.card}>
      <AirlineLogo airline={deal.airlineDetails} />
      <FavoriteButton deal={deal} />
      <View style={styles.cardTop}>
        <View style={styles.cardMain}>
          <Text style={styles.freshness}>{getFreshnessLabel(deal)}</Text>
          <View style={styles.badgeRow}>
            <Text style={styles.countryCode}>{deal.countryCode}</Text>
            <VisaBadge visaType={deal.visaType} />
          </View>
          <Text style={styles.cardTitle}>
            {deal.fromCity} → {deal.toCity}
          </Text>
          <Text style={styles.cardSubtitle}>
            {deal.fromAirport} → {deal.toAirport}
          </Text>
          {transitAirport && (
            <View style={styles.transitBadge}>
              <Text style={styles.transitBadgeText}>
                Transit via {transitAirport}
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
    </View>
  );
}
