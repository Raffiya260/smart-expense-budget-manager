import React, { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { EXPENSE_CATEGORIES } from '../../data/sampleData';
import { ExpenseCategory } from '../../types/finance';
import { CURRENCY_META } from '../../utils/formatters';

interface FormErrors {
  category?: string;
  limit?: string;
  month?: string;
  submit?: string;
}

export function BudgetModal() {
  const {
    budgetModalOpen,
    editingBudget,
    closeBudgetModal,
    addBudget,
    editBudget,
    selectedMonth,
    settings,
  } = useFinance();

  const [category, setCategory] = useState<ExpenseCategory>('Groceries & Dining');
  const [limit, setLimit] = useState('');
  const [month, setMonth] = useState(selectedMonth);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currencySymbol = CURRENCY_META[settings.currency]?.symbol ?? '₹';

  useEffect(() => {
    if (!budgetModalOpen) return;
    setErrors({});
    if (editingBudget) {
      setCategory(editingBudget.category);
      setLimit(String(editingBudget.limit));
      setMonth(editingBudget.month);
    } else {
      setCategory('Groceries & Dining');
      setLimit('');
      setMonth(selectedMonth);
    }
  }, [budgetModalOpen, editingBudget, selectedMonth]);

  if (!budgetModalOpen) return null;

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    const trimmedLimit = limit.trim();
    const parsedLimit = Number(trimmedLimit);

    if (!category || !EXPENSE_CATEGORIES.includes(category)) {
      nextErrors.category = 'Please choose a valid expense category.';
    }

    if (
      !trimmedLimit ||
      !Number.isFinite(parsedLimit) ||
      parsedLimit <= 0
    ) {
      nextErrors.limit = 'Spending limit must be greater than 0.';
    } else if (!/^\d+(\.\d{1,2})?$/.test(trimmedLimit)) {
      nextErrors.limit = 'Spending limit can have at most 2 decimal places.';
    } else if (parsedLimit > 100000000) {
      nextErrors.limit = 'Limit value exceeds the maximum allowed.';
    }

    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      nextErrors.month = 'Please pick a valid month (YYYY-MM).';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        category,
        limit: Math.round(Number(limit.trim()) * 100) / 100,
        month,
      };
      if (editingBudget) {
        await editBudget(editingBudget.id, payload);
      } else {
        await addBudget(payload);
      }
      closeBudgetModal();
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'Could not save budget.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="budget-modal-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1426] p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <h2
            id="budget-modal-title"
            className="text-lg font-semibold text-slate-900 dark:text-white"
          >
            {editingBudget ? 'Edit Category Budget' : 'Create Monthly Budget'}
          </h2>
          <button
            type="button"
            onClick={closeBudgetModal}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="budget-category"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Expense Category
            </label>
            <select
              id="budget-category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as ExpenseCategory);
                if (errors.category) setErrors((p) => ({ ...p, category: undefined }));
              }}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errors.category}</span>
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="budget-limit"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Monthly Spending Limit ({currencySymbol})
            </label>
            <input
              id="budget-limit"
              type="number"
              step="100"
              min="1"
              placeholder="e.g., 10000"
              value={limit}
              onChange={(e) => {
                setLimit(e.target.value);
                if (errors.limit) setErrors((p) => ({ ...p, limit: undefined }));
              }}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70 px-3 py-2 text-sm text-slate-900 dark:text-white font-mono-tabular focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            />
            {errors.limit && (
              <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errors.limit}</span>
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="budget-month"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Budget Month
            </label>
            <input
              id="budget-month"
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                if (errors.month) setErrors((p) => ({ ...p, month: undefined }));
              }}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            />
            {errors.month && (
              <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errors.month}</span>
              </p>
            )}
          </div>

          {errors.submit && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
              {errors.submit}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeBudgetModal}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-500 hover:to-blue-500 disabled:opacity-60 transition-all whitespace-nowrap"
            >
              {isSubmitting
                ? 'Saving...'
                : editingBudget
                  ? 'Update Budget'
                  : 'Create Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
