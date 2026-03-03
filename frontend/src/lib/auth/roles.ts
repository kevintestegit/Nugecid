import { UserRole } from "@/types";

const LEGACY_ROLE_ALIASES: Record<string, UserRole> = {
  nugecid_operator: UserRole.USUARIO,
  nugecid_viewer: UserRole.USUARIO,
};

export function normalizeUserRoleName(role: unknown): UserRole | undefined {
  if (!role) return undefined;

  if (typeof role === "string") {
    const normalized = role.toLowerCase();
    return LEGACY_ROLE_ALIASES[normalized] ?? toUserRole(normalized);
  }

  if (typeof role === "object" && role !== null && "name" in role) {
    const normalized = String(
      (role as Record<string, unknown>).name || "",
    ).toLowerCase();
    return LEGACY_ROLE_ALIASES[normalized] ?? toUserRole(normalized);
  }

  return undefined;
}

export function checkUserRoleAccess(
  userRole: UserRole,
  requiredRole: UserRole,
): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.ADMIN]: 3,
    [UserRole.COORDENADOR]: 2,
    [UserRole.USUARIO]: 1,
    [UserRole.NUGECID_OPERATOR]: 1,
  };

  return (roleHierarchy[userRole] ?? 0) >= (roleHierarchy[requiredRole] ?? 0);
}

function toUserRole(value: string): UserRole | undefined {
  if (value === UserRole.ADMIN) return UserRole.ADMIN;
  if (value === UserRole.COORDENADOR) return UserRole.COORDENADOR;
  if (value === UserRole.USUARIO) return UserRole.USUARIO;
  if (value === UserRole.NUGECID_OPERATOR) return UserRole.NUGECID_OPERATOR;
  return undefined;
}
