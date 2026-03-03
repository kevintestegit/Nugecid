import React, { useState } from "react";
import { Users, Plus } from "lucide-react";
import { useUsers, useUserPermissions } from "@/hooks/useUsers";
import { UsersQueryParams } from "@/types";
import UsuarioFilters from "@/components/usuarios/UsuarioFilters";
import UsuariosTable from "@/components/usuarios/UsuariosTable";
import DeleteUserModal from "@/components/usuarios/DeleteUserModal";
import CreateUserModal from "@/components/usuarios/CreateUserModal";
import { PageError } from "@/components/ui/ErrorMessage";
import { getAccessToken, getStoredUser } from "@/utils/tokenStorage";

const UsuariosPage: React.FC = () => {
  const [queryParams, setQueryParams] = useState<UsersQueryParams>({
    page: 1,
    limit: 10,
    active: true,
  });
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { canManageUsers, canViewUsers } = useUserPermissions();
  const {
    data: usersResponse,
    isLoading,
    error,
    refetch,
  } = useUsers(queryParams);

  // Redirecionar se não tiver permissão
  if (!canViewUsers) {
    // DEBUG: Log detalhado
    console.error("❌ Acesso negado à página de usuários", {
      canViewUsers,
      canManageUsers,
      authUser: (window as unknown as Record<string, unknown>).__authUser,
      localStorage_user: getStoredUser(),
      localStorage_token: getAccessToken() ? "EXISTS" : "NOT_FOUND",
    });

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Users className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            Acesso Negado
          </h2>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
          <div className="mt-4 text-xs text-muted-foreground/80">
            <p>Abra o Console (F12) para ver detalhes do erro</p>
          </div>
        </div>
      </div>
    );
  }

  const handleFilterChange = (newParams: Partial<UsersQueryParams>) => {
    setQueryParams((prev) => ({
      ...prev,
      ...newParams,
      page: 1, // Reset para primeira página ao filtrar
    }));
  };

  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  };

  const handleDeleteUser = (userId: number) => {
    setUserToDelete(userId);
  };

  const handleCloseDeleteModal = () => {
    setUserToDelete(null);
  };

  // Mostra tela de erro somente se houve erro E não há dados de usuários disponíveis.
  if (
    error &&
    (!usersResponse || !usersResponse.data || usersResponse.data.length === 0)
  ) {
    return (
      <PageError
        title="Erro ao carregar usuários"
        message="Ocorreu um erro ao carregar a lista de usuários. Tente novamente."
        onRetry={() => refetch()}
        onGoBack={() => window.history.back()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_24px_55px_-42px_rgba(15,23,42,0.75)] backdrop-blur md:p-7">
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-8 -bottom-10 h-28 w-28 rounded-full bg-orange-400/15 blur-3xl" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Gerenciamento de Usuários
              </h1>
              <p className="text-sm text-muted-foreground">
                Gerencie usuários do sistema
              </p>
            </div>
          </div>
          {canManageUsers && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus:ring-2 focus:ring-primary/40 focus:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
              Novo Usuário
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.8)] backdrop-blur">
        <UsuarioFilters
          params={queryParams}
          onParamsChange={handleFilterChange}
          canManageUsers={canManageUsers}
        />
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.8)] backdrop-blur">
        <UsuariosTable
          users={usersResponse?.data || []}
          meta={usersResponse?.meta}
          isLoading={isLoading}
          canManageUsers={canManageUsers}
          onPageChange={handlePageChange}
          onDeleteUser={handleDeleteUser}
          onRefresh={refetch}
        />
      </div>

      {/* Modal de confirmação de exclusão */}
      {userToDelete && (
        <DeleteUserModal
          userId={userToDelete}
          onClose={handleCloseDeleteModal}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {/* Modal de Criação */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default UsuariosPage;
