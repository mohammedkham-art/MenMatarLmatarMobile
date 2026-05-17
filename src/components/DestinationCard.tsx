import { Text, View } from 'react-native';

import { sharedStyles as styles } from '../theme/styles';
import type { Destination } from '../types';
import { VisaBadge } from './VisaBadge';

export function DestinationCard({
  destination,
  compact,
}: {
  destination: Destination;
  compact?: boolean;
}) {
  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      <View style={styles.cardTop}>
        <View style={styles.cardMain}>
          <Text style={styles.cardTitle}>{destination.city}</Text>
          <Text style={styles.cardSubtitle}>
            {destination.country}
            {destination.region ? ` · ${destination.region}` : ''}
          </Text>
        </View>
        <VisaBadge visaType={destination.visaType} />
      </View>
    </View>
  );
}
