import { CurrencyCode } from '../types/finance';

export const CURRENCY_META: Record<
  CurrencyCode,
  { symbol: string; locale: string; label: string }
> = {
  INR: { symbol: '₹', locale: 'en-IN', label: 'Indian Rupee (INR ₹)' },
  USD: { symbol: '$', locale: 'en-US', label: 'US Dollar (USD $)' },
  EUR: { symbol: '€', locale: 'de-DE', label: 'Euro (EUR €)' },
  GBP: { symbol: '£', locale: 'en-GB', label: 'British Pound (GBP £)' },
  JPY: { symbol: '¥', locale: 'ja-JP', label: 'Japanese Yen (JPY ¥)' },
};

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'INR',
  options?: { compact?: boolean }
): string {
  const meta = CURRENCY_META[currency] ?? CURRENCY_META.INR;
  const safeAmount = Object.is(amount, -0) ? 0 : amount;

  if (options?.compact && Math.abs(safeAmount) >= 1000) {
    return new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(safeAmount);
  }

  return new Intl.NumberFormat(meta.locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    minimumFractionDigits: safeAmount % 1 === 0 ? 0 : 2,
  }).format(safeAmount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatMonthLabel(monthKey: string): string {
  if (!monthKey || !monthKey.includes('-')) return monthKey;
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (year < 1900 || year > 2100) return false;
  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}
