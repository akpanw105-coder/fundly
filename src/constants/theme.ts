/**
 * Obsidian Wealth Design System — Stitch-generated color tokens and typography.
 * Dark-first design with navy surfaces, electric blue primary, emerald income, crimson expense.
 */

import '@/global.css';

import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Obsidian Wealth palette (matches Stitch DESIGN.md exactly)
// ---------------------------------------------------------------------------
export const FundlyColors = {
  // Canvas / background layers
  background: '#10131a',
  surface: '#10131a',
  surfaceContainerLowest: '#0b0e15',
  surfaceContainerLow: '#191b23',
  surfaceContainer: '#1d1f27',
  surfaceContainerHigh: '#272a32',
  surfaceContainerHighest: '#32353d',
  surfaceBright: '#363941',

  // Text
  onSurface: '#e1e2ec',
  onSurfaceVariant: '#c3c6d7',
  outline: '#8d90a0',
  outlineVariant: '#434655',

  // Primary (Electric Royal Blue)
  primary: '#b4c5ff',
  primaryContainer: '#2563eb',
  onPrimary: '#002a78',
  onPrimaryContainer: '#eeefff',
  primaryFixed: '#dbe1ff',
  primaryFixedDim: '#b4c5ff',

  // Secondary (Emerald Green — income / positive)
  secondary: '#4edea3',
  secondaryContainer: '#00a572',
  onSecondary: '#003824',

  // Tertiary (Soft coral / pink — subscriptions)
  tertiary: '#ffb3ad',
  tertiaryContainer: '#cf2c30',
  onTertiary: '#68000a',

  // Semantic — error / expense (crimson)
  error: '#ffb4ab',
  errorContainer: '#93000a',
  onError: '#690005',

  // Inverse
  inverseSurface: '#e1e2ec',
  inverseOnSurface: '#2d3038',
  inversePrimary: '#0053db',

  // Category chart accents
  categoryFood: '#00a572',      // emerald
  categoryTransport: '#2563eb', // blue
  categoryUtilities: '#b4c5ff', // light blue
  categorySubscriptions: '#ffb3ad', // coral/pink
} as const;

// Legacy Colors kept for components that reference light/dark scheme
export const Colors = {
  light: {
    text: '#1a1a2e',
    background: '#f0f4ff',
    backgroundElement: '#e4eaf8',
    backgroundSelected: '#d0d9f0',
    textSecondary: '#60646C',
  },
  dark: {
    text: FundlyColors.onSurface,
    background: FundlyColors.background,
    backgroundElement: FundlyColors.surfaceContainer,
    backgroundSelected: FundlyColors.surfaceContainerHigh,
    textSecondary: FundlyColors.onSurfaceVariant,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 20,   // Stitch: margin = 1.25rem = 20px
  five: 24,
  six: 32,
  seven: 64,
} as const;

// Stitch typography scale (Inter font, from DESIGN.md)
export const FundlyTypography = {
  displayLg: { fontSize: 36, lineHeight: 44, fontWeight: '700' as const },
  headlineLg: { fontSize: 28, lineHeight: 36, fontWeight: '700' as const },
  headlineMd: { fontSize: 22, lineHeight: 28, fontWeight: '600' as const },
  headlineSm: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  titleMd: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  bodyLg: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyMd: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  labelLg: { fontSize: 14, lineHeight: 18, fontWeight: '500' as const },
  labelMd: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  labelSm: { fontSize: 10, lineHeight: 14, fontWeight: '600' as const, letterSpacing: 0.4 },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
