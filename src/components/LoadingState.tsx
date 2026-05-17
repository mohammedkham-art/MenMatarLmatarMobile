import { ActivityIndicator, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { sharedStyles as styles } from '../theme/styles';

export function LoadingState() {
  return (
    <View style={styles.stateBox}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.stateText}>Chargement de Men Matar L Matar...</Text>
    </View>
  );
}
