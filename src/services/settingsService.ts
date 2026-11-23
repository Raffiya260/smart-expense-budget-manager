import { API_CONFIG } from '../config/api';
import { INITIAL_SETTINGS } from '../data/sampleData';
import { UserSettings } from '../types/finance';
import { apiRequest } from './apiClient';

let memorySettings: UserSettings = structuredClone(INITIAL_SETTINGS);

export function resetPreviewSettings(): UserSettings {
  memorySettings = structuredClone(INITIAL_SETTINGS);
  return structuredClone(memorySettings);
}

export const settingsService = {
  async get(): Promise<UserSettings> {
    if (!API_CONFIG.usePreviewMode) {
      return apiRequest<UserSettings>(API_CONFIG.endpoints.settings);
    }
    return structuredClone(memorySettings);
  },

  async update(nextSettings: UserSettings): Promise<UserSettings> {
    if (!API_CONFIG.usePreviewMode) {
      return apiRequest<UserSettings>(API_CONFIG.endpoints.settings, {
        method: 'PUT',
        body: JSON.stringify(nextSettings),
      });
    }
    memorySettings = structuredClone(nextSettings);
    return structuredClone(memorySettings);
  },
};
