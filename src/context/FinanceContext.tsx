import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { API_CONFIG, setApiPreviewMode } from '../config/api';
import { CURRENT_MONTH, INITIAL_SETTINGS } from '../data/sampleData';
import {
  budgetService,
  resetPreviewBudgets,
} from '../services/budgetService';
import {
  resetPreviewSettings,
  settingsService,
} from '../services/settingsService';
import {
  resetPreviewTransactions,
  transactionService,
} from '../services/transactionService';
import {
  AppPage,
  Budget,
  BudgetInput,
  BudgetWithUsage,
  CurrencyCode,
  ThemeMode,
  Transaction,
  TransactionInput,
  UserProfile,
  UserSettings,
} from '../types/finance';
import {
  AllTimeTotals,
  BudgetSummaryTotals,
  calculateAllTimeTotals,
  calculateBudgetsWithUsage,
  calculateMonthlyTotals,
  MonthlyTotals,
} from '../utils/financeCalculations';
import { getMonthKey } from '../utils/formatters';

interface FinanceContextValue {
  activePage: AppPage;
  setActivePage: (page: AppPage) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  availableMonths: string[];

  transactions: Transaction[];
  budgets: Budget[];
  budgetsWithUsage: BudgetWithUsage[];
  budgetSummary: BudgetSummaryTotals;
  allTimeTotals: AllTimeTotals;
  monthlyTotals: MonthlyTotals;
  settings: UserSettings;

  isDemoMode: boolean;
  switchDataMode: (usePreview: boolean) => Promise<void>;

  isLoading: boolean;
  error: string | null;
  clearError: () => void;

  // CRUD actions
  addTransaction: (input: TransactionInput) => Promise<void>;
  editTransaction: (id: string, input: TransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  addBudget: (input: BudgetInput) => Promise<void>;
  editBudget: (id: string, input: BudgetInput) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  updateProfile: (profile: UserProfile) => Promise<void>;
  setCurrency: (currency: CurrencyCode) => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  resetSampleData: () => Promise<void>;

  // Global Transaction & Budget Modal triggers
  transactionModalOpen: boolean;
  editingTransaction: Transaction | null;
  openAddTransaction: () => void;
  openEditTransaction: (txn: Transaction) => void;
  closeTransactionModal: () => void;

  budgetModalOpen: boolean;
  editingBudget: Budget | null;
  openAddBudget: () => void;
  openEditBudget: (budget: Budget) => void;
  closeBudgetModal: () => void;
}

const FinanceContext = createContext<FinanceContextValue | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [activePage, setActivePage] = useState<AppPage>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>(CURRENT_MONTH);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(API_CONFIG.usePreviewMode);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [settings, setSettings] = useState<UserSettings>(() =>
    structuredClone(INITIAL_SETTINGS)
  );

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Load initial data from service layer
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [loadedTxns, loadedBudgets, loadedSettings] = await Promise.all([
        transactionService.getAll(),
        budgetService.getAll(),
        settingsService.get(),
      ]);
      setTransactions(loadedTxns);
      setBudgets(loadedBudgets);
      setSettings(loadedSettings);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load financial data.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Synchronize HTML root dark class whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  const switchDataMode = useCallback(
    async (usePreview: boolean) => {
      setApiPreviewMode(usePreview);
      setIsDemoMode(usePreview);
      try {
        await loadData();
      } catch (err) {
        // Revert to preview mode if FastAPI is unreachable
        if (!usePreview) {
          setApiPreviewMode(true);
          setIsDemoMode(true);
          await loadData();
          setError(
            err instanceof Error
              ? `Could not load from FastAPI backend (${err.message}). Reverted to Demo Data.`
              : 'Could not reach FastAPI backend. Reverted to Demo Data.'
          );
        }
      }
    },
    [loadData]
  );

