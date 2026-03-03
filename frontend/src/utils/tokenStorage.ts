import { User } from "@/types";

// ---------------------------------------------------------------------------
// Keys – single source of truth for localStorage key names
// ---------------------------------------------------------------------------
const KEYS = {
  USER: "user",
} as const;

// ---------------------------------------------------------------------------
// User (serialised as JSON) – non-secret UI profile data
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

/**
 * Remove all auth-related data from localStorage.
 * Tokens are managed exclusively via httpOnly cookies — only the
 * cached user profile needs to be cleared from localStorage.
 */
export function clearAuth(): void {
  removeStoredUser();
  // Also clean up any legacy token keys left from previous versions
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}
