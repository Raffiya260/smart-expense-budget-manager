/**
 * API Configuration for Smart Expense & Budget Manager
 *
 * Designed for Python FastAPI + SQLAlchemy + SQLite backend integration.
 *
 * Expected FastAPI REST endpoints under `baseUrl` (default: http://localhost:8000/api/v1):
 * - GET    /health                 -> { status: "ok" }
 * - GET    /transactions           -> Transaction[]
 * - POST   /transactions           -> Transaction
 * - PUT    /transactions/{id}      -> Transaction
 * - DELETE /transactions/{id}      -> 204 No Content
 * - GET    /budgets?month=YYYY-MM  -> Budget[]
 * - POST   /budgets                -> Budget
 * - PUT    /budgets/{id}           -> Budget
 * - DELETE /budgets/{id}           -> 204 No Content
 * - GET    /reports/monthly        -> MonthlySummaryPoint[]
 * - GET    /reports/categories     -> CategoryBreakdownPoint[]
 * - GET    /settings               -> UserSettings
 * - PUT    /settings               -> UserSettings
 */

export interface ApiConfig {
  baseUrl: string;
  timeoutMs: number;
  usePreviewMode: boolean;
  endpoints: {
    health: string;
    transactions: string;
    budgets: string;
    reportsMonthly: string;
    reportsCategories: string;
    settings: string;
  };
}

const envBaseUrl =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
    ? String(import.meta.env.VITE_API_BASE_URL)
    : 'http://localhost:8000/api/v1';

const envUsePreview =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_PREVIEW_MODE === 'false'
    ? false
    : true;

export const API_CONFIG: ApiConfig = {
  baseUrl: envBaseUrl.replace(/\/+$/, ''),
  timeoutMs: 10000,
  usePreviewMode: envUsePreview,
  endpoints: {
    health: '/health',
    transactions: '/transactions',
    budgets: '/budgets',
    reportsMonthly: '/reports/monthly',
    reportsCategories: '/reports/categories',
    settings: '/settings',
  },
};

export function updateApiBaseUrl(newBaseUrl: string): void {
  API_CONFIG.baseUrl = newBaseUrl.trim().replace(/\/+$/, '');
}

export function setApiPreviewMode(usePreview: boolean): void {
  API_CONFIG.usePreviewMode = usePreview;
}