  // Available months derived from transactions + budgets + current month
  const availableMonths = useMemo(() => {
    const set = new Set<string>([CURRENT_MONTH]);
    transactions.forEach((t) => set.add(getMonthKey(t.date)));
    budgets.forEach((b) => set.add(b.month));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [transactions, budgets]);

  // Single-source-of-truth financial calculations
  const allTimeTotals = useMemo(
    () => calculateAllTimeTotals(transactions),
    [transactions]
  );

  const monthlyTotals = useMemo(
    () => calculateMonthlyTotals(transactions, selectedMonth),
    [transactions, selectedMonth]
  );

  const { items: budgetsWithUsage, summary: budgetSummary } = useMemo(
    () => calculateBudgetsWithUsage(budgets, transactions, selectedMonth),
    [budgets, transactions, selectedMonth]
  );

  // Transaction CRUD
  const addTransaction = useCallback(async (input: TransactionInput) => {
    const created = await transactionService.create(input);
    setTransactions((prev) =>
      [created, ...prev].sort((a, b) => b.date.localeCompare(a.date))
    );
  }, []);

  const editTransaction = useCallback(
    async (id: string, input: TransactionInput) => {
      const updated = await transactionService.update(id, input);
      setTransactions((prev) =>
        prev
          .map((t) => (t.id === id ? updated : t))
          .sort((a, b) => b.date.localeCompare(a.date))
      );
    },
    []
  );

  const deleteTransaction = useCallback(async (id: string) => {
    await transactionService.remove(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Budget CRUD
  const addBudget = useCallback(async (input: BudgetInput) => {
    const created = await budgetService.create(input);
    setBudgets((prev) => [...prev, created]);
    setSelectedMonth(input.month);
  }, []);

  const editBudget = useCallback(async (id: string, input: BudgetInput) => {
    const updated = await budgetService.update(id, input);
    setBudgets((prev) => prev.map((b) => (b.id === id ? updated : b)));
    setSelectedMonth(input.month);
  }, []);

  const deleteBudget = useCallback(async (id: string) => {
    await budgetService.remove(id);
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // Settings updates
  const updateProfile = useCallback(
    async (profile: UserProfile) => {
      const updated = await settingsService.update({ ...settings, profile });
      setSettings(updated);
    },
    [settings]
  );

  const setCurrency = useCallback(
    async (currency: CurrencyCode) => {
      const updated = await settingsService.update({ ...settings, currency });
      setSettings(updated);
    },
    [settings]
  );

  const setTheme = useCallback(
    async (theme: ThemeMode) => {
      const updated = await settingsService.update({ ...settings, theme });
      setSettings(updated);
    },
    [settings]
  );

  const resetSampleData = useCallback(async () => {
    setApiPreviewMode(true);
    setIsDemoMode(true);
    const freshTxns = resetPreviewTransactions();
    const freshBudgets = resetPreviewBudgets();
    const freshSettings = resetPreviewSettings();
    setTransactions(freshTxns);
    setBudgets(freshBudgets);
    setSettings(freshSettings);
    setSelectedMonth(CURRENT_MONTH);
  }, []);

  // Modal triggers
  const openAddTransaction = useCallback(() => {
    setEditingTransaction(null);
    setTransactionModalOpen(true);
  }, []);

  const openEditTransaction = useCallback((txn: Transaction) => {
    setEditingTransaction(txn);
    setTransactionModalOpen(true);
  }, []);

  const closeTransactionModal = useCallback(() => {
    setTransactionModalOpen(false);
    setEditingTransaction(null);
  }, []);

  const openAddBudget = useCallback(() => {
    setEditingBudget(null);
    setBudgetModalOpen(true);
  }, []);

  const openEditBudget = useCallback((budget: Budget) => {
    setEditingBudget(budget);
    setBudgetModalOpen(true);
  }, []);

  const closeBudgetModal = useCallback(() => {
    setBudgetModalOpen(false);
    setEditingBudget(null);
  }, []);

  return (
    <FinanceContext.Provider
      value={{
        activePage,
        setActivePage,
        selectedMonth,
        setSelectedMonth,
        availableMonths,
        transactions,
        budgets,
        budgetsWithUsage,
        budgetSummary,
        allTimeTotals,
        monthlyTotals,
        settings,
        isDemoMode,
        switchDataMode,
        isLoading,
        error,
        clearError,
        addTransaction,
        editTransaction,
        deleteTransaction,
        addBudget,
        editBudget,
        deleteBudget,
        updateProfile,
        setCurrency,
        setTheme,
        resetSampleData,
        transactionModalOpen,
        editingTransaction,
        openAddTransaction,
        openEditTransaction,
        closeTransactionModal,
        budgetModalOpen,
        editingBudget,
        openAddBudget,
        openEditBudget,
        closeBudgetModal,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) {
    throw new Error('useFinance must be used inside a FinanceProvider.');
  }
  return ctx;
}
