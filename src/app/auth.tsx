import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';
import { FundlyColors, FundlyTypography, MaxContentWidth, Spacing } from '@/constants/theme';

type AuthMode = 'signin' | 'signup' | 'forgot';

export default function AuthScreen() {
  const router = useRouter();
  const { session } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('tunde.investor@fundlyapp.com');
  const [password, setPassword] = useState('Fundly#ObsidianWealth2025!');
  const [fullName, setFullName] = useState('Tunde Adeleke');
  const [confirmPassword, setConfirmPassword] = useState('Fundly#ObsidianWealth2025!');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // If already authenticated, redirect
  React.useEffect(() => {
    if (session) {
      router.replace('/');
    }
  }, [session, router]);

  const handleSubmit = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (mode !== 'forgot' && password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message.includes('Email not confirmed')) {
            setErrorMessage('Email not confirmed. Please check your inbox or confirm in Supabase dashboard.');
          } else {
            setErrorMessage(error.message);
          }
          return;
        }

        if (data.session) {
          router.replace('/');
        }
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim() || 'Fundly Member',
            },
          },
        });

        if (error) {
          setErrorMessage(error.message);
          return;
        }

        if (data.session) {
          router.replace('/');
        } else {
          setSuccessMessage('Registration initiated! A verification email has been sent. If email confirmation is enabled, confirm your email to sign in.');
          setMode('signin');
        }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (error) {
          setErrorMessage(error.message);
          return;
        }
        setSuccessMessage('Password reset link sent! Check your email inbox.');
        setMode('signin');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Brand Header */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoIcon}>💎</Text>
            </View>
            <Text style={styles.brandTitle}>FUNDLY</Text>
            <Text style={styles.brandSubtitle}>Obsidian Wealth Management</Text>
          </View>

          {/* Mode Switcher Tabs */}
          {mode !== 'forgot' && (
            <View style={styles.modeTabs}>
              <Pressable
                style={[styles.modeTab, mode === 'signin' && styles.modeTabActive]}
                onPress={() => {
                  setMode('signin');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}>
                <Text
                  style={[
                    styles.modeTabText,
                    mode === 'signin' && styles.modeTabTextActive,
                  ]}>
                  Sign In
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modeTab, mode === 'signup' && styles.modeTabActive]}
                onPress={() => {
                  setMode('signup');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}>
                <Text
                  style={[
                    styles.modeTabText,
                    mode === 'signup' && styles.modeTabTextActive,
                  ]}>
                  Create Account
                </Text>
              </Pressable>
            </View>
          )}

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {mode === 'signin'
                ? 'Welcome Back'
                : mode === 'signup'
                ? 'Start Your Wealth Ledger'
                : 'Reset Password'}
            </Text>
            <Text style={styles.formDesc}>
              {mode === 'signin'
                ? 'Authenticate to access your encrypted accounts and portfolio.'
                : mode === 'signup'
                ? 'Join high-net-worth individuals managing capital with precision.'
                : 'Enter your registered email to receive recovery instructions.'}
            </Text>

            {/* Error & Success Banners */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}

            {successMessage ? (
              <View style={styles.successBanner}>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.successBannerText}>{successMessage}</Text>
              </View>
            ) : null}

            {/* Full Name for Signup */}
            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputBox}>
                  <Text style={styles.fieldIcon}>👤</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Tunde Adeleke"
                    placeholderTextColor={FundlyColors.outline}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputBox}>
                <Text style={styles.fieldIcon}>✉️</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="name@domain.com"
                  placeholderTextColor={FundlyColors.outline}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Input */}
            {mode !== 'forgot' && (
              <View style={styles.inputGroup}>
                <View style={styles.passwordLabelRow}>
                  <Text style={styles.inputLabel}>Password</Text>
                  {mode === 'signin' && (
                    <Pressable onPress={() => setMode('forgot')}>
                      <Text style={styles.forgotText}>Forgot password?</Text>
                    </Pressable>
                  )}
                </View>
                <View style={styles.inputBox}>
                  <Text style={styles.fieldIcon}>🔒</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••••••"
                    placeholderTextColor={FundlyColors.outline}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={8}>
                    <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Confirm Password for Signup */}
            {mode === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputBox}>
                  <Text style={styles.fieldIcon}>🔒</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••••••"
                    placeholderTextColor={FundlyColors.outline}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )}

            {/* Submit CTA */}
            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && styles.submitBtnPressed,
                loading && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {mode === 'signin'
                    ? 'Sign In to Fundly'
                    : mode === 'signup'
                    ? 'Create Secure Account'
                    : 'Send Reset Instructions'}
                </Text>
              )}
            </Pressable>

            {/* Back to sign in if in forgot mode */}
            {mode === 'forgot' && (
              <Pressable
                style={styles.backToSignInBtn}
                onPress={() => setMode('signin')}>
                <Text style={styles.backToSignInText}>← Back to Sign In</Text>
              </Pressable>
            )}
          </View>

          {/* Security Notice */}
          <View style={styles.securityFooter}>
            <Text style={styles.securityIconSmall}>🛡️</Text>
            <Text style={styles.securityFooterText}>
              256-bit AES database encryption with Postgres Row Level Security (RLS).
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: FundlyColors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.seven,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    gap: Spacing.four,
  },
  brandContainer: {
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: FundlyColors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: FundlyColors.primaryContainer,
  },
  logoIcon: {
    fontSize: 28,
  },
  brandTitle: {
    ...FundlyTypography.headlineLg,
    color: '#ffffff',
    letterSpacing: 2,
    fontWeight: '700',
  },
  brandSubtitle: {
    ...FundlyTypography.labelMd,
    color: FundlyColors.outline,
    letterSpacing: 0.5,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: FundlyColors.surfaceContainerLow,
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 999,
  },
  modeTabActive: {
    backgroundColor: FundlyColors.primaryContainer,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  modeTabText: {
    ...FundlyTypography.labelLg,
    color: FundlyColors.outline,
    fontWeight: '500',
  },
  modeTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: FundlyColors.surfaceContainerLow,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: FundlyColors.surfaceContainerHigh,
    gap: 16,
  },
  formTitle: {
    ...FundlyTypography.headlineSm,
    color: FundlyColors.onSurface,
  },
  formDesc: {
    ...FundlyTypography.bodyMd,
    color: FundlyColors.outline,
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  errorIcon: {
    fontSize: 16,
  },
  errorBannerText: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.error,
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  successIcon: {
    fontSize: 16,
    color: FundlyColors.secondary,
    fontWeight: '700',
  },
  successBannerText: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.secondary,
    flex: 1,
  },
  inputGroup: {
    gap: 6,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLabel: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.onSurfaceVariant,
    fontWeight: '600',
  },
  forgotText: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.primary,
    fontWeight: '600',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FundlyColors.surfaceContainer,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: FundlyColors.surfaceContainerHigh,
    gap: 10,
  },
  fieldIcon: {
    fontSize: 16,
  },
  textInput: {
    flex: 1,
    color: FundlyColors.onSurface,
    ...FundlyTypography.bodyMd,
    padding: 0,
  },
  eyeBtn: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 14,
  },
  submitBtn: {
    height: 50,
    backgroundColor: FundlyColors.primaryContainer,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  submitBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    ...FundlyTypography.titleMd,
    color: '#ffffff',
    fontWeight: '700',
  },
  backToSignInBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backToSignInText: {
    ...FundlyTypography.labelMd,
    color: FundlyColors.primary,
    fontWeight: '600',
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  securityIconSmall: {
    fontSize: 14,
  },
  securityFooterText: {
    ...FundlyTypography.labelSm,
    color: FundlyColors.outline,
    textAlign: 'center',
    flex: 1,
  },
});
