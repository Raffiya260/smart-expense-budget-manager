import { API_CONFIG } from '../config/api';
import {
  CategoryBreakdownPoint,
  MonthlySummaryPoint,
  Transaction,
} from '../types/finance';
import {
  calculateCategoryBreakdown,
  calculateMonthlyTrend,
} from '../utils/financeCalculations';
import { apiRequest } from './apiClient';

export const reportService = {
  async getMonthlySummary(
    transactions: Transaction[],
    monthsLimit = 6
  ): Promise<MonthlySummaryPoint[]> {
    if (!API_CONFIG.usePreviewMode) {
      return apiRequest<MonthlySummaryPoint[]>(API_CONFIG.endpoints.reportsMonthly, {
        queryParams: { months: monthsLimit },
      });
    }

    return calculateMonthlyTrend(transactions, monthsLimit);
  },

  async getCategoryBreakdown(
    transactions: Transaction[],
    month?: string
  ): Promise<CategoryBreakdownPoint[]> {
    if (!API_CONFIG.usePreviewMode) {
      return apiRequest<CategoryBreakdownPoint[]>(
        API_CONFIG.endpoints.reportsCategories,
        { queryParams: { month } }
      );
    }

    return calculateCategoryBreakdown(transactions, month);
  },
};
