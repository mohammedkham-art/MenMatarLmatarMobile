import { Text, View } from 'react-native';

import { sharedStyles as styles } from '../theme/styles';
import type { Country } from '../types';
import { VisaBadge } from './VisaBadge';

function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export function CountryCard({ country }: { country: Country }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardMain}>
          <View style={styles.badgeRow}>
            <Text style={[styles.countryCode, { fontSize: 24 }]}>{countryCodeToFlag(country.code)}</Text>
            <VisaBadge visaType={country.visaType} />
          </View>
          <Text style={styles.cardTitle}>{country.name}</Text>
          <Text style={styles.cardSubtitle}>{country.region}</Text>
        </View>
      </View>
      {(country.maxStayDays !== null || country.notes) && (
        <View style={styles.detailList}>
          {country.maxStayDays !== null && (
            <Text style={styles.detail}>
              Séjour max: {country.maxStayDays} jours
            </Text>
          )}
          {country.notes && <Text style={styles.detail}>{country.notes}</Text>}
        </View>
      )}
    </View>
  );
}
