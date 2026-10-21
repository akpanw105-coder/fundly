import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FundlyColors, FundlyTypography } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <FundlyBottomDock>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="🏠">Home</TabButton>
          </TabTrigger>
          <TabTrigger name="history" href="/history" asChild>
            <TabButton icon="📜">History</TabButton>
          </TabTrigger>
          <TabTrigger name="analytics" href="/analytics" asChild>
            <TabButton icon="📊">Analytics</TabButton>
          </TabTrigger>
          <TabTrigger name="budgets" href="/budgets" asChild>
            <TabButton icon="🥧">Budgets</TabButton>
          </TabTrigger>
          <TabTrigger name="goals" href="/goals" asChild>
            <TabButton icon="🎯">Goals</TabButton>
          </TabTrigger>
        </FundlyBottomDock>
      </TabList>
    </Tabs>
  );
}

interface TabButtonProps extends TabTriggerSlotProps {
  icon: string;
}

export function TabButton({ children, isFocused, icon, ...props }: TabButtonProps) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.tabBtn,
        isFocused ? styles.tabBtnActive : styles.tabBtnInactive,
        pressed && styles.pressed,
      ]}>
      <Text style={styles.tabIcon}>{icon}</Text>
      <Text
        style={[
          styles.tabLabel,
          isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
        ]}>
        {children}
      </Text>
    </Pressable>
  );
}

export function FundlyBottomDock(props: TabListProps) {
  return (
    <View {...props} style={styles.dockContainer}>
      <View style={styles.dockSurface}>
        {props.children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    height: '100%',
    backgroundColor: FundlyColors.background,
  },
  dockContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 6,
    backgroundColor: 'rgba(11, 14, 21, 0.95)',
    borderTopWidth: 1,
    borderTopColor: FundlyColors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 500,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    minWidth: 58,
    gap: 3,
    transitionDuration: '150ms',
  },
  tabBtnActive: {
    backgroundColor: FundlyColors.primaryContainer,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  tabBtnInactive: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    ...FundlyTypography.labelSm,
  },
  tabLabelActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: FundlyColors.outline,
    fontWeight: '500',
  },
});
