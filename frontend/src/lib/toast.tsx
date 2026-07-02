import { toast as sonnerToast } from "sonner";
import { AlertTriangle } from "lucide-react";
import React from "react";

export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, {
      description,
      duration: 3000,
    });
  },

  error: (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
      duration: 4000,
    });
  },

  info: (message: string, description?: string) => {
    sonnerToast.info(message, {
      description,
      duration: 3000,
    });
  },

  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, {
      description,
      duration: 5000,
      icon: <AlertTriangle className="w-5 h-5" />,
    });
  },

  confirm: (
    message: string,
    description: string,
    onConfirm: () => void | Promise<void>,
  ) => {
    const id = sonnerToast.warning(message, {
      description,
      duration: 10000,
      icon: <AlertTriangle className="w-5 h-5" />,
      action: {
        label: "Confirmar",
        onClick: () => {
          sonnerToast.dismiss(id);
          void onConfirm();
        },
      },
      cancel: {
        label: "Cancelar",
        onClick: () => sonnerToast.dismiss(id),
      },
    });
  },

  loading: (message: string) => {
    return sonnerToast.loading(message);
  },

  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    },
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    });
  },
};
