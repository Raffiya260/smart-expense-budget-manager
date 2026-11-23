export type TransactionType = 'income' | 'expense';

export type ExpenseCategory =
  | 'Housing & Rent'
  | 'Groceries & Dining'
  | 'Transport & Fuel'
  | 'Utilities & Bills'
  | 'Shopping & Lifestyle'
  | 'Health & Wellness'
  | 'Entertainment'
  | 'Education & Growth'
  | 'Other Expense';

export type IncomeCategory =
  | 'Salary'
  | 'Freelance'
  | 'Investments'
  | 'Bonus'
  | 'Other Income';

export type TransactionCategory = ExpenseCategory | IncomeCategory;

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  description: string;
  date: string; // YYYY-MM-DD
  paymentMethod?: string;
  createdAt: string;
}

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  description: string;
  date: string;
  paymentMethod?: string;
}

export interface Budget {
  id: string;
  category: ExpenseCategory;
  limit: number;
  month: string; // YYYY-MM
}

export interface BudgetInput {
  category: ExpenseCategory;
  limit: number;
  month: string;
}

export interface BudgetWithUsage extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
  status: 'on-track' | 'warning' | 'exceeded';
}

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY';
export type ThemeMode = 'dark' | 'light';
export type AppPage = 'dashboard' | 'transactions' | 'budgets' | 'reports' | 'settings';

export interface UserProfile {
  fullName: string;
  email: string;
  role: string;
  monthlySavingsGoal: number;
}

export interface UserSettings {
  profile: UserProfile;
  currency: CurrencyCode;
  theme: ThemeMode;
}

export interface MonthlySummaryPoint {
  month: string; // YYYY-MM
  label: string; // e.g. "Nov 2026"
  income: number;
  expenses: number;
  savings: number;
}

export interface CategoryBreakdownPoint {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}
