import React, { useEffect, useState, useCallback } from 'react';
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

import { BalanceCard } from '@/components/fundly/BalanceCard';
import { PeriodFilter } from '@/components/fundly/PeriodFilter';
import { Category, SpendingChart } from '@/components/fundly/SpendingChart';
import { Transaction, TransactionItem } from '@/components/fundly/TransactionItem';
import { BottomTabInset, FundlyColors, FundlyTypography, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const router = useRouter();
  const { session, user, isLoading: authLoading } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [balance, setBalance] = useState('₦0.00');
  const [incomeTotal, setIncomeTotal] = useState('₦0.00');
  const [expenseTotal, setExpenseTotal] = useState('₦0.00');
  const [spendingCategories, setSpendingCategories] = useState<Category[]>([]);

  // Access Control: redirect unauthenticated users to /auth
  useEffect(() => {
    if (!authLoading && !session) {
      router.replace('/auth');
    }
  }, [session, authLoading, router]);

  // Load transactions and calculate metrics
  const loadFinancialData = useCallback(async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoadingData(true);
    }
    setErrorMsg('');

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      let totalInc = 0;
      let totalExp = 0;
      const catMap: Record<string, number> = {};

      const mapped: Transaction[] = (data || []).map((t: any) => {
        const num = Number(t.amount) || 0;
        if (t.is_income) {
          totalInc += num;
        } else {
          totalExp += num;
          const cat = t.category || 'General';
          catMap[cat] = (catMap[cat] || 0) + num;
        }

        return {
          id: t.id,
          name: t.name,
          date: t.date,
          category: t.category,
          amount: `${t.is_income ? '+' : '-'}₦${num.toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          isIncome: t.is_income,
          note: t.note || t.payment_method,
          emoji: t.emoji || (t.is_income ? '💰' : '💸'),
          iconBg: t.icon_bg || 'rgba(37, 99, 235, 0.20)',
          iconColor: t.icon_color || FundlyColors.primary,
          pending: t.is_pending,
        };
      });

      setTransactions(mapped);
      setIncomeTotal(`₦${totalInc.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);
      setExpenseTotal(`₦${totalExp.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);
      const netBal = totalInc - totalExp;
      setBalance(`₦${netBal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);

      // Build spending categories from real data
      if (totalExp > 0) {
        const colorList = [
          FundlyColors.categoryFood,
          FundlyColors.categoryTransport,
          FundlyColors.categoryUtilities,
          FundlyColors.categorySubscriptions,
          '#c084fc',
          '#38bdf8',
          '#facc15',
        ];
        const cats: Category[] = Object.keys(catMap).map((catName, i) => {
          const catAmt = catMap[catName];
          const pct = Math.round((catAmt / totalExp) * 1000) / 10;
          return {
            label: catName,
            percentage: pct,
            amount: '₦' + (catAmt / 1000).toFixed(0) + 'k',
            color: colorList[i % colorList.length],
          };
        });
        setSpendingCategories(cats);
      } else {
        setSpendingCategories([]);
      }
    } catch (e: any) {
      console.warn('Error loading financial data:', e);
      setErrorMsg('Unable to load your data. Tap to retry.');
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFinancialData();
    } else if (!authLoading) {
      // Auth finished resolving but no user — clear spinner
      setLoadingData(false);
    }
  }, [user, authLoading, loadFinancialData]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const todayLabel = new Date().toLocaleDateString('en-NG', {
    month: 'long',
    year: 'numeric',
  });

  if (authLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={FundlyColors.primaryContainer} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.walletIconBox}>
            <Text style={styles.walletIcon}>💳</Text>
          </View>
          <Text style={styles.headerTitle}>Home</Text>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            style={styles.iconButton}
            hitSlop={8}
            onPress={() => router.push('/settings')}
            accessibilityLabel="Settings">
            <Text style={styles.bellIcon}>⚙️</Text>
          </Pressable>
          <Pressable
            style={styles.avatar}
            onPress={() => router.push('/settings')}
            accessibilityLabel="Profile">
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
            onRefresh={() => loadFinancialData(true)}
            tintColor={FundlyColors.primary}
          />
        }>
        {/* User Greeting */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greetingTitle}>
              {greeting()}, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'} 👋
            </Text>
            <Text style={styles.greetingDate}>{todayLabel}</Text>
          </View>
        </View>

        {/* Error state */}
        {errorMsg ? (
          <Pressable style={styles.errorBanner} onPress={() => loadFinancialData()}>
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
          </Pressable>
        ) : null}

        {/* Hero Total Balance Card */}
        <BalanceCard
          balance={balance}
          income={incomeTotal}
          expenses={expenseTotal}
        />

        {/* Period Filter */}
        <PeriodFilter onChange={(_) => {}} />

        {/* Spending By Category Chart - only shown when data exists */}
        {spendingCategories.length > 0 && (
          <SpendingChart
            total={expenseTotal}
            categories={spendingCategories}
          />
        )}

        {/* Quick Add Action Button */}
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
          onPress={() => router.push('/add-transaction')}>
          <Text style={styles.addBtnIcon}>＋</Text>
          <Text style={styles.addBtnText}>Add Transaction</Text>
        </Pressable>

        {/* Recent Transactions Section */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <Pressable hitSlop={8} onPress={() => router.push('/history')}>
              <Text style={styles.seeAllText}>See All</Text>
            </Pressable>
          </View>

          <View style={styles.transactionsList}>
            {loadingData ? (
              <ActivityIndicator color={FundlyColors.primary} style={{ marginVertical: 20 }} />
            ) : transactions.length > 0 ? (
              transactions.slice(0, 5).map(item => (
                <TransactionItem key={item.id} item={item} />
              ))
            ) : (
              <View style={styles.emptyTransactions}>
                <Text style={styles.emptyIcon}>💸</Text>
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptyText}>
                  Start tracking your finances by adding your first transaction.
                </Text>
                <Pressable
                  style={styles.emptyActionBtn}
                  onPress={() => router.push('/add-transaction')}>
                  <Text style={styles.emptyActionText}>+ Add Transaction</Text>
                </Pressable>
              </View>
            )}
          </View>
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
  loadingScreen: {
    flex: 1,
    backgroundColor: FundlyColors.background,
    alignItems: 'center',
    justifyContent: 'center',
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
  walletIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: FundlyColors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletIcon: {
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
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: FundlyColors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    fontSize: 16,
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
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  greetingTitle: {
    ...FundlyTypography.headlineMd,
    color: FundlyColors.onSurface,
  },
  greetingDate: {
    ...FundlyTypography.bodyMd,
    color: FundlyColors.outline,
    marginTop: 2,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorBannerText: {
    ...FundlyTypography.bodyMd,
    color: FundlyColors.error,
    textAlign: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: FundlyColors.primaryContainer,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  addBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  addBtnIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  addBtnText: {
    ...FundlyTypography.titleMd,
    color: '#ffffff',
  },
  transactionsSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...FundlyTypography.titleMd,
    color: FundlyColors.onSurface,
  },
  seeAllText: {
    ...FundlyTypography.labelMd,
    color: FundlyColors.primary,
    fontWeight: '600',
  },
  transactionsList: {
    gap: 8,
  },
  emptyTransactions: {
    backgroundColor: FundlyColors.surfaceContainerLow,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  emptyTitle: {
    ...FundlyTypography.titleMd,
    color: FundlyColors.onSurface,
  },
  emptyText: {
    ...FundlyTypography.bodyMd,
    color: FundlyColors.outline,
    textAlign: 'center',
    maxWidth: 260,
  },
  emptyActionBtn: {
    marginTop: 8,
    backgroundColor: FundlyColors.primaryContainer,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  emptyActionText: {
    ...FundlyTypography.labelMd,
    color: '#ffffff',
    fontWeight: '600',
  },
});
