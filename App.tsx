import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  fetchCountries,
  fetchDeals,
  fetchDestinations,
  simulateTrip,
} from './src/api';
import { colors } from './src/theme';
import type {
  Country,
  CountryVisaType,
  Deal,
  DealVisaType,
  Destination,
  DestinationVisaType,
  TravelerType,
  TravelStyle,
  TripSimulationResult,
} from './src/types';

type Tab = 'home' | 'deals' | 'destinations' | 'simulator';

const tabs: Array<{ label: string; value: Tab }> = [
  { label: 'Accueil', value: 'home' },
  { label: 'Offres', value: 'deals' },
  { label: 'Destinations', value: 'destinations' },
  { label: 'Simulateur IA', value: 'simulator' },
];

const travelerOptions: Array<{ label: string; value: TravelerType }> = [
  { label: 'Solo', value: 'solo' },
  { label: 'Couple', value: 'couple' },
  { label: 'Amis', value: 'friends' },
  { label: 'Famille', value: 'family' },
];

const styleOptions: Array<{ label: string; value: TravelStyle }> = [
  { label: 'Budget', value: 'minimum' },
  { label: 'Équilibré', value: 'balanced' },
  { label: 'Confort', value: 'comfortable' },
];

const visaLabels: Record<DealVisaType | DestinationVisaType | CountryVisaType, string> = {
  visa_free: 'Sans visa',
  evisa: 'eVisa',
  e_visa: 'eVisa',
  on_arrival: "Visa à l'arrivée",
  visa_on_arrival: "Visa à l'arrivée",
  visa_required: 'Visa requis',
};

const recentPriceMaxAgeHours = 144;

const simulatorSnapshots = [
  { days: '3J', budget: '2 000', city: 'Istanbul' },
  { days: '5J', budget: '4 500', city: 'Tunis' },
  { days: '7J', budget: '6 500', city: 'Bangkok' },
  { days: '4J', budget: '3 800', city: 'Le Caire' },
  { days: '10J', budget: '9 900', city: 'Bali' },
  { days: '6J', budget: '5 700', city: 'Doha' },
];

function formatMad(value: number) {
  return `${value.toLocaleString('fr-MA')} MAD`;
}

function formatDate(date: string | null) {
  if (!date) {
    return null;
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate);
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getFreshnessLabel(deal: Deal) {
  const checkedAt = new Date(deal.lastCheckedAt ?? deal.createdAt);
  const diffHours = Math.floor(
    (Date.now() - checkedAt.getTime()) / (1000 * 60 * 60),
  );

  if (Number.isNaN(diffHours) || diffHours > recentPriceMaxAgeHours) {
    return 'À vérifier';
  }

  return 'Prix repéré récemment';
}

function getVisaTone(
  visaType: DealVisaType | DestinationVisaType | CountryVisaType | null,
) {
  if (visaType === 'evisa' || visaType === 'e_visa') {
    return { backgroundColor: colors.blueSoft, color: colors.blue };
  }

  if (visaType === 'visa_required') {
    return { backgroundColor: colors.dangerSoft, color: colors.danger };
  }

  return { backgroundColor: colors.greenSoft, color: colors.green };
}

function getRefreshItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function getTransitAirport(tags: string[]) {
  const transitTag = tags.find((tag) =>
    tag.toLowerCase().startsWith('transit:'),
  );

  return transitTag?.split(':')[1]?.trim().toUpperCase() ?? null;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [simulatorDestinations, setSimulatorDestinations] = useState<
    Destination[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const [nextDeals, nextCountries, nextSimulatorDestinations] =
          await Promise.all([
            fetchDeals(),
            fetchCountries(),
            fetchDestinations('simulator'),
          ]);

        if (!isMounted) {
          return;
        }

        setDeals(nextDeals);
        setCountries(nextCountries);
        setSimulatorDestinations(nextSimulatorDestinations);
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Impossible de charger les données.',
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [retryKey]);

  const featuredDeals = useMemo(() => deals.slice(0, 3), [deals]);
  const refreshData = () => {
    setIsRefreshing(true);
    setRetryKey((key) => key + 1);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.appShell}>
        <Header />

        {isLoading ? (
          <LoadingState />
        ) : loadError ? (
          <ErrorState
            message={loadError}
            onRetry={() => setRetryKey((k) => k + 1)}
          />
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentInner}
            refreshControl={
              <RefreshControl
                colors={[colors.primary]}
                refreshing={isRefreshing}
                tintColor={colors.primary}
                onRefresh={refreshData}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'home' && (
              <HomeScreen
                deals={featuredDeals}
                countries={countries}
                onNavigate={setActiveTab}
              />
            )}
            {activeTab === 'deals' && <DealsScreen deals={deals} />}
            {activeTab === 'destinations' && (
              <DestinationsScreen countries={countries} />
            )}
            {activeTab === 'simulator' && (
              <SimulatorScreen destinations={simulatorDestinations} />
            )}
          </ScrollView>
        )}

        <TabBar activeTab={activeTab} onChange={setActiveTab} />
      </View>
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.headerLogo}>
        <View style={styles.logoBox}>
          <Image
            source={require('./assets/logo-sticker.png')}
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

