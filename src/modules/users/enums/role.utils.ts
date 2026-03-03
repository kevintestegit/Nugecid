import { RoleType } from "./role-type.enum";

export const LEGACY_ROLE_ALIASES = {
  nugecid_operator: RoleType.USUARIO,
  nugecid_viewer: RoleType.USUARIO,
} as const;

export const TRANSITION_NUGECID_FULL_ACCESS_ROLES = new Set<string>([
  RoleType.ADMIN,
  "nugecid_operator",
  "nugecid_viewer",
]);

export function normalizeRoleName(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  return (
    LEGACY_ROLE_ALIASES[normalized as keyof typeof LEGACY_ROLE_ALIASES] ??
    normalized
  );
}

export function expandRolesForTransition(roles: readonly string[]): string[] {
  const expanded = new Set<string>();

  for (const role of roles) {
    const normalized = normalizeRoleName(role);
    if (!normalized) {
      continue;
    }

    expanded.add(normalized);

    if (normalized === RoleType.USUARIO) {
      expanded.add("nugecid_operator");
      expanded.add("nugecid_viewer");
    }
  }

  return Array.from(expanded);
}

export function hasAnyNormalizedRole(
  userRoles: readonly string[],
  allowedRoles: ReadonlySet<string>,
): boolean {
  return userRoles.some((role) => {
    const normalized = normalizeRoleName(role);
    return normalized ? allowedRoles.has(normalized) : false;
  });
}
