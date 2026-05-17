import { Linking, Pressable, Text, View } from 'react-native';

import { sharedStyles as styles } from '../theme/styles';
import type { Deal } from '../types';
import { getFreshnessLabel, getTransitAirport } from '../utils/deals';
import { formatDate, formatMad } from '../utils/format';
import { FavoriteButton } from './FavoriteButton';
import { VisaBadge } from './VisaBadge';

export function DealCard({ deal, compact }: { deal: Deal; compact?: boolean }) {
  const departureDate = formatDate(deal.departureDate);
  const returnDate = formatDate(deal.returnDate);
  const transitAirport = getTransitAirport(deal.tags);

  return (
    <View style={styles.card}>
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
