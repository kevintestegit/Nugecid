import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => {
  const sourcemap = process.env.GENERATE_SOURCEMAP === "true";
  const frontendPort = Number.parseInt(process.env.VITE_PORT || "3001", 10);
  const apiProxyTarget =
    process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:3000";
  const sentryRelease =
    process.env.VITE_SENTRY_RELEASE || process.env.SENTRY_RELEASE;
  const sentryPluginEnabled = Boolean(
    process.env.SENTRY_AUTH_TOKEN &&
      process.env.SENTRY_ORG &&
      process.env.SENTRY_PROJECT &&
      sentryRelease,
  );
  const sentryPlugins = sentryPluginEnabled
    ? sentryVitePlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        release: {
          name: sentryRelease,
        },
        sourcemaps: {
          assets: "./dist/**",
        },
      })
    : [];
  const plugins = [react(), ...sentryPlugins];
  const chunkGroups = {
    vendor: ["react", "react-dom", "react-router-dom"],
    ui: [
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-toast",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
    ],
    forms: ["react-hook-form", "@hookform/resolvers", "zod"],
    charts: ["recharts"],
    dnd: ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"],
    date: ["date-fns"],
    utils: ["axios", "lucide-react"],
  } satisfies Record<string, string[]>;
  const manualChunkEntries = Object.entries(chunkGroups);
  const manualChunks = (moduleId: string) => {
    const matchedGroup = manualChunkEntries.find(([, dependencies]) =>
      dependencies.some(
        (dependency) =>
          moduleId.includes(`/node_modules/${dependency}/`) ||
          moduleId.includes(`\\node_modules\\${dependency}\\`),
      ),
    );

    return matchedGroup?.[0];
  };

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: true,
      port: Number.isFinite(frontendPort) ? frontendPort : 3001,
      strictPort: false,
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: false,
          secure: false,
          rewrite: (path) => path,
        },
        "/uploads": {
          target: apiProxyTarget,
          changeOrigin: false,
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
      sourcemap: sourcemap || sentryPluginEnabled,
      target: "esnext",
      minify: "terser",
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks,
          // Separar código CSS em chunks menores
          assetFileNames: (assetInfo) => {
            const assetName = assetInfo.name ?? "";

            if (/\.css$/i.test(assetName)) {
              return "css/[name]-[hash][extname]";
            }

            return "assets/[name]-[hash][extname]";
          },
          // Garantir nomes consistentes para chunks
          chunkFileNames: "js/[name]-[hash].js",
          entryFileNames: "js/[name]-[hash].js",
        },
        // Não incluir assets muito grandes no bundle inicial.
        external: (id: string) => /heavy-assets/.test(id),
      },
      // Otimizações de chunk
      chunkSizeWarningLimit: 500,
      // Terser options para melhor minificação
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ["console.log", "console.info", "console.debug"],
        },
        mangle: {
          safari10: true,
        },
      },
    },
    // Otimizações de CSS
    css: {
      devSourcemap: true,
    },
    // Otimizações de dependências
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "axios",
        "@tanstack/react-query",
      ],
      exclude: ["recharts"], // Carregar sob demanda
    },
  };
});
