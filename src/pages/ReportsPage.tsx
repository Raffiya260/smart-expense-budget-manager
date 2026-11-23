import React, { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ExpenseCategoryChart } from '../components/charts/ExpenseCategoryChart';
import { useFinance } from '../context/FinanceContext';
import { reportService } from '../services/reportService';
import { CategoryBreakdownPoint, MonthlySummaryPoint } from '../types/finance';
import { exportTransactionsToCsv } from '../utils/financeCalculations';
import { formatCurrency, formatMonthLabel, getMonthKey } from '../utils/formatters';

export function ReportsPage() {
  const { transactions, availableMonths, allTimeTotals, settings } = useFinance();

  const [monthsRange, setMonthsRange] = useState<number>(6);
  const [categoryMonth, setCategoryMonth] = useState<string>('all');
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummaryPoint[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<
    CategoryBreakdownPoint[]
  >([]);

  const currency = settings.currency;
  const isDark = settings.theme === 'dark';

  useEffect(() => {
    let active = true;
    const loadReports = async () => {
      const [monthly, categories] = await Promise.all([
        reportService.getMonthlySummary(transactions, monthsRange),
        reportService.getCategoryBreakdown(transactions, categoryMonth),
      ]);
      if (active) {
        setMonthlySummary(monthly);
        setCategoryBreakdown(categories);
      }
    };
    void loadReports();
    return () => {
      active = false;
    };
  }, [transactions, monthsRange, categoryMonth]);

  const periodStats = useMemo(() => {
    if (monthlySummary.length === 0) {
      return {
        periodIncome: 0,
        periodExpense: 0,
        avgIncome: 0,
        avgExpense: 0,
        avgSavings: 0,
        savingsRate: 0,
      };
    }
    const periodIncome = monthlySummary.reduce((s, m) => s + m.income, 0);
    const periodExpense = monthlySummary.reduce((s, m) => s + m.expenses, 0);
    const periodSavings = periodIncome - periodExpense;
    const count = monthlySummary.length;
    const savingsRate =
      periodIncome > 0
        ? Math.round((periodSavings / periodIncome) * 1000) / 10
        : 0;

    return {
      periodIncome,
      periodExpense,
      avgIncome: periodIncome / count,
      avgExpense: periodExpense / count,
      avgSavings: periodSavings / count,
      savingsRate,
    };
  }, [monthlySummary]);

  const transactionsInPeriod = useMemo(() => {
    const activeMonthKeys = new Set(monthlySummary.map((m) => m.month));
    if (activeMonthKeys.size === 0) return transactions;
    return transactions.filter((t) => activeMonthKeys.has(getMonthKey(t.date)));
  }, [transactions, monthlySummary]);

  const gridStroke = isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.08)';
  const tickColor = isDark ? '#94A3B8' : '#64748B';
  const periodLabel =
    monthsRange >= 24 ? 'All Available Months' : `Last ${monthlySummary.length} Month(s)`;

  return (
    <div className="space-y-6">
      {/* Controls & Export Bar */}
      <section className="glass-card rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-900/80 p-1 border border-slate-200 dark:border-slate-800"
            role="group"
            aria-label="Report period"
          >
            {[
              { label: 'Last 3 Months', value: 3 },
              { label: 'Last 6 Months', value: 6 },
              { label: 'All-Time', value: 120 },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMonthsRange(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  monthsRange === opt.value
                    ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            All-Time Net Balance:{' '}
            <strong className="font-mono-tabular text-slate-900 dark:text-white">
              {formatCurrency(allTimeTotals.totalBalance, currency)}
            </strong>
          </span>
        </div>

        <button
          type="button"
          onClick={() =>
            exportTransactionsToCsv(
              transactionsInPeriod,
              monthsRange >= 24
                ? 'smart-expense-all-time-report'
                : `smart-expense-last-${monthsRange}m-report`
            )
          }
          disabled={transactionsInPeriod.length === 0}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          <Download className="h-4 w-4" />
          <span>Export Period CSV ({transactionsInPeriod.length})</span>
        </button>
      </section>

      {/* Summary Metrics Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Avg. Monthly Income ({periodLabel})
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white font-mono-tabular">
            {formatCurrency(periodStats.avgIncome, currency)}
          </p>
        </div>
        <div className="glass-card rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Avg. Monthly Expenses ({periodLabel})
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white font-mono-tabular">
            {formatCurrency(periodStats.avgExpense, currency)}
          </p>
        </div>
        <div className="glass-card rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Avg. Monthly Savings ({periodLabel})
          </p>
          <p
            className={`mt-2 text-2xl font-semibold font-mono-tabular ${
              periodStats.avgSavings >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(periodStats.avgSavings, currency)}
          </p>
        </div>
        <div className="glass-card rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Period Savings Rate
          </p>
          <p className="mt-2 text-2xl font-semibold text-indigo-600 dark:text-indigo-400 font-mono-tabular">
            {periodStats.savingsRate}%
          </p>
        </div>
      </section>

      {/* Income vs Expense Bar Chart & Spending Trend Line Chart */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Monthly Income vs Expenses
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Side-by-side comparison across months
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-blue-500" />
                Income
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-violet-500" />
                Expenses
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlySummary}
                margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: tickColor, fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: tickColor, fontSize: 12 }}
                  tickFormatter={(val: number) =>
                    formatCurrency(val, currency, { compact: true })
                  }
                  width={62}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1426] p-3 shadow-xl text-xs">
                        <p className="font-semibold text-slate-900 dark:text-white mb-2">
                          {label}
                        </p>
                        {payload.map((entry) => (
                          <div
                            key={String(entry.dataKey)}
                            className="flex items-center justify-between gap-4 py-0.5"
                          >
                            <span className="text-slate-600 dark:text-slate-300">
                              {entry.name}
                            </span>
                            <span className="font-mono-tabular font-medium text-slate-900 dark:text-white">
                              {formatCurrency(Number(entry.value ?? 0), currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="income" name="Income" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="#8B5CF6"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Spending & Savings Trend
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Trajectory of monthly expenses and net savings
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" />
                Savings
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-violet-500" />
                Expenses
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlySummary}
                margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: tickColor, fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: tickColor, fontSize: 12 }}
                  tickFormatter={(val: number) =>
                    formatCurrency(val, currency, { compact: true })
                  }
                  width={62}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1426] p-3 shadow-xl text-xs">
                        <p className="font-semibold text-slate-900 dark:text-white mb-2">
                          {label}
                        </p>
                        {payload.map((entry) => (
                          <div
                            key={String(entry.dataKey)}
                            className="flex items-center justify-between gap-4 py-0.5"
                          >
                            <span className="text-slate-600 dark:text-slate-300">
                              {entry.name}
                            </span>
                            <span className="font-mono-tabular font-medium text-slate-900 dark:text-white">
                              {formatCurrency(Number(entry.value ?? 0), currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="savings"
                  name="Net Savings"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10B981' }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#8B5CF6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Category-Wise Spending & Monthly Summary Table */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-6 glass-card rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Category-Wise Spending
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Distribution across expense categories
              </p>
            </div>
            <select
              aria-label="Filter category breakdown by month"
              value={categoryMonth}
              onChange={(e) => setCategoryMonth(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/70 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            >
              <option value="all">All Months Combined</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {formatMonthLabel(month)}
                </option>
              ))}
            </select>
          </div>

          <ExpenseCategoryChart data={categoryBreakdown} currency={currency} />
        </div>

        <div className="xl:col-span-6 glass-card rounded-xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800/80">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Monthly Summary Ledger
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Income, total expenses, and savings rate by month
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800/80 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-5">Month</th>
                  <th className="py-3 px-4 text-right">Income</th>
                  <th className="py-3 px-4 text-right">Expenses</th>
                  <th className="py-3 px-4 text-right">Net Savings</th>
                  <th className="py-3 px-5 text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70 text-sm">
                {[...monthlySummary].reverse().map((row) => {
                  const rate =
                    row.income > 0
                      ? Math.round((row.savings / row.income) * 1000) / 10
                      : 0;
                  return (
                    <tr
                      key={row.month}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/35 transition-colors"
                    >
                      <td className="py-3.5 px-5 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                        {row.label}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {formatCurrency(row.income, currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular text-slate-900 dark:text-slate-200 whitespace-nowrap">
                        {formatCurrency(row.expenses, currency)}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-mono-tabular font-medium whitespace-nowrap ${
                          row.savings >= 0
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {formatCurrency(row.savings, currency)}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono-tabular text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {rate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
