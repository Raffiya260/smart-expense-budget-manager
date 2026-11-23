import { API_CONFIG } from '../config/api';
import { INITIAL_TRANSACTIONS } from '../data/sampleData';
import { Transaction, TransactionInput } from '../types/finance';
import { apiRequest } from './apiClient';

// In-memory store used during frontend preview mode (resets on page reload)
let memoryTransactions: Transaction[] = [...INITIAL_TRANSACTIONS];

export function resetPreviewTransactions(): Transaction[] {
  memoryTransactions = [...INITIAL_TRANSACTIONS];
  return [...memoryTransactions];
}

export const transactionService = {
  async getAll(): Promise<Transaction[]> {
    if (!API_CONFIG.usePreviewMode) {
      return apiRequest<Transaction[]>(API_CONFIG.endpoints.transactions);
    }
    return [...memoryTransactions].sort((a, b) => b.date.localeCompare(a.date));
  },

  async create(input: TransactionInput): Promise<Transaction> {
    if (!API_CONFIG.usePreviewMode) {
      return apiRequest<Transaction>(API_CONFIG.endpoints.transactions, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    }

    const newTransaction: Transaction = {
      ...input,
      id: `txn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    memoryTransactions = [newTransaction, ...memoryTransactions];
    return newTransaction;
  },

  async update(id: string, input: TransactionInput): Promise<Transaction> {
    if (!API_CONFIG.usePreviewMode) {
      return apiRequest<Transaction>(`${API_CONFIG.endpoints.transactions}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    }

    const existing = memoryTransactions.find((t) => t.id === id);
    if (!existing) {
      throw new Error('Transaction not found.');
    }

    const updated: Transaction = {
      ...existing,
      ...input,
    };
    memoryTransactions = memoryTransactions.map((t) => (t.id === id ? updated : t));
    return updated;
  },

  async remove(id: string): Promise<void> {
    if (!API_CONFIG.usePreviewMode) {
      await apiRequest<void>(`${API_CONFIG.endpoints.transactions}/${id}`, {
        method: 'DELETE',
      });
      return;
    }

    memoryTransactions = memoryTransactions.filter((t) => t.id !== id);
  },
};