function TabBar({
  activeTab,
  onChange,
}: {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;

        return (
          <Pressable
            key={tab.value}
            onPress={() => onChange(tab.value)}
            style={[styles.tabButton, isActive && styles.tabButtonActive]}
          >
            <Text
              style={[styles.tabText, isActive && styles.tabTextActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function HomeScreen({
  deals,
  countries,
  onNavigate,
}: {
  deals: Deal[];
  countries: Country[];
  onNavigate: (tab: Tab) => void;
}) {
  const currentSimulation = useMemo(
    () => getRefreshItem(simulatorSnapshots),
    [deals, countries],
  );

  return (
    <View>
      <View style={styles.hero}>
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
            <Text style={styles.heroFeatureValue}>{currentSimulation.days}</Text>
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
      </View>

      <View style={styles.quickActions}>
        <Pressable style={styles.primaryButton} onPress={() => onNavigate('deals')}>
          <Text style={styles.primaryButtonText}>Voir les offres</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => onNavigate('simulator')}
        >
          <Text style={styles.secondaryButtonText}>Simuler un voyage</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Sans visa" value="+40" />
        <StatCard label="eVisa" value="+40" />
        <StatCard label="À l'arrivée" value="14" />
      </View>

      <SectionHeader
        title="Offres du moment"
        subtitle="Les meilleures offres du moment"
      />
      {deals.length === 0 ? (
        <EmptyState message="Aucun deal actif pour le moment." />
      ) : (
        deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} compact />
        ))
      )}
    </View>
  );
}

type VisaFilter = 'all' | 'visa_free' | 'evisa' | 'on_arrival' | 'visa_required';
type DealSort = 'score' | 'price' | 'departure';

const visaFilterOptions: Array<{ label: string; value: VisaFilter }> = [
  { label: 'Tous', value: 'all' },
  { label: 'Sans visa', value: 'visa_free' },
  { label: 'eVisa', value: 'evisa' },
  { label: 'Arrivée', value: 'on_arrival' },
  { label: 'Visa requis', value: 'visa_required' },
];

const dealSortOptions: Array<{ label: string; value: DealSort }> = [
  { label: 'Score', value: 'score' },
  { label: 'Prix ↑', value: 'price' },
  { label: 'Date', value: 'departure' },
];

function FilterPills<TValue extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ label: string; value: TValue }>;
  value: TValue;
  onChange: (value: TValue) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.pillScroll}
      contentContainerStyle={styles.pillScrollContent}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.pill, isActive && styles.pillActive]}
          >
            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function DealsScreen({ deals }: { deals: Deal[] }) {
  const [visaFilter, setVisaFilter] = useState<VisaFilter>('all');
  const [sort, setSort] = useState<DealSort>('score');

  const filteredDeals = useMemo(() => {
    let result = deals;

    if (visaFilter !== 'all') {
      result = result.filter((deal) => {
        const v = deal.visaType;
        if (visaFilter === 'evisa') return v === 'evisa' || v === 'e_visa';
        if (visaFilter === 'on_arrival') return v === 'on_arrival' || v === 'visa_on_arrival';
        return v === visaFilter;
      });
    }

    return [...result].sort((a, b) => {
      if (sort === 'price') return a.priceMad - b.priceMad;
      if (sort === 'departure') {
        if (!a.departureDate) return 1;
        if (!b.departureDate) return -1;
        return new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime();
      }
      return b.score - a.score;
    });
  }, [deals, visaFilter, sort]);

  return (
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
  );
}

