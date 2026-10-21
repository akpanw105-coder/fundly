import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { BottomTabInset, FundlyColors, FundlyTypography, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';

interface BudgetItem {
  id: string;
  category: string;
  spent: number;
  allocated: number;
  icon: string;
  color: string;
  iconBg: string;
}

export default function BudgetsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');

  const fetchBudgetsAndExpenses = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Fetch user's budgets
      const { data: budgetData, error: budgetErr } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);

      if (budgetErr) throw budgetErr;

      // 2. Fetch user's transactions to calculate actual spent per category
      const { data: txData, error: txErr } = await supabase
        .from('transactions')
        .select('category, amount, is_income')
        .eq('user_id', user.id)
        .eq('is_income', false);

      if (txErr) throw txErr;

      const spentMap: Record<string, number> = {};
      if (txData) {
        txData.forEach((t: any) => {
          const cat = t.category || 'General';
          spentMap[cat] = (spentMap[cat] || 0) + Number(t.amount);
        });
      }

      if (budgetData && budgetData.length > 0) {
        const mapped: BudgetItem[] = budgetData.map((b: any) => ({
          id: b.id,
          category: b.category,
          allocated: Number(b.allocated),
          spent: spentMap[b.category] || 0,
          icon: b.icon || '🥧',
          color: b.color || FundlyColors.primary,
          iconBg: b.icon_bg || 'rgba(37, 99, 235, 0.20)',
        }));
        setBudgets(mapped);
      } else {
        // Create initial default envelopes for user if none exist
        const initialEnvelopes = [
          { category: 'Food & Dining', allocated: 400000, icon: '🍽️', color: FundlyColors.categoryFood },
          { category: 'Transport', allocated: 200000, icon: '🚗', color: FundlyColors.categoryTransport },
          { category: 'Bills', allocated: 150000, icon: '⚡', color: FundlyColors.categoryUtilities },
          { category: 'Subscriptions', allocated: 85000, icon: '📺', color: FundlyColors.categorySubscriptions },
        ];

        for (const env of initialEnvelopes) {
          await supabase.from('budgets').insert({
            user_id: user.id,
            category: env.category,
            allocated: env.allocated,
            month_year: '2024-12',
            icon: env.icon,
            color: env.color,
            icon_bg: 'rgba(37, 99, 235, 0.20)',
          });
        }

        const reMapped: BudgetItem[] = initialEnvelopes.map((e, idx) => ({
          id: idx.toString(),
          category: e.category,
          allocated: e.allocated,
          spent: spentMap[e.category] || 0,
          icon: e.icon,
          color: e.color,
          iconBg: 'rgba(37, 99, 235, 0.20)',
        }));
        setBudgets(reMapped);
      }
    } catch (e) {
      console.warn('Error fetching budgets:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchBudgetsAndExpenses();
    }
  }, [user, fetchBudgetsAndExpenses]);

  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
  const totalAllocated = budgets.reduce((acc, b) => acc + b.allocated, 0);
  const overallPercentage = totalAllocated > 0 ? Math.min(100, Math.round((totalSpent / totalAllocated) * 100)) : 0;

  const handleAddBudget = async () => {
    if (!newCategory.trim() || !newLimit.trim() || !user) return;
    const limitNum = parseFloat(newLimit.replace(/[^0-9.]/g, '')) || 50000;

    try {
      const { data, error } = await supabase.from('budgets').insert({
        user_id: user.id,
        category: newCategory.trim(),
        allocated: limitNum,
        month_year: '2024-12',
        icon: '🎯',
        color: FundlyColors.primary,
        icon_bg: 'rgba(37, 99, 235, 0.2)',
      }).select();

      if (error) throw error;
      fetchBudgetsAndExpenses();
    } catch (e: any) {
      console.warn('Error adding budget:', e.message);
    }

    setNewCategory('');
    setNewLimit('');
    setIsAddingBudget(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <Text style={styles.iconBoxEmoji}>🥧</Text>
          </View>
          <Text style={styles.headerTitle}>Budgets</Text>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            style={styles.headerActionBtn}
            hitSlop={8}
            onPress={() => setIsAddingBudget(!isAddingBudget)}>
            <Text style={styles.headerPlusIcon}>{isAddingBudget ? '✕' : '＋'}</Text>
          </Pressable>
          <Pressable
            style={styles.avatar}
            onPress={() => router.push('/settings')}>
            <Text style={styles.avatarText}>👤</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        {/* Month Selector Card */}
        <View style={styles.monthHeaderRow}>
          <View>
            <Text style={styles.monthTitle}>December 2024</Text>
            <Text style={styles.monthSub}>Cloud Envelope Allocation</Text>
          </View>
          <View style={styles.budgetStatusPill}>
            <Text style={styles.budgetStatusText}>{overallPercentage}% Used</Text>
          </View>
        </View>

        {/* Hero Budget Overview Card */}
        <View style={styles.heroBudgetCard}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroLabel}>TOTAL SPENT THIS MONTH</Text>
              <Text style={styles.heroSpentAmount}>
                ₦{totalSpent.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.heroAllocatedBox}>
              <Text style={styles.heroAllocatedLabel}>Total Limit</Text>
              <Text style={styles.heroAllocatedVal}>
                ₦{totalAllocated.toLocaleString('en-NG')}
              </Text>
            </View>
          </View>

          {/* Master Progress Bar */}
          <View style={styles.masterProgressTrack}>
            <View
              style={[
                styles.masterProgressBar,
                { width: `${overallPercentage}%` },
                overallPercentage > 90 ? styles.progressDanger : styles.progressNormal,
              ]}
            />
          </View>

          <View style={styles.heroFooter}>
            <Text style={styles.remainingText}>
              ₦{(Math.max(0, totalAllocated - totalSpent)).toLocaleString('en-NG')} remaining in pool
            </Text>
            <Text style={styles.daysLeftText}>Supabase Synced</Text>
          </View>
        </View>

        {/* Inline Create Budget Form */}
        {isAddingBudget && (
          <View style={styles.createCard}>
            <Text style={styles.createTitle}>Create Budget Envelope</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Personal Care & Grooming"
                placeholderTextColor={FundlyColors.outline}
                value={newCategory}
                onChangeText={setNewCategory}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Monthly Limit (₦)</Text>
              <TextInput
                style={styles.input}
                placeholder="50,000"
                placeholderTextColor={FundlyColors.outline}
                keyboardType="numeric"
                value={newLimit}
                onChangeText={setNewLimit}
              />
            </View>
            <Pressable style={styles.saveBudgetBtn} onPress={handleAddBudget}>
              <Text style={styles.saveBudgetBtnText}>Save Budget</Text>
            </Pressable>
          </View>
        )}

        {/* Category Budget Cards */}
        <View style={styles.budgetsSection}>
          <Text style={styles.sectionHeaderTitle}>Category Allocations</Text>

          {loading ? (
            <ActivityIndicator color={FundlyColors.primary} style={{ marginVertical: 30 }} />
          ) : (
            <View style={styles.budgetsList}>
              {budgets.map(item => {
                const pct = item.allocated > 0 ? Math.round((item.spent / item.allocated) * 100) : 0;
                const isOver = item.spent > item.allocated;
                const remaining = item.allocated - item.spent;

                return (
                  <View key={item.id} style={styles.budgetCard}>
                    <View style={styles.budgetCardTop}>
                      <View style={styles.budgetCardLeft}>
                        <View style={[styles.budgetIconBox, { backgroundColor: item.iconBg }]}>
                          <Text style={styles.budgetIconEmoji}>{item.icon}</Text>
                        </View>
                        <View>
                          <Text style={styles.budgetCategory}>{item.category}</Text>
                          <Text style={styles.budgetSub}>
                            ₦{item.spent.toLocaleString('en-NG')} of ₦{item.allocated.toLocaleString('en-NG')}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.budgetCardRight}>
                        <Text
                          style={[
                            styles.budgetPct,
                            isOver ? styles.textOver : styles.textNormal,
                          ]}>
                          {pct}%
                        </Text>
                        <Text style={styles.budgetStatusLabel}>
                          {isOver ? 'Exceeded' : `₦${remaining.toLocaleString('en-NG')} left`}
                        </Text>
                      </View>
                    </View>

                    {/* Progress Track */}
                    <View style={styles.track}>
                      <View
                        style={[
                          styles.bar,
                          {
                            width: `${Math.min(100, pct)}%`,
                            backgroundColor: isOver ? FundlyColors.error : item.color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Quick Add Expense Action */}
        <Pressable
          style={styles.recordActionBtn}
          onPress={() => router.push('/add-transaction')}>
          <Text style={styles.recordActionIcon}>＋</Text>
          <Text style={styles.recordActionText}>Record Spending Against Budget</Text>
        </Pressable>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: FundlyColors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: FundlyColors.surfaceContainerHigh,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: FundlyColors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxEmoji: {
    fontSize: 18,
  },
  headerTitle: {
    ...FundlyTypography.headlineSm,
    color: FundlyColors.onSurface,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: FundlyColors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPlusIcon: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '700',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: FundlyColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.six + 40,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthTitle: {
    ...FundlyTypography.headlineMd,
    color: FundlyColors.onSurface,
  },
  monthSub: {
    ...FundlyTypography.bodyMd,
    color: FundlyColors.outline,
  },
  budgetStatusPill: {
    backgroundColor: FundlyColors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  budgetStatusText: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.secondary,
    fontWeight: '700',
  },
  heroBudgetCard: {
    backgroundColor: FundlyColors.surfaceContainerLow,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: FundlyColors.surfaceContainerHigh,
    gap: 14,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroLabel: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.outline,
    letterSpacing: 0.6,
  },
  heroSpentAmount: {
    ...FundlyTypography.headlineLg,
    color: FundlyColors.onSurface,
    fontWeight: '700',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  heroAllocatedBox: {
    alignItems: 'flex-end',
  },
  heroAllocatedLabel: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.outline,
  },
  heroAllocatedVal: {
    ...FundlyTypography.titleMd,
    color: FundlyColors.onSurface,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  masterProgressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: FundlyColors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  masterProgressBar: {
    height: 10,
    borderRadius: 5,
  },
  progressNormal: {
    backgroundColor: FundlyColors.primaryContainer,
  },
  progressDanger: {
    backgroundColor: FundlyColors.error,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  remainingText: {
    ...FundlyTypography.labelMd,
    color: FundlyColors.secondary,
    fontWeight: '600',
  },
  daysLeftText: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.outline,
  },
  createCard: {
    backgroundColor: FundlyColors.surfaceContainer,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  createTitle: {
    ...FundlyTypography.titleMd,
    color: FundlyColors.onSurface,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.outline,
  },
  input: {
    backgroundColor: FundlyColors.surfaceContainerLow,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: FundlyColors.onSurface,
    ...FundlyTypography.bodyMd,
  },
  saveBudgetBtn: {
    backgroundColor: FundlyColors.primaryContainer,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBudgetBtnText: {
    ...FundlyTypography.labelMd,
    color: '#ffffff',
    fontWeight: '700',
  },
  budgetsSection: {
    gap: 12,
  },
  sectionHeaderTitle: {
    ...FundlyTypography.titleMd,
    color: FundlyColors.onSurface,
  },
  budgetsList: {
    gap: 10,
  },
  budgetCard: {
    backgroundColor: FundlyColors.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  budgetCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  budgetIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetIconEmoji: {
    fontSize: 20,
  },
  budgetCategory: {
    ...FundlyTypography.titleMd,
    color: FundlyColors.onSurface,
  },
  budgetSub: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.outline,
    fontVariant: ['tabular-nums'],
  },
  budgetCardRight: {
    alignItems: 'flex-end',
  },
  budgetPct: {
    ...FundlyTypography.titleMd,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  textNormal: {
    color: FundlyColors.onSurface,
  },
  textOver: {
    color: FundlyColors.error,
  },
  budgetStatusLabel: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.outline,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: FundlyColors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  bar: {
    height: 6,
    borderRadius: 3,
  },
  recordActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: FundlyColors.surfaceContainerHigh,
  },
  recordActionIcon: {
    fontSize: 18,
    color: FundlyColors.primary,
    fontWeight: '700',
  },
  recordActionText: {
    ...FundlyTypography.titleMd,
    color: FundlyColors.onSurface,
  },
});
