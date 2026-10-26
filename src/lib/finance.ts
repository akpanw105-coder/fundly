/**
 * Shared Financial Calculations and Types
 * Central financial service to ensure Home, History, Analytics, and Budgets
 * use consistent transaction processing, date boundaries, and financial rules.
 */

type SyncEventListener = () => void;
const syncListeners = new Set<SyncEventListener>();

/**
 * Event notifier called when transactions, budgets, or goal deposits change,
 * signaling all active screens to refresh their data without requiring manual refresh.
 */
export const FinancialSync = {
  subscribe(listener: SyncEventListener): () => void {
    syncListeners.add(listener);
    return () => {
      syncListeners.delete(listener);
    };
  },
  notify(): void {
    for (const listener of syncListeners) {
      try {
        listener();
      } catch (err) {
        console.warn('Error notifying financial sync listener:', err);
      }
    }
  },
};

export interface DbTransaction {
  id: string;
  user_id: string;
  name: string;
  category: string;
  category_display?: string;
  amount: number | string;
  is_income: boolean;
  date: string;
  time_display?: string;
  payment_method?: string;
  note?: string;
  emoji?: string;
  icon_bg?: string;
  icon_color?: string;
  is_pending?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FinancialSummary {
  /** Total calculated balance: openingBalance + totalIncome - totalExpenses */
  balance: number;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  savingsRate: number; // percentage 0 - 100
  expenseCategoryTotals: Record<string, number>;
  transactionCount: number;
}

/**
 * Calculates current balance and totals using the consistent financial rule:
 * Current balance = opening balance + income transactions - expense transactions.
 * Default opening balance = 0.
 */
export function calculateFinancialSummary(
  transactions: DbTransaction[],
  openingBalance: number = 0
): FinancialSummary {
  let totalIncome = 0;
  let totalExpenses = 0;
  const expenseCategoryTotals: Record<string, number> = {};

  for (const tx of transactions) {
    const amt = typeof tx.amount === 'number' ? tx.amount : parseFloat(String(tx.amount)) || 0;
    if (amt <= 0) continue;

    if (tx.is_income) {
      totalIncome += amt;
    } else {
      totalExpenses += amt;
      const cat = (tx.category || 'General').trim();
      expenseCategoryTotals[cat] = (expenseCategoryTotals[cat] || 0) + amt;
    }
  }

  const balance = openingBalance + totalIncome - totalExpenses;
  const netCashFlow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netCashFlow / totalIncome) * 100)) : 0;

  return {
    balance,
    totalIncome,
    totalExpenses,
    netCashFlow,
    savingsRate,
    expenseCategoryTotals,
    transactionCount: transactions.length,
  };
}

/**
 * Format currency amount into standard Nigerian Naira representation (₦X,XXX.XX)
 */
export function formatNaira(amount: number, showDecimals: boolean = true): string {
  return `₦${amount.toLocaleString('en-NG', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  })}`;
}


export interface MonthlyTrend {
  month: string;      // e.g. 'Oct'
  fullMonthYear: string; // e.g. 'October 2026'
  year: number;
  monthIndex: number; // 0-11
  income: number;
  expenses: number;
  savings: number;
}

/**
 * Calculates historical monthly trends for the past N calendar months (default 5)
 * based strictly on actual user transactions.
 * Months with no transactions default to 0 income/expenses without inserting fake numbers.
 */
export function calculateHistoricalMonthlyTrends(
  transactions: DbTransaction[],
  monthsCount: number = 5,
  baseDate: Date = new Date()
): MonthlyTrend[] {
  const trends: MonthlyTrend[] = [];

  // Generate slots for the last `monthsCount` months in chronological order
  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const monthStr = d.toLocaleString('en-US', { month: 'short' });
    const fullMonthYear = d.toLocaleString('en-NG', { month: 'long', year: 'numeric' });

    trends.push({
      month: monthStr,
      fullMonthYear,
      year: y,
      monthIndex: m,
      income: 0,
      expenses: 0,
      savings: 0,
    });
  }

  // Aggregate transactions into the corresponding month slot
  for (const tx of transactions) {
    if (!tx.date) continue;
    const parts = tx.date.split('-');
    if (parts.length < 2) continue;
    const txYear = parseInt(parts[0], 10);
    const txMonth = parseInt(parts[1], 10) - 1; // 0-indexed month

    const slot = trends.find(t => t.year === txYear && t.monthIndex === txMonth);
    if (!slot) continue;

    const amt = typeof tx.amount === 'number' ? tx.amount : parseFloat(String(tx.amount)) || 0;
    if (amt <= 0) continue;

    if (tx.is_income) {
      slot.income += amt;
    } else {
      slot.expenses += amt;
    }
  }

  // Calculate net savings for each month
  for (const t of trends) {
    t.savings = t.income - t.expenses;
  }

  return trends;
}

/**
 * Date range helper for time-filtered queries (e.g. week, month, year)
 */
export function getDateFilterRange(period: 'week' | 'month' | 'year', baseDate: Date = new Date()): {
  startDate: string;
  endDate: string;
} {
  const endDate = baseDate.toISOString().split('T')[0];
  let startDate = '';

  if (period === 'week') {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - 7);
    startDate = d.toISOString().split('T')[0];
  } else if (period === 'month') {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    startDate = d.toISOString().split('T')[0];
  } else if (period === 'year') {
    const d = new Date(baseDate.getFullYear(), 0, 1);
    startDate = d.toISOString().split('T')[0];
  }

  return { startDate, endDate };
}

/**
 * Get category spending for a specific category matching normalized names
 */
export function getCategorySpending(
  categoryTotals: Record<string, number>,
  budgetCategory: string
): number {
  const normBudget = budgetCategory.toLowerCase().trim();
  let total = 0;

  for (const [catName, spent] of Object.entries(categoryTotals)) {
    const normCat = catName.toLowerCase().trim();
    if (normCat === normBudget) {
      total += spent;
    } else if (normBudget.includes('food') && normCat.includes('food')) {
      total += spent;
    } else if (normBudget.includes('transport') && normCat.includes('transport')) {
      total += spent;
    } else if (normBudget.includes('bill') && (normCat.includes('bill') || normCat.includes('utilit'))) {
      total += spent;
    }
  }

  return total;
}
