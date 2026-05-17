import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DealCard } from '../../src/components/DealCard';
import { SectionHeader } from '../../src/components/SectionHeader';
import { useFavorites } from '../../src/context/FavoritesContext';
import { snapshotToDeal } from '../../src/services/storage';
import { colors } from '../../src/theme/colors';
import { sharedStyles as styles } from '../../src/theme/styles';

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites, count, clear } = useFavorites();

  const handleClearAll = () => {
    if (count === 0) return;
    Alert.alert(
      'Vider les favoris',
      `Es-tu sûr(e) de vouloir retirer tes ${count} deal${count > 1 ? 's' : ''} favori${count > 1 ? 's' : ''} ? Cette action est définitive.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout vider',
          style: 'destructive',
          onPress: () => clear(),
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.contentInner}
      showsVerticalScrollIndicator={false}
    >
      <View style={localStyles.headerRow}>
        <View style={localStyles.headerTextWrap}>
          <SectionHeader
            title="Mes favoris"
            subtitle={
              count === 0
                ? 'Tes deals sauvegardés apparaîtront ici, hors connexion aussi.'
                : `${count} deal${count > 1 ? 's' : ''} sauvegardé${count > 1 ? 's' : ''}`
            }
          />
        </View>
        {count > 0 && (
          <Pressable
            onPress={handleClearAll}
            style={localStyles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Vider tous les favoris"
          >
            <Text style={localStyles.clearButtonText}>Vider</Text>
          </Pressable>
        )}
      </View>

      {count === 0 ? (
        <View style={localStyles.emptyCard}>
          <Text style={localStyles.emptyIcon}>♡</Text>
          <Text style={localStyles.emptyTitle}>Aucun deal favori</Text>
          <Text style={localStyles.emptyText}>
            Appuie sur le ♡ d'un deal pour le sauvegarder ici. Tu pourras le
            retrouver même hors connexion.
          </Text>
          <Pressable
            style={localStyles.browseButton}
            onPress={() => router.push('/deals')}
          >
            <Text style={localStyles.browseButtonText}>Voir les offres</Text>
          </Pressable>
        </View>
      ) : (
        favorites.map((favorite) => (
          <DealCard key={favorite.id} deal={snapshotToDeal(favorite)} />
        ))
      )}
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  clearButton: {
    backgroundColor: colors.dangerSoft,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 14,
  },
  clearButtonText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyIcon: {
    fontSize: 48,
    color: '#E11D48',
    marginBottom: 10,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 18,
  },
  browseButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  browseButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
});
