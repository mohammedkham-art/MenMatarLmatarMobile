import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

import { useFavorites } from '../context/FavoritesContext';
import { colors } from '../theme/colors';
import type { Deal } from '../types';

const FILLED_COLOR = '#E11D48';

export function FavoriteButton({ deal }: { deal: Deal }) {
  const { has, add, remove } = useFavorites();
  const isFavorite = has(deal.id);

  const scale = useRef(new Animated.Value(1)).current;

  // Petite animation de pulse quand le statut change.
  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.18,
        useNativeDriver: true,
        speed: 30,
        bounciness: 12,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 18,
        bounciness: 6,
      }),
    ]).start();
  }, [isFavorite, scale]);

  const handlePress = () => {
    if (isFavorite) {
      remove(deal.id);
    } else {
      add(deal);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={
        isFavorite
          ? `Retirer ${deal.fromCity} → ${deal.toCity} des favoris`
          : `Ajouter ${deal.fromCity} → ${deal.toCity} aux favoris`
      }
      accessibilityState={{ selected: isFavorite }}
    >
      <Animated.Text
        style={[
          styles.icon,
          { color: isFavorite ? FILLED_COLOR : colors.muted },
          { transform: [{ scale }] },
        ]}
      >
        {isFavorite ? '♥' : '♡'}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '900',
  },
});
