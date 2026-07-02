import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { AxiosError } from "axios";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { ButtonLoading } from "@/components/ui/Loading";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import loginHero from "@/assets/images/login-hero.webp";

const loginSchema = z.object({
  usuario: z.string().min(1, "Usuário é obrigatório"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname || "/";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data);
      toast.success("Login realizado com sucesso!");
      navigate(from, { replace: true });
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      const message =
        error.response?.data?.message || "Usuário ou senha inválidos.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(120%_80%_at_8%_10%,rgba(56,189,248,0.18),transparent_55%),radial-gradient(120%_80%_at_92%_90%,rgba(249,115,22,0.12),transparent_55%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background)))] dark:bg-[radial-gradient(120%_80%_at_8%_10%,rgba(56,189,248,0.07),transparent_55%),radial-gradient(120%_80%_at_92%_90%,rgba(249,115,22,0.05),transparent_55%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background)))] text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[56%_44%]">
        {/* Painel esquerdo — imagem institucional */}
        <div className="relative hidden overflow-hidden lg:block">
          <img
            src={loginHero}
            alt="Painel institucional"
            className="h-full w-full object-cover object-[center_25%]"
          />
          {/* Overlay gradiente principal */}
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.82)_0%,rgba(15,23,42,0.42)_50%,rgba(56,189,248,0.18)_100%)]" />
          {/* Glow cyan decorativo */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_16%,rgba(56,189,248,0.32),transparent_50%)]" />
          {/* Glow orange sutil no canto inferior */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_90%,rgba(249,115,22,0.14),transparent_45%)]" />

          {/* Card informativo glassmorphism */}
          <div className="absolute bottom-10 left-8 right-8 rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
            <p className="text-lg font-semibold leading-tight text-white">
              Sistema de Gerenciamento Eletrônico de Documentos - GED
            </p>
            <p className="mt-2 text-sm text-white/60">
              Polícia Científica do Rio Grande do Norte - Setor de Gestão da
              Informação
            </p>
          </div>
        </div>

        {/* Painel direito — formulário */}
        <div className="relative flex min-h-screen flex-col">
          {/* Decorative blur circles (padrão cyan/orange) */}
          <div className="pointer-events-none absolute -left-24 top-16 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-400/10" />
          <div className="pointer-events-none absolute -right-24 bottom-16 h-56 w-56 rounded-full bg-orange-400/20 blur-3xl dark:bg-orange-400/10" />

          <div className="flex flex-1 items-center justify-center p-6 sm:p-8">
            {/* Card glassmorphism do formulário */}
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/60 bg-card/85 p-7 shadow-[0_28px_60px_-46px_rgba(15,23,42,0.75)] backdrop-blur sm:p-9">
              {/* Top gradient accent */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

              <div className="relative z-10">
                {/* Header */}
                <div className="mb-8 space-y-2 text-center">
                  <h1 className="bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
                    NUGECID
                  </h1>
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    Acesse sua conta
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Entre com suas credenciais para continuar
                  </p>
                </div>

                {/* Formulário */}
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-5"
                  noValidate
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="usuario"
                      className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                    >
                      Usuário
                    </Label>
                    <Input
                      id="usuario"
                      type="text"
                      placeholder="Seu usuário"
                      autoComplete="username"
                      disabled={isLoading}
                      aria-invalid={!!errors.usuario}
                      className="h-11 border-border/70 bg-background/60 backdrop-blur-sm focus-visible:ring-primary/40"
                      {...register("usuario")}
                    />
                    {errors.usuario && (
                      <p className="text-sm text-destructive">
                        {errors.usuario.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="senha"
                      className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                    >
                      Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="senha"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        disabled={isLoading}
                        aria-invalid={!!errors.senha}
                        className="h-11 border-border/70 bg-background/60 pr-10 backdrop-blur-sm focus-visible:ring-primary/40"
                        {...register("senha")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={
                          showPassword ? "Ocultar senha" : "Mostrar senha"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.senha && (
                      <p className="text-sm text-destructive">
                        {errors.senha.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="h-11 w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 font-semibold text-white shadow-[0_18px_32px_-20px_rgba(6,182,212,0.7)] transition-all hover:brightness-110 dark:shadow-[0_18px_32px_-20px_rgba(6,182,212,0.4)]"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <ButtonLoading className="mr-2 h-4 w-4" />
                        Entrando...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Entrar
                      </>
                    )}
                  </Button>
                </form>

                {/* Rodapé do card */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-muted-foreground">
                    Em caso de acesso bloqueado, To nem ai
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
