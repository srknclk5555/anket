/** Paths already include `/api/...`; Vite proxies `/api` to the backend in dev */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

interface ApiOptions extends RequestInit {
  token?: string;
}

async function apiClient<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    credentials: "include",
    ...rest,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Bir hata oluştu" }));
    throw new Error(error.message || error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(endpoint: string, options?: ApiOptions) =>
    apiClient<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: ApiOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: ApiOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: ApiOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: ApiOptions) =>
    apiClient<T>(endpoint, { ...options, method: "DELETE" }),
};
