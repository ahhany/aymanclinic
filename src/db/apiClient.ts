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

/** Hook-flavoured variant that injects the current token. */
export function useApi() {
  const { state } = useAuth();
  const token = state?.token ?? null;
  return {
    get: <T,>(path: string) => apiGet<T>(path, token),
  };
}
