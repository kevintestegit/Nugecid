import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => {
  const sourcemap = process.env.GENERATE_SOURCEMAP === "true";

  const chunkByPackage = (id: string): string | undefined => {
    if (!id.includes("node_modules")) return undefined;

    // Charts stack used by reports pages.
    if (id.includes("node_modules/recharts")) return "charts-recharts";
    if (id.includes("node_modules/d3-")) return "charts-d3";

    // React runtime and router are shared across the whole app.
    if (
      id.includes("node_modules/react/") ||
      id.includes("node_modules/react-dom/") ||
      id.includes("node_modules/react-router/") ||
      id.includes("node_modules/react-router-dom/") ||
      id.includes("node_modules/scheduler/")
    ) {
      return "vendor-react";
    }

    // Design-system and command UI foundations.
    if (
      id.includes("node_modules/@radix-ui/") ||
      id.includes("node_modules/cmdk/")
    ) {
      return "vendor-ui";
    }

    // Form and validation stack.
    if (
      id.includes("node_modules/react-hook-form/") ||
      id.includes("node_modules/@hookform/resolvers/") ||
      id.includes("node_modules/zod/")
    ) {
      return "vendor-forms";
    }

    // Drag-and-drop stack for kanban and related screens.
    if (id.includes("node_modules/@dnd-kit/")) return "vendor-dnd";

    // Data and transport foundations.
    if (id.includes("node_modules/@tanstack/")) return "vendor-query";
    if (id.includes("node_modules/axios/")) return "vendor-http";
    if (id.includes("node_modules/date-fns/")) return "vendor-date";

    // Domain-heavy libraries with lower change frequency.
    if (id.includes("node_modules/xlsx/")) return "vendor-xlsx";
    if (id.includes("node_modules/yet-another-react-lightbox/")) return "vendor-lightbox";

    // Remaining frequently reused UI helpers.
    if (
      id.includes("node_modules/lucide-react/") ||
      id.includes("node_modules/sonner/") ||
      id.includes("node_modules/react-day-picker/")
    ) {
      return "vendor-widgets";
    }

    return undefined;
  };

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: true,
      port: 3001,
      strictPort: true,
      proxy: {
        "/api": {
          target: "http://backend:3000",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
        },
        "/uploads": {
          target: "http://backend:3000",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
        },
      },
      watch: {
        usePolling: true,
      },
    },
    build: {
      outDir: "dist",
      sourcemap,
      rollupOptions: {
        output: {
          manualChunks(id) {
            return chunkByPackage(id);
          },
        },
      },
    },
  };
});
