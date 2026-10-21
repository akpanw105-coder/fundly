import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FundlyColors, FundlyTypography } from '@/constants/theme';

export interface Category {
  label: string;
  percentage: number;
  amount: string;
  color: string;
}

interface SpendingChartProps {
  total: string;
  categories: Category[];
}

/**
 * Renders a segmented arc indicator using layered View transforms.
 * This is a visual approximation of the Stitch donut chart without react-native-svg.
 * Each segment is a half-ring clipped by rotation.
 */
export function SpendingChart({ total, categories }: SpendingChartProps) {
  const topCategory = categories.reduce(
    (a, b) => (a.percentage > b.percentage ? a : b),
    categories[0],
  );

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Spending by Category</Text>
        <Text style={styles.totalLabel}>{total} Total</Text>
      </View>

      {/* Visual representation: stacked progress bars (simpler, reliable without SVG) */}
      <View style={styles.ringContainer}>
        {/* Outer decorative ring using border */}
        <View style={styles.outerRing}>
          {/* Colored segments represented as thick arcs using overflow-hidden rectangles */}
          {categories.map((cat, i) => {
            const cumulativePct = categories
              .slice(0, i)
              .reduce((acc, c) => acc + c.percentage, 0);
            const startAngle = (cumulativePct / 100) * 360 - 90;
            const sweepAngle = (cat.percentage / 100) * 360;

            return (
              <View
                key={i}
                style={[
                  styles.segment,
                  {
                    borderColor: cat.color,
                    transform: [
                      { rotate: `${startAngle}deg` },
                    ],
                    // show only part of the ring via clip
                    borderTopWidth: sweepAngle > 0 ? 14 : 0,
                    borderRightWidth: sweepAngle > 90 ? 14 : 0,
                    borderBottomWidth: sweepAngle > 180 ? 14 : 0,
                    borderLeftWidth: sweepAngle > 270 ? 14 : 0,
                  },
                ]}
              />
            );
          })}

          {/* Center content */}
          <View style={styles.centerContent}>
            <Text style={styles.centerTopLabel}>TOP SPEND</Text>
            <Text style={styles.centerMain}>{topCategory?.label.split(' & ')[0]}</Text>
            <Text style={styles.centerPct}>{topCategory?.percentage.toFixed(1)}%</Text>
          </View>
        </View>

        {/* Category bar legend (horizontal) */}
        <View style={styles.legendBar}>
          {categories.map((cat, i) => (
            <View
              key={i}
              style={[styles.legendSegment, { backgroundColor: cat.color, flex: cat.percentage }]}
            />
          ))}
        </View>
      </View>

      {/* Category 2×2 grid */}
      <View style={styles.grid}>
        {categories.map((cat, i) => (
          <View key={i} style={styles.gridItem}>
            <View style={styles.gridItemLeft}>
              <View style={[styles.dot, { backgroundColor: cat.color }]} />
              <View style={styles.gridItemTexts}>
                <Text style={styles.catLabel} numberOfLines={1}>{cat.label}</Text>
                <Text style={styles.catPct}>{cat.percentage.toFixed(1)}%</Text>
              </View>
            </View>
            <Text style={styles.catAmount}>{cat.amount}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const RING_SIZE = 160;
const RING_BORDER = 14;

const styles = StyleSheet.create({
  card: {
    backgroundColor: FundlyColors.surfaceContainerLow,
    borderRadius: 20,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...FundlyTypography.titleMd,
    color: FundlyColors.onSurface,
  },
  totalLabel: {
    ...FundlyTypography.labelMd,
    color: FundlyColors.outline,
  },
  ringContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  outerRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_BORDER,
    borderColor: FundlyColors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  segment: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderColor: 'transparent',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  centerTopLabel: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  centerMain: {
    ...FundlyTypography.titleMd,
    color: FundlyColors.onSurface,
    fontWeight: '700',
    textAlign: 'center',
  },
  centerPct: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.secondary,
    fontWeight: '600',
  },
  legendBar: {
    flexDirection: 'row',
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    gap: 2,
  },
  legendSegment: {
    height: 6,
    borderRadius: 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: FundlyColors.surfaceContainer,
    borderRadius: 12,
    padding: 10,
  },
  gridItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  gridItemTexts: {
    flex: 1,
    minWidth: 0,
  },
  catLabel: {
    ...FundlyTypography.labelMd,
    color: FundlyColors.onSurface,
  },
  catPct: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.outline,
  },
  catAmount: {
    ...FundlyTypography.labelLg,
    fontWeight: '600',
    color: FundlyColors.onSurface,
    fontVariant: ['tabular-nums'],
  },
});
