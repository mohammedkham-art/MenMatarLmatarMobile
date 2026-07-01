import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { formatMonthName, getMonthState, toMonthKey } from '../utils/months';
import type { MonthValue } from '../utils/months';

type Props = {
  visible: boolean;
  onClose: () => void;
  months: MonthValue[];
  monthFrom: MonthValue | null;
  monthTo: MonthValue | null;
  onMonthPress: (m: MonthValue) => void;
};

export function MonthPickerModal({
  visible,
  onClose,
  months,
  monthFrom,
  monthTo,
  onMonthPress,
}: Props) {
  const hint = !monthFrom
    ? 'Appuie sur un mois pour commencer'
    : !monthTo
      ? 'Appuie sur un 2e mois pour finir la période'
      : 'Appuie sur un mois pour recommencer';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.panel} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>Période de voyage</Text>
          <Text style={styles.hint}>{hint}</Text>

          <View style={styles.grid}>
            {months.map((m) => {
              const state = getMonthState(m, monthFrom, monthTo);
              const isActive = state === 'start' || state === 'end';
              const isInRange = state === 'in-range';

              return (
                <Pressable
                  key={toMonthKey(m)}
                  style={[
                    styles.cell,
                    isActive && styles.cellActive,
                    isInRange && styles.cellInRange,
                  ]}
                  onPress={() => onMonthPress(m)}
                >
                  <Text
                    style={[
                      styles.cellMonth,
                      isActive && styles.cellActiveText,
                      isInRange && styles.cellInRangeText,
                    ]}
                  >
                    {formatMonthName(m)}
                  </Text>
                  <Text
                    style={[
                      styles.cellYear,
                      isActive && styles.cellActiveText,
                    ]}
                  >
                    {m.year}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    bottom: 0,
    flex: 1,
    justifyContent: 'flex-end',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  panel: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 36,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 4,
    marginBottom: 18,
    width: 42,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    width: '31%',
  },
  cellActive: {
    backgroundColor: colors.primary,
  },
  cellInRange: {
    backgroundColor: colors.primarySoft,
  },
  cellMonth: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  cellYear: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  cellActiveText: {
    color: '#ffffff',
  },
  cellInRangeText: {
    color: colors.primary,
  },
});
