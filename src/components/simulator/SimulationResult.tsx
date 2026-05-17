import { Text, View } from 'react-native';

import { sharedStyles as styles } from '../../theme/styles';
import type { TripSimulationResult } from '../../types';
import { formatMad } from '../../utils/format';
import { StatCard } from '../StatCard';

export function SimulationResult({ result }: { result: TripSimulationResult }) {
  return (
    <View style={styles.resultCard}>
      <Text style={styles.resultKicker}>Résultat IA estimé</Text>
      <Text style={styles.resultTitle}>{result.title}</Text>
      <Text style={styles.resultText}>{result.summary}</Text>
      <View style={styles.statsRow}>
        <StatCard
          label="Total"
          value={result.budgetMad ? formatMad(result.budgetMad) : '—'}
        />
        <StatCard
          label="Par jour"
          value={
            result.estimatedDailyBudgetMad
              ? formatMad(result.estimatedDailyBudgetMad)
              : '—'
          }
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
