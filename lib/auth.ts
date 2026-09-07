import type { LoginResponse } from "./types";

// The console is an internal tool; the JWT lives in localStorage and is attached as a bearer.
const TOKEN_KEY = "dispatch.token";
const STAFF_KEY = "dispatch.staff";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStaff(): LoginResponse["staff"] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STAFF_KEY);
    return raw ? (JSON.parse(raw) as LoginResponse["staff"]) : null;
  } catch {
    return null;
  }
}

export function storeSession(session: LoginResponse): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, session.token);
    window.localStorage.setItem(STAFF_KEY, JSON.stringify(session.staff));
  } catch {
    /* private mode / storage disabled — the session simply won't persist */
  }
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(STAFF_KEY);
  } catch {
    /* ignore */
  }
}
