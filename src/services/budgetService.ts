import { API_CONFIG } from '../config/api';
import { INITIAL_BUDGETS } from '../data/sampleData';
import { Budget, BudgetInput } from '../types/finance';
import { apiRequest } from './apiClient';

let memoryBudgets: Budget[] = [...INITIAL_BUDGETS];

export function resetPreviewBudgets(): Budget[] {
  memoryBudgets = [...INITIAL_BUDGETS];
  return [...memoryBudgets];
}

export const budgetService = {
  async getAll(month?: string): Promise<Budget[]> {
    if (!API_CONFIG.usePreviewMode) {
      return apiRequest<Budget[]>(API_CONFIG.endpoints.budgets, {
        queryParams: { month },
      });
    }
    if (!month) return [...memoryBudgets];
    return memoryBudgets.filter((b) => b.month === month);
  },

  async create(input: BudgetInput): Promise<Budget> {
    if (!API_CONFIG.usePreviewMode) {
      return apiRequest<Budget>(API_CONFIG.endpoints.budgets, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    }

    const duplicate = memoryBudgets.find(
      (b) => b.category === input.category && b.month === input.month
    );
    if (duplicate) {
      throw new Error(
        `A budget for ${input.category} already exists for this month. Edit the existing budget instead.`
      );
    }

    const newBudget: Budget = {
      ...input,
      id: `bdg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    memoryBudgets = [...memoryBudgets, newBudget];
    return newBudget;
  },

  async update(id: string, input: BudgetInput): Promise<Budget> {
    if (!API_CONFIG.usePreviewMode) {
      return apiRequest<Budget>(`${API_CONFIG.endpoints.budgets}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    }

    const existing = memoryBudgets.find((b) => b.id === id);
    if (!existing) {
      throw new Error('Budget not found.');
    }

    const conflict = memoryBudgets.find(
      (b) =>
        b.id !== id && b.category === input.category && b.month === input.month
    );
    if (conflict) {
      throw new Error(
        `Another budget for ${input.category} already exists for this month.`
      );
    }

    const updated: Budget = {
      ...existing,
      ...input,
    };
    memoryBudgets = memoryBudgets.map((b) => (b.id === id ? updated : b));
    return updated;
  },

  async remove(id: string): Promise<void> {
    if (!API_CONFIG.usePreviewMode) {
      await apiRequest<void>(`${API_CONFIG.endpoints.budgets}/${id}`, {
        method: 'DELETE',
      });
      return;
    }

    memoryBudgets = memoryBudgets.filter((b) => b.id !== id);
  },
};
