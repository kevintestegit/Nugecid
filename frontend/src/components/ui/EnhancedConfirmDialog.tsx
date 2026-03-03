import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/utils/cn";
import {
  useFocusTrap,
  useKeyboardNavigation,
} from "@/hooks/useKeyboardNavigation";

type ConfirmationType = "none" | "text" | "checkbox" | "countdown";

interface EnhancedConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;

  // Enhanced features
  confirmationType?: ConfirmationType;
  confirmationKeyword?: string; // Para confirmationType='text'
  checkboxLabel?: string; // Para confirmationType='checkbox'
  countdownSeconds?: number; // Para confirmationType='countdown'
  warningList?: string[]; // Lista de avisos/consequências
  showIcon?: boolean;
}

export const EnhancedConfirmDialog: React.FC<EnhancedConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar ação",
  description = "Tem certeza que deseja continuar?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  isLoading = false,
  confirmationType = "none",
  confirmationKeyword = "CONFIRMAR",
  checkboxLabel = "Eu entendo as consequências desta ação",
  countdownSeconds = 5,
  warningList = [],
  showIcon = true,
}) => {
  const [confirmInput, setConfirmInput] = useState("");
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [countdown, setCountdown] = useState(countdownSeconds);
  const [canConfirm, setCanConfirm] = useState(false);

  // Refs e hooks de acessibilidade
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap para manter foco dentro do modal
  useFocusTrap(dialogRef, isOpen);

  // Navegação por teclado
  useKeyboardNavigation(dialogRef, {
    onEscape: onClose,
    enabled: isOpen,
  });

  // Reset states when dialog opens
  useEffect(() => {
    if (isOpen) {
      setConfirmInput("");
      setCheckboxChecked(false);
      setCountdown(countdownSeconds);
      setCanConfirm(confirmationType === "none");
    }
  }, [isOpen, confirmationType, countdownSeconds]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || confirmationType !== "countdown") return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanConfirm(true);
    }
  }, [isOpen, countdown, confirmationType]);

  // Check text confirmation
  useEffect(() => {
    if (confirmationType === "text") {
      setCanConfirm(confirmInput === confirmationKeyword);
    }
  }, [confirmInput, confirmationKeyword, confirmationType]);

  // Check checkbox confirmation
  useEffect(() => {
    if (confirmationType === "checkbox") {
      setCanConfirm(checkboxChecked);
    }
  }, [checkboxChecked, confirmationType]);

  const { theme } = useTheme();
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: AlertCircle,
          iconColor: "text-red-600",
          bgColor: "bg-red-50 dark:bg-red-950/30",
          borderColor: "border-red-200 dark:border-red-800",
          confirmButton: "bg-red-600 hover:bg-red-700 text-white",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          iconColor: "text-yellow-600",
          bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
          borderColor: "border-yellow-200 dark:border-yellow-800",
          confirmButton: "bg-yellow-600 hover:bg-yellow-700 text-white",
        };
      case "info":
        return {
          icon: Info,
          iconColor: "text-blue-600",
          bgColor: "bg-blue-50 dark:bg-blue-950/30",
          borderColor: "border-blue-200 dark:border-blue-800",
          confirmButton: "bg-blue-600 hover:bg-blue-700 text-white",
        };
      default:
        return {
          icon: AlertCircle,
          iconColor: "text-red-600",
          bgColor: "bg-red-50 dark:bg-red-950/30",
          borderColor: "border-red-200 dark:border-red-800",
          confirmButton: "bg-red-600 hover:bg-red-700 text-white",
        };
    }
  };

  const styles = getVariantStyles();
  const Icon = styles.icon;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (!isLoading && canConfirm) {
      await onConfirm();
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  // Keyboard handlers já gerenciados por useKeyboardNavigation

  // Prevent body scroll
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
      <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none p-4">
        <Card
          ref={dialogRef}
          className="relative w-full max-w-md pointer-events-auto"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-description"
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle id="dialog-title" className="flex items-center gap-3">
                {showIcon && (
                  <Icon className={cn("h-6 w-6", styles.iconColor)} />
                )}
                {title}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isLoading}
                className="h-8 w-8 p-0 hover:bg-accent"
                aria-label="Fechar diálogo"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p
              id="dialog-description"
              className="text-muted-foreground leading-relaxed"
            >
              {description}
            </p>

            {/* Warning List */}
            {warningList.length > 0 && (
              <div
                className={cn(
                  "rounded-lg border p-4",
                  styles.bgColor,
                  styles.borderColor,
                )}
              >
                <p className="text-sm font-semibold mb-2 text-foreground">
                  Esta ação irá:
                </p>
                <ul className="space-y-1">
                  {warningList.map((warning, index) => (
                    <li
                      key={index}
                      className="text-sm text-muted-foreground flex gap-2"
                    >
                      <span className={styles.iconColor}>•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Text Confirmation */}
            {confirmationType === "text" && (
              <div className="space-y-2">
                <label
                  htmlFor="confirm-input"
                  className="block text-sm font-medium text-foreground"
                >
                  Para confirmar, digite{" "}
                  <span className={cn("font-bold", styles.iconColor)}>
                    {confirmationKeyword}
                  </span>{" "}
                  no campo abaixo:
                </label>
                <input
                  id="confirm-input"
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder={`Digite ${confirmationKeyword}`}
                  className={cn(
                    "w-full px-3 py-2 border rounded-md bg-background text-foreground",
                    "focus:ring-2 focus:border-transparent",
                    variant === "danger" && "focus:ring-red-500",
                    variant === "warning" && "focus:ring-yellow-500",
                    variant === "info" && "focus:ring-blue-500",
                  )}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            )}

            {/* Checkbox Confirmation */}
            {confirmationType === "checkbox" && (
              <div className="flex items-start gap-3">
                <input
                  id="confirm-checkbox"
                  type="checkbox"
                  checked={checkboxChecked}
                  onChange={(e) => setCheckboxChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border"
                  disabled={isLoading}
                />
                <label
                  htmlFor="confirm-checkbox"
                  className="text-sm text-foreground cursor-pointer"
                >
                  {checkboxLabel}
                </label>
              </div>
            )}

            {/* Countdown */}
            {confirmationType === "countdown" && countdown > 0 && (
              <div
                className={cn(
                  "rounded-lg border p-4 text-center",
                  styles.bgColor,
                  styles.borderColor,
                )}
              >
                <p className="text-sm text-muted-foreground mb-2">
                  Aguarde antes de confirmar
                </p>
                <p className={cn("text-3xl font-bold", styles.iconColor)}>
                  {countdown}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {cancelText}
              </Button>

              <Button
                onClick={handleConfirm}
                disabled={isLoading || !canConfirm}
                className={cn("w-full sm:w-auto", styles.confirmButton)}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processando...
                  </div>
                ) : confirmationType === "countdown" && countdown > 0 ? (
                  `Aguarde ${countdown}s`
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
    <div className={theme === "dark" ? "dark" : ""}>
      modalContent
    </div>,
    document.body
  );
};

export default EnhancedConfirmDialog;
