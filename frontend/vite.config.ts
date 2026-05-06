import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const normalizeBasePath = (value?: string): string => {
  if (!value || value === "/") {
    return "/";
  }

  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const devProxyTarget = env.VITE_DEV_PROXY_TARGET || "http://127.0.0.1:8081";

  return {
    base: normalizeBasePath(env.VITE_BASE_PATH),
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/phaser")) {
              return "phaser-vendor";
            }

            return undefined;
          }
        }
      }
    },
    test: {
      environment: "node",
      include: ["src/**/*.test.ts"]
    },
    server: {
      host: true,
      port: 5173,
      proxy: {
        "/api": {
          target: devProxyTarget,
          changeOrigin: true
        }
      }
    },
    preview: {
      host: true
    }
  };
});
