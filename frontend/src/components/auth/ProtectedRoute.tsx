import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoading } from "@/components/ui/Loading";
import { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requireAuth = true,
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return <PageLoading />;
  }

  // Se requer autenticação mas usuário não está logado
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se não requer autenticação mas usuário está logado (ex: página de login)
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Verificar permissões de role
  if (requiredRole && user) {
    const normalizedRole = normalizeUserRole(user.role);
    const hasPermission = normalizedRole
      ? checkRolePermission(normalizedRole, requiredRole)
      : false;
    if (!hasPermission) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Acesso Negado
            </h1>
            <p className="text-gray-600 mb-4">
              Você não tem permissão para acessar esta página.
            </p>
            <button
              onClick={() => window.history.back()}
              className="text-blue-600 hover:text-blue-500"
            >
              Voltar
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

// Normaliza diferentes formatos de role para o enum UserRole
function normalizeUserRole(role: unknown): UserRole | undefined {
  if (!role) return undefined;

  // Caso já seja o enum (string com valores válidos)
  if (typeof role === "string") {
    const value = role.toLowerCase();
    if (value === UserRole.ADMIN) return UserRole.ADMIN;
    if (value === UserRole.COORDENADOR) return UserRole.COORDENADOR;
    if (value === UserRole.USUARIO) return UserRole.USUARIO;
    if (value === UserRole.NUGECID_OPERATOR) return UserRole.NUGECID_OPERATOR;
    return undefined;
  }

  // Caso seja objeto { name: 'admin' | 'usuario' }
  if (typeof role === "object" && role !== null && "name" in role) {
    const name = String(
      (role as Record<string, unknown>).name || "",
    ).toLowerCase();
    if (name === UserRole.ADMIN) return UserRole.ADMIN;
    if (name === UserRole.COORDENADOR) return UserRole.COORDENADOR;
    if (name === UserRole.USUARIO) return UserRole.USUARIO;
    if (name === UserRole.NUGECID_OPERATOR) return UserRole.NUGECID_OPERATOR;
    return undefined;
  }

  return undefined;
}

// Função para verificar permissões de role
function checkRolePermission(
  userRole: UserRole,
  requiredRole: UserRole,
): boolean {
  // Hierarquia de permissões:
  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.ADMIN]: 3,
    [UserRole.COORDENADOR]: 2,
    [UserRole.NUGECID_OPERATOR]: 2,
    [UserRole.USUARIO]: 1,
  };

  return (roleHierarchy[userRole] ?? 0) >= (roleHierarchy[requiredRole] ?? 0);
}

export default ProtectedRoute;
