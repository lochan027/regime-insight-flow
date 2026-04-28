import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget =
    (env.VITE_API_PROXY_TARGET || env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  const useApiProxy = mode === "development" && Boolean(proxyTarget) && !proxyTarget.startsWith("/");

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
      proxy: useApiProxy
        ? {
            "/api": {
              target: proxyTarget,
              changeOrigin: true,
              secure: true,
              rewrite: (p) => p.replace(/^\/api/, ""),
            },
          }
        : undefined,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
    },
  };
});
