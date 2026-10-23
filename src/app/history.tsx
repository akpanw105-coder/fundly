import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
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

export interface HistoryItem {
  id: string;
  name: string;
  date: string;
  groupDate: string;
  category: string;
  categoryDisplay: string;
  amount: string;
  isIncome: boolean;
  time: string;
  paymentMethod: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  isOffline?: boolean;
}

const CATEGORY_CHIPS = ['All', 'Income', 'Expenses', 'Food', 'Transport', 'Bills'] as const;

export default function HistoryScreen() {
  const router = useRouter();
  const { user, session, isLoading: authLoading } = useAuth();

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;
    setDeleting(true);
    setDeleteError('');

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setItems(prev => prev.filter(it => it.id !== id));
      setSelectedItem(null);
    } catch (e: any) {
      console.warn('Error deleting transaction:', e.message);
      setDeleteError(e.message || 'Failed to delete transaction.');
    } finally {
      setDeleting(false);
    }
  };

  const fetchHistory = useCallback(async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMsg('');

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped: HistoryItem[] = data.map((t: any) => {
          const num = Number(t.amount) || 0;
          return {
            id: t.id,
            name: t.name,
            date: t.date,
            groupDate: t.date === new Date().toISOString().split('T')[0] ? 'Today' : t.date,
            category: t.category,
            categoryDisplay: t.category_display || t.category,
            amount: `${t.is_income ? '+' : '-'}₦${num.toLocaleString('en-NG', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
            isIncome: t.is_income,
            time: t.time_display || '12:00 PM',
            paymentMethod: t.payment_method || 'Card',
            icon: t.emoji || (t.is_income ? '💰' : '💳'),
            iconBg: t.icon_bg || 'rgba(37, 99, 235, 0.20)',
            iconColor: t.icon_color || FundlyColors.primary,
            isOffline: false,
          };
        });
        setItems(mapped);
      }
    } catch (e) {
      console.warn('Error fetching history:', e);
      setErrorMsg('Could not load transactions. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, fetchHistory]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter(item => {
      const matchesSearch =
        q.length === 0 ||
        item.name.toLowerCase().includes(q) ||
        item.categoryDisplay.toLowerCase().includes(q);

      let matchesCategory = true;
      if (selectedFilter === 'All') {
        matchesCategory = true;
      } else if (selectedFilter === 'Income') {
        matchesCategory = item.isIncome;
      } else if (selectedFilter === 'Expenses') {
        matchesCategory = !item.isIncome;
      } else {
        matchesCategory = item.category.toLowerCase() === selectedFilter.toLowerCase();
      }

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedFilter, items]);

  // Group items by groupDate
  const groupedItems = useMemo(() => {
    const map = new Map<string, { totalFormatted: string; isNetPositive: boolean; items: HistoryItem[] }>();

    filteredItems.forEach(item => {
      if (!map.has(item.groupDate)) {
        map.set(item.groupDate, { totalFormatted: '', isNetPositive: false, items: [] });
      }
      map.get(item.groupDate)!.items.push(item);
    });

    map.forEach((val) => {
      let net = 0;
      val.items.forEach(it => {
        const num = parseFloat(it.amount.replace(/[^0-9.]/g, '')) || 0;
        net += it.isIncome ? num : -num;
      });
      val.isNetPositive = net >= 0;
      val.totalFormatted = `${net >= 0 ? '+' : '-'}₦${Math.abs(net).toLocaleString('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    });

    return Array.from(map.entries());
  }, [filteredItems]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.walletIconBox}>
            <Text style={styles.walletIcon}>💳</Text>
          </View>
          <Text style={styles.headerTitle}>Transactions</Text>
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
            onRefresh={() => fetchHistory(true)}
            tintColor={FundlyColors.primary}
          />
        }>
        {/* Search & Filter Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search transactions, merchant..."
                placeholderTextColor={FundlyColors.outline}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  style={styles.clearBtn}
                  onPress={() => setSearchQuery('')}
                  hitSlop={8}>
                  <Text style={styles.clearBtnText}>✕</Text>
                </Pressable>
              )}
            </View>

            <Pressable
              style={styles.filterBtn}
              onPress={() => {
                const curIdx = CATEGORY_CHIPS.indexOf(selectedFilter as any);
                const nextIdx = (curIdx + 1) % CATEGORY_CHIPS.length;
                setSelectedFilter(CATEGORY_CHIPS[nextIdx]);
              }}
              hitSlop={8}>
              <Text style={styles.filterBtnIcon}>⚙️</Text>
            </Pressable>
          </View>

          {/* Quick Horizon & Total Row */}
          <View style={styles.horizonRow}>
            <View style={styles.horizonBadge}>
              <Text style={styles.calIcon}>📅</Text>
              <Text style={styles.horizonText}>This Month ({new Date().toLocaleString('en-NG', { month: 'long', year: 'numeric' })})</Text>
            </View>

            <View style={styles.horizonTotalCol}>
              <Text style={styles.decTotalLabel}>TOTAL RECORDS</Text>
              <Text style={styles.decTotalVal}>{items.length} Logged</Text>
            </View>
          </View>

          {/* Category Filter Chips Horizontal Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}>
            {CATEGORY_CHIPS.map(chip => {
              const active = selectedFilter === chip;
              return (
                <Pressable
                  key={chip}
                  style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                  onPress={() => setSelectedFilter(chip)}>
                  <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                    {chip}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>


        {/* Loading / Error / Empty / Content */}
        {loading ? (
          <ActivityIndicator size="large" color={FundlyColors.primary} style={{ marginVertical: 40 }} />
        ) : errorMsg ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Text style={styles.emptyIcon}>⚠️</Text>
            </View>
            <Text style={styles.emptyTitle}>Something went wrong</Text>
            <Text style={styles.emptyDesc}>{errorMsg}</Text>
            <Pressable
              style={styles.resetBtn}
              onPress={() => fetchHistory()}>
              <Text style={styles.resetBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : groupedItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Text style={styles.emptyIcon}>🔍</Text>
            </View>
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptyDesc}>
              {searchQuery || selectedFilter !== 'All'
                ? 'No results match your search or filter.'
                : 'Start adding transactions to see your history here.'}
            </Text>
            <Pressable
              style={styles.resetBtn}
              onPress={() => router.push('/add-transaction')}>
              <Text style={styles.resetBtnText}>+ Add Transaction</Text>
            </Pressable>
          </View>
        ) : (
          groupedItems.map(([dateGroup, groupData]) => (
            <View key={dateGroup} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupDate}>{dateGroup}</Text>
                <Text
                  style={[
                    styles.groupTotal,
                    groupData.isNetPositive ? styles.amountIncome : styles.amountExpense,
                  ]}>
                  {groupData.totalFormatted}
                </Text>
              </View>

              <View style={styles.itemsContainer}>
                {groupData.items.map((item, index) => (
                  <React.Fragment key={item.id}>
                    {index > 0 && <View style={styles.itemDivider} />}
                    <Pressable
                      style={({ pressed }) => [
                        styles.itemRow,
                        pressed && styles.itemRowPressed,
                        selectedItem?.id === item.id && styles.itemRowSelected,
                      ]}
                      onPress={() => setSelectedItem(item)}>
                      <View style={[styles.itemIconBox, { backgroundColor: item.iconBg }]}>
                        <Text style={[styles.itemIconEmoji, { color: item.iconColor }]}>
                          {item.icon}
                        </Text>
                      </View>

                      <View style={styles.itemDetails}>
                        <View style={styles.itemNameRow}>
                          <Text style={styles.itemName} numberOfLines={1}>
                            {item.name}
                          </Text>
                        </View>

                        <View style={styles.itemMetaRow}>
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>
                              {item.categoryDisplay}
                            </Text>
                          </View>
                          <Text style={styles.metaDot}>•</Text>
                          <Text style={styles.itemTimeText}>
                            {item.time} ({item.paymentMethod})
                          </Text>
                        </View>
                      </View>

                      <View style={styles.itemAmountCol}>
                        <Text
                          style={[
                            styles.itemAmount,
                            item.isIncome ? styles.amountIncome : styles.amountExpense,
                          ]}>
                          {item.amount}
                        </Text>
                      </View>
                    </Pressable>
                  </React.Fragment>
                ))}
              </View>
            </View>
          ))
        )}

        {/* Detail Bottom Card Modal if item tapped */}
        {selectedItem && (
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Transaction Details</Text>
              <Pressable
                onPress={() => setSelectedItem(null)}
                style={styles.detailCloseBtn}
                hitSlop={8}>
                <Text style={styles.detailCloseText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.detailBody}>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Merchant / Name</Text>
                <Text style={styles.detailVal}>{selectedItem.name}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Category</Text>
                <Text style={styles.detailVal}>{selectedItem.categoryDisplay}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Date & Time</Text>
                <Text style={styles.detailVal}>{selectedItem.date} at {selectedItem.time}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Payment Method</Text>
                <Text style={styles.detailVal}>{selectedItem.paymentMethod}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Amount</Text>
                <Text
                  style={[
                    styles.detailValAmount,
                    selectedItem.isIncome ? styles.amountIncome : styles.amountExpense,
                  ]}>
                  {selectedItem.amount}
                </Text>
              </View>

              {deleteError ? (
                <Text style={styles.deleteErrorText}>{deleteError}</Text>
              ) : null}

              <Pressable
                style={[styles.deleteBtn, deleting && styles.deleteBtnDisabled]}
                disabled={deleting}
                onPress={() => handleDeleteTransaction(selectedItem.id)}>
                <Text style={styles.deleteBtnText}>
                  {deleting ? 'Deleting...' : 'Delete Transaction'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
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
  searchSection: {
    gap: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBox: {
    flex: 1,
    height: 46,
    backgroundColor: FundlyColors.surfaceContainer,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: FundlyColors.onSurface,
    ...FundlyTypography.bodyMd,
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    color: FundlyColors.outline,
    fontSize: 14,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: FundlyColors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnIcon: {
    fontSize: 18,
  },
  horizonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  horizonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: FundlyColors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  calIcon: {
    fontSize: 14,
  },
  horizonText: {
    ...FundlyTypography.labelMd,
    color: FundlyColors.onSurface,
    fontWeight: '600',
  },
  horizonTotalCol: {
    alignItems: 'flex-end',
  },
  decTotalLabel: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.outline,
    letterSpacing: 0.5,
  },
  decTotalVal: {
    ...FundlyTypography.labelMd,
    fontWeight: '700',
    color: FundlyColors.secondary,
    fontVariant: ['tabular-nums'],
  },
  chipsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
  },
  chipActive: {
    backgroundColor: FundlyColors.primaryContainer,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  chipInactive: {
    backgroundColor: FundlyColors.surfaceContainer,
  },
  chipText: {
    ...FundlyTypography.labelMd,
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  chipTextInactive: {
    color: FundlyColors.onSurfaceVariant,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: FundlyColors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyTitle: {
    ...FundlyTypography.headlineSm,
    color: FundlyColors.onSurface,
  },
  emptyDesc: {
    ...FundlyTypography.bodyMd,
    color: FundlyColors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 280,
  },
  resetBtn: {
    marginTop: 8,
    backgroundColor: FundlyColors.primaryContainer,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  resetBtnText: {
    ...FundlyTypography.labelMd,
    color: '#ffffff',
    fontWeight: '600',
  },
  groupCard: {
    gap: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  groupDate: {
    ...FundlyTypography.labelMd,
    fontWeight: '600',
    color: FundlyColors.onSurface,
  },
  groupTotal: {
    ...FundlyTypography.labelMd,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  itemsContainer: {
    backgroundColor: FundlyColors.surfaceContainer,
    borderRadius: 18,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  itemRowPressed: {
    backgroundColor: FundlyColors.surfaceContainerHigh,
  },
  itemRowSelected: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
  },
  itemDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: FundlyColors.surfaceContainerHigh,
    marginHorizontal: 14,
  },
  itemIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemIconEmoji: {
    fontSize: 22,
  },
  itemDetails: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemName: {
    ...FundlyTypography.titleMd,
    color: FundlyColors.onSurface,
    flexShrink: 1,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: FundlyColors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.onSurfaceVariant,
  },
  metaDot: {
    color: FundlyColors.outline,
    fontSize: 10,
  },
  itemTimeText: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.outline,
  },
  itemAmountCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
    paddingLeft: 6,
  },
  itemAmount: {
    ...FundlyTypography.titleMd,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  amountIncome: {
    color: FundlyColors.secondary,
  },
  amountExpense: {
    color: FundlyColors.error,
  },
  detailCard: {
    backgroundColor: FundlyColors.surfaceContainerLow,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: FundlyColors.surfaceContainerHigh,
    padding: 16,
    gap: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: FundlyColors.surfaceContainerHigh,
    paddingBottom: 8,
  },
  detailTitle: {
    ...FundlyTypography.titleMd,
    color: FundlyColors.onSurface,
  },
  detailCloseBtn: {
    padding: 4,
  },
  detailCloseText: {
    color: FundlyColors.outline,
    fontSize: 16,
  },
  detailBody: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailKey: {
    ...FundlyTypography.labelMd,
    color: FundlyColors.outline,
  },
  detailVal: {
    ...FundlyTypography.labelMd,
    color: FundlyColors.onSurface,
    fontWeight: '500',
  },
  detailValAmount: {
    ...FundlyTypography.titleMd,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  deleteBtn: {
    marginTop: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteBtnDisabled: {
    opacity: 0.5,
  },
  deleteBtnText: {
    ...FundlyTypography.labelMd,
    color: FundlyColors.error,
    fontWeight: '700',
  },
  deleteErrorText: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.error,
    textAlign: 'center',
    marginTop: 4,
  },
});
