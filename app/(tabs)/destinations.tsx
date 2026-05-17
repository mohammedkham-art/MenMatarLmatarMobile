import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

import { CountryCard } from '../../src/components/CountryCard';
import { EmptyState } from '../../src/components/EmptyState';
import { FilterPills } from '../../src/components/FilterPills';
import { SectionHeader } from '../../src/components/SectionHeader';
import { visaFilterOptions } from '../../src/constants/options';
import { useAppData } from '../../src/context/AppDataContext';
import { colors } from '../../src/theme/colors';
import { sharedStyles as styles } from '../../src/theme/styles';
import type { VisaFilter } from '../../src/types';
import { normalize } from '../../src/utils/format';

const validVisaFilters: VisaFilter[] = [
  'all',
  'visa_free',
  'evisa',
  'on_arrival',
  'visa_required',
];

export default function DestinationsScreen() {
  const { countries, isRefreshing, refresh } = useAppData();
  const params = useLocalSearchParams<{ visa?: string }>();
  const [visaFilter, setVisaFilter] = useState<VisaFilter>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (params.visa && validVisaFilters.includes(params.visa as VisaFilter)) {
      setVisaFilter(params.visa as VisaFilter);
    }
  }, [params.visa]);

  const filteredCountries = useMemo(() => {
    const normalizedQuery = normalize(query.trim());

    let result = countries;

    if (normalizedQuery) {
      result = result.filter((country) =>
        normalize(country.name).includes(normalizedQuery),
      );
    }

    if (visaFilter !== 'all') {
      result = result.filter((country) => {
        const v = country.visaType;
        if (visaFilter === 'evisa') return v === 'evisa' || v === 'e_visa';
        if (visaFilter === 'on_arrival') {
          return v === 'on_arrival' || v === 'visa_on_arrival';
        }
        return v === visaFilter;
      });
    }

    return result;
  }, [countries, query, visaFilter]);

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
        <SectionHeader
          title="Destinations"
          subtitle="Infos indicatives à vérifier auprès des sources officielles"
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher un pays"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />
        <FilterPills
          options={visaFilterOptions}
          value={visaFilter}
          onChange={setVisaFilter}
        />
        {filteredCountries.length === 0 ? (
          <EmptyState message="Aucun pays ne correspond aux filtres." />
        ) : (
          filteredCountries.map((country) => (
            <CountryCard key={country.id} country={country} />
          ))
        )}
      </View>
    </ScrollView>
  );
}
