import { User } from "@/types";

// ---------------------------------------------------------------------------
// Keys – single source of truth for localStorage key names
// ---------------------------------------------------------------------------
const KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
  USER: "user",
} as const;

// ---------------------------------------------------------------------------
// Access Token
// ---------------------------------------------------------------------------
export function getAccessToken(): string | null {
  return localStorage.getItem(KEYS.ACCESS_TOKEN);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(KEYS.ACCESS_TOKEN, token);
}

export function removeAccessToken(): void {
  localStorage.removeItem(KEYS.ACCESS_TOKEN);
}

// ---------------------------------------------------------------------------
// Refresh Token
// ---------------------------------------------------------------------------
export function getRefreshToken(): string | null {
  return localStorage.getItem(KEYS.REFRESH_TOKEN);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(KEYS.REFRESH_TOKEN, token);
}

export function removeRefreshToken(): void {
  localStorage.removeItem(KEYS.REFRESH_TOKEN);
}

// ---------------------------------------------------------------------------
// User (serialised as JSON)
// ---------------------------------------------------------------------------
export function getStoredUser(): User | null {
  const raw = localStorage.getItem(KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export function removeStoredUser(): void {
  localStorage.removeItem(KEYS.USER);
}

// ---------------------------------------------------------------------------
// Bulk helpers
// ---------------------------------------------------------------------------

/** Remove all auth-related data from localStorage. */
export function clearAuth(): void {
  removeAccessToken();
  removeRefreshToken();
  removeStoredUser();
}

/** Returns `true` when both access + refresh tokens are present. */
export function hasTokens(): boolean {
  return getAccessToken() !== null && getRefreshToken() !== null;
}

/** Returns `true` when the access token exists (regardless of refresh). */
export function hasAccessToken(): boolean {
  return getAccessToken() !== null;
}

// ---------------------------------------------------------------------------
// Header helpers (for raw `fetch()` calls that bypass the Axios interceptor)
// ---------------------------------------------------------------------------

/**
 * Returns an object with the Authorization header set to `Bearer <token>`.
 * If no access token is stored, returns an empty object so that spreading
 * it into a headers object is safe.
 */
export function getAuthHeader():
  | { Authorization: string }
  | Record<string, never> {
  const token = getAccessToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
