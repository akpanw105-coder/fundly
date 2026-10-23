/**
 * Shared Financial Calculations and Types
 * Central financial service to ensure Home, History, Analytics, and Budgets
 * use consistent transaction processing, date boundaries, and financial rules.
 */

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
