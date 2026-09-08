import { clearSession, getToken } from "./auth";
import type { CustomerSession, LoginResponse } from "./types";

// Same-origin by default; Next.js proxies /api/* to the backend (see next.config.ts).
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

/** Thrown for any non-success response; carries the backend's error code and details. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string | null,
    readonly status: number,
    readonly details: string[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface Envelope<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string; details?: string[] } | null;
}

function authHeaders(extra: HeadersInit = {}): HeadersInit {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

/**
 * Calls the API and unwraps the ApiResponse envelope, returning `data` on success and throwing
 * [ApiError] otherwise. A 401 clears the stored session so the app falls back to the login screen.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: authHeaders({ "Content-Type": "application/json", ...(init.headers ?? {}) }),
  });

  const body = (await res.json().catch(() => null)) as Envelope<T> | null;

  if (res.status === 401) clearSession();
  if (!body || body.success === false) {
    throw new ApiError(
      body?.error?.message ?? res.statusText ?? "Request failed",
      body?.error?.code ?? null,
      res.status,
      body?.error?.details ?? [],
    );
  }
  return body.data as T;
}

/** Convenience wrappers. */
export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
};

/** Portal sign-in (customer OTP). Returns the dev code when the backend exposes it. */
export function requestCustomerOtp(phone: string): Promise<{ sent: boolean; devCode: string | null }> {
  return api.post("/customer/auth/request-otp", { phone });
}

export function verifyCustomerOtp(phone: string, code: string): Promise<CustomerSession> {
  return api.post<CustomerSession>("/customer/auth/verify-otp", { phone, code });
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return api.post<LoginResponse>("/auth/login", { email, password });
}

/** Downloads a raw (non-envelope) response such as a CSV report and triggers a browser save. */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) {
    if (res.status === 401) clearSession();
    throw new ApiError("Download failed", null, res.status);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
