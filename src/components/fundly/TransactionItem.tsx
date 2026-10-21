import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FundlyColors, FundlyTypography } from '@/constants/theme';

export interface Transaction {
  id: string;
  name: string;
  date: string;
  category: string;
  amount: string;
  isIncome: boolean;
  note?: string;
  emoji: string;
  iconBg: string;
  iconColor: string;
  pending?: boolean;
}

interface TransactionItemProps {
  item: Transaction;
  onPress?: (item: Transaction) => void;
}

export function TransactionItem({ item, onPress }: TransactionItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={() => onPress?.(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.amount}`}>
      {/* Icon */}
      <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
        <Text style={[styles.iconEmoji, { color: item.iconColor }]}>{item.emoji}</Text>
      </View>

      {/* Details */}
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{item.date} · {item.category}</Text>
          {item.pending && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>⏱ Pending</Text>
            </View>
          )}
        </View>
      </View>

      {/* Amount */}
      <View style={styles.amountCol}>
        <Text style={[styles.amount, item.isIncome ? styles.amountIncome : styles.amountExpense]}>
          {item.amount}
        </Text>
        {item.note && <Text style={styles.note}>{item.note}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: FundlyColors.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
  },
  rowPressed: {
    backgroundColor: FundlyColors.surfaceContainer,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: {
    fontSize: 18,
  },
  details: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    ...FundlyTypography.bodyMd,
    fontWeight: '500',
    color: FundlyColors.onSurface,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  meta: {
    ...FundlyTypography.labelMd,
    color: FundlyColors.outline,
  },
  pendingBadge: {
    backgroundColor: FundlyColors.surfaceContainerHigh,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pendingText: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.outline,
  },
  amountCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
    paddingLeft: 8,
  },
  amount: {
    ...FundlyTypography.titleMd,
    fontVariant: ['tabular-nums'],
  },
  amountIncome: {
    color: FundlyColors.secondary,
  },
  amountExpense: {
    color: FundlyColors.error,
  },
  note: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.outline,
  },
});
