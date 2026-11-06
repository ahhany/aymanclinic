// The only module the UI uses to reach the backend. When production moves to
// Supabase (D6/D20), this file is the single seam that changes.

import { useAuth } from '../auth/AuthContext';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiGet<T>(path: string, token: string | null): Promise<T> {
  const res = await fetch(`/api/${path}`, {
    headers: token ? { 'x-dev-token': token } : undefined,
  });
  if (!res.ok) throw new ApiError(res.status, `GET ${path} failed`);
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown, token: string | null): Promise<T> {
  const res = await fetch(`/api/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { 'x-dev-token': token } : {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, err.error ?? `POST ${path} failed`);
  }
  return (await res.json()) as T;
}

/** Hook-flavoured variant that injects the current token. */
export function useApi() {
  const { state } = useAuth();
  const token = state?.token ?? null;
  return {
    get: <T,>(path: string) => apiGet<T>(path, token),
    post: <T,>(path: string, body: unknown) => apiPost<T>(path, body, token),
    put: <T,>(path: string, body: unknown) => apiPut<T>(path, body, token),
  };
}

export async function apiPut<T>(path: string, body: unknown, token: string | null): Promise<T> {
  const res = await fetch(`/api/${path}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', ...(token ? { 'x-dev-token': token } : {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, err.error ?? `PUT ${path} failed`);
  }
  return (await res.json()) as T;
}
