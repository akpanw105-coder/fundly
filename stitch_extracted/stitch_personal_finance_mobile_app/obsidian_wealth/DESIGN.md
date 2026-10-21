---
name: Obsidian Wealth
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363941'
  surface-container-lowest: '#0b0e15'
  surface-container-low: '#191b23'
  surface-container: '#1d1f27'
  surface-container-high: '#272a32'
  surface-container-highest: '#32353d'
  on-surface: '#e1e2ec'
  on-surface-variant: '#c3c6d7'
  inverse-surface: '#e1e2ec'
  inverse-on-surface: '#2d3038'
  outline: '#8d90a0'
  outline-variant: '#434655'
  surface-tint: '#b4c5ff'
  primary: '#b4c5ff'
  on-primary: '#002a78'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#0053db'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb3ad'
  on-tertiary: '#68000a'
  tertiary-container: '#cf2c30'
  on-tertiary-container: '#ffecea'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#10131a'
  on-background: '#e1e2ec'
  surface-variant: '#32353d'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system establishes a high-precision, executive-tier personal finance experience crafted specifically for dark mode environments. It addresses discerning professionals, wealth builders, and modern fintech users who demand clarity, discretion, and control over their capital. 

The aesthetic is rooted in **Minimalism** blended with **Tonal Layering** and razor-sharp structural outlines. Instead of harsh pure blacks or excessive neon glows, the interface employs rich obsidian tones, midnight navy elevations, and vibrant electric blue accents. High-contrast semantic indicators (emerald green for cash inflows, crimson for outflows) provide instantaneous cognitive processing, while jewel-toned category accents (amber, purple, cyan, magenta) categorize complex financial data cleanly without visual chaos. 

The tone is authoritative yet frictionless: restrained typography, pill-shaped control segments, discrete border highlights, and deeply tactile interactions that make personal wealth management feel elevated, precise, and secure.

## Colors

The palette is engineered around an intentional hierarchy of deep dark navy canvases, luminous primary highlights, and strict financial semantics:

- **Background & Canvas:**
  - Base canvas: `#0A0D14` (Deep pitch obsidian)
  - Surface container (cards, bottom bar): `#121826` (Muted navy-black)
  - Elevated surfaces & active controls: `#1A2234`
  - Subtle borders & divider strokes: `#1E293B`

- **Primary & Interactive Accents:**
  - Primary blue: `#2563EB` (Used for primary CTA buttons, dominant metric widgets, active indicator states)
  - Bright interactive state: `#3B82F6` (Focused strokes, active chart bars)

- **Financial Semantics:**
  - Positive / Income (Emerald): `#10B981` (Inflows, positive percentages, target completions)
  - Negative / Expense (Crimson): `#EF4444` (Outflows, deficits, over-budget warnings)

- **Category & Chart Accents:**
  - Amber (Food & Dining): `#F59E0B`
  - Purple (Shopping & Lifestyle): `#8B5CF6`
  - Cyan (Transportation & Travel): `#06B6D4`
  - Pink (Entertainment & Leisure): `#EC4899`

- **Text Hierarchy:**
  - Primary text: `#F8FAFC`
  - Secondary text / Subtitles: `#94A3B8`
  - Muted / Inactive labels: `#64748B`

## Typography

Typography relies entirely on **Inter** to ensure maximum legibility, tabular figure harmony, and mechanical precision across dense numerical financial dashboards.

- **Currency Treatment:** All currency representations utilize the Nigerian Naira (`₦`) symbol. Currency amounts must render using tabular numerals (`tnum`) to maintain vertical alignment in lists and transaction breakdowns.
- **Display Numerals:** Big hero balances (`display-lg` and `headline-lg`) must use bold weights (`700`) to anchor dashboard hierarchy instantly.
- **Micro-Copy & Badges:** Metadata, date markers, and category tags utilize `label-md` and `label-sm` with slight positive tracking (`0.04em`) to ensure legibility on dark surfaces.

## Layout & Spacing

The layout is built for native mobile ergonomics with strict one-handed accessibility considerations:

- **Horizontal Margins:** Fixed outer screen padding of `1.25rem` (20px), ensuring elements do not bleed to screen edges on mobile displays while preserving usable area.
- **Vertical Spacing:** Section headers are spaced `1.5rem` apart from cards. Nested content within cards retains a consistent internal padding of `1rem` to `1.25rem`.
- **Tab Bar Clearance:** The fixed 5-tab bottom navigation requires a safe bottom margin buffer of `5.5rem` across all scroll views to prevent the last content row from clipping.
- **Data Densities:** Transaction items and category rows preserve a minimum touch target height of `48px` with `0.75rem` vertical spacing to avoid accidental taps.

