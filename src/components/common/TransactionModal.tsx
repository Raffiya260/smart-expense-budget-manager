import React, { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../data/sampleData';
import { TransactionCategory, TransactionType } from '../../types/finance';
import {
  CURRENCY_META,
  getTodayDateString,
  isValidDateString,
} from '../../utils/formatters';

interface FormErrors {
  amount?: string;
  category?: string;
  description?: string;
  date?: string;
  submit?: string;
}

const PAYMENT_METHODS = ['UPI', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Cash'];

export function TransactionModal() {
  const {
    transactionModalOpen,
    editingTransaction,
    closeTransactionModal,
    addTransaction,
    editTransaction,
    settings,
  } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('Groceries & Dining');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currencySymbol = CURRENCY_META[settings.currency]?.symbol ?? '₹';

  useEffect(() => {
    if (!transactionModalOpen) return;
    setErrors({});
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(String(editingTransaction.amount));
      setCategory(editingTransaction.category);
      setDescription(editingTransaction.description);
      setDate(editingTransaction.date);
      setPaymentMethod(editingTransaction.paymentMethod || 'UPI');
    } else {
      setType('expense');
      setAmount('');
      setCategory('Groceries & Dining');
      setDescription('');
      setDate(getTodayDateString());
      setPaymentMethod('UPI');
    }
  }, [transactionModalOpen, editingTransaction]);

  if (!transactionModalOpen) return null;

  const availableCategories =
    type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    const nextList = nextType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if (!nextList.includes(category as never)) {
      setCategory(nextList[0]);
    }
    setErrors((prev) => ({ ...prev, category: undefined }));
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    const trimmedAmount = amount.trim();
    const parsedAmount = Number(trimmedAmount);

    if (
      !trimmedAmount ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      nextErrors.amount = 'Enter a valid amount greater than 0.';
    } else if (!/^\d+(\.\d{1,2})?$/.test(trimmedAmount)) {
      nextErrors.amount = 'Amount can have at most 2 decimal places.';
    } else if (parsedAmount > 100000000) {
      nextErrors.amount = 'Amount exceeds the maximum allowed limit.';
    }

    const validCategoryList: readonly string[] =
      type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if (!category || !validCategoryList.includes(category)) {
      nextErrors.category = `Select a valid ${type} category.`;
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc || trimmedDesc.length < 2) {
      nextErrors.description = 'Description must be at least 2 characters.';
    } else if (!/[a-zA-Z0-9]/.test(trimmedDesc)) {
      nextErrors.description = 'Description must include letters or numbers.';
    } else if (trimmedDesc.length > 100) {
      nextErrors.description = 'Description must be 100 characters or fewer.';
    }

    if (!date) {
      nextErrors.date = 'Select a transaction date.';
    } else if (!isValidDateString(date)) {
      nextErrors.date = 'Enter a valid calendar date (YYYY-MM-DD).';
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
        type,
        amount: Math.round(Number(amount.trim()) * 100) / 100,
        category,
        description: description.trim(),
        date,
        paymentMethod,
      };

      if (editingTransaction) {
        await editTransaction(editingTransaction.id, payload);
      } else {
        await addTransaction(payload);
      }
      closeTransactionModal();
    } catch (err) {
      setErrors({
        submit:
          err instanceof Error ? err.message : 'Could not save transaction.',
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
      aria-labelledby="txn-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1426] p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <h2
            id="txn-modal-title"
            className="text-lg font-semibold text-slate-900 dark:text-white"
          >
            {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button
            type="button"
            onClick={closeTransactionModal}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          {/* Type Switcher */}
          <div>
            <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Transaction Type
            </span>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 dark:bg-slate-900/90 p-1 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2 px-3 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  type === 'expense'
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-2 px-3 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  type === 'income'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label
                htmlFor="txn-amount"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Amount ({currencySymbol})
              </label>
              <input
                id="txn-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors((p) => ({ ...p, amount: undefined }));
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70 px-3 py-2 text-sm text-slate-900 dark:text-white font-mono-tabular focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              />
              {errors.amount && (
                <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.amount}</span>
                </p>
              )}
            </div>

            {/* Date */}
            <div>
              <label
                htmlFor="txn-date"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Date
              </label>
              <input
                id="txn-date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((p) => ({ ...p, date: undefined }));
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              />
              {errors.date && (
                <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.date}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label
                htmlFor="txn-category"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Category
              </label>
              <select
                id="txn-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as TransactionCategory);
                  if (errors.category) setErrors((p) => ({ ...p, category: undefined }));
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              >
                {availableCategories.map((cat) => (
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

            {/* Payment Method */}
            <div>
              <label
                htmlFor="txn-payment"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Payment Method
              </label>
              <select
                id="txn-payment"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="txn-description"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Description
            </label>
            <input
              id="txn-description"
              type="text"
              maxLength={100}
              placeholder={
                type === 'expense'
                  ? 'e.g., Weekly supermarket groceries'
                  : 'e.g., Monthly salary or freelance invoice'
              }
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description)
                  setErrors((p) => ({ ...p, description: undefined }));
              }}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            />
            {errors.description && (
              <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errors.description}</span>
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
              onClick={closeTransactionModal}
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
                : editingTransaction
                  ? 'Save Changes'
                  : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
