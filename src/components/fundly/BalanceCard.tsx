import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FundlyColors, FundlyTypography } from '@/constants/theme';

interface BalanceCardProps {
  balance: string;
  income: string;
  expenses: string;
}

export function BalanceCard({ balance, income, expenses }: BalanceCardProps) {
  const [masked, setMasked] = useState(false);

  return (
    <View style={styles.card}>
      {/* Ambient glow overlay */}
      <View style={styles.glowOverlay} />

      {/* Content */}
      <View style={styles.content}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <Text style={styles.balanceLabel}>TOTAL AVAILABLE BALANCE</Text>
          <Pressable
            style={styles.eyeBtn}
            onPress={() => setMasked(v => !v)}
            hitSlop={8}
            accessibilityLabel="Toggle balance visibility">
            <Text style={styles.eyeIcon}>{masked ? '🙈' : '👁'}</Text>
          </Pressable>
        </View>

        {/* Main balance */}
        <Text style={styles.balanceAmount} numberOfLines={1} adjustsFontSizeToFit>
          {masked ? '₦ • • • • • • •' : balance}
        </Text>

        {/* Income / Expense sub-metrics */}
        <View style={styles.metricsRow}>
          {/* Income */}
          <View style={styles.metricPill}>
            <View style={[styles.metricIconBox, { backgroundColor: 'rgba(78, 222, 163, 0.20)' }]}>
              <Text style={[styles.metricIcon, { color: FundlyColors.secondary }]}>↓</Text>
            </View>
            <View style={styles.metricTexts}>
              <Text style={styles.metricLabel}>Income</Text>
              <Text style={[styles.metricValue, { color: FundlyColors.secondary }]} numberOfLines={1}>
                {masked ? '••••' : `+${income}`}
              </Text>
            </View>
          </View>

          {/* Expenses */}
          <View style={styles.metricPill}>
            <View style={[styles.metricIconBox, { backgroundColor: 'rgba(255, 180, 171, 0.20)' }]}>
              <Text style={[styles.metricIcon, { color: FundlyColors.error }]}>↑</Text>
            </View>
            <View style={styles.metricTexts}>
              <Text style={styles.metricLabel}>Expenses</Text>
              <Text style={[styles.metricValue, { color: FundlyColors.error }]} numberOfLines={1}>
                {masked ? '••••' : `-${expenses}`}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: FundlyColors.primaryContainer,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 12,
  },
  glowOverlay: {
    position: 'absolute',
    top: -32,
    right: -32,
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  content: {
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    ...FundlyTypography.labelMd,
    color: FundlyColors.primaryFixed,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  eyeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: {
    fontSize: 14,
  },
  balanceAmount: {
    ...FundlyTypography.displayLg,
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
  },
  metricPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.20)',
    borderRadius: 12,
    padding: 10,
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metricIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
  metricTexts: {
    flex: 1,
    minWidth: 0,
  },
  metricLabel: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.primaryFixedDim,
  },
  metricValue: {
    ...FundlyTypography.titleMd,
    fontVariant: ['tabular-nums'],
  },
});
