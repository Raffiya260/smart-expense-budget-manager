import React from 'react';
import { Calendar, Menu, Plus } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { AppPage } from '../../types/finance';
import { formatMonthLabel } from '../../utils/formatters';

interface TopBarProps {
  onOpenMobileMenu: () => void;
}

const PAGE_TITLES: Record<AppPage, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Financial Dashboard',
    subtitle: 'Overview of balances, monthly cash flow, and category budgets',
  },
  transactions: {
    title: 'Transactions',
    subtitle: 'Record, search, edit, and filter income and expenses',
  },
  budgets: {
    title: 'Monthly Budgets',
    subtitle: 'Set category spending limits and monitor budget thresholds',
  },
  reports: {
    title: 'Financial Reports',
    subtitle: 'Monthly summaries, category analytics, and spending trends',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Profile details, currency, appearance, and FastAPI endpoint configuration',
  },
};

export function TopBar({ onOpenMobileMenu }: TopBarProps) {
  const {
    activePage,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    openAddTransaction,
  } = useFinance();

  const meta = PAGE_TITLES[activePage];
  const showMonthFilter = activePage === 'dashboard' || activePage === 'budgets';

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#060914]/85 backdrop-blur-md">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h1 className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-white truncate">
              {meta.title}
            </h1>
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 truncate">
              {meta.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {showMonthFilter && (
            <div className="relative flex items-center">
              <Calendar
                className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400"
                aria-hidden="true"
              />
              <select
                aria-label="Select active month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/90 pl-8 pr-3 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              >
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {formatMonthLabel(month)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={openAddTransaction}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-3.5 sm:px-4 text-xs sm:text-sm font-medium text-white shadow-sm hover:from-indigo-500 hover:to-blue-500 transition-all whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Add Transaction</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>
    </header>
  );
}