function DestinationsScreen({
  countries,
}: {
  countries: Country[];
}) {
  const [query, setQuery] = useState('');
  const [visaFilter, setVisaFilter] = useState<VisaFilter>('all');

  const filteredCountries = useMemo(() => {
    const normalizedQuery = normalize(query.trim());

    let result = countries;

    if (normalizedQuery) {
      result = result.filter(
        (country) => normalize(country.name).includes(normalizedQuery),
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
  );
}

function SimulatorScreen({
  destinations,
}: {
  destinations: Destination[];
}) {
  const [query, setQuery] = useState('');
  const [selectedDestination, setSelectedDestination] =
    useState<Destination | null>(null);
  const [arrivalDateDisplay, setArrivalDateDisplay] = useState('');
  const [durationDays, setDurationDays] = useState(3);

  // Convertit DD-MM-YYYY (affichage) → YYYY-MM-DD (API)
  function toApiDate(display: string) {
    const match = display.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!match) return '';

    const [, day, month, year] = match;
    const parsedDate = new Date(`${year}-${month}-${day}T00:00:00`);
    const isValidDate =
      parsedDate.getFullYear() === Number(year) &&
      parsedDate.getMonth() + 1 === Number(month) &&
      parsedDate.getDate() === Number(day);

    if (!isValidDate) return '';

    return `${year}-${month}-${day}`;
  }

  // Formate la saisie automatiquement en DD-MM-YYYY
  function handleArrivalDateChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 2) formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length > 4) formatted = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
    setArrivalDateDisplay(formatted);
  }

  const arrivalDate = toApiDate(arrivalDateDisplay);
  const [budgetMad, setBudgetMad] = useState('');
  const [travelerType, setTravelerType] = useState<TravelerType>('solo');
  const [travelStyle, setTravelStyle] = useState<TravelStyle>('balanced');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TripSimulationResult | null>(null);

  const suggestions = useMemo(() => {
    const normalizedQuery = normalize(query.trim());

    if (!normalizedQuery || selectedDestination) {
      return [];
    }

    return destinations
      .filter(
        (destination) =>
          normalize(destination.city).includes(normalizedQuery) ||
          normalize(destination.country).includes(normalizedQuery),
      )
      .slice(0, 6);
  }, [destinations, query, selectedDestination]);

  const parsedBudget = budgetMad.trim() ? Number(budgetMad) : null;
  const budgetError =
    parsedBudget !== null && Number.isFinite(parsedBudget)
      ? parsedBudget < 1000
        ? 'Indique au moins 1 000 MAD ou laisse le budget vide.'
        : parsedBudget / durationDays < 350
          ? 'Ce budget paraît trop bas. Augmente le montant ou laisse le champ vide.'
          : null
      : null;
  const canSubmit =
    Boolean(selectedDestination && arrivalDate && !budgetError) &&
    durationDays >= 1 &&
    durationDays <= 30 &&
    !isSubmitting;

  async function handleSubmit() {
    if (!selectedDestination || !canSubmit) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setResult(null);

      const plan = await simulateTrip({
        destinationId: selectedDestination.id,
        destinationCity: selectedDestination.city,
        destinationCountry: selectedDestination.country,
        destinationCountryCode: selectedDestination.countryCode,
        visaType: selectedDestination.visaType,
        arrivalDate,
        durationDays,
        ...(parsedBudget ? { budgetMad: Math.round(parsedBudget) } : {}),
        travelerType,
        travelStyle,
      });

      setResult(plan);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : 'La simulation n’a pas abouti.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View>
      <SectionHeader
        title="Simulateur IA"
        subtitle="Une première idée de séjour, budget et conseils passeport"
      />

      <Text style={styles.label}>Ville de destination</Text>
      <TextInput
        value={query}
        onChangeText={(value) => {
          setQuery(value);
          setSelectedDestination(null);
        }}
        placeholder="Istanbul, Paris, Bangkok..."
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
      {selectedDestination && (
        <DestinationCard destination={selectedDestination} compact />
      )}
      {suggestions.map((destination) => (
        <Pressable
          key={destination.id}
          onPress={() => {
            setSelectedDestination(destination);
            setQuery(`${destination.city}, ${destination.country}`);
          }}
        >
          <DestinationCard destination={destination} compact />
        </Pressable>
      ))}

      <Text style={styles.label}>Date d'arrivée</Text>
      <TextInput
        value={arrivalDateDisplay}
        onChangeText={handleArrivalDateChange}
        placeholder="JJ-MM-AAAA"
        placeholderTextColor={colors.muted}
        keyboardType="numeric"
        style={styles.input}
      />

      <Text style={styles.label}>Nombre de jours</Text>
      <View style={styles.stepper}>
        <Pressable
          style={styles.stepperButton}
          onPress={() => setDurationDays(Math.max(1, durationDays - 1))}
        >
          <Text style={styles.stepperButtonText}>-</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{durationDays}</Text>
        <Pressable
          style={styles.stepperButton}
          onPress={() => setDurationDays(Math.min(30, durationDays + 1))}
        >
          <Text style={styles.stepperButtonText}>+</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Budget total en MAD (facultatif)</Text>
      <TextInput
        value={budgetMad}
        onChangeText={setBudgetMad}
        keyboardType="numeric"
        placeholder="Ex: 3000"
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
      {budgetError && <Text style={styles.warningText}>{budgetError}</Text>}

      <OptionGroup
        label="Type de voyageur"
        options={travelerOptions}
        value={travelerType}
        onChange={setTravelerType}
      />
      <OptionGroup
        label="Style de voyage"
        options={styleOptions}
        value={travelStyle}
        onChange={setTravelStyle}
      />

      <Pressable
        disabled={!canSubmit}
        style={[styles.primaryButton, !canSubmit && styles.disabledButton]}
        onPress={handleSubmit}
      >
        <Text style={styles.primaryButtonText}>
          {isSubmitting ? 'Génération en cours...' : 'Simuler mon séjour'}
        </Text>
      </Pressable>

      {isSubmitting && <SimulatorLoadingState />}
      {!isSubmitting && error && <SimulatorErrorState message={error} />}
      {!isSubmitting && result && <SimulationResult result={result} />}

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
    </View>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function VisaBadge({
  visaType,
}: {
  visaType: DealVisaType | DestinationVisaType | CountryVisaType | null;
}) {
  if (!visaType) {
    return null;
  }

  const tone = getVisaTone(visaType);

  return (
    <View style={[styles.badge, { backgroundColor: tone.backgroundColor }]}>
      <Text style={[styles.badgeText, { color: tone.color }]}>
        {visaLabels[visaType]}
      </Text>
    </View>
  );
}

function CountryCard({
  country,
}: {
  country: Country;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardMain}>
          <View style={styles.badgeRow}>
            <Text style={styles.countryCode}>{country.code}</Text>
            <VisaBadge visaType={country.visaType} />
          </View>
          <Text style={styles.cardTitle}>{country.name}</Text>
          <Text style={styles.cardSubtitle}>{country.region}</Text>
        </View>
      </View>
      {(country.maxStayDays !== null || country.notes) && (
        <View style={styles.detailList}>
          {country.maxStayDays !== null && (
            <Text style={styles.detail}>Séjour max: {country.maxStayDays} jours</Text>
          )}
          {country.notes && <Text style={styles.detail}>{country.notes}</Text>}
        </View>
      )}
    </View>
  );
}

