const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit & { headers?: Record<string, string> } = {}
): Promise<{ success: boolean; data?: T; error?: any; meta?: any }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('queueflow_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error?.message || `HTTP ${response.status} Error`;
    const errorCode = data?.error?.code || 'UNKNOWN_ERROR';
    throw new ApiError(errorMsg, errorCode, data?.error?.details);
  }

  return data;
}

export const api = {
  get: <T = any>(endpoint: string) => fetchApi<T>(endpoint, { method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any, headers?: Record<string, string>) =>
    fetchApi<T>(endpoint, { method: 'POST', body: JSON.stringify(body), headers }),
  put: <T = any>(endpoint: string, body?: any) =>
    fetchApi<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T = any>(endpoint: string) => fetchApi<T>(endpoint, { method: 'DELETE' }),
};
