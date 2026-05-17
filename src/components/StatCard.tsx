import { Pressable, Text, View } from 'react-native';

import { sharedStyles as styles } from '../theme/styles';

export function StatCard({
  label,
  value,
  onPress,
}: {
  label: string;
  value: number | string;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={styles.statCard} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.statCard}>{content}</View>;
}
