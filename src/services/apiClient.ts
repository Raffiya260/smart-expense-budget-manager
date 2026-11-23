import { API_CONFIG } from '../config/api';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  queryParams?: Record<string, string | number | undefined>;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { queryParams, headers, ...fetchOptions } = options;

  const url = new URL(`${API_CONFIG.baseUrl}${endpoint}`);
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    if (!response.ok) {
      let errorBody: unknown = null;
      try {
        errorBody = await response.json();
      } catch {
        // Ignore non-JSON error responses
      }
      throw new ApiError(
        `Request failed with status ${response.status}`,
        response.status,
        errorBody
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function testBackendConnection(): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    await apiRequest<{ status?: string }>(API_CONFIG.endpoints.health, {
      method: 'GET',
    });
    return {
      ok: true,
      message: `Connected to FastAPI backend at ${API_CONFIG.baseUrl}`,
    };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? `Could not reach ${API_CONFIG.baseUrl}${API_CONFIG.endpoints.health} (${err.message}).`
          : `Could not reach ${API_CONFIG.baseUrl}.`,
    };
  }
}
