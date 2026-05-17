import { Pressable, Text, View } from 'react-native';

import { sharedStyles as styles } from '../theme/styles';

export function OptionGroup<TValue extends string>({
  label,
  options,
  value,
  onChange,
  columns,
}: {
  label: string;
  options: Array<{ label: string; value: TValue }>;
  value: TValue;
  onChange: (value: TValue) => void;
  columns?: 1 | 2;
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
              style={[
                styles.option,
                columns === 2 && styles.optionTwoColumn,
                columns === 1 && styles.optionFullWidth,
                isActive && styles.optionActive,
              ]}
              onPress={() => onChange(option.value)}
            >
              <Text
                style={[styles.optionText, isActive && styles.optionTextActive]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
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