function DealCard({ deal, compact }: { deal: Deal; compact?: boolean }) {
  const departureDate = formatDate(deal.departureDate);
  const returnDate = formatDate(deal.returnDate);
  const transitAirport = getTransitAirport(deal.tags);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardMain}>
          <Text style={styles.freshness}>{getFreshnessLabel(deal)}</Text>
          <View style={styles.badgeRow}>
            <Text style={styles.countryCode}>{deal.countryCode}</Text>
            <VisaBadge visaType={deal.visaType} />
          </View>
          <Text style={styles.cardTitle}>
            {deal.fromCity} → {deal.toCity}
          </Text>
          <Text style={styles.cardSubtitle}>
            {deal.fromAirport} → {deal.toAirport}
          </Text>
          {transitAirport && (
            <View style={styles.transitBadge}>
              <Text style={styles.transitBadgeText}>
                Transit via {transitAirport}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>À partir de</Text>
          <Text style={styles.price}>{formatMad(deal.priceMad)}</Text>
        </View>
      </View>

      {!compact && (
        <View style={styles.detailList}>
          {deal.airline && <Text style={styles.detail}>Compagnie: {deal.airline}</Text>}
          {departureDate && <Text style={styles.detail}>Départ: {departureDate}</Text>}
          {returnDate && <Text style={styles.detail}>Retour: {returnDate}</Text>}
        </View>
      )}

      <Pressable
        style={styles.cardButton}
        onPress={() => {
          const url = deal.bookingUrl;
          if (!url.startsWith('https://') && !url.startsWith('http://')) return;
          Linking.canOpenURL(url).then((supported) => {
            if (supported) Linking.openURL(url);
          }).catch(() => {});
        }}
      >
        <Text style={styles.cardButtonText}>Voir l'offre</Text>
      </Pressable>
    </View>
  );
}

