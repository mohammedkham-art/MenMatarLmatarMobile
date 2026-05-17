import { useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DestinationCard } from '../../src/components/DestinationCard';
import { OptionGroup } from '../../src/components/OptionGroup';
import { SectionHeader } from '../../src/components/SectionHeader';
import { SimulationResult } from '../../src/components/simulator/SimulationResult';
import { SimulatorErrorState } from '../../src/components/simulator/SimulatorErrorState';
import { SimulatorLoadingState } from '../../src/components/simulator/SimulatorLoadingState';
import { styleOptions, travelerOptions } from '../../src/constants/options';
import { useAppData } from '../../src/context/AppDataContext';
import { simulateTrip } from '../../src/services/api';
import { colors } from '../../src/theme/colors';
import { sharedStyles as styles } from '../../src/theme/styles';
import type {
  Destination,
  TravelStyle,
  TravelerType,
  TripSimulationResult,
} from '../../src/types';
import { normalize } from '../../src/utils/format';

export default function SimulatorScreen() {
  const { simulatorDestinations, isRefreshing, refresh } = useAppData();
  const [query, setQuery] = useState('');
  const [selectedDestination, setSelectedDestination] =
    useState<Destination | null>(null);
  const [arrivalDateDisplay, setArrivalDateDisplay] = useState('');
  const [durationDays, setDurationDays] = useState(3);

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

  function handleArrivalDateChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 2)
      formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length > 4)
      formatted = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
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

    return simulatorDestinations
      .filter(
        (destination) =>
          normalize(destination.city).includes(normalizedQuery) ||
          normalize(destination.country).includes(normalizedQuery),
      )
      .slice(0, 6);
  }, [simulatorDestinations, query, selectedDestination]);

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
          title="Simulateur IA"
          subtitle="Une première idée de séjour, budget et conseils passeport"
        />

        <View>
          <Text style={styles.label}>Ville de destination</Text>
          <TextInput
            value={query}
            onChangeText={(value) => {
              setQuery(value);
              setSelectedDestination(null);
            }}
            placeholder="Istanbul, Paris..."
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

          <OptionGroup
            label="Type de voyageur"
            options={travelerOptions}
            value={travelerType}
            onChange={setTravelerType}
            columns={1}
          />
          <OptionGroup
            label="Style de voyage"
            options={styleOptions}
            value={travelStyle}
            onChange={setTravelStyle}
            columns={1}
          />

          <Text style={styles.label}>Budget total en MAD (facultatif)</Text>
          <TextInput
            value={budgetMad}
            onChangeText={setBudgetMad}
            keyboardType="numeric"
            placeholder="Ex: 3000"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          {budgetError && (
            <Text style={styles.warningText}>{budgetError}</Text>
          )}
        </View>

        <Pressable
          disabled={!canSubmit}
          style={[
            styles.primaryButton,
            styles.simulatorSubmitButton,
            !canSubmit && styles.disabledButton,
          ]}
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
    </ScrollView>
  );
}
