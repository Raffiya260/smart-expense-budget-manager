import { CATEGORY_COLORS } from '../data/sampleData';
import {
  Budget,
  BudgetWithUsage,
  CategoryBreakdownPoint,
  MonthlySummaryPoint,
  Transaction,
} from '../types/finance';
import { formatMonthLabel, getMonthKey } from './formatters';

export interface AllTimeTotals {
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
}

export interface MonthlyTotals {
  monthIncome: number;
  monthExpenses: number;
  monthNetSavings: number;
}

export interface BudgetSummaryTotals {
  totalLimit: number;
  totalBudgetedSpent: number;
  totalMonthExpenses: number;
  unbudgetedExpenses: number;
  totalRemaining: number;
  overallPercentage: number;
  warningCount: number;
  exceededCount: number;
}

/**
 * Total Balance is strictly defined as:
 * All-Time Cumulative Income minus All-Time Cumulative Expenses.
 */
export function calculateAllTimeTotals(transactions: Transaction[]): AllTimeTotals {
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const txn of transactions) {
    if (txn.type === 'income') {
      totalIncome += txn.amount;
    } else {
      totalExpenses += txn.amount;
    }
  }

  return {
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    totalBalance: Math.round((totalIncome - totalExpenses) * 100) / 100,
  };
}

/**
 * Monthly Totals are isolated strictly to transactions matching `monthKey` (YYYY-MM).
 */
export function calculateMonthlyTotals(
  transactions: Transaction[],
  monthKey: string
): MonthlyTotals {
  let monthIncome = 0;
  let monthExpenses = 0;

  for (const txn of transactions) {
    if (getMonthKey(txn.date) !== monthKey) continue;
    if (txn.type === 'income') {
      monthIncome += txn.amount;
    } else {
      monthExpenses += txn.amount;
    }
  }

  return {
    monthIncome: Math.round(monthIncome * 100) / 100,
    monthExpenses: Math.round(monthExpenses * 100) / 100,
    monthNetSavings: Math.round((monthIncome - monthExpenses) * 100) / 100,
  };
}

/**
 * Computes per-category budget usage and monthly budget rollup totals.
 * Automatically updates whenever transactions or budgets change.
 */
export function calculateBudgetsWithUsage(
  budgets: Budget[],
  transactions: Transaction[],
  monthKey: string
): { items: BudgetWithUsage[]; summary: BudgetSummaryTotals } {
  const monthBudgets = budgets.filter((b) => b.month === monthKey);
  const monthExpenses = transactions.filter(
    (t) => t.type === 'expense' && getMonthKey(t.date) === monthKey
  );

  const items: BudgetWithUsage[] = monthBudgets.map((budget) => {
    const spent =
      Math.round(
        monthExpenses
          .filter((t) => t.category === budget.category)
          .reduce((sum, t) => sum + t.amount, 0) * 100
      ) / 100;

    const remaining = Math.round((budget.limit - spent) * 100) / 100;
    const percentage =
      budget.limit > 0 ? Math.round((spent / budget.limit) * 1000) / 10 : 0;

    let status: BudgetWithUsage['status'] = 'on-track';
    if (spent > budget.limit) {
      status = 'exceeded';
    } else if (percentage >= 80) {
      status = 'warning';
    }

    return {
      ...budget,
      spent,
      remaining,
      percentage,
      status,
    };
  });

  const totalLimit =
    Math.round(items.reduce((sum, b) => sum + b.limit, 0) * 100) / 100;
  const totalBudgetedSpent =
    Math.round(items.reduce((sum, b) => sum + b.spent, 0) * 100) / 100;
  const totalMonthExpenses =
    Math.round(monthExpenses.reduce((sum, t) => sum + t.amount, 0) * 100) / 100;
  const unbudgetedExpenses =
    Math.round(Math.max(0, totalMonthExpenses - totalBudgetedSpent) * 100) / 100;
  const totalRemaining =
    Math.round((totalLimit - totalBudgetedSpent) * 100) / 100;
  const overallPercentage =
    totalLimit > 0 ? Math.round((totalBudgetedSpent / totalLimit) * 1000) / 10 : 0;

  return {
    items,
    summary: {
      totalLimit,
      totalBudgetedSpent,
      totalMonthExpenses,
      unbudgetedExpenses,
      totalRemaining,
      overallPercentage,
      warningCount: items.filter((b) => b.status === 'warning').length,
      exceededCount: items.filter((b) => b.status === 'exceeded').length,
    },
  };
}

export function calculateMonthlyTrend(
  transactions: Transaction[],
  monthsLimit = 6
): MonthlySummaryPoint[] {
  const grouped = new Map<string, { income: number; expenses: number }>();

  for (const txn of transactions) {
    const monthKey = getMonthKey(txn.date);
    const current = grouped.get(monthKey) ?? { income: 0, expenses: 0 };
    if (txn.type === 'income') {
      current.income += txn.amount;
    } else {
      current.expenses += txn.amount;
    }
    grouped.set(monthKey, current);
  }

  const sortedKeys = Array.from(grouped.keys())
    .sort((a, b) => a.localeCompare(b))
    .slice(-monthsLimit);

  return sortedKeys.map((month) => {
    const entry = grouped.get(month)!;
    const income = Math.round(entry.income * 100) / 100;
    const expenses = Math.round(entry.expenses * 100) / 100;
    return {
      month,
      label: formatMonthLabel(month),
      income,
      expenses,
      savings: Math.round((income - expenses) * 100) / 100,
    };
  });
}

export function calculateCategoryBreakdown(
  transactions: Transaction[],
  month?: string
): CategoryBreakdownPoint[] {
  const expenseTxns = transactions.filter((t) => {
    if (t.type !== 'expense') return false;
    if (month && month !== 'all') {
      return getMonthKey(t.date) === month;
    }
    return true;
  });

  const totals = new Map<string, number>();
  let grandTotal = 0;

  for (const txn of expenseTxns) {
    totals.set(txn.category, (totals.get(txn.category) ?? 0) + txn.amount);
    grandTotal += txn.amount;
  }

  return Array.from(totals.entries())
    .map(([category, amount]) => {
      const roundedAmount = Math.round(amount * 100) / 100;
      return {
        category,
        amount: roundedAmount,
        percentage:
          grandTotal > 0
            ? Math.round((roundedAmount / grandTotal) * 1000) / 10
            : 0,
        color: CATEGORY_COLORS[category] ?? '#64748B',
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

export function exportTransactionsToCsv(
  transactions: Transaction[],
  filenamePrefix = 'smart-expense-transactions'
): void {
  const header = [
    'ID',
    'Date',
    'Type',
    'Category',
    'Description',
    'Amount',
    'Payment Method',
  ];
  const rows = transactions.map((t) => [
    t.id,
    t.date,
    t.type,
    `"${t.category.replace(/"/g, '""')}"`,
    `"${t.description.replace(/"/g, '""')}"`,
    String(t.amount),
    `"${(t.paymentMethod ?? '').replace(/"/g, '""')}"`,
  ]);
  const csvContent = [header.join(','), ...rows.map((r) => r.join(','))].join(
    '\n'
  );
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
