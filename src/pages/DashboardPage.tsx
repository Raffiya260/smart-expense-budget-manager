import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Info,
  Pencil,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { ExpenseCategoryChart } from '../components/charts/ExpenseCategoryChart';
import { MonthlySpendingChart } from '../components/charts/MonthlySpendingChart';
import { StatCard } from '../components/common/StatCard';
import { useFinance } from '../context/FinanceContext';
import { reportService } from '../services/reportService';
import { CategoryBreakdownPoint, MonthlySummaryPoint } from '../types/finance';
import {
  formatCurrency,
  formatDate,
  formatMonthLabel,
} from '../utils/formatters';

export function DashboardPage() {
  const {
    transactions,
    budgetsWithUsage,
    budgetSummary,
    allTimeTotals,
    monthlyTotals,
    selectedMonth,
    settings,
    isDemoMode,
    setActivePage,
    openEditTransaction,
    openAddTransaction,
    openAddBudget,
  } = useFinance();

  const [monthlySummary, setMonthlySummary] = useState<MonthlySummaryPoint[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryBreakdownPoint[]>([]);

  useEffect(() => {
    let active = true;
    const loadCharts = async () => {
      const [monthly, categories] = await Promise.all([
        reportService.getMonthlySummary(transactions, 6),
        reportService.getCategoryBreakdown(transactions, selectedMonth),
      ]);
      if (active) {
        setMonthlySummary(monthly);
        setCategoryData(categories);
      }
    };
    void loadCharts();
    return () => {
      active = false;
    };
  }, [transactions, selectedMonth]);

  const recentTransactions = useMemo(
    () => transactions.slice(0, 6),
    [transactions]
  );

  const monthLabel = formatMonthLabel(selectedMonth);
  const currency = settings.currency;
  const isDark = settings.theme === 'dark';
  const alertCount = budgetSummary.warningCount + budgetSummary.exceededCount;

  return (
    <div className="space-y-6">
      {/* Demo Data Disclosure */}
      {isDemoMode && (
        <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/8 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              <strong className="font-medium text-slate-900 dark:text-white">
                Demo Data:
              </strong>{' '}
              Showing sample financial records in memory for preview. Data is not permanently saved until linked to FastAPI.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActivePage('settings')}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap shrink-0"
          >
            Configure Profile & Backend
          </button>
        </div>
      )}

      {/* KPI Stat Cards: All-Time Balance vs Selected Month Totals */}
      <section aria-label="Key financial metrics" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Balance (All-Time)"
          value={formatCurrency(allTimeTotals.totalBalance, currency)}
          subtitle={`In ${formatCurrency(allTimeTotals.totalIncome, currency, { compact: true })} − Out ${formatCurrency(allTimeTotals.totalExpenses, currency, { compact: true })}`}
          icon={Wallet}
          accent="indigo"
        />
        <StatCard
          title={`Monthly Income (${monthLabel})`}
          value={formatCurrency(monthlyTotals.monthIncome, currency)}
          subtitle={`Selected month income only`}
          icon={TrendingUp}
          accent="emerald"
        />
        <StatCard
          title={`Monthly Expenses (${monthLabel})`}
          value={formatCurrency(monthlyTotals.monthExpenses, currency)}
          subtitle={`Net ${formatCurrency(monthlyTotals.monthNetSavings, currency)} in ${monthLabel}`}
          icon={TrendingDown}
          accent="rose"
        />
        <StatCard
          title={`Remaining Budget (${monthLabel})`}
          value={formatCurrency(budgetSummary.totalRemaining, currency)}
          subtitle={
            budgetSummary.totalLimit > 0
              ? `Spent ${formatCurrency(budgetSummary.totalBudgetedSpent, currency, { compact: true })} of ${formatCurrency(budgetSummary.totalLimit, currency, { compact: true })}${
                  alertCount > 0 ? ` · ${alertCount} alert(s)` : ''
                }`
              : `No budgets set for ${monthLabel}`
          }
          icon={PiggyBank}
          accent="blue"
        />
      </section>

      {/* Primary Charts Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 glass-card rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Monthly Income & Spending
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cash flow trend across recent months
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-blue-500" aria-hidden="true" />
                Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-violet-500" aria-hidden="true" />
                Expenses
              </span>
            </div>
          </div>
          <MonthlySpendingChart
            data={monthlySummary}
            currency={currency}
            isDark={isDark}
          />
        </div>

        <div className="xl:col-span-5 glass-card rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Expenses by Category
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Breakdown for {monthLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePage('reports')}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap"
            >
              <span>Full Report</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <ExpenseCategoryChart data={categoryData} currency={currency} />
        </div>
      </section>

      {/* Bottom Split: Recent Transactions & Budget Watch */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Recent Transactions */}
        <div className="xl:col-span-7 glass-card rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Recent Transactions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest activity across all months
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePage('transactions')}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No transactions recorded yet.
              </p>
              <button
                type="button"
                onClick={openAddTransaction}
                className="mt-3 px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
              >
                Record First Transaction
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
              {recentTransactions.map((txn) => {
                const isIncome = txn.type === 'income';
                return (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          isIncome
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300'
                        }`}
                        aria-hidden="true"
                      >
                        {isIncome ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {txn.description}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {txn.category} · {formatDate(txn.date)}
                          {txn.paymentMethod ? ` · ${txn.paymentMethod}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-sm font-semibold font-mono-tabular ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(txn.amount, currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => openEditTransaction(txn)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                        aria-label={`Edit ${txn.description}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Budget Health Snapshot */}
        <div className="xl:col-span-5 glass-card rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Budget Health ({monthLabel})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Updates automatically when expenses change
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePage('budgets')}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap"
            >
              <span>Manage Budgets</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {budgetsWithUsage.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No category budgets configured for {monthLabel}.
              </p>
              <button
                type="button"
                onClick={openAddBudget}
                className="mt-3 px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
              >
                Create Monthly Budget
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {[...budgetsWithUsage]
                .sort((a, b) => b.percentage - a.percentage)
                .slice(0, 5)
                .map((budget) => {
                  const clamped = Math.min(budget.percentage, 100);
                  const barColor =
                    budget.status === 'exceeded'
                      ? 'bg-rose-500'
                      : budget.status === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-gradient-to-r from-indigo-500 to-blue-500';

                  return (
                    <div key={budget.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {budget.category}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          {budget.status === 'exceeded' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Exceeded ({budget.percentage}%)
                            </span>
                          ) : budget.status === 'warning' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {budget.percentage >= 100 ? 'Limit Reached' : 'Near Limit'} ({budget.percentage}%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              On Track ({budget.percentage}%)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                          style={{ width: `${clamped}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono-tabular">
                        <span>Spent: {formatCurrency(budget.spent, currency)}</span>
                        <span>Limit: {formatCurrency(budget.limit, currency)}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
