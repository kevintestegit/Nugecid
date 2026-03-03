import React from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoading } from "@/components/ui/Loading";
import { UserRole } from "@/types";
import { checkUserRoleAccess, normalizeUserRoleName } from "@/lib/auth/roles";

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
  const navigate = useNavigate();

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
    const normalizedRole = normalizeUserRoleName(user.role);
    const hasPermission = normalizedRole
      ? checkUserRoleAccess(normalizedRole, requiredRole)
      : false;
    if (!hasPermission) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Acesso Negado
            </h1>
            <p className="text-muted-foreground mb-4">
              Você não tem permissão para acessar esta página.
            </p>
            <button
              onClick={() => navigate("/", { replace: true })}
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

export default ProtectedRoute;
