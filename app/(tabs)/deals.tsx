import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DealCard } from '../../src/components/DealCard';
import { EmptyState } from '../../src/components/EmptyState';
import { FilterPills } from '../../src/components/FilterPills';
import { MonthPickerModal } from '../../src/components/MonthPickerModal';
import { SectionHeader } from '../../src/components/SectionHeader';
import { dealSortOptions, visaFilterOptions } from '../../src/constants/options';
import { useAppData } from '../../src/context/AppDataContext';
import { colors } from '../../src/theme/colors';
import { sharedStyles as styles } from '../../src/theme/styles';
import type { DealSort, VisaFilter } from '../../src/types';
import {
  dealInMonthRange,
  formatMonthLabel,
  getRollingMonths,
  toMonthKey,
} from '../../src/utils/months';
import type { MonthValue } from '../../src/utils/months';


export default function DealsScreen() {
  const { deals, isRefreshing, refresh } = useAppData();
  const [visaFilter, setVisaFilter] = useState<VisaFilter>('all');
  const [sort, setSort] = useState<DealSort>('score');
  const [monthFrom, setMonthFrom] = useState<MonthValue | null>(null);
  const [monthTo, setMonthTo] = useState<MonthValue | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const months = useMemo(getRollingMonths, []);
  const hasMonthFilter = Boolean(monthFrom);

  const periodLabel = monthFrom
    ? monthTo && toMonthKey(monthFrom) !== toMonthKey(monthTo)
      ? `${formatMonthLabel(monthFrom)} → ${formatMonthLabel(monthTo)}`
      : formatMonthLabel(monthFrom)
    : 'Période de voyage';

  function handleMonthPress(m: MonthValue) {
    if (!monthFrom || (monthFrom && monthTo)) {
      setMonthFrom(m);
      setMonthTo(null);
    } else {
      const key = toMonthKey(m);
      const fromKey = toMonthKey(monthFrom);
      if (key < fromKey) {
        setMonthFrom(m);
        setMonthTo(monthFrom);
      } else {
        setMonthTo(m);
      }
      setShowMonthPicker(false);
    }
  }

  function resetMonths() {
    setMonthFrom(null);
    setMonthTo(null);
  }

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

    if (monthFrom) {
      const effectiveTo = monthTo ?? monthFrom;
      result = result.filter((deal) => dealInMonthRange(deal, monthFrom, effectiveTo));
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
  }, [deals, visaFilter, sort, monthFrom, monthTo]);

  const emptyMessage =
    deals.length === 0
      ? 'Aucun deal actif pour le moment.'
      : hasMonthFilter
        ? 'Aucun deal sur cette période — reviens bientôt !'
        : 'Aucun deal ne correspond aux filtres.';

  return (
    <>
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

          {/* Bouton période de voyage */}
          <View style={periodStyles.wrapper}>
            <Pressable
              style={[
                periodStyles.button,
                hasMonthFilter && periodStyles.buttonActive,
              ]}
              onPress={() => setShowMonthPicker(true)}
            >
              <Feather name="calendar" size={17} color="#ffffff" />
              <Text
                style={[
                  periodStyles.label,
                  hasMonthFilter && periodStyles.labelActive,
                ]}
                numberOfLines={1}
              >
                {periodLabel}
              </Text>
            </Pressable>

            {hasMonthFilter && (
              <Pressable
                style={periodStyles.clearButton}
                onPress={resetMonths}
                hitSlop={8}
              >
                <Text style={periodStyles.clearText}>✕</Text>
              </Pressable>
            )}
          </View>

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
            <EmptyState message={emptyMessage} />
          ) : (
            filteredDeals.map((deal) => <DealCard key={deal.id} deal={deal} />)
          )}
        </View>
      </ScrollView>

      <MonthPickerModal
        visible={showMonthPicker}
        onClose={() => setShowMonthPicker(false)}
        months={months}
        monthFrom={monthFrom}
        monthTo={monthTo}
        onMonthPress={handleMonthPress}
      />
    </>
  );
}

const periodStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
    position: 'relative',
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  buttonActive: {
    paddingRight: 48,
  },
  label: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  labelActive: {
    fontWeight: '800',
  },
  clearButton: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 10,
    position: 'absolute',
    right: 10,
    top: 0,
  },
  clearText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
