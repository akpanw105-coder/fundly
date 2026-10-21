import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FundlyColors, FundlyTypography, Spacing } from '@/constants/theme';

interface PlaceholderScreenProps {
  title: string;
  icon: string;
  description: string;
}

export function PlaceholderScreen({ title, icon, description }: PlaceholderScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: FundlyColors.background,
  },
  header: {
    height: 56,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: FundlyColors.surfaceContainerHigh,
  },
  headerTitle: {
    ...FundlyTypography.headlineSm,
    color: FundlyColors.onSurface,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.six,
    gap: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: FundlyColors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    ...FundlyTypography.headlineMd,
    color: FundlyColors.onSurface,
    textAlign: 'center',
  },
  desc: {
    ...FundlyTypography.bodyMd,
    color: FundlyColors.outline,
    textAlign: 'center',
  },
});
