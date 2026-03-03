import React from "react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, UserPlus } from "lucide-react";
import { useCreateUser } from "@/hooks/useUsers";
import { CreateUserDto, UpdateUserDto } from "@/types";
import UsuarioForm from "./UsuarioForm";

interface CreateUserModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const createUserMutation = useCreateUser();

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = async (data: CreateUserDto | UpdateUserDto) => {
    try {
      await createUserMutation.mutateAsync(data as CreateUserDto);
      onSuccess?.();
    } catch (error) {
      // O erro será tratado pelo hook useCreateUser
      console.error("Erro ao criar usuário:", error);
    }
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !createUserMutation.isPending) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [createUserMutation.isPending, onClose]);

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
        <div className="relative bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4 pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Novo Usuário
                </h3>
                <p className="text-sm text-muted-foreground">
                  Preencha os dados para criar um novo usuário
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-muted-foreground p-1 rounded hover:bg-gray-100 transition-colors"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <UsuarioForm
              mode="create"
              onSubmit={handleSubmit}
              onCancel={onClose}
              isLoading={createUserMutation.isPending}
            />
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

export default CreateUserModal;
