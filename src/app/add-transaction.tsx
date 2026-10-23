import React, { useState } from 'react';
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

interface CategoryOption {
  name: string;
  icon: string;
  color: string;
}

const CATEGORIES: CategoryOption[] = [
  { name: 'Food', icon: '🍽️', color: FundlyColors.tertiary },
  { name: 'Transport', icon: '🚗', color: FundlyColors.primary },
  { name: 'Shopping', icon: '🛍️', color: FundlyColors.primaryFixed },
  { name: 'Bills', icon: '🧾', color: FundlyColors.secondary },
  { name: 'Entertainment', icon: '🎮', color: '#c084fc' },
  { name: 'Health', icon: '❤️', color: '#f472b6' },
  { name: 'Home', icon: '🏠', color: '#38bdf8' },
  { name: 'Education', icon: '🎓', color: '#facc15' },
];

const PAYMENT_METHODS = ['Cash', 'Card', 'Bank'] as const;

export default function AddTransactionScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [amountStr, setAmountStr] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState<CategoryOption>(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedPayment, setSelectedPayment] = useState<typeof PAYMENT_METHODS[number]>('Cash');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const numericAmount = parseFloat(amountStr.replace(/[^0-9.]/g, '')) || 0;

  const adjustAmount = (delta: number) => {
    const current = parseFloat(amountStr.replace(/[^0-9.]/g, '')) || 0;
    const next = Math.max(0, current + delta);
    setAmountStr(next.toString());
  };

  const handleAmountChange = (text: string) => {
    // Keep numbers and at most one decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    setAmountStr(cleaned);
  };

  const handleSave = async () => {
    if (saveStatus !== 'idle') return; // Prevent duplicate submissions

    if (!user) {
      router.replace('/auth');
      return;
    }

    if (numericAmount <= 0) {
      setErrorMsg('Please enter an amount greater than zero.');
      return;
    }

    setErrorMsg('');
    setSaveStatus('saving');

    const isInc = txType === 'income';

    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        name: description.trim() || (isInc ? 'Income Payment' : `${selectedCategory.name} Expense`),
        category: selectedCategory.name,
        category_display: selectedCategory.name,
        amount: numericAmount,
        is_income: isInc,
        payment_method: selectedPayment,
        note: `${selectedPayment} Payment`,
        emoji: selectedCategory.icon,
        icon_bg: isInc ? 'rgba(78, 222, 163, 0.20)' : 'rgba(255, 180, 171, 0.20)',
        icon_color: isInc ? FundlyColors.secondary : FundlyColors.error,
        date: dateStr || new Date().toISOString().split('T')[0],
        time_display: timeStr,
      });

      if (error) {
        console.warn('Database error inserting transaction:', error);
        setErrorMsg(error.message || 'Failed to save transaction. Please try again.');
        setSaveStatus('idle');
        return;
      }

      setSaveStatus('saved');
      setTimeout(() => {
        router.back();
      }, 600);
    } catch (e: any) {
      console.warn('Error in transaction submission:', e);
      setErrorMsg(e.message || 'Something went wrong. Please try again.');
      setSaveStatus('idle');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityLabel="Go Back">
            <Text style={styles.backBtnText}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Add Transaction</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        {/* Type Switcher Pill */}
        <View style={styles.typeSwitcher}>
          <Pressable
            style={[
              styles.typeBtn,
              txType === 'expense' && styles.typeBtnExpenseActive,
            ]}
            onPress={() => setTxType('expense')}>
            <Text style={styles.typeBtnIcon}>↓</Text>
            <Text
              style={[
                styles.typeBtnLabel,
                txType === 'expense' && styles.typeBtnLabelActive,
              ]}>
              Expense
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.typeBtn,
              txType === 'income' && styles.typeBtnIncomeActive,
            ]}
            onPress={() => setTxType('income')}>
            <Text style={styles.typeBtnIcon}>↑</Text>
            <Text
              style={[
                styles.typeBtnLabel,
                txType === 'income' && styles.typeBtnLabelActive,
              ]}>
              Income
            </Text>
          </Pressable>
        </View>

        {/* Hero Amount Display */}
        <View style={styles.amountDisplayCard}>
          <Text style={styles.amountPrompt}>TRANSACTION AMOUNT (₦)</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountCurrency}>₦</Text>
            <TextInput
              style={styles.amountBigNumberInput}
              value={amountStr === '0' ? '' : amountStr}
              onChangeText={handleAmountChange}
              placeholder="0"
              placeholderTextColor={FundlyColors.outline}
              keyboardType="decimal-pad"
              autoFocus={false}
            />
            <Text style={styles.amountDecimals}>.00</Text>
          </View>

          {/* Quick Increment Bubbles */}
          <View style={styles.quickAddRow}>
            <Pressable style={styles.bubbleBtn} onPress={() => adjustAmount(1000)}>
              <Text style={styles.bubbleText}>+₦1k</Text>
            </Pressable>
            <Pressable style={styles.bubbleBtn} onPress={() => adjustAmount(5000)}>
              <Text style={styles.bubbleText}>+₦5k</Text>
            </Pressable>
            <Pressable style={styles.bubbleBtn} onPress={() => adjustAmount(10000)}>
              <Text style={styles.bubbleText}>+₦10k</Text>
            </Pressable>
            <Pressable style={styles.bubbleResetBtn} onPress={() => setAmountStr('0')}>
              <Text style={styles.bubbleResetText}>Reset</Text>
            </Pressable>
          </View>
        </View>

        {/* Category Grid Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Select Category</Text>
            <Text style={styles.selectedCategoryLabel}>{selectedCategory.name}</Text>
          </View>

          <View style={styles.categoryGrid}>
            {CATEGORIES.map(cat => {
              const isSelected = selectedCategory.name === cat.name;
              return (
                <Pressable
                  key={cat.name}
                  style={[
                    styles.categoryCard,
                    isSelected ? styles.categoryCardSelected : styles.categoryCardUnselected,
                  ]}
                  onPress={() => setSelectedCategory(cat)}>
                  <View style={styles.categoryIconCircle}>
                    <Text style={styles.categoryIconEmoji}>{cat.icon}</Text>
                  </View>
                  <Text
                    style={[
                      styles.categoryCardLabel,
                      isSelected && styles.categoryCardLabelSelected,
                    ]}
                    numberOfLines={1}>
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Form Fields: Description */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Description</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>📝</Text>
            <TextInput
              style={styles.textInputField}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Lunch at Yellow Chilli"
              placeholderTextColor={FundlyColors.outline}
            />
          </View>
        </View>

        {/* Form Fields: Date */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Transaction Date (YYYY-MM-DD)</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputIcon}>📅</Text>
            <TextInput
              style={styles.textInputField}
              value={dateStr}
              onChangeText={setDateStr}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={FundlyColors.outline}
            />
          </View>
        </View>

        {/* Payment Method Selector */}
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Payment Method</Text>
          <View style={styles.paymentMethodsRow}>
            {PAYMENT_METHODS.map(method => {
              const isSelected = selectedPayment === method;
              return (
                <Pressable
                  key={method}
                  style={[
                    styles.paymentPill,
                    isSelected ? styles.paymentPillSelected : styles.paymentPillUnselected,
                  ]}
                  onPress={() => setSelectedPayment(method)}>
                  <Text style={styles.paymentMethodIcon}>
                    {method === 'Cash' ? '💵' : method === 'Card' ? '💳' : '🏦'}
                  </Text>
                  <Text
                    style={[
                      styles.paymentPillText,
                      isSelected ? styles.paymentPillTextSelected : styles.paymentPillTextUnselected,
                    ]}>
                    {method}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Error message */}
        {errorMsg ? (
          <View style={styles.errorNotice}>
            <Text style={styles.errorNoticeText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Actions Container */}
        <View style={styles.actionsContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              txType === 'income' && styles.saveBtnIncome,
              saveStatus === 'saved' && styles.saveBtnSaved,
              pressed && styles.saveBtnPressed,
            ]}
            onPress={handleSave}
            disabled={saveStatus !== 'idle'}>
            <Text style={styles.saveBtnText}>
              {saveStatus === 'idle'
                ? 'Save Transaction'
                : saveStatus === 'saving'
                ? 'Saving...'
                : '✓ Transaction Saved!'}
            </Text>
          </Pressable>

          <Pressable style={styles.deleteBtn} onPress={() => router.back()}>
            <Text style={styles.deleteBtnIcon}>🗑️</Text>
            <Text style={styles.deleteBtnText}>Cancel & Go Back</Text>
          </Pressable>
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: FundlyColors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 20,
    color: FundlyColors.onSurface,
    fontWeight: '700',
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
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: FundlyColors.surfaceContainerLow,
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 999,
  },
  typeBtnExpenseActive: {
    backgroundColor: FundlyColors.primaryContainer,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  typeBtnIncomeActive: {
    backgroundColor: FundlyColors.secondaryContainer,
    shadowColor: '#00a572',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  typeBtnIcon: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
  typeBtnLabel: {
    ...FundlyTypography.labelLg,
    color: FundlyColors.onSurfaceVariant,
  },
  typeBtnLabelActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  amountDisplayCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  amountPrompt: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  amountCurrency: {
    ...FundlyTypography.displayLg,
    color: FundlyColors.primary,
    marginRight: 4,
    fontWeight: '600',
  },
  amountBigNumberInput: {
    ...FundlyTypography.displayLg,
    color: FundlyColors.onSurface,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'center',
    padding: 0,
    fontVariant: ['tabular-nums'],
  },
  amountDecimals: {
    ...FundlyTypography.headlineSm,
    color: FundlyColors.onSurfaceVariant,
    fontWeight: '500',
  },
  quickAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  bubbleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: FundlyColors.surfaceContainerHigh,
  },
  bubbleText: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.onSurfaceVariant,
    fontWeight: '600',
  },
  bubbleResetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: FundlyColors.surfaceContainer,
  },
  bubbleResetText: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.outline,
    fontWeight: '500',
  },
  section: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...FundlyTypography.titleMd,
    color: FundlyColors.onSurface,
  },
  selectedCategoryLabel: {
    ...FundlyTypography.labelMd,
    color: FundlyColors.primary,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    width: '23%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 14,
    gap: 6,
  },
  categoryCardSelected: {
    backgroundColor: FundlyColors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: FundlyColors.primary,
  },
  categoryCardUnselected: {
    backgroundColor: FundlyColors.surfaceContainer,
  },
  categoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: FundlyColors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconEmoji: {
    fontSize: 20,
  },
  categoryCardLabel: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.onSurfaceVariant,
  },
  categoryCardLabelSelected: {
    color: FundlyColors.onSurface,
    fontWeight: '700',
  },
  fieldLabel: {
    ...FundlyTypography.labelMd,
    color: FundlyColors.onSurfaceVariant,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FundlyColors.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    gap: 8,
  },
  inputIcon: {
    fontSize: 18,
  },
  textInputField: {
    flex: 1,
    color: FundlyColors.onSurface,
    ...FundlyTypography.bodyMd,
    padding: 0,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  paymentPillSelected: {
    backgroundColor: FundlyColors.primaryContainer,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  paymentPillUnselected: {
    backgroundColor: FundlyColors.surfaceContainerLow,
  },
  paymentMethodIcon: {
    fontSize: 16,
  },
  paymentPillText: {
    ...FundlyTypography.labelLg,
  },
  paymentPillTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  paymentPillTextUnselected: {
    color: FundlyColors.onSurfaceVariant,
  },
  errorNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  errorNoticeText: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.error,
    textAlign: 'center',
  },
  actionsContainer: {
    gap: 12,
    paddingTop: 8,
  },
  saveBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: FundlyColors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  saveBtnIncome: {
    backgroundColor: FundlyColors.secondaryContainer,
  },
  saveBtnSaved: {
    backgroundColor: FundlyColors.secondary,
  },
  saveBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  saveBtnText: {
    ...FundlyTypography.titleMd,
    color: '#ffffff',
    fontWeight: '700',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  deleteBtnIcon: {
    fontSize: 14,
  },
  deleteBtnText: {
    ...FundlyTypography.labelMd,
    color: FundlyColors.error,
    fontWeight: '600',
  },
});
