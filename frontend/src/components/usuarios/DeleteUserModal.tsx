import React from "react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X, Trash2, Loader2 } from "lucide-react";
import { useDeleteUser, useUser } from "@/hooks/useUsers";

interface DeleteUserModalProps {
  userId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  userId,
  onClose,
  onSuccess,
}) => {
  const { data: userResponse, isLoading: isLoadingUser } = useUser(userId);
  const deleteUserMutation = useDeleteUser();

  const user = userResponse?.data;

  const handleConfirmDelete = async () => {
    try {
      await deleteUserMutation.mutateAsync(userId);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Erro ao desativar usuário:", error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !deleteUserMutation.isPending) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [deleteUserMutation.isPending, onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const modalContent = (
    <>
      <div
        className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />
      <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none">
        <div className="relative bg-background rounded-lg shadow-xl max-w-md w-full mx-4 pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Confirmar Desativação
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-muted-foreground transition-colors"
              disabled={deleteUserMutation.isPending}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoadingUser ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="ml-2 text-muted-foreground">
                  Carregando dados do usuário...
                </span>
              </div>
            ) : user ? (
              <div className="space-y-4">
                <p className="text-foreground/90">
                  Tem certeza de que deseja desativar o usuário?
                </p>

                <div className="bg-gray-50 rounded-lg p-4 border border-border">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Nome:
                      </span>
                      <span className="text-sm text-foreground">{user.nome}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Login:
                      </span>
                      <span className="text-sm text-foreground">
                        {user.usuario}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Papel:
                      </span>
                      <span className="text-sm text-foreground">
                        {user.role?.name === "admin"
                          ? "Administrador"
                          : user.role?.name === "coordenador"
                            ? "Coordenador"
                            : "Usuário"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">Atenção:</p>
                      <ul className="space-y-1 text-xs">
                        <li>
                          • O usuário será desativado e não poderá mais acessar
                          o sistema
                        </li>
                        <li>• Esta ação pode ser revertida posteriormente</li>
                        <li>• Os dados do usuário serão mantidos no sistema</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-red-600">
                  Erro ao carregar dados do usuário.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
            <button
              onClick={onClose}
              disabled={deleteUserMutation.isPending}
              className="px-4 py-2 border border-border rounded-md text-foreground/90 bg-background hover:bg-muted focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleteUserMutation.isPending || isLoadingUser || !user}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Desativando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Desativar Usuário
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

export default DeleteUserModal;
