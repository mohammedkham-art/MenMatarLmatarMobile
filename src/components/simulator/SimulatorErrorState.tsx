import { Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { sharedStyles as styles } from '../../theme/styles';

export function SimulatorErrorState({ message }: { message: string }) {
  return (
    <View style={styles.simStateCard}>
      <Text style={styles.simStateKicker}>Simulateur IA</Text>
      <Text style={[styles.simStateTitle, { color: colors.danger }]}>
        La simulation n'a pas abouti
      </Text>
      <Text style={styles.simStateText}>{message}</Text>
      <View style={styles.simStateHint}>
        <Text style={styles.simStateHintText}>
          Tu peux relancer avec une durée plus courte, un budget légèrement
          différent ou réessayer dans quelques instants.
        </Text>
      </View>
    </View>
  );
}
