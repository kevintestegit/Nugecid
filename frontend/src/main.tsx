import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppToaster } from "./components/ui/AppToaster";
import { initMonitoring } from "./lib/monitoring";
import { RouteMetadata } from "./components/seo/RouteMetadata";
import "./index.css";

const globalHandlers = globalThis as typeof globalThis & {
  __sgcGlobalErrorHandler?: (event: ErrorEvent) => void;
  __sgcUnhandledRejectionHandler?: (event: PromiseRejectionEvent) => void;
};

// Configuração do React Query
initMonitoring();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
      staleTime: 60 * 1000,
    },
  },
});

// Tratamento de erros globais
if (!globalHandlers.__sgcGlobalErrorHandler) {
  globalHandlers.__sgcGlobalErrorHandler = (event) => {
    console.error("Erro global capturado:", event.error);
  };
  window.addEventListener("error", globalHandlers.__sgcGlobalErrorHandler);
}

if (!globalHandlers.__sgcUnhandledRejectionHandler) {
  globalHandlers.__sgcUnhandledRejectionHandler = (event) => {
    console.error("Promise rejeitada não tratada:", event.reason);
  };
  window.addEventListener(
    "unhandledrejection",
    globalHandlers.__sgcUnhandledRejectionHandler,
  );
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (globalHandlers.__sgcGlobalErrorHandler) {
      window.removeEventListener(
        "error",
        globalHandlers.__sgcGlobalErrorHandler,
      );
      delete globalHandlers.__sgcGlobalErrorHandler;
    }
    if (globalHandlers.__sgcUnhandledRejectionHandler) {
      window.removeEventListener(
        "unhandledrejection",
        globalHandlers.__sgcUnhandledRejectionHandler,
      );
      delete globalHandlers.__sgcUnhandledRejectionHandler;
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <RouteMetadata />
              <App />
              <AppToaster />
            </BrowserRouter>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
