export const APP_NAVIGATE_EVENT = "sgc:navigate";
export const AUTH_REQUIRED_EVENT = "sgc:auth-required";

export interface AppNavigateDetail {
  to: string;
  replace?: boolean;
}

export interface AuthRequiredDetail {
  redirectTo?: string;
}

export function dispatchAppNavigate(detail: AppNavigateDetail): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<AppNavigateDetail>(APP_NAVIGATE_EVENT, { detail }),
  );
}

export function dispatchAuthRequired(detail: AuthRequiredDetail = {}): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<AuthRequiredDetail>(AUTH_REQUIRED_EVENT, { detail }),
  );
}
