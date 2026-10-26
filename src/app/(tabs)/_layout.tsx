import AppTabs from '@/components/app-tabs';

/**
 * Tab group layout — renders the NativeTabs bar for the five primary screens.
 * Stack-level screens (add-transaction, auth, settings) live at the root Stack
 * so the tab bar is naturally hidden when they are pushed.
 */
export default function TabGroupLayout() {
  return <AppTabs />;
}
