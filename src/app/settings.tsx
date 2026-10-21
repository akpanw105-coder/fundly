import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import { BottomTabInset, FundlyColors, FundlyTypography, MaxContentWidth, Spacing } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [saving, setSaving] = useState(false);
  const [currency, setCurrency] = useState('NGN (₦)');
  const [offlineSyncEnabled, setOfflineSyncEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth');
    } catch (e: any) {
      Alert.alert('Sign Out Error', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={8}>
            <Text style={styles.backBtnText}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Account & Settings</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>
              {user?.user_metadata?.full_name || 'Tunde Adeleke'}
            </Text>
            <Text style={styles.profileEmail}>
              {user?.email || 'tunde.investor@fundlyapp.com'}
            </Text>
            <View style={styles.tierBadge}>
              <Text style={styles.tierText}>Obsidian Wealth Member</Text>
            </View>
          </View>
        </View>

        {/* Security & Cloud Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security & Privacy</Text>

          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Biometric Access</Text>
              <Text style={styles.settingSub}>FaceID / Fingerprint discretion lock</Text>
            </View>
            <Pressable
              style={[
                styles.togglePill,
                biometricsEnabled ? styles.toggleActive : styles.toggleInactive,
              ]}
              onPress={() => setBiometricsEnabled(!biometricsEnabled)}>
              <View
                style={[
                  styles.toggleDot,
                  biometricsEnabled ? styles.toggleDotActive : styles.toggleDotInactive,
                ]}
              />
            </Pressable>
          </View>

          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>SQLite Offline Synchronization</Text>
              <Text style={styles.settingSub}>Automatic reconciliation with cloud ledger</Text>
            </View>
            <Pressable
              style={[
                styles.togglePill,
                offlineSyncEnabled ? styles.toggleActive : styles.toggleInactive,
              ]}
              onPress={() => setOfflineSyncEnabled(!offlineSyncEnabled)}>
              <View
                style={[
                  styles.toggleDot,
                  offlineSyncEnabled ? styles.toggleDotActive : styles.toggleDotInactive,
                ]}
              />
            </Pressable>
          </View>
        </View>

        {/* Currency & Financial Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Base Currency</Text>
              <Text style={styles.settingSub}>Tabular figure alignment</Text>
            </View>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyBadgeText}>{currency}</Text>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Cloud Database Endpoint</Text>
              <Text style={styles.settingSub}>Supabase EU-Central Postgres 17</Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.statusText}>Connected</Text>
            </View>
          </View>
        </View>

        {/* Sign Out CTA */}
        <Pressable
          style={({ pressed }) => [styles.signOutBtn, pressed && styles.signOutBtnPressed]}
          onPress={handleSignOut}>
          <Text style={styles.signOutBtnIcon}>🚪</Text>
          <Text style={styles.signOutBtnText}>Sign Out of Fundly</Text>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.seven,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FundlyColors.surfaceContainerLow,
    borderRadius: 20,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: FundlyColors.surfaceContainerHigh,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: FundlyColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
  },
  profileDetails: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    ...FundlyTypography.titleMd,
    color: FundlyColors.onSurface,
  },
  profileEmail: {
    ...FundlyTypography.bodyMd,
    color: FundlyColors.outline,
  },
  tierBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  tierText: {
    fontSize: 10,
    color: FundlyColors.primary,
    fontWeight: '700',
  },
  section: {
    backgroundColor: FundlyColors.surfaceContainerLow,
    borderRadius: 20,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: FundlyColors.surfaceContainerHigh,
  },
  sectionTitle: {
    ...FundlyTypography.titleMd,
    color: FundlyColors.onSurface,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    ...FundlyTypography.labelLg,
    color: FundlyColors.onSurface,
  },
  settingSub: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.outline,
    marginTop: 2,
  },
  togglePill: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: FundlyColors.primaryContainer,
  },
  toggleInactive: {
    backgroundColor: FundlyColors.surfaceContainerHighest,
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  toggleDotActive: {
    alignSelf: 'flex-end',
  },
  toggleDotInactive: {
    alignSelf: 'flex-start',
  },
  currencyBadge: {
    backgroundColor: FundlyColors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  currencyBadgeText: {
    ...FundlyTypography.labelMd,
    color: FundlyColors.onSurface,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(78, 222, 163, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: FundlyColors.secondary,
  },
  statusText: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.secondary,
    fontWeight: '700',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    gap: 8,
    marginTop: 8,
  },
  signOutBtnPressed: {
    opacity: 0.8,
  },
  signOutBtnIcon: {
    fontSize: 16,
  },
  signOutBtnText: {
    ...FundlyTypography.titleMd,
    color: FundlyColors.error,
    fontWeight: '700',
  },
});