function DestinationCard({
  destination,
  compact,
}: {
  destination: Destination;
  compact?: boolean;
}) {
  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      <View style={styles.cardTop}>
        <View style={styles.cardMain}>
          <Text style={styles.cardTitle}>{destination.city}</Text>
          <Text style={styles.cardSubtitle}>
            {destination.country}
            {destination.region ? ` · ${destination.region}` : ''}
          </Text>
        </View>
        <VisaBadge visaType={destination.visaType} />
      </View>
    </View>
  );
}

function OptionGroup<TValue extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ label: string; value: TValue }>;
  value: TValue;
  onChange: (value: TValue) => void;
}) {
  return (
    <View style={styles.optionGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map((option) => {
          const isActive = option.value === value;

          return (
            <Pressable
              key={option.value}
              style={[styles.option, isActive && styles.optionActive]}
              onPress={() => onChange(option.value)}
            >
              <Text
                style={[styles.optionText, isActive && styles.optionTextActive]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SimulatorLoadingState() {
  return (
    <View style={styles.simStateCard}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.simStateKicker}>IA voyage</Text>
      <Text style={styles.simStateTitle}>Préparation de ton programme</Text>
      <Text style={styles.simStateText}>
        Merci de patienter quelques secondes pendant que l'IA prépare ton
        itinéraire, ton budget et tes conseils passeport.
      </Text>
    </View>
  );
}

function SimulatorErrorState({ message }: { message: string }) {
  return (
    <View style={styles.simStateCard}>
      <Text style={styles.simStateKicker}>Simulateur IA</Text>
      <Text style={[styles.simStateTitle, { color: colors.danger }]}>
        La simulation n'a pas abouti
      </Text>
      <Text style={styles.simStateText}>{message}</Text>
      <View style={styles.simStateHint}>
        <Text style={styles.simStateHintText}>
          Tu peux relancer avec une durée plus courte, un budget légèrement
          différent ou réessayer dans quelques instants.
        </Text>
      </View>
    </View>
  );
}

function SimulationResult({ result }: { result: TripSimulationResult }) {
  return (
    <View style={styles.resultCard}>
      <Text style={styles.resultKicker}>Résultat IA estimé</Text>
      <Text style={styles.resultTitle}>{result.title}</Text>
      <Text style={styles.resultText}>{result.summary}</Text>
      <View style={styles.statsRow}>
        <StatCard label="Total" value={result.budgetMad ? formatMad(result.budgetMad) : '—'} />
        <StatCard
          label="Par jour"
          value={result.estimatedDailyBudgetMad ? formatMad(result.estimatedDailyBudgetMad) : '—'}
        />
      </View>
      {result.budgetWarning && (
        <Text style={styles.warningText}>{result.budgetWarning}</Text>
      )}
      {(result.dayPlans ?? []).map((day) => (
        <View key={day.day} style={styles.dayCard}>
          <Text style={styles.dayTitle}>
            Jour {day.day} · {day.title}
          </Text>
          <Text style={styles.detail}>Matin: {day.morning}</Text>
          <Text style={styles.detail}>Après-midi: {day.afternoon}</Text>
          <Text style={styles.detail}>Soir: {day.evening}</Text>
          <Text style={styles.dayTip}>{day.budgetTip}</Text>
        </View>
      ))}
      <Text style={styles.officialNote}>
        Vérifie toujours les règles visa, passeport, transit et entrée auprès
        des sources officielles avant de réserver ou de partir.
      </Text>
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.stateBox}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.stateText}>Chargement de Men Matar L Matar...</Text>
    </View>
  );
}

function ErrorState({
  message,
  compact,
  onRetry,
}: {
  message: string;
  compact?: boolean;
  onRetry?: () => void;
}) {
  return (
    <View style={[styles.stateBox, compact && styles.compactStateBox]}>
      <Text style={styles.errorTitle}>La demande n'a pas abouti</Text>
      <Text style={styles.stateText}>{message}</Text>
      {onRetry && (
        <Pressable onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </Pressable>
      )}
    </View>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.stateBox}>
      <Text style={styles.stateText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appShell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ffffff',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 38,
    height: 44,
  },
  brandSmall: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  brand: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
  },
  headerPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 18,
    paddingBottom: 110,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 22,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
    marginTop: 14,
  },
  heroText: {
    color: '#d8e7df',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
  },
  heroFeatureRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  heroFeature: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  heroFeatureValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroFeatureLabel: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  heroCityFeature: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  heroCityValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    width: '100%',
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: 14,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    marginTop: 14,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    marginLeft: 10,
    marginTop: 14,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  disabledButton: {
    backgroundColor: '#aebbb4',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginTop: 14,
  },
  statCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
  },
  statValue: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 26,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  compactCard: {
    padding: 12,
  },
  cardTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardMain: {
    flex: 1,
    paddingRight: 10,
  },
  freshness: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  countryCode: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginRight: 8,
  },
  badge: {
    borderRadius: 999,
    marginBottom: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  transitBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.orangeSoft,
    borderRadius: 999,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  transitBadgeText: {
    color: colors.orange,
    fontSize: 11,
    fontWeight: '900',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
    marginTop: 6,
  },
  cardSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 5,
  },
  priceBox: {
    alignItems: 'flex-end',
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    padding: 10,
  },
  priceLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
  },
  price: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 3,
  },
  detailList: {
    marginTop: 12,
  },
  detail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  cardButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginTop: 14,
    paddingVertical: 12,
  },
  cardButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    minHeight: 50,
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  stepperButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 46,
    justifyContent: 'center',
    width: 54,
  },
  stepperButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
  },
  stepperValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    paddingHorizontal: 22,
  },
  optionGroup: {
    marginTop: 8,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  option: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    margin: 4,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  optionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  optionTextActive: {
    color: '#ffffff',
  },
  warningText: {
    backgroundColor: colors.orangeSoft,
    borderRadius: 12,
    color: colors.orange,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 8,
    padding: 12,
  },
  simStateCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 18,
    padding: 24,
    alignItems: 'center',
    minHeight: 220,
    justifyContent: 'center',
  },
  simStateKicker: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 16,
  },
  simStateTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    marginTop: 8,
    textAlign: 'center',
  },
  simStateText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
    textAlign: 'center',
  },
  simStateHint: {
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    marginTop: 14,
    padding: 12,
    width: '100%',
  },
  simStateHintText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 18,
    padding: 16,
  },
  resultKicker: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  resultTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
    marginTop: 8,
  },
  resultText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  dayCard: {
    backgroundColor: colors.background,
    borderRadius: 14,
    marginTop: 12,
    padding: 13,
  },
  dayTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  dayTip: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 20,
    marginTop: 8,
  },
  officialNote: {
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 14,
    padding: 12,
  },
  stateBox: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  compactStateBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: 16,
    flex: 0,
    marginTop: 14,
  },
  errorTitle: {
    color: colors.danger,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  stateText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    textAlign: 'center',
  },
  stateHint: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  pillScroll: {
    marginBottom: 10,
  },
  pillScrollContent: {
    gap: 8,
    paddingRight: 4,
  },
  pill: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  pillTextActive: {
    color: '#ffffff',
  },
  tabBar: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    bottom: Platform.OS === 'ios' ? 36 : 18,
    flexDirection: 'row',
    left: 18,
    padding: 6,
    position: 'absolute',
    right: 18,
  },
  tabButton: {
    alignItems: 'center',
    borderRadius: 16,
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 3,
    paddingVertical: 10,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    width: '100%',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    marginTop: 16,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  privacyLink: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  privacyLinkText: {
    color: colors.muted,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
