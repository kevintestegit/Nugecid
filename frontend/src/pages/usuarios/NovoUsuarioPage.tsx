import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useCreateUser, useUserPermissions } from "@/hooks/useUsers";
import { CreateUserDto } from "@/types";
import UsuarioForm from "@/components/usuarios/UsuarioForm";

const NovoUsuarioPage: React.FC = () => {
  const navigate = useNavigate();
  const { canManageUsers } = useUserPermissions();
  const createUserMutation = useCreateUser();

  // Redirecionar se não tiver permissão
  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <UserPlus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Acesso Negado
          </h2>
          <p className="text-muted-foreground mb-4">
            Você não tem permissão para criar usuários.
          </p>
          <Link
            to="/usuarios"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Usuários
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (data: CreateUserDto) => {
    try {
      await createUserMutation.mutateAsync(data);
      navigate("/usuarios");
    } catch (error) {
      // Erro já tratado no hook
      console.error("Erro ao criar usuário:", error);
    }
  };

  const handleCancel = () => {
    navigate("/usuarios");
  };

  return (
    <div className="space-y-6">
      {/* Header glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_28px_60px_-46px_rgba(15,23,42,0.75)] backdrop-blur md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-orange-400/10 blur-3xl" />

        <div className="relative flex items-center gap-4">
          <Link
            to="/usuarios"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <UserPlus className="h-8 w-8" />
              Novo Usuário
            </h1>
            <p className="text-muted-foreground mt-1">
              Preencha os dados para criar um novo usuário
            </p>
          </div>
        </div>

        {/* Breadcrumb */}
        <nav className="relative mt-4 flex text-sm text-muted-foreground">
          <Link to="/usuarios" className="hover:text-foreground">
            Usuários
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Novo Usuário</span>
        </nav>
      </div>

      {/* Formulário */}
      <div className="rounded-2xl border border-border/60 bg-card/85 p-6 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
        <UsuarioForm
          onSubmit={(data) => handleSubmit(data as CreateUserDto)}
          onCancel={handleCancel}
          isLoading={createUserMutation.isPending}
          mode="create"
        />
      </div>
    </div>
  );
};

export default NovoUsuarioPage;
