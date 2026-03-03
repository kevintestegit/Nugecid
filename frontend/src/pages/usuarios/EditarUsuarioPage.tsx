import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Loader2 } from "lucide-react";
import { useUser, useUpdateUser, useUserPermissions } from "@/hooks/useUsers";
import { UpdateUserDto, UserRole } from "@/types";
import UsuarioForm from "@/components/usuarios/UsuarioForm";
import { isValidUserIdFormat, parseNumericId } from "@/utils/validation";

const EditarUsuarioPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canManageUsers } = useUserPermissions();

  // Validação do ID antes de fazer a conversão
  const userId = parseNumericId(id);
  const {
    data: userResponse,
    isLoading: isLoadingUser,
    error,
  } = useUser(userId ?? 0);
  const updateUserMutation = useUpdateUser();

  // Se o ID não for válido, mostrar erro
  if (id && !isValidUserIdFormat(id)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Edit className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Erro: ID de Usuário Inválido
          </h2>
          <p className="text-muted-foreground mb-4">
            O ID fornecido &ldquo;{id}&rdquo; não é válido para um usuário. IDs
            de usuários devem ser números inteiros.
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

  // Redirecionar se não tiver permissão
  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Edit className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Acesso Negado
          </h2>
          <p className="text-muted-foreground mb-4">
            Você não tem permissão para editar usuários.
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

  // Loading state
  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            Carregando dados do usuário...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !userResponse?.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-destructive mb-4">
            <Edit className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Usuário não encontrado
          </h2>
          <p className="text-muted-foreground mb-4">
            O usuário solicitado não foi encontrado ou você não tem permissão
            para acessá-lo.
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

  const user = userResponse.data;
  const roleName = user.role?.name?.toLowerCase();
  const normalizedRole: UserRole =
    roleName === UserRole.ADMIN
      ? UserRole.ADMIN
      : roleName === UserRole.COORDENADOR
        ? UserRole.COORDENADOR
        : roleName === UserRole.NUGECID_OPERATOR
          ? UserRole.NUGECID_OPERATOR
          : UserRole.USUARIO;

  const handleSubmit = async (data: UpdateUserDto) => {
    if (!userId) return;
    try {
      await updateUserMutation.mutateAsync({ id: userId, data });
      navigate("/usuarios");
    } catch (error) {
      // Erro já tratado no hook
      console.error("Erro ao atualizar usuário:", error);
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
              <Edit className="h-8 w-8" />
              Editar Usuário
            </h1>
            <p className="text-muted-foreground mt-1">
              Edite os dados do usuário {user.nome}
            </p>
          </div>
        </div>

        {/* Breadcrumb */}
        <nav className="relative mt-4 flex text-sm text-muted-foreground">
          <Link to="/usuarios" className="hover:text-foreground">
            Usuários
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Editar {user.nome}</span>
        </nav>
      </div>

      {/* Formulário */}
      <div className="rounded-2xl border border-border/60 bg-card/85 p-6 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)] backdrop-blur">
        <UsuarioForm
          initialData={{
            nome: user.nome,
            role: normalizedRole,
            ativo: user.ativo,
          }}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={updateUserMutation.isPending}
          mode="edit"
        />
      </div>
    </div>
  );
};

export default EditarUsuarioPage;
