import { Linking, Pressable, Text } from 'react-native';

import { sharedStyles as styles } from '../theme/styles';

export function PrivacyPolicyLink() {
  return (
    <Pressable
      onPress={() =>
        Linking.openURL('https://menmatarlmatar.ma/privacy').catch(() => {})
      }
      style={styles.privacyLink}
    >
      <Text style={styles.privacyLinkText}>
        Politique de confidentialité
      </Text>
    </Pressable>
  );
}
