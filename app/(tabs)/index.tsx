import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { DealCard } from '../../src/components/DealCard';
import { EmptyState } from '../../src/components/EmptyState';
import { PrivacyPolicyLink } from '../../src/components/PrivacyPolicyLink';
import { SectionHeader } from '../../src/components/SectionHeader';
import { StatCard } from '../../src/components/StatCard';
import { simulatorSnapshots } from '../../src/constants/options';
import { useAppData } from '../../src/context/AppDataContext';
import { colors } from '../../src/theme/colors';
import { sharedStyles as styles } from '../../src/theme/styles';
import type { VisaFilter } from '../../src/types';
import { formatThresholdCount, getRefreshItem } from '../../src/utils/format';
import { getVisaStatCount } from '../../src/utils/visa';

export default function HomeScreen() {
  const router = useRouter();
  const { deals, countries, isRefreshing, refresh } = useAppData();

  const featuredDeals = useMemo(() => deals.slice(0, 3), [deals]);

  const currentSimulation = useMemo(
    () => getRefreshItem(simulatorSnapshots),
    [deals, countries],
  );
  const visaFreeCount = getVisaStatCount(countries, ['visa_free']);
  const eVisaCount = getVisaStatCount(countries, ['evisa', 'e_visa']);
  const visaOnArrivalCount = getVisaStatCount(countries, [
    'on_arrival',
    'visa_on_arrival',
  ]);

  const goToDestinationsWithFilter = (visa: VisaFilter) => {
    router.push({ pathname: '/destinations', params: { visa } });
  };

  return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.contentInner}
      refreshControl={
        <RefreshControl
          colors={[colors.primary]}
          refreshing={isRefreshing}
          tintColor={colors.primary}
          onRefresh={refresh}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Pressable onPress={() => router.push('/simulator')} style={styles.hero}>
          <Text style={styles.eyebrow}>Simulateur IA</Text>
          <Text style={styles.heroTitle}>
            Imagine ton prochain séjour avant de réserver.
          </Text>
          <Text style={styles.heroText}>
            Choisis une destination, une date et un budget. L'app te prépare une
            première idée de programme en quelques secondes.
          </Text>
          <View style={styles.heroFeatureRow}>
            <View style={styles.heroFeature}>
              <Text style={styles.heroFeatureValue}>
                {currentSimulation.days}
              </Text>
              <Text style={styles.heroFeatureLabel}>durée</Text>
            </View>
            <View style={styles.heroFeature}>
              <Text style={styles.heroFeatureValue}>
                {currentSimulation.budget}
              </Text>
              <Text style={styles.heroFeatureLabel}>DHS</Text>
            </View>
          </View>
          <View style={styles.heroCityFeature}>
            <Text
              style={styles.heroCityValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
            >
              {currentSimulation.city}
            </Text>
          </View>
        </Pressable>

        <View style={styles.quickActions}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push('/deals')}
          >
            <Text style={styles.primaryButtonText}>Voir les offres</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push('/simulator')}
          >
            <Text style={styles.secondaryButtonText}>Simuler un voyage</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label="Sans visa"
            value={formatThresholdCount(visaFreeCount)}
            onPress={() => goToDestinationsWithFilter('visa_free')}
          />
          <StatCard
            label="eVisa"
            value={formatThresholdCount(eVisaCount)}
            onPress={() => goToDestinationsWithFilter('evisa')}
          />
          <StatCard
            label="À l'arrivée"
            value={visaOnArrivalCount}
            onPress={() => goToDestinationsWithFilter('on_arrival')}
          />
        </View>

        <SectionHeader
          title="Offres du moment"
          subtitle="Les meilleures offres du moment"
        />
        {featuredDeals.length === 0 ? (
          <EmptyState message="Aucun deal actif pour le moment." />
        ) : (
          featuredDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} compact />
          ))
        )}

        <PrivacyPolicyLink />
      </View>
    </ScrollView>
  );
}
