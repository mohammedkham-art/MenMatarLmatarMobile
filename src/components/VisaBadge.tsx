import { Text, View } from 'react-native';

import { sharedStyles as styles } from '../theme/styles';
import type {
  CountryVisaType,
  DealVisaType,
  DestinationVisaType,
} from '../types';
import { getVisaTone, visaLabels } from '../utils/visa';

export function VisaBadge({
  visaType,
}: {
  visaType: DealVisaType | DestinationVisaType | CountryVisaType | null;
}) {
  if (!visaType) {
    return null;
  }

  const tone = getVisaTone(visaType);

  return (
    <View style={[styles.badge, { backgroundColor: tone.backgroundColor }]}>
      <Text style={[styles.badgeText, { color: tone.color }]}>
        {visaLabels[visaType]}
      </Text>
    </View>
  );
}
