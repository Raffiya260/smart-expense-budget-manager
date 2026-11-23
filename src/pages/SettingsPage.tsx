import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Moon,
  RotateCcw,
  Server,
  Sun,
} from 'lucide-react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { API_CONFIG, updateApiBaseUrl } from '../config/api';
import { useFinance } from '../context/FinanceContext';
import { testBackendConnection } from '../services/apiClient';
import { CurrencyCode } from '../types/finance';
import { CURRENCY_META } from '../utils/formatters';

interface ProfileErrors {
  fullName?: string;
  email?: string;
  role?: string;
  monthlySavingsGoal?: string;
}

export function SettingsPage() {
  const {
    settings,
    isDemoMode,
    switchDataMode,
    updateProfile,
    setCurrency,
    setTheme,
    resetSampleData,
  } = useFinance();

  const [fullName, setFullName] = useState(settings.profile.fullName);
  const [email, setEmail] = useState(settings.profile.email);
  const [role, setRole] = useState(settings.profile.role);
  const [savingsGoal, setSavingsGoal] = useState(
    String(settings.profile.monthlySavingsGoal)
  );
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [profileSaved, setProfileSaved] = useState(false);

  const [apiUrlInput, setApiUrlInput] = useState(API_CONFIG.baseUrl);
  const [apiUrlError, setApiUrlError] = useState<string | null>(null);
  const [apiUrlSaved, setApiUrlSaved] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    setFullName(settings.profile.fullName);
    setEmail(settings.profile.email);
    setRole(settings.profile.role);
    setSavingsGoal(String(settings.profile.monthlySavingsGoal));
  }, [settings.profile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved(false);

    const errors: ProfileErrors = {};
    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = 'Display name must be at least 2 characters.';
    }
    if (
      email.trim() !== '' &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      errors.email = 'Please enter a valid email address or leave blank.';
    }
    if (!role.trim()) {
      errors.role = 'Please enter an account label or occupation.';
    }
    const goalNum = Number(savingsGoal);
    if (savingsGoal.trim() === '' || Number.isNaN(goalNum) || goalNum < 0) {
      errors.monthlySavingsGoal = 'Savings goal must be 0 or greater.';
    }

    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;

    await updateProfile({
      fullName: fullName.trim(),
      email: email.trim(),
      role: role.trim(),
      monthlySavingsGoal: goalNum,
    });
    setProfileSaved(true);
  };

  const validateAndApplyApiUrl = (): boolean => {
    const trimmed = apiUrlInput.trim();
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setApiUrlError('Base URL must start with http:// or https://');
        return false;
      }
      setApiUrlError(null);
      updateApiBaseUrl(trimmed);
      return true;
    } catch {
      setApiUrlError('Please enter a valid URL (e.g. http://localhost:8000/api/v1).');
      return false;
    }
  };

  const handleApiUrlSave = (e: React.FormEvent) => {
    e.preventDefault();
    setApiUrlSaved(false);
    setConnectionStatus(null);
    if (validateAndApplyApiUrl()) {
      setApiUrlSaved(true);
    }
  };

  const handleTestConnection = async () => {
    setApiUrlSaved(false);
    setConnectionStatus(null);
    if (!validateAndApplyApiUrl()) return;

    setIsTestingConnection(true);
    try {
      const result = await testBackendConnection();
      setConnectionStatus(result);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await resetSampleData();
      setConfirmResetOpen(false);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Editable User Profile Card */}
      <section className="glass-card rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6">
        <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
          User Profile
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Customize your profile name, contact email, and monthly savings target.
        </p>

        <form onSubmit={handleProfileSubmit} noValidate className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="profile-name"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Display Name
              </label>
              <input
                id="profile-name"
                type="text"
                placeholder="Enter your name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setProfileSaved(false);
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              />
              {profileErrors.fullName && (
                <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{profileErrors.fullName}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="profile-email"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Email Address (Optional)
              </label>
              <input
                id="profile-email"
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setProfileSaved(false);
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              />
              {profileErrors.email && (
                <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{profileErrors.email}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="profile-role"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Account Label / Occupation
              </label>
              <input
                id="profile-role"
                type="text"
                placeholder="e.g., Personal Budget or Software Engineer"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setProfileSaved(false);
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              />
              {profileErrors.role && (
                <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{profileErrors.role}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="profile-goal"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Monthly Savings Goal ({CURRENCY_META[settings.currency].symbol})
              </label>
              <input
                id="profile-goal"
                type="number"
                min="0"
                step="500"
                value={savingsGoal}
                onChange={(e) => {
                  setSavingsGoal(e.target.value);
                  setProfileSaved(false);
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70 px-3 py-2 text-sm text-slate-900 dark:text-white font-mono-tabular focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
              />
              {profileErrors.monthlySavingsGoal && (
                <p className="mt-1 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{profileErrors.monthlySavingsGoal}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div>
              {profileSaved && (
                <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    Profile updated{isDemoMode ? ' for this preview session.' : '.'}
                  </span>
                </p>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-500 hover:to-blue-500 transition-all whitespace-nowrap"
            >
              Save Profile
            </button>
          </div>
        </form>
      </section>

      {/* Currency & Appearance */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Display Currency
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Default is Indian Rupee (INR ₹). Updates all dashboards and reports immediately.
          </p>

          <div className="mt-4">
            <label
              htmlFor="currency-select"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Preferred Currency
            </label>
            <select
              id="currency-select"
              value={settings.currency}
              onChange={(e) => void setCurrency(e.target.value as CurrencyCode)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            >
              {(Object.keys(CURRENCY_META) as CurrencyCode[]).map((code) => (
                <option key={code} value={code}>
                  {CURRENCY_META[code].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="glass-card rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Appearance Theme
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Switch between the dark navy workspace and clean light mode.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => void setTheme('dark')}
              className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                settings.theme === 'dark'
                  ? 'border-indigo-500 bg-indigo-500/15 text-indigo-600 dark:text-white'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Moon className="h-4 w-4" />
              <span>Dark Navy</span>
            </button>

            <button
              type="button"
              onClick={() => void setTheme('light')}
              className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                settings.theme === 'light'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:text-white'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sun className="h-4 w-4" />
              <span>Light Mode</span>
            </button>
          </div>
        </div>
      </section>

      {/* FastAPI Backend Configuration & Demo Mode Notice */}
      <section className="glass-card rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-5 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Python FastAPI Backend Integration
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {isDemoMode
                ? 'Currently running in Demo Data mode (in-memory sample records, not permanently saved). '
                : 'Currently targeting your FastAPI REST API. '}
              Configure your Python FastAPI + SQLAlchemy + SQLite backend URL below or set{' '}
              <code className="font-mono-tabular text-indigo-600 dark:text-indigo-400">
                VITE_API_BASE_URL
              </code>{' '}
              in your environment.
            </p>
          </div>
        </div>

        {/* Data Mode Switch */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 p-3">
          <div className="text-xs">
            <p className="font-medium text-slate-800 dark:text-slate-200">
              Active Data Source: {isDemoMode ? 'Demo Data (In-Memory)' : 'FastAPI REST Backend'}
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              Switch to FastAPI mode once your local Python server is running with CORS enabled.
            </p>
          </div>
          <div className="inline-flex items-center rounded-lg bg-slate-200/80 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => void switchDataMode(true)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                isDemoMode
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Demo Data
            </button>
            <button
              type="button"
              onClick={() => {
                if (validateAndApplyApiUrl()) {
                  void switchDataMode(false);
                }
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                !isDemoMode
                  ? 'bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              FastAPI API
            </button>
          </div>
        </div>

        <form onSubmit={handleApiUrlSave} noValidate className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="api-base-url" className="sr-only">
              Backend Base URL
            </label>
            <input
              id="api-base-url"
              type="url"
              value={apiUrlInput}
              onChange={(e) => {
                setApiUrlInput(e.target.value);
                setApiUrlSaved(false);
                setApiUrlError(null);
                setConnectionStatus(null);
              }}
              placeholder="http://localhost:8000/api/v1"
              className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/70 px-3 text-sm font-mono-tabular text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
            />
            {apiUrlError && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                {apiUrlError}
              </p>
            )}
            {apiUrlSaved && (
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                API base URL updated to {API_CONFIG.baseUrl}.
              </p>
            )}
            {connectionStatus && (
              <p
                className={`mt-1 text-xs ${
                  connectionStatus.ok
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {connectionStatus.message}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="submit"
              className="h-10 px-4 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Save URL
            </button>
            <button
              type="button"
              onClick={() => void handleTestConnection()}
              disabled={isTestingConnection}
              className="h-10 px-4 text-sm font-medium rounded-lg bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/25 disabled:opacity-60 transition-colors whitespace-nowrap"
            >
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Restore the initial demo transactions, monthly budgets, and default profile for this session.
          </p>
          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </section>

      <ConfirmDialog
        isOpen={confirmResetOpen}
        title="Reset Demo Data"
        message="This will restore all demo transactions, monthly budgets, and default settings for the current preview session."
        confirmLabel="Reset Data"
        onConfirm={handleConfirmReset}
        onCancel={() => setConfirmResetOpen(false)}
        isSubmitting={isResetting}
      />
    </div>
  );
}