## Elevation & Depth

Visual depth is achieved through **Tonal Layering** coupled with subtle, sharp border containment rather than heavy dropped shadows:

- **Base Level (Canvas):** Pure base tone (`#0A0D14`). Used for screen backgrounds, modal dimmers, and underlying scroll layers.
- **Level 1 (Cards & Modules):** Surface tone (`#121826`) bounded by a hairline border (`1px solid #1E293B`). This provides separation without introducing muddy dark gradients.
- **Level 2 (Pills, Chips & Inset Elements):** Elevated surface (`#1A2234`) with zero shadow, relying on tone contrast against Level 1 containers.
- **Hero Elevation (Account Summary Card):** High-prominence surface with an optional electric blue gradient tint (`linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)`) accompanied by a subtle tinted glow: `box-shadow: 0 12px 32px rgba(37, 99, 235, 0.25)`.
- **Bottom Navigation Dock:** Fixed blur glass effect with dark surface (`rgba(18, 24, 38, 0.85)` with `backdrop-filter: blur(16px)`) and a `1px` top border stroke (`#1E293B`).

## Shapes

The design system incorporates a balanced, modern curvature profile:

- **Standard Cards & Modal Sheets:** Formed with `rounded-xl` (`1.5rem` / 24px) to provide a soft, contemporary silhouette.
- **Segmented Controls & Action Buttons:** Standardized to full pill curvature (`rounded-full` / 9999px) for primary CTA buttons, timeframe filters (Week / Month / Year), and bottom tab active indicators.
- **Category Icon Avatars:** Squircles with `rounded-lg` (`0.75rem` / 12px) featuring centered glyphs on subtle tinted category-color backgrounds.
- **Input Fields & Small Tiles:** `rounded-lg` (`0.75rem` / 12px) for structured input consistency.

## Components

### 1. Navigation & Floating Action
- **Bottom Tab Navigation:** 5 key tabs: *Home*, *Transactions*, *Analytics*, *Budgets*, and *Goals*. Standard height 64px + safe area padding. Inactive icons: `#64748B`; active icon and label: `#3B82F6` with subtle indicator pill.
- **Floating Action Button (Add Quick Transaction):** Circular or pill-shaped button positioned prominently with electric blue background (`#2563EB`), white glyph, and dynamic elevation.

### 2. Segmented Pill Controls
- Encased in a `#121826` container with `rounded-full` curvature and `4px` internal padding.
- Active pill transitions with background `#2563EB` (or `#1A2234` for secondary filter rows), text color `#FFFFFF`, and instant tactile response. Inactive segments display `#94A3B8`.

### 3. Metric & Hero Cards
- **Total Balance Card:** Elevated `#2563EB` surface. Displays bold Naira balance (e.g. `₦12,845,500.00`) with dual mini metrics for total Income (`+₦8,500,000.00` with emerald up arrow) and Expenses (`-₦3,245,500.00` with crimson down arrow).
- **Secondary Cards:** Flat `#121826` fill, `1px solid #1E293B` border, with consistent header, action links ("See All"), and nested content.

### 4. Transaction List Items
- Display category icon inside a rounded squircle with `15%` opacity category tint.
- Left-aligned title (`body-md`, `#F8FAFC`) with timestamp underneath (`label-md`, `#64748B`).
- Right-aligned amount formatted with tabular numbers: negative expenses displayed in crimson (`-₦24,500.00`), positive income in emerald (`+₦120,000.00`).

### 5. Charts & Visualizations
- **Donut Visualizations:** Thick 16px track with segmented arcs matching category tokens (Amber, Purple, Cyan, Pink). Center hole displays total selected metric or category icon.
- **Bar Charts (Trends):** Vertical rounded-top bars. Inactive/standard bars utilize `#1E293B` or `#1A2234`, while the active/selected bar illuminates in `#3B82F6` with an floating value chip above.

### 6. Input Fields & Form Controls
- Dark inputs styled with background `#121826`, border `1px solid #1E293B`, and placeholder `#64748B`.
- Focused state transitions border to `#3B82F6` with an inner halo outline.