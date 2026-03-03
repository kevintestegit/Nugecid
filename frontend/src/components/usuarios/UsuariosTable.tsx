import React, { useState } from "react";
import {
  Edit,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Shield,
  User,
  Crown,
  Eye,
} from "lucide-react";
import { User as UserType, PaginationMeta } from "@/types";
import { useReactivateUser } from "@/hooks/useUsers";
import UserDetailModal from "./UserDetailModal";
import EditUserModal from "./EditUserModal";
import { NoResultsFound } from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui";

interface UsuariosTableProps {
  users: UserType[];
  meta?: PaginationMeta;
  isLoading: boolean;
  canManageUsers: boolean;
  onPageChange: (page: number) => void;
  onDeleteUser: (userId: number) => void;
  onRefresh?: () => void;
}

const UsuariosTable: React.FC<UsuariosTableProps> = ({
  users,
  meta,
  isLoading,
  canManageUsers,
  onPageChange,
  onDeleteUser,
  onRefresh,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const reactivateUserMutation = useReactivateUser();

  const handleReactivateUser = async (userId: number) => {
    try {
      await reactivateUserMutation.mutateAsync(userId);
    } catch (error) {
      console.error("Erro ao reativar usuário:", error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case "coordenador":
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "coordenador":
        return "Coordenador";
      default:
        return "Usuário";
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "border border-yellow-500/20 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300";
      case "coordenador":
        return "border border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300";
      default:
        return "border border-border/70 bg-muted/40 text-foreground/85";
    }
  };

  if (isLoading) {
    return <SkeletonTable rows={10} columns={5} />;
  }

  if (!users.length) {
    return (
      <div className="p-8">
        <NoResultsFound
          description="Não há usuários que correspondam aos filtros aplicados."
          secondaryAction={
            onRefresh
              ? {
                  label: "Limpar filtros",
                  onClick: onRefresh,
                }
              : undefined
          }
          variant="compact"
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border/60">
          <thead className="bg-muted/35">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Usuário
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Papel
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Criado em
              </th>
              {canManageUsers && (
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 bg-card/30">
            {users.map((user) => (
              <tr
                key={user.id}
                className={`transition-colors hover:bg-muted/35 ${user.deletedAt ? "opacity-60" : ""}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <Avatar className="h-10 w-10">
                        {user.avatarUrl || user.avatar ? (
                          <AvatarImage
                            src={user.avatarUrl ?? user.avatar ?? undefined}
                            alt={user.nome}
                            className="object-cover"
                          />
                        ) : (
                          <AvatarFallback className="bg-muted text-muted-foreground">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-foreground">
                        {user.nome}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID: {user.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-foreground">{user.usuario}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(user.role.name)}
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role.name)}`}
                    >
                      {getRoleLabel(user.role.name)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.deletedAt ? (
                    <span className="inline-flex rounded-full border border-border/70 bg-muted/40 px-2 py-1 text-xs font-semibold text-foreground/85">
                      Deletado
                    </span>
                  ) : (
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.ativo
                          ? "border border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300"
                          : "border border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300"
                      }`}
                    >
                      {user.ativo ? "Ativo" : "Inativo"}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                </td>
                {canManageUsers && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {user.deletedAt ? (
                        <span className="text-xs italic text-muted-foreground">
                          Deletado em{" "}
                          {new Date(user.deletedAt).toLocaleDateString("pt-BR")}
                        </span>
                      ) : user.ativo ? (
                        <>
                          <button
                            onClick={() => setSelectedUserId(user.id)}
                            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            title="Visualizar detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditUserId(user.id)}
                            className="rounded p-1 text-blue-600 transition-colors hover:bg-blue-500/10 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                            title="Editar usuário"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDeleteUser(user.id)}
                            className="rounded p-1 text-red-600 transition-colors hover:bg-red-500/10 hover:text-red-700 dark:text-red-300 dark:hover:text-red-200"
                            title="Desativar usuário"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleReactivateUser(user.id)}
                          disabled={reactivateUserMutation.isPending}
                          className="rounded p-1 text-green-600 transition-colors hover:bg-green-500/10 hover:text-green-700 disabled:opacity-50 dark:text-green-300 dark:hover:text-green-200"
                          title="Reativar usuário"
                        >
                          {reactivateUserMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {meta && meta.totalPages > 1 && (
        <div className="border-t border-border/60 bg-card/50 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => onPageChange(meta.page - 1)}
                disabled={!meta.hasPrev}
                className="relative inline-flex items-center rounded-md border border-border/70 bg-background/70 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => onPageChange(meta.page + 1)}
                disabled={!meta.hasNext}
                className="ml-3 relative inline-flex items-center rounded-md border border-border/70 bg-background/70 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Mostrando{" "}
                  <span className="font-medium text-foreground">
                    {(meta.page - 1) * meta.limit + 1}
                  </span>{" "}
                  até{" "}
                  <span className="font-medium text-foreground">
                    {Math.min(meta.page * meta.limit, meta.total)}
                  </span>{" "}
                  de{" "}
                  <span className="font-medium text-foreground">
                    {meta.total}
                  </span>{" "}
                  resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => onPageChange(meta.page - 1)}
                    disabled={!meta.hasPrev}
                    className="relative inline-flex items-center rounded-l-md border border-border/70 bg-background/70 px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  {/* Números das páginas */}
                  {Array.from(
                    { length: Math.min(5, meta.totalPages) },
                    (_, i) => {
                      const pageNum =
                        Math.max(
                          1,
                          Math.min(meta.totalPages - 4, meta.page - 2),
                        ) + i;
                      if (pageNum > meta.totalPages) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => onPageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === meta.page
                              ? "z-10 border-primary/50 bg-primary/15 text-primary"
                              : "border-border/70 bg-background/70 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    },
                  )}

                  <button
                    onClick={() => onPageChange(meta.page + 1)}
                    disabled={!meta.hasNext}
                    className="relative inline-flex items-center rounded-r-md border border-border/70 bg-background/70 px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}

      {/* Modal de Edição */}
      {editUserId && (
        <EditUserModal
          userId={editUserId}
          onClose={() => setEditUserId(null)}
          onSuccess={() => {
            setEditUserId(null);
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
};

export default UsuariosTable;
