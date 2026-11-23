import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useFinance } from '../context/FinanceContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/sampleData';
import { Transaction } from '../types/finance';
import { exportTransactionsToCsv } from '../utils/financeCalculations';
import {
  formatCurrency,
  formatDate,
  formatMonthLabel,
  getMonthKey,
} from '../utils/formatters';

type TypeFilter = 'all' | 'expense' | 'income';
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export function TransactionsPage() {
  const {
    transactions,
    availableMonths,
    settings,
    openAddTransaction,
    openEditTransaction,
    deleteTransaction,
  } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const currency = settings.currency;

  const allCategories = useMemo(
    () => [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES],
    []
  );

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return transactions
      .filter((txn) => {
        if (typeFilter !== 'all' && txn.type !== typeFilter) return false;
        if (categoryFilter !== 'all' && txn.category !== categoryFilter) return false;
        if (monthFilter !== 'all' && getMonthKey(txn.date) !== monthFilter) return false;
        if (query) {
          const matchesDesc = txn.description.toLowerCase().includes(query);
          const matchesCat = txn.category.toLowerCase().includes(query);
          const matchesMethod = (txn.paymentMethod ?? '').toLowerCase().includes(query);
          if (!matchesDesc && !matchesCat && !matchesMethod) return false;
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date-asc':
            return a.date.localeCompare(b.date);
          case 'amount-desc':
            return b.amount - a.amount;
          case 'amount-asc':
            return a.amount - b.amount;
          case 'date-desc':
          default:
            return b.date.localeCompare(a.date);
        }
      });
  }, [transactions, searchQuery, typeFilter, categoryFilter, monthFilter, sortBy]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of filteredTransactions) {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    }
    return {
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      net: Math.round((income - expense) * 100) / 100,
    };
  }, [filteredTransactions]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    monthFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setMonthFilter('all');
    setSortBy('date-desc');
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(pendingDelete.id);
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const scopeLabel =
    monthFilter === 'all' ? 'All-Time Filtered' : `${formatMonthLabel(monthFilter)} Filtered`;

  return (
    <div className="space-y-6">
      {/* Filter & Search Toolbar */}
      <section className="glass-card rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by description, category, or payment method..."
              aria-label="Search transactions"
              className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/70 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Segmented Type Filter */}
            <div
              className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-900/80 p-1 border border-slate-200 dark:border-slate-800"
              role="group"
              aria-label="Filter by transaction type"
            >
              {(['all', 'expense', 'income'] as TypeFilter[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTypeFilter(item)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap ${
                    typeFilter === item
                      ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                exportTransactionsToCsv(
                  filteredTransactions,
                  monthFilter === 'all'
                    ? 'smart-expense-transactions'
                    : `smart-expense-${monthFilter}`
                )
              }
              disabled={filteredTransactions.length === 0}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/70 px-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            >
              <option value="all">All Categories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/70 px-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            >
              <option value="all">All Months (All-Time)</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {formatMonthLabel(month)}
                </option>
              ))}
            </select>

            <select
              aria-label="Sort transactions"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-9 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/70 px-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-mono-tabular">
            <span className="font-sans text-slate-500 dark:text-slate-400">
              {scopeLabel} ({filteredTransactions.length}):
            </span>
            <span className="text-emerald-600 dark:text-emerald-400">
              In: {formatCurrency(summary.income, currency)}
            </span>
            <span className="text-rose-600 dark:text-rose-400">
              Out: {formatCurrency(summary.expense, currency)}
            </span>
            <span
              className={
                summary.net >= 0
                  ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                  : 'text-rose-600 dark:text-rose-400 font-medium'
              }
            >
              Net: {formatCurrency(summary.net, currency)}
            </span>
          </div>
        </div>
      </section>

      {/* Transactions Table / List */}
      <section className="glass-card rounded-xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <p className="text-base font-medium text-slate-900 dark:text-white">
              No matching transactions found
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {hasActiveFilters
                ? 'Try clearing or adjusting your search and category filters.'
                : 'Add your first income or expense transaction to start tracking.'}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Clear Filters
                </button>
              )}
              <button
                type="button"
                onClick={openAddTransaction}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-500 hover:to-blue-500 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add Transaction</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800/80 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-5">Date</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70 text-sm">
                  {filteredTransactions.map((txn) => {
                    const isIncome = txn.type === 'income';
                    return (
                      <tr
                        key={txn.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/35 transition-colors"
                      >
                        <td className="py-3.5 px-5 whitespace-nowrap text-slate-600 dark:text-slate-300 font-mono-tabular text-xs">
                          {formatDate(txn.date)}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                                isIncome
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}
                              aria-hidden="true"
                            >
                              {isIncome ? (
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowDownRight className="h-3.5 w-3.5" />
                              )}
                            </span>
                            <span className="font-medium text-slate-900 dark:text-white truncate">
                              {txn.description}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {txn.category}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                          {txn.paymentMethod || '—'}
                        </td>
                        <td
                          className={`py-3.5 px-4 whitespace-nowrap text-right font-semibold font-mono-tabular ${
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                          {formatCurrency(txn.amount, currency)}
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditTransaction(txn)}
                              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition-colors"
                              aria-label={`Edit ${txn.description}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDelete(txn)}
                              className="rounded-md p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
                              aria-label={`Delete ${txn.description}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-slate-200/70 dark:divide-slate-800/70">
              {filteredTransactions.map((txn) => {
                const isIncome = txn.type === 'income';
                return (
                  <div key={txn.id} className="p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {txn.description}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {txn.category} · {formatDate(txn.date)}
                        {txn.paymentMethod ? ` · ${txn.paymentMethod}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span
                        className={`text-sm font-semibold font-mono-tabular ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        {formatCurrency(txn.amount, currency)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditTransaction(txn)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                          aria-label={`Edit ${txn.description}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(txn)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 dark:text-slate-400"
                          aria-label={`Delete ${txn.description}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete Transaction"
        message={
          pendingDelete
            ? `Are you sure you want to remove "${pendingDelete.description}" (${formatCurrency(
                pendingDelete.amount,
                currency
              )})?`
            : ''
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
        isSubmitting={isDeleting}
      />
    </div>
  );
}
