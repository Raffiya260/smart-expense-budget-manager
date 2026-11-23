import React, { useState } from 'react';
import { BudgetModal } from './components/common/BudgetModal';
import { TransactionModal } from './components/common/TransactionModal';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { BudgetsPage } from './pages/BudgetsPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { TransactionsPage } from './pages/TransactionsPage';

function AppShell() {
  const { activePage, isLoading, error, clearError } = useFinance();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case 'transactions':
        return <TransactionsPage />;
      case 'budgets':
        return <BudgetsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'dashboard':
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#060914] dark:text-slate-100 transition-colors duration-200">
      {/* Subtle ambient dark navy radial accent */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden hidden dark:block"
        aria-hidden="true"
      >
        <div className="absolute -top-40 right-0 h-96 w-96 rounded-full bg-indigo-600/12 blur-3xl" />
        <div className="absolute top-1/3 -left-24 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="lg:pl-64 flex min-h-screen flex-col relative">
        <TopBar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {error && (
            <div
              role="alert"
              className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={clearError}
                className="text-xs font-medium underline shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((idx) => (
                <div
                  key={idx}
                  className="h-32 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/50 animate-pulse"
                />
              ))}
            </div>
          ) : (
            renderPage()
          )}
        </main>
      </div>

      <TransactionModal />
      <BudgetModal />
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <AppShell />
    </FinanceProvider>
  );
}
