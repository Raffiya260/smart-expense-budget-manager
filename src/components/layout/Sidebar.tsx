import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  BarChart3,
  Settings,
  Wallet,
  X,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { AppPage } from '../../types/finance';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { id: AppPage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'budgets', label: 'Budgets', icon: Target },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { activePage, setActivePage, settings, isDemoMode } = useFinance();

  const handleSelect = (page: AppPage) => {
    setActivePage(page);
    onCloseMobile();
  };

  const displayName = settings.profile.fullName.trim() || 'Personal Account';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white dark:bg-[#080D1C] border-r border-slate-200 dark:border-slate-800/80">
      <div>
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-600 text-white shadow-sm">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="font-display text-sm font-semibold tracking-tight text-slate-900 dark:text-white truncate">
              Smart Expense
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/15 to-blue-600/10 text-indigo-700 dark:from-indigo-500/20 dark:to-blue-500/15 dark:text-white border border-indigo-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent'
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Demo Notice & Editable Profile Link */}
      <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
        <div className="rounded-lg bg-slate-100/80 dark:bg-slate-900/70 px-3 py-2.5 border border-slate-200/70 dark:border-slate-800/80">
          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {isDemoMode ? 'Demo Data Mode' : 'FastAPI Backend Mode'}
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            {isDemoMode
              ? 'Showing sample demo data in memory only. Changes reset on reload until connected to FastAPI.'
              : 'Connected to your configured Python FastAPI REST API.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSelect('settings')}
          className="w-full flex items-center gap-3 rounded-lg p-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 text-xs font-semibold text-white">
            {initials || 'PA'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {displayName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {settings.profile.email || settings.profile.role || 'Edit profile in Settings'}
            </p>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 max-w-[80vw]">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
