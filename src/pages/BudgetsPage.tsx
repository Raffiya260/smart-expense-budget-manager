import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useFinance } from '../context/FinanceContext';
import { Budget } from '../types/finance';
import { formatCurrency, formatMonthLabel } from '../utils/formatters';

export function BudgetsPage() {
  const {
    budgetsWithUsage,
    budgetSummary,
    selectedMonth,
    settings,
    openAddBudget,
    openEditBudget,
    deleteBudget,
  } = useFinance();

  const [pendingDelete, setPendingDelete] = useState<Budget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const currency = settings.currency;
  const monthLabel = formatMonthLabel(selectedMonth);

  const warningBudgets = budgetsWithUsage.filter((b) => b.status === 'warning');
  const exceededBudgets = budgetsWithUsage.filter((b) => b.status === 'exceeded');

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteBudget(pendingDelete.id);
      setPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Monthly Overview Card */}
      <section className="glass-card rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              {monthLabel} Budget Summary
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Set category spending limits. Usage and warnings update automatically as expenses change.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddBudget}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-4 text-sm font-medium text-white hover:from-indigo-500 hover:to-blue-500 transition-all whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Create Budget</span>
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-slate-200/80 dark:border-slate-800/80">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Monthly Limit ({monthLabel})
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white font-mono-tabular">
              {formatCurrency(budgetSummary.totalLimit, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Spent in Budgeted Categories
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white font-mono-tabular">
              {formatCurrency(budgetSummary.totalBudgetedSpent, currency)}
            </p>
            {budgetSummary.unbudgetedExpenses > 0 && (
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono-tabular">
                +{formatCurrency(budgetSummary.unbudgetedExpenses, currency)} in unbudgeted categories
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Remaining Budget
            </p>
            <p
              className={`mt-1 text-xl font-semibold font-mono-tabular ${
                budgetSummary.totalRemaining < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {formatCurrency(budgetSummary.totalRemaining, currency)}
            </p>
          </div>
        </div>

        {budgetSummary.totalLimit > 0 && (
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Overall budgeted utilization</span>
              <span className="font-mono-tabular font-medium text-slate-700 dark:text-slate-300">
                {budgetSummary.overallPercentage}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  budgetSummary.overallPercentage > 100
                    ? 'bg-rose-500'
                    : budgetSummary.overallPercentage >= 80
                      ? 'bg-amber-500'
                      : 'bg-gradient-to-r from-indigo-500 to-blue-500'
                }`}
                style={{ width: `${Math.min(budgetSummary.overallPercentage, 100)}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Budget Alerts Notice */}
      {(exceededBudgets.length > 0 || warningBudgets.length > 0) && (
        <section
          aria-label="Budget threshold warnings"
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3"
        >
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-800 dark:text-slate-200 space-y-1">
            <p className="font-medium">Budget Attention Needed for {monthLabel}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {exceededBudgets.length > 0 &&
                `${exceededBudgets.length} category over budget (${exceededBudgets
                  .map((b) => b.category)
                  .join(', ')}). `}
              {warningBudgets.length > 0 &&
                `${warningBudgets.length} category approaching or at limit (${warningBudgets
                  .map((b) => b.category)
                  .join(', ')}).`}
            </p>
          </div>
        </section>
      )}

      {/* Category Budget Cards */}
      {budgetsWithUsage.length === 0 ? (
        <section className="glass-card rounded-xl border border-slate-200/80 dark:border-slate-800/80 py-16 px-6 text-center">
          <p className="text-base font-medium text-slate-900 dark:text-white">
            No budgets created for {monthLabel}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create spending limits for your expense categories to receive automatic progress tracking and alerts.
          </p>
          <button
            type="button"
            onClick={openAddBudget}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-indigo-500 hover:to-blue-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Budget</span>
          </button>
        </section>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {budgetsWithUsage.map((budget) => {
            const clampedPct = Math.min(budget.percentage, 100);
            const barClass =
              budget.status === 'exceeded'
                ? 'bg-rose-500'
                : budget.status === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-indigo-500 to-blue-500';

            return (
              <div
                key={budget.id}
                className="glass-card rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-5 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white truncate">
                      {budget.category}
                    </h3>
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-medium">
                      {budget.status === 'exceeded' ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Over Budget · {budget.percentage}%
                        </span>
                      ) : budget.status === 'warning' ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {budget.percentage >= 100 ? 'Limit Reached' : 'Near Limit'} · {budget.percentage}%
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          On Track · {budget.percentage}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditBudget(budget)}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400 transition-colors"
                      aria-label={`Edit ${budget.category} budget`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(budget)}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
                      aria-label={`Delete ${budget.category} budget`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${barClass}`}
                      style={{ width: `${clampedPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono-tabular">
                    <span className="text-slate-700 dark:text-slate-300">
                      Spent: {formatCurrency(budget.spent, currency)}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Limit: {formatCurrency(budget.limit, currency)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    {budget.remaining >= 0 ? 'Amount Remaining' : 'Amount Exceeded'}
                  </span>
                  <span
                    className={`font-semibold font-mono-tabular ${
                      budget.remaining >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatCurrency(Math.abs(budget.remaining), currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </section>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        title="Delete Category Budget"
        message={
          pendingDelete
            ? `Remove the ${formatMonthLabel(pendingDelete.month)} spending budget for "${pendingDelete.category}"? Your recorded transactions will not be affected.`
            : ''
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
        isSubmitting={isDeleting}
      />
    </div>
  );
}
