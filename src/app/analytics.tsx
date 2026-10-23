import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { PeriodFilter } from '@/components/fundly/PeriodFilter';
import { SpendingChart, Category } from '@/components/fundly/SpendingChart';
import { BottomTabInset, FundlyColors, FundlyTypography, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { calculateFinancialSummary, getDateFilterRange, DbTransaction } from '@/lib/finance';
import { supabase } from '@/lib/supabase';

interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

const DEFAULT_MONTHLY_TRENDS: MonthlyTrend[] = [
  { month: 'Aug', income: 1800000, expenses: 950000, savings: 850000 },
  { month: 'Sep', income: 2100000, expenses: 1100000, savings: 1000000 },
  { month: 'Oct', income: 2000000, expenses: 880000, savings: 1120000 },
  { month: 'Nov', income: 2300000, expenses: 1050000, savings: 1250000 },
  { month: 'Dec', income: 2400000, expenses: 845300, savings: 1554700 },
];

export default function AnalyticsScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [activeTrendIdx, setActiveTrendIdx] = useState<number>(4);
  const [trends, setTrends] = useState<MonthlyTrend[]>(DEFAULT_MONTHLY_TRENDS);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMsg('');

    try {
      const { startDate } = getDateFilterRange(selectedPeriod);

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);

      if (startDate) {
        query = query.gte('date', startDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const rawList: DbTransaction[] = data || [];
      const summary = calculateFinancialSummary(rawList);

      setTotalIncome(summary.totalIncome);
      setTotalExpenses(summary.totalExpenses);

      if (summary.totalExpenses > 0) {
        const colorList = [
          FundlyColors.categoryFood,
          FundlyColors.categoryTransport,
          FundlyColors.categoryUtilities,
          FundlyColors.categorySubscriptions,
          '#c084fc',
          '#38bdf8',
          '#facc15',
        ];

        const catArray: Category[] = Object.keys(summary.expenseCategoryTotals).map((catName, i) => {
          const catAmt = summary.expenseCategoryTotals[catName];
          const pct = Math.round((catAmt / summary.totalExpenses) * 1000) / 10;
          return {
            label: catName,
            percentage: pct,
            amount: `₦${(catAmt / 1000).toFixed(0)}k`,
            color: colorList[i % colorList.length],
          };
        });

        setCategories(catArray);
      } else {
        setCategories([]);
      }

      // Update current month trend with actual user numbers
      const now = new Date();
      if (summary.totalIncome > 0 || summary.totalExpenses > 0) {
        setTrends(prev => {
          const updated = [...prev];
          const currentMonthName = now.toLocaleString('en-US', { month: 'short' });
          updated[4] = {
            month: currentMonthName,
            income: summary.totalIncome,
            expenses: summary.totalExpenses,
            savings: summary.netCashFlow,
          };
          return updated;
        });
      }
    } catch (e: any) {
      console.warn('Error fetching analytics:', e);
      setErrorMsg('Could not load analytics. Tap to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, selectedPeriod]);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, fetchAnalytics]);

  const activeTrend = trends[activeTrendIdx] || DEFAULT_MONTHLY_TRENDS[4];
  const maxBarValue = Math.max(...trends.map(t => Math.max(t.income, t.expenses, 2000000)));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <Text style={styles.iconBoxEmoji}>📊</Text>
          </View>
          <Text style={styles.headerTitle}>Analytics</Text>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            style={styles.headerActionBtn}
            hitSlop={8}
            onPress={() => router.push('/add-transaction')}>
            <Text style={styles.headerPlusIcon}>＋</Text>
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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAnalytics(true)}
            tintColor={FundlyColors.primary}
          />
        }>
        {/* Period Filter */}
        <PeriodFilter onChange={setSelectedPeriod} />

        {/* Error state with retry */}
        {errorMsg ? (
          <Pressable style={styles.errorBanner} onPress={() => fetchAnalytics()}>
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </Pressable>
        ) : null}

        {loading && (
          <ActivityIndicator color={FundlyColors.primary} style={{ marginVertical: 16 }} />
        )}

        {/* Hero Cash Flow Summary */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroSub}>
              NET CASH FLOW ({activeTrend.month.toUpperCase()} {new Date().getFullYear()})
            </Text>
            {totalIncome > 0 && totalExpenses > 0 && (
              <View style={styles.rateBadge}>
                <Text style={styles.rateText}>
                  {Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)}% savings
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.heroAmount}>
            +₦{(activeTrend.income - activeTrend.expenses).toLocaleString('en-NG', {
              minimumFractionDigits: 2,
            })}
          </Text>

          <View style={styles.heroMetricsGrid}>
            <View style={styles.heroMetricItem}>
              <View style={[styles.miniDot, { backgroundColor: FundlyColors.secondary }]} />
              <View>
                <Text style={styles.heroMetricLabel}>Total Inflow</Text>
                <Text style={[styles.heroMetricVal, { color: FundlyColors.secondary }]}>
                  ₦{activeTrend.income.toLocaleString('en-NG')}
                </Text>
              </View>
            </View>

            <View style={styles.heroMetricItem}>
              <View style={[styles.miniDot, { backgroundColor: FundlyColors.error }]} />
              <View>
                <Text style={styles.heroMetricLabel}>Total Outflow</Text>
                <Text style={[styles.heroMetricVal, { color: FundlyColors.error }]}>
                  ₦{activeTrend.expenses.toLocaleString('en-NG')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Monthly Trend Bar Visualization */}
        <View style={styles.chartCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Cash Flow Trends</Text>
            <Text style={styles.cardSub}>5-Month Horizon</Text>
          </View>

          <View style={styles.barsContainer}>
            {trends.map((trend, idx) => {
              const isSelected = idx === activeTrendIdx;
              const incomeHeight = (trend.income / maxBarValue) * 120;
              const expenseHeight = (trend.expenses / maxBarValue) * 120;
              const netTrend = trend.income - trend.expenses;

              return (
                <Pressable
                  key={trend.month}
                  style={styles.barColumn}
                  onPress={() => setActiveTrendIdx(idx)}>
                  {isSelected && (
                    <View style={styles.activeFloatChip}>
                      <Text style={styles.activeFloatText}>
                        ₦{netTrend >= 1000000
                          ? `${(netTrend / 1000000).toFixed(2)}M`
                          : `${(netTrend / 1000).toFixed(0)}k`}
                      </Text>
                    </View>
                  )}

                  <View style={styles.barGroup}>
                    <View
                      style={[
                        styles.barTrack,
                        { height: incomeHeight },
                        isSelected ? styles.barActiveIncome : styles.barInactiveIncome,
                      ]}
                    />
                    <View
                      style={[
                        styles.barTrack,
                        { height: expenseHeight },
                        isSelected ? styles.barActiveExpense : styles.barInactiveExpense,
                      ]}
                    />
                  </View>

                  <Text
                    style={[
                      styles.barMonthLabel,
                      isSelected && styles.barMonthLabelSelected,
                    ]}>
                    {trend.month}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendSquare, { backgroundColor: FundlyColors.secondary }]} />
              <Text style={styles.legendText}>Inflow (Salary & Returns)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSquare, { backgroundColor: FundlyColors.primaryContainer }]} />
              <Text style={styles.legendText}>Outflow (Expenses)</Text>
            </View>
          </View>
        </View>

        {/* Spending Category Distribution */}
        {loading ? (
          <ActivityIndicator color={FundlyColors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <SpendingChart
            total={`₦${totalExpenses.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`}
            categories={categories}
          />
        )}

        {/* Financial Health Observation */}
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Text style={styles.insightEmoji}>💡</Text>
            <Text style={styles.insightTitle}>Financial Health Tip</Text>
          </View>
          <Text style={styles.insightText}>
            Track your income and expenses regularly to stay on top of your financial goals. A healthy savings rate of at least 20% of your monthly income is a great target to aim for.
          </Text>
        </View>
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
  heroCard: {
    backgroundColor: FundlyColors.surfaceContainerLow,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: FundlyColors.surfaceContainerHigh,
    gap: 12,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroSub: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.outline,
    letterSpacing: 0.6,
  },
  rateBadge: {
    backgroundColor: 'rgba(78, 222, 163, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  rateText: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.secondary,
    fontWeight: '700',
  },
  heroAmount: {
    ...FundlyTypography.headlineLg,
    color: FundlyColors.secondary,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  heroMetricsGrid: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: FundlyColors.surfaceContainerHigh,
    paddingTop: 12,
  },
  heroMetricItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroMetricLabel: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.outline,
  },
  heroMetricVal: {
    ...FundlyTypography.titleMd,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  chartCard: {
    backgroundColor: FundlyColors.surfaceContainerLow,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: FundlyColors.surfaceContainerHigh,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...FundlyTypography.titleMd,
    color: FundlyColors.onSurface,
  },
  cardSub: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.outline,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    paddingTop: 24,
    paddingHorizontal: 8,
  },
  barColumn: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  activeFloatChip: {
    position: 'absolute',
    top: -20,
    backgroundColor: FundlyColors.primaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 10,
  },
  activeFloatText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '700',
  },
  barGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  barTrack: {
    width: 12,
    borderRadius: 6,
  },
  barActiveIncome: {
    backgroundColor: FundlyColors.secondary,
  },
  barInactiveIncome: {
    backgroundColor: 'rgba(78, 222, 163, 0.35)',
  },
  barActiveExpense: {
    backgroundColor: FundlyColors.primaryContainer,
  },
  barInactiveExpense: {
    backgroundColor: FundlyColors.surfaceContainerHigh,
  },
  barMonthLabel: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.outline,
  },
  barMonthLabelSelected: {
    color: FundlyColors.onSurface,
    fontWeight: '700',
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: FundlyColors.surfaceContainerHigh,
    paddingTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSquare: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.onSurfaceVariant,
  },
  insightCard: {
    backgroundColor: FundlyColors.surfaceContainer,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightEmoji: {
    fontSize: 18,
  },
  insightTitle: {
    ...FundlyTypography.titleMd,
    color: FundlyColors.onSurface,
  },
  insightText: {
    ...FundlyTypography.bodyMd,
    color: FundlyColors.onSurfaceVariant,
    lineHeight: 22,
  },
  highlightText: {
    color: FundlyColors.secondary,
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 180, 171, 0.15)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 180, 171, 0.3)',
    alignItems: 'center',
  },
  errorBannerText: {
    ...FundlyTypography.labelMd,
    color: FundlyColors.error,
    fontWeight: '600',
  },
});
