import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Modal,
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

import { BalanceCard } from '@/components/fundly/BalanceCard';
import { PeriodFilter } from '@/components/fundly/PeriodFilter';
import { Category, SpendingChart } from '@/components/fundly/SpendingChart';
import { Transaction, TransactionItem } from '@/components/fundly/TransactionItem';
import { BottomTabInset, FundlyColors, FundlyTypography, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';

const INITIAL_CATEGORIES: Category[] = [
  { label: 'Food & Dining', percentage: 40.2, amount: '₦340k', color: FundlyColors.categoryFood },
  { label: 'Transport', percentage: 21.8, amount: '₦185k', color: FundlyColors.categoryTransport },
  { label: 'Utilities', percentage: 14.2, amount: '₦120k', color: FundlyColors.categoryUtilities },
  { label: 'Subscriptions', percentage: 9.5, amount: '₦80k', color: FundlyColors.categorySubscriptions },
];

export default function HomeScreen() {
  const router = useRouter();
  const { session, user, isLoading: authLoading } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [balance, setBalance] = useState('₦4,850,240.00');
  const [incomeTotal, setIncomeTotal] = useState('₦2,400,000.00');
  const [expenseTotal, setExpenseTotal] = useState('₦845,300.50');

  const [modalVisible, setModalVisible] = useState(false);
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  // Access Control: redirect unauthenticated users to /auth
  useEffect(() => {
    if (!authLoading && !session) {
      router.replace('/auth');
    }
  }, [session, authLoading, router]);

  // Load transactions and calculate metrics
  const loadFinancialData = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        let totalInc = 0;
        let totalExp = 0;

        const mapped: Transaction[] = data.map((t: any) => {
          const num = Number(t.amount) || 0;
          if (t.is_income) totalInc += num;
          else totalExp += num;

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
        const netBal = 4850240 + totalInc - totalExp;
        setBalance(`₦${netBal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`);
      }
    } catch (e) {
      console.warn('Error loading financial data:', e);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFinancialData();
    }
  }, [user, loadFinancialData]);

  const handleAddTransaction = async () => {
    if (!amount.trim() || !user) return;

    const numAmount = parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;
    const isInc = txType === 'income';

    try {
      const { data, error } = await supabase.from('transactions').insert({
        user_id: user.id,
        name: note.trim() || (isInc ? 'Income Payment' : 'General Outflow'),
        category: isInc ? 'Income' : 'General',
        category_display: isInc ? 'Income' : 'General Expense',
        amount: numAmount,
        is_income: isInc,
        payment_method: 'Card',
        note: 'Quick Entry',
        emoji: isInc ? '💰' : '💸',
        icon_bg: isInc ? 'rgba(78, 222, 163, 0.20)' : 'rgba(255, 180, 171, 0.20)',
        icon_color: isInc ? FundlyColors.secondary : FundlyColors.error,
      }).select();

      if (error) throw error;

      if (data && data[0]) {
        loadFinancialData();
      }
    } catch (e: any) {
      console.warn('Failed to insert transaction:', e.message);
    }

    setAmount('');
    setNote('');
    setModalVisible(false);
  };

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
        showsVerticalScrollIndicator={false}>
        {/* User Status / Greeting */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greetingTitle}>
              Good day, {user?.user_metadata?.full_name?.split(' ')[0] || 'Tunde'}
            </Text>
            <Text style={styles.greetingDate}>December 2024</Text>
          </View>

        </View>

        {/* Hero Total Balance Card */}
        <BalanceCard
          balance={balance}
          income={incomeTotal}
          expenses={expenseTotal}
        />

        {/* Period Filter */}
        <PeriodFilter onChange={(_) => {}} />

        {/* Spending By Category Chart */}
        <SpendingChart
          total={expenseTotal}
          categories={INITIAL_CATEGORIES}
        />

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
                <Text style={styles.emptyText}>No transactions recorded yet in Supabase.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Quick Add Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quick Add Transaction</Text>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
                hitSlop={8}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.typeSwitcher}>
              <Pressable
                style={[styles.typeBtn, txType === 'expense' && styles.typeBtnActive]}
                onPress={() => setTxType('expense')}>
                <Text
                  style={[
                    styles.typeBtnText,
                    txType === 'expense' && styles.typeBtnTextActive,
                  ]}>
                  Expense
                </Text>
              </Pressable>
              <Pressable
                style={[styles.typeBtn, txType === 'income' && styles.typeBtnActive]}
                onPress={() => setTxType('income')}>
                <Text
                  style={[
                    styles.typeBtnText,
                    txType === 'income' && styles.typeBtnTextActive,
                  ]}>
                  Income
                </Text>
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (₦)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={FundlyColors.outline}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Note / Merchant</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Spar Lekki Grocery"
                placeholderTextColor={FundlyColors.outline}
                value={note}
                onChangeText={setNote}
              />
            </View>

            <Pressable
              style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed]}
              onPress={handleAddTransaction}>
              <Text style={styles.submitBtnText}>Save to Supabase</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: FundlyColors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: FundlyColors.secondary,
  },
  syncText: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.onSurfaceVariant,
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
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    ...FundlyTypography.bodyMd,
    color: FundlyColors.outline,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: FundlyColors.surfaceContainerLow,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    ...FundlyTypography.headlineSm,
    color: FundlyColors.onSurface,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: FundlyColors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: FundlyColors.outline,
    fontSize: 14,
    fontWeight: '700',
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: FundlyColors.surfaceContainer,
    borderRadius: 999,
    padding: 4,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 999,
  },
  typeBtnActive: {
    backgroundColor: FundlyColors.primaryContainer,
  },
  typeBtnText: {
    ...FundlyTypography.labelMd,
    color: FundlyColors.outline,
  },
  typeBtnTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    ...FundlyTypography.labelMd,
    color: FundlyColors.outline,
  },
  input: {
    backgroundColor: FundlyColors.surfaceContainer,
    color: FundlyColors.onSurface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...FundlyTypography.bodyLg,
  },
  submitBtn: {
    backgroundColor: FundlyColors.primaryContainer,
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnPressed: {
    opacity: 0.9,
  },
  submitBtnText: {
    ...FundlyTypography.titleMd,
    color: '#ffffff',
  },
});
