import { Pressable, Text, View } from 'react-native';

import { sharedStyles as styles } from '../theme/styles';

export function ErrorState({
  message,
  compact,
  onRetry,
}: {
  message: string;
  compact?: boolean;
  onRetry?: () => void;
}) {
  return (
    <View style={[styles.stateBox, compact && styles.compactStateBox]}>
      <Text style={styles.errorTitle}>La demande n'a pas abouti</Text>
      <Text style={styles.stateText}>{message}</Text>
      {onRetry && (
        <Pressable onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </Pressable>
      )}
    </View>
  );
}
