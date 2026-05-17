import { Feather } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useFavorites } from '../context/FavoritesContext';
import { colors } from '../theme/colors';
import { sharedStyles as styles } from '../theme/styles';

const FAVORITE_COLOR = '#E11D48';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

type TabConfig = {
  icon: FeatherName;
  label: string;
};

const tabConfig: Record<string, TabConfig> = {
  index: { icon: 'home', label: 'Accueil' },
  deals: { icon: 'tag', label: 'Offres' },
  destinations: { icon: 'globe', label: 'Pays' },
  simulator: { icon: 'zap', label: 'IA' },
  favorites: { icon: 'heart', label: 'Favoris' },
};

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { count } = useFavorites();

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const config = tabConfig[route.name];
        if (!config) return null;

        const isActive = state.index === index;
        const isFavoritesTab = route.name === 'favorites';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isActive && !event.defaultPrevented) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (navigation as any).navigate(route.name, route.params);
          }
        };

        const iconColor = isFavoritesTab
          ? FAVORITE_COLOR
          : isActive
            ? '#ffffff'
            : colors.primary;

        const labelColor = isFavoritesTab
          ? isActive
            ? colors.primary
            : colors.primary
          : isActive
            ? '#ffffff'
            : colors.primary;

        const { options } = descriptors[route.key];
        const accessibilityLabel =
          isFavoritesTab && count > 0
            ? `${config.label}, ${count} sauvegardé${count > 1 ? 's' : ''}`
            : (options.title ?? config.label);

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={[
              localStyles.tabButton,
              isActive && !isFavoritesTab && styles.tabButtonActive,
              isActive && isFavoritesTab && localStyles.tabButtonActiveFavorite,
            ]}
            accessibilityRole="button"
            accessibilityState={isActive ? { selected: true } : {}}
            accessibilityLabel={accessibilityLabel}
          >
            <View style={localStyles.iconWrap}>
              <Feather name={config.icon} size={20} color={iconColor} />
              {isFavoritesTab && count > 0 && (
                <View
                  style={[
                    localStyles.badge,
                    isActive && localStyles.badgeActive,
                  ]}
                >
                  <Text style={localStyles.badgeText}>
                    {count > 99 ? '99+' : count}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[localStyles.tabLabel, { color: labelColor }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {config.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const localStyles = StyleSheet.create({
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 2,
    paddingVertical: 6,
    gap: 2,
  },
  tabButtonActiveFavorite: {
    backgroundColor: '#fee4e2',
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 22,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.2,
    width: '100%',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#E11D48',
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeActive: {
    borderColor: '#fee4e2',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 11,
  },
});
