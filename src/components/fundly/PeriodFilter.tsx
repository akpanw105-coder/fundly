import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FundlyColors, FundlyTypography } from '@/constants/theme';

type Period = 'week' | 'month' | 'year';

interface PeriodFilterProps {
  value?: Period;
  onChange?: (period: Period) => void;
}

const PERIODS: { key: Period; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];

export function PeriodFilter({ value = 'month', onChange }: PeriodFilterProps) {
  const [selected, setSelected] = useState<Period>(value);

  const handlePress = (period: Period) => {
    setSelected(period);
    onChange?.(period);
  };

  return (
    <View style={styles.container}>
      {PERIODS.map(({ key, label }) => {
        const isActive = selected === key;
        return (
          <Pressable
            key={key}
            style={({ pressed }) => [
              styles.pill,
              isActive && styles.pillActive,
              pressed && styles.pillPressed,
            ]}
            onPress={() => handlePress(key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isActive }}>
            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: FundlyColors.surfaceContainer,
    borderRadius: 999,
    padding: 4,
    gap: 0,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: FundlyColors.primaryContainer,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  pillPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  pillText: {
    ...FundlyTypography.labelLg,
    color: FundlyColors.outline,
  },
  pillTextActive: {
    ...FundlyTypography.labelLg,
    fontWeight: '600',
    color: '#ffffff',
  },
});
