import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

import { DealCard } from '../../src/components/DealCard';
import { EmptyState } from '../../src/components/EmptyState';
import { FilterPills } from '../../src/components/FilterPills';
import { SectionHeader } from '../../src/components/SectionHeader';
import { dealSortOptions, visaFilterOptions } from '../../src/constants/options';
import { useAppData } from '../../src/context/AppDataContext';
import { colors } from '../../src/theme/colors';
import { sharedStyles as styles } from '../../src/theme/styles';
import type { DealSort, VisaFilter } from '../../src/types';

export default function DealsScreen() {
  const { deals, isRefreshing, refresh } = useAppData();
  const [visaFilter, setVisaFilter] = useState<VisaFilter>('all');
  const [sort, setSort] = useState<DealSort>('score');

  const filteredDeals = useMemo(() => {
    let result = deals;

    if (visaFilter !== 'all') {
      result = result.filter((deal) => {
        const v = deal.visaType;
        if (visaFilter === 'evisa') return v === 'evisa' || v === 'e_visa';
        if (visaFilter === 'on_arrival')
          return v === 'on_arrival' || v === 'visa_on_arrival';
        return v === visaFilter;
      });
    }

    return [...result].sort((a, b) => {
      if (sort === 'price') return a.priceMad - b.priceMad;
      if (sort === 'departure') {
        if (!a.departureDate) return 1;
        if (!b.departureDate) return -1;
        return (
          new Date(a.departureDate).getTime() -
          new Date(b.departureDate).getTime()
        );
      }
      return b.score - a.score;
    });
  }, [deals, visaFilter, sort]);

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
          title="Deals"
          subtitle="Les vols à surveiller avant de réserver"
        />
        <FilterPills
          options={visaFilterOptions}
          value={visaFilter}
          onChange={setVisaFilter}
        />
        <FilterPills
          options={dealSortOptions}
          value={sort}
          onChange={setSort}
        />
        {filteredDeals.length === 0 ? (
          <EmptyState
            message={
              deals.length === 0
                ? 'Aucun deal actif pour le moment.'
                : 'Aucun deal ne correspond aux filtres.'
            }
          />
        ) : (
          filteredDeals.map((deal) => <DealCard key={deal.id} deal={deal} />)
        )}
      </View>
    </ScrollView>
  );
}
