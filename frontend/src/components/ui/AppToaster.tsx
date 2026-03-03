import { Toaster } from "sonner";

import { useTheme } from "@/contexts/ThemeContext";

export function AppToaster() {
  const { isDark } = useTheme();

  return (
    <Toaster
      position="top-right"
      richColors
      theme={isDark ? "dark" : "light"}
      toastOptions={{
        classNames: {
          toast: "toast-custom",
          title: "toast-title",
          description: "toast-description",
          icon: "toast-icon",
        },
      }}
    />
  );
}
