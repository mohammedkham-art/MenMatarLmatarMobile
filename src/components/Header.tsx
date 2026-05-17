import { Image, Text, View } from 'react-native';

import { sharedStyles as styles } from '../theme/styles';

export function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.headerLogo}>
        <View style={styles.logoBox}>
          <Image
            source={require('../../assets/logo-sticker.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <View>
          <Text style={styles.brandSmall}>MEN MATAR</Text>
          <Text style={styles.brand}>L MATAR</Text>
        </View>
      </View>
      <View style={styles.headerPill}>
        <Text style={styles.headerPillText}>Passeport marocain</Text>
      </View>
    </View>
  );
}
