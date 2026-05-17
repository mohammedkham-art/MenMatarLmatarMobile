import { Text, View } from 'react-native';

import { sharedStyles as styles } from '../theme/styles';

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.stateBox}>
      <Text style={styles.stateText}>{message}</Text>
    </View>
  );
}
