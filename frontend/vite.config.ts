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
  const assetVersion = (
    process.env.VITE_ASSET_VERSION || Date.now().toString(36)
  ).replace(/[^a-zA-Z0-9_-]/g, "");
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
      minify: "oxc",
      cssMinify: true,
      rollupOptions: {
        checks: {
          pluginTimings: false,
        },
        output: {
          // Separar código CSS em chunks menores
          assetFileNames: (assetInfo) => {
            const assetName = assetInfo.name ?? "";

            if (/\.css$/i.test(assetName)) {
              return `css/[name]-${assetVersion}-[hash][extname]`;
            }

            return "assets/[name]-[hash][extname]";
          },
          // Garantir nomes consistentes para chunks
          chunkFileNames: `js/[name]-${assetVersion}-[hash].js`,
          entryFileNames: `js/[name]-${assetVersion}-[hash].js`,
        },
        // Não incluir assets muito grandes no bundle inicial.
        external: (id: string) => /heavy-assets/.test(id),
      },
      // Otimizações de chunk
      chunkSizeWarningLimit: 500,
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
