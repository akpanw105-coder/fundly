import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  const { user, session } = useAuth();

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [offlineBannerDismissed, setOfflineBannerDismissed] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedSuccessfully, setSyncedSuccessfully] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

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
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, fetchHistory]);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      fetchHistory();
      setIsSyncing(false);
      setSyncedSuccessfully(true);
      setTimeout(() => {
        setOfflineBannerDismissed(true);
      }, 2500);
    }, 1200);
  };

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
        showsVerticalScrollIndicator={false}>
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
              <Text style={styles.horizonText}>This Month (Dec 2024)</Text>
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

        {/* Offline Status Banner */}
        {!offlineBannerDismissed && (
          <View
            style={[
              styles.offlineBanner,
              syncedSuccessfully && styles.offlineBannerSuccess,
            ]}>
            <View style={styles.offlineLeft}>
              <View
                style={[
                  styles.statusDot,
                  syncedSuccessfully ? styles.statusDotGreen : styles.statusDotAmber,
                ]}
              />
              <Text style={styles.offlineText} numberOfLines={1}>
                {syncedSuccessfully
                  ? 'All Supabase cloud records synchronized'
                  : 'Cloud Database synchronization active'}
              </Text>
            </View>

            {!syncedSuccessfully && (
              <View style={styles.offlineActions}>
                <Pressable
                  onPress={handleSync}
                  disabled={isSyncing}
                  style={styles.syncBtn}
                  hitSlop={6}>
                  <Text style={styles.syncBtnText}>
                    {isSyncing ? 'Syncing...' : '⚡ Sync'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setOfflineBannerDismissed(true)}
                  style={styles.dismissBtn}
                  hitSlop={8}>
                  <Text style={styles.dismissBtnText}>✕</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <ActivityIndicator size="large" color={FundlyColors.primary} style={{ marginVertical: 40 }} />
        ) : groupedItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Text style={styles.emptyIcon}>🔍</Text>
            </View>
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptyDesc}>
              We couldn&apos;t find matches in your Supabase account. Try recording a new transaction.
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
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: FundlyColors.surfaceContainerHigh,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  offlineBannerSuccess: {
    borderColor: 'rgba(78, 222, 163, 0.3)',
    backgroundColor: 'rgba(78, 222, 163, 0.1)',
  },
  offlineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotAmber: {
    backgroundColor: '#fbbf24',
  },
  statusDotGreen: {
    backgroundColor: FundlyColors.secondary,
  },
  offlineText: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.onSurfaceVariant,
    flex: 1,
  },
  offlineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  syncBtnText: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.primary,
    fontWeight: '700',
  },
  dismissBtn: {
    padding: 4,
  },
  dismissBtnText: {
    color: FundlyColors.outline,
    fontSize: 14,
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
});
