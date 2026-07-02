import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AlertTriangle, X, Eye, EyeOff } from "lucide-react";
import { cn } from "@/utils/cn";
import { apiService } from "@/services/api";
import { LoginDto } from "@/types";

interface AdminConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

const AdminConfirmDialog: React.FC<AdminConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar exclusão",
  description = "Você tem certeza que deseja excluir este registro?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  isLoading: externalLoading = false,
}) => {
  const [credentials, setCredentials] = useState<LoginDto>({
    usuario: "",
    senha: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    if (!isValidating && !externalLoading) {
      setCredentials({ usuario: "", senha: "" });
      setError(null);
      setShowPassword(false);
      onClose();
    }
  }, [isValidating, externalLoading, onClose]);

  const { theme } = useTheme();
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: "text-red-600",
          confirmButton: "bg-red-600 hover:bg-red-700 text-white",
        };
      case "warning":
        return {
          icon: "text-yellow-600",
          confirmButton: "bg-yellow-600 hover:bg-yellow-700 text-white",
        };
      case "info":
        return {
          icon: "text-blue-600",
          confirmButton: "bg-blue-600 hover:bg-blue-700 text-white",
        };
      default:
        return {
          icon: "text-red-600",
          confirmButton: "bg-red-600 hover:bg-red-700 text-white",
        };
    }
  };

  const styles = getVariantStyles();

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleInputChange = (field: keyof LoginDto, value: string) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const validateCredentials = async (): Promise<boolean> => {
    try {
      setIsValidating(true);
      setError(null);

      // Validar se os campos estão preenchidos
      if (!credentials.usuario.trim() || !credentials.senha.trim()) {
        setError("Por favor, preencha todos os campos");
        return false;
      }

      // Tentar fazer login para validar as credenciais
      const response = await apiService.login(credentials);

      if (response.success && response.data) {
        // Verificar se o usuário tem perfil de administrador
        const user = response.data.user;
        if (user.role.name.toUpperCase() !== "ADMIN") {
          setError(
            "Apenas usuários com perfil de administrador podem realizar esta ação",
          );
          return false;
        }

        return true;
      } else {
        setError("Credenciais inválidas");
        return false;
      }
    } catch (error: unknown) {
      console.error("Erro na validação de credenciais:", error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          setError("Usuário ou senha incorretos");
        } else if (error.response?.status === 403) {
          setError(
            "Acesso negado. Apenas administradores podem realizar esta ação",
          );
        } else {
          setError("Erro ao validar credenciais. Tente novamente");
        }
      } else {
        setError("Erro ao validar credenciais. Tente novamente");
      }

      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirm = async () => {
    const isValid = await validateCredentials();

    if (isValid) {
      onConfirm();
      handleClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isValidating && !externalLoading) {
      handleConfirm();
    }
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (!isOpen) return;
      if (event.key === "Escape") {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [handleClose, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <>
      <div
        className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />
      <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none">
        <Card className="relative w-full max-w-md mx-4 pointer-events-auto">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <AlertTriangle className={cn("h-6 w-6", styles.icon)} />
                {title}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                disabled={isValidating || externalLoading}
                className="h-8 w-8 p-0 hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              {description}
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Usuário Administrador
                </label>
                <Input
                  type="text"
                  placeholder="Digite seu usuário"
                  value={credentials.usuario}
                  onChange={(e) => handleInputChange("usuario", e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isValidating || externalLoading}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Senha
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={credentials.senha}
                    onChange={(e) => handleInputChange("senha", e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isValidating || externalLoading}
                    className="w-full pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isValidating || externalLoading}
                    className="absolute right-0 top-0 h-9 w-9 p-0 hover:bg-transparent"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isValidating || externalLoading}
                className="w-full sm:w-auto"
              >
                {cancelText}
              </Button>

              <Button
                onClick={handleConfirm}
                disabled={
                  isValidating ||
                  externalLoading ||
                  !credentials.usuario.trim() ||
                  !credentials.senha.trim()
                }
                className={cn("w-full sm:w-auto", styles.confirmButton)}
              >
                {isValidating || externalLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Validando...
                  </div>
                ) : (
                  confirmText
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  return createPortal(
    <div className={theme === "dark" ? "dark" : ""}>{modalContent}</div>,
    document.body,
  );
};

export { AdminConfirmDialog };
export type { AdminConfirmDialogProps };
