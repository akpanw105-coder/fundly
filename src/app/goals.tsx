import React, { useState, useEffect, useCallback } from 'react';
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

interface SavingsGoal {
  id: string;
  title: string;
  saved: number;
  target: number;
  deadline: string;
  icon: string;
  accentColor: string;
}

export default function GoalsScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newDeadline, setNewDeadline] = useState('Dec 2025');
  const [formError, setFormError] = useState('');

  const fetchGoals = useCallback(async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMsg('');

    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: SavingsGoal[] = (data || []).map((g: any) => ({
        id: g.id,
        title: g.title,
        saved: Number(g.current_saved),
        target: Number(g.target_amount),
        deadline: g.deadline || 'Dec 2025',
        icon: g.icon || '🏆',
        accentColor: g.accent_color || FundlyColors.primary,
      }));
      setGoals(mapped);
    } catch (e: any) {
      console.warn('Error fetching goals:', e);
      setErrorMsg('Could not load goals. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchGoals();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, fetchGoals]);

  // Expose a refresh that home can call after adding a transaction
  const onRefresh = () => fetchGoals(true);

  const totalSaved = goals.reduce((acc, g) => acc + g.saved, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.target, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const handleAddGoal = async () => {
    setFormError('');
    if (!newTitle.trim()) {
      setFormError('Please enter a goal name.');
      return;
    }
    const targetNum = parseFloat(newTarget.replace(/[^0-9.]/g, '')) || 0;
    if (targetNum <= 0) {
      setFormError('Please enter a valid target amount greater than zero.');
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('savings_goals').insert({
        user_id: user.id,
        title: newTitle.trim(),
        target_amount: targetNum,
        current_saved: 0,
        deadline: newDeadline || 'Dec 2025',
        icon: '🏆',
        accent_color: FundlyColors.primary,
      });

      if (error) throw error;

      setNewTitle('');
      setNewTarget('');
      setNewDeadline('Dec 2025');
      setIsAdding(false);
      fetchGoals();
    } catch (e: any) {
      console.warn('Error adding goal:', e.message);
      setFormError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositError, setDepositError] = useState('');
  const [depositing, setDepositing] = useState(false);

  const handleDeposit = async (id: string, amount: number) => {
    if (!user || amount <= 0) return;
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const originalSaved = goal.saved;
    const newSaved = Math.min(goal.target, goal.saved + amount);

    // Optimistic UI update
    setGoals(prev => prev.map(g => (g.id === id ? { ...g, saved: newSaved } : g)));

    try {
      // 1. Record contribution record in savings_contributions
      const { error: contribErr } = await supabase.from('savings_contributions').insert({
        goal_id: id,
        user_id: user.id,
        amount: amount,
        note: `Contribution of ₦${amount.toLocaleString('en-NG')}`,
      });
      if (contribErr) throw contribErr;

      // 2. Update goal current_saved
      const { error: updateErr } = await supabase
        .from('savings_goals')
        .update({ current_saved: newSaved, is_completed: newSaved >= goal.target })
        .eq('id', id);
      if (updateErr) throw updateErr;

      setDepositGoalId(null);
      setDepositAmount('');
      setDepositError('');
    } catch (e: any) {
      console.warn('Error recording deposit:', e.message);
      // Rollback optimistic update
      setGoals(prev => prev.map(g => (g.id === id ? { ...g, saved: originalSaved } : g)));
      setDepositError(e.message || 'Deposit failed. Please try again.');
    } finally {
      setDepositing(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (e: any) {
      console.warn('Error deleting goal:', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBox}>
            <Text style={styles.iconBoxEmoji}>🎯</Text>
          </View>
          <Text style={styles.headerTitle}>Savings Goals</Text>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            style={styles.headerActionBtn}
            hitSlop={8}
            onPress={() => setIsAdding(!isAdding)}>
            <Text style={styles.headerPlusIcon}>{isAdding ? '✕' : '＋'}</Text>
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
            onRefresh={onRefresh}
            tintColor={FundlyColors.primary}
          />
        }>
        {/* Hero Wealth Reserve Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroSub}>TOTAL SAVED ACROSS TARGETS</Text>
            <View style={styles.rateBadge}>
              <Text style={styles.rateText}>{overallPct}% achieved</Text>
            </View>
          </View>

          <Text style={styles.heroSavedVal}>
            ₦{totalSaved.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </Text>

          <View style={styles.masterTrack}>
            <View style={[styles.masterFill, { width: `${overallPct}%` }]} />
          </View>

          <View style={styles.heroMetaRow}>
            <Text style={styles.metaTarget}>
              Goal Pool: ₦{totalTarget.toLocaleString('en-NG')}
            </Text>
            <Text style={styles.metaLeft}>
              ₦{(Math.max(0, totalTarget - totalSaved)).toLocaleString('en-NG')} remaining
            </Text>
          </View>
        </View>

        {/* Add Goal Card */}
        {isAdding && (
          <View style={styles.createCard}>
            <Text style={styles.createTitle}>New Savings Target</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Goal Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Master's Tuition Deposit"
                placeholderTextColor={FundlyColors.outline}
                value={newTitle}
                onChangeText={setNewTitle}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Amount (₦)</Text>
              <TextInput
                style={styles.input}
                placeholder="2,500,000"
                placeholderTextColor={FundlyColors.outline}
                keyboardType="numeric"
                value={newTarget}
                onChangeText={setNewTarget}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Date</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Dec 2025"
                placeholderTextColor={FundlyColors.outline}
                value={newDeadline}
                onChangeText={setNewDeadline}
              />
            </View>
            {formError ? (
              <Text style={styles.formErrorText}>{formError}</Text>
            ) : null}
            <Pressable
              style={[styles.saveGoalBtn, saving && styles.saveGoalBtnDisabled]}
              onPress={handleAddGoal}
              disabled={saving}>
              <Text style={styles.saveGoalBtnText}>
                {saving ? 'Saving...' : 'Create Goal'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Goals List Section */}
        <View style={styles.goalsSection}>
          <Text style={styles.sectionHeaderTitle}>Active Milestones ({goals.length})</Text>

          {errorMsg ? (
            <Text style={styles.errorText}>{errorMsg}</Text>
          ) : loading ? (
            <ActivityIndicator color={FundlyColors.primary} style={{ marginVertical: 30 }} />
          ) : goals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🏆</Text>
              <Text style={styles.emptyStateTitle}>No savings goals yet</Text>
              <Text style={styles.emptyStateDesc}>
                Tap the + button to set your first savings target and start building wealth.
              </Text>
              <Pressable style={styles.emptyStateBtn} onPress={() => setIsAdding(true)}>
                <Text style={styles.emptyStateBtnText}>+ Create First Goal</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.goalsList}>
              {goals.map(goal => {
                const pct = goal.target > 0 ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;
                const remaining = goal.target - goal.saved;

                return (
                  <View key={goal.id} style={styles.goalCard}>
                    {/* Top Row */}
                    <View style={styles.goalCardTop}>
                      <View style={styles.goalLeft}>
                        <View style={styles.goalIconBox}>
                          <Text style={styles.goalIconEmoji}>{goal.icon}</Text>
                        </View>
                        <View>
                          <Text style={styles.goalTitle}>{goal.title}</Text>
                          <Text style={styles.goalDeadline}>Target: {goal.deadline}</Text>
                        </View>
                      </View>

                      <View style={styles.goalRight}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={[styles.goalPct, { color: goal.accentColor }]}>
                            {pct}%
                          </Text>
                          <Pressable
                            hitSlop={8}
                            onPress={() => handleDeleteGoal(goal.id)}>
                            <Text style={{ fontSize: 13, color: FundlyColors.outline, opacity: 0.7 }}>✕</Text>
                          </Pressable>
                        </View>
                        <Text style={styles.goalSavedSub}>
                          ₦{goal.saved.toLocaleString('en-NG')}
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.goalTrack}>
                      <View
                        style={[
                          styles.goalBar,
                          { width: `${pct}%`, backgroundColor: goal.accentColor },
                        ]}
                      />
                    </View>

                    {/* Goal Card Bottom Actions */}
                    <View style={styles.goalCardBottom}>
                      <Text style={styles.remainingSub}>
                        {remaining <= 0
                          ? '🎉 Target Completed!'
                          : `₦${remaining.toLocaleString('en-NG')} to go`}
                      </Text>

                      <View style={styles.quickDepositRow}>
                        <Pressable
                          style={styles.quickDepositBtn}
                          onPress={() => handleDeposit(goal.id, 100000)}>
                          <Text style={styles.quickDepositText}>+₦100k</Text>
                        </Pressable>
                        <Pressable
                          style={styles.quickDepositBtn}
                          onPress={() => handleDeposit(goal.id, 500000)}>
                          <Text style={styles.quickDepositText}>+₦500k</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.quickDepositBtn, styles.customDepositBtn]}
                          onPress={() => {
                            setDepositGoalId(goal.id);
                            setDepositAmount('');
                            setDepositError('');
                          }}>
                          <Text style={styles.customDepositText}>Custom</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Custom Deposit Card / Modal */}
        {depositGoalId && (
          <View style={styles.createCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.createTitle}>
                Deposit to: {goals.find(g => g.id === depositGoalId)?.title}
              </Text>
              <Pressable
                onPress={() => {
                  setDepositGoalId(null);
                  setDepositError('');
                  setDepositAmount('');
                }}
                hitSlop={8}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Deposit Amount (₦)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 50,000"
                placeholderTextColor={FundlyColors.outline}
                keyboardType="numeric"
                value={depositAmount}
                onChangeText={setDepositAmount}
              />
            </View>

            {depositError ? (
              <Text style={styles.formErrorText}>{depositError}</Text>
            ) : null}

            <Pressable
              style={[styles.saveGoalBtn, depositing && styles.saveGoalBtnDisabled]}
              disabled={depositing}
              onPress={() => {
                const amt = parseFloat(depositAmount.replace(/[^0-9.]/g, '')) || 0;
                if (amt <= 0) {
                  setDepositError('Please enter an amount greater than zero.');
                  return;
                }
                setDepositing(true);
                handleDeposit(depositGoalId, amt);
              }}>
              <Text style={styles.saveGoalBtnText}>
                {depositing ? 'Processing...' : 'Confirm Deposit'}
              </Text>
            </Pressable>
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
  heroSavedVal: {
    ...FundlyTypography.headlineLg,
    color: FundlyColors.onSurface,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  masterTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: FundlyColors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  masterFill: {
    height: 10,
    borderRadius: 5,
    backgroundColor: FundlyColors.secondary,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaTarget: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.outline,
  },
  metaLeft: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.secondary,
    fontWeight: '600',
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
  saveGoalBtn: {
    backgroundColor: FundlyColors.primaryContainer,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveGoalBtnDisabled: {
    opacity: 0.6,
  },
  saveGoalBtnText: {
    ...FundlyTypography.labelMd,
    color: '#ffffff',
    fontWeight: '700',
  },
  formErrorText: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.error,
    textAlign: 'center',
  },
  errorText: {
    ...FundlyTypography.bodyMd,
    color: FundlyColors.error,
    textAlign: 'center',
    paddingVertical: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  emptyStateIcon: {
    fontSize: 40,
  },
  emptyStateTitle: {
    ...FundlyTypography.titleMd,
    color: FundlyColors.onSurface,
  },
  emptyStateDesc: {
    ...FundlyTypography.bodyMd,
    color: FundlyColors.outline,
    textAlign: 'center',
    maxWidth: 270,
  },
  emptyStateBtn: {
    marginTop: 8,
    backgroundColor: FundlyColors.primaryContainer,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  emptyStateBtnText: {
    ...FundlyTypography.labelMd,
    color: '#ffffff',
    fontWeight: '600',
  },
  goalsSection: {
    gap: 12,
  },
  sectionHeaderTitle: {
    ...FundlyTypography.titleMd,
    color: FundlyColors.onSurface,
  },
  goalsList: {
    gap: 10,
  },
  goalCard: {
    backgroundColor: FundlyColors.surfaceContainer,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  goalCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: FundlyColors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalIconEmoji: {
    fontSize: 20,
  },
  goalTitle: {
    ...FundlyTypography.titleMd,
    color: FundlyColors.onSurface,
  },
  goalDeadline: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.outline,
  },
  goalRight: {
    alignItems: 'flex-end',
  },
  goalPct: {
    ...FundlyTypography.titleMd,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  goalSavedSub: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.outline,
    fontVariant: ['tabular-nums'],
  },
  goalTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: FundlyColors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  goalBar: {
    height: 6,
    borderRadius: 3,
  },
  goalCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  remainingSub: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.onSurfaceVariant,
  },
  quickDepositRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickDepositBtn: {
    backgroundColor: FundlyColors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quickDepositText: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.primary,
    fontWeight: '600',
  },
  customDepositBtn: {
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
  },
  customDepositText: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.primaryFixed,
    fontWeight: '700',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtnText: {
    color: FundlyColors.outline,
    fontSize: 16,
    padding: 4,
  },
});
