import { ActivityIndicator, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { sharedStyles as styles } from '../../theme/styles';

export function SimulatorLoadingState() {
  return (
    <View style={styles.simStateCard}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.simStateKicker}>IA voyage</Text>
      <Text style={styles.simStateTitle}>Préparation de ton programme</Text>
      <Text style={styles.simStateText}>
        Merci de patienter quelques secondes pendant que l'IA prépare ton
        itinéraire, ton budget et tes conseils passeport.
      </Text>
    </View>
  );
}
