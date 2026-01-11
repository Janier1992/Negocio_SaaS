import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

  // CSP para desarrollo: permitir HMR (ws:) y evaluación para React SWC.
  const devCsp =
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.supabase.co; connect-src 'self' https://*.supabase.co https://openrouter.ai ws:; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

  // CSP para producción: sin 'unsafe-eval' y con upgrade-insecure-requests.
  const prodCsp =
    "default-src 'self'; script-src 'self' https://*.supabase.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.supabase.co; connect-src 'self' https://*.supabase.co https://openrouter.ai; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests";

  // Plugin para inyectar la meta CSP en index.html
  const cspPlugin = {
    name: "inject-csp-meta",
    transformIndexHtml() {
      const content = isDev ? devCsp : prodCsp;
      return [
        {
          tag: "meta",
          attrs: {
            "http-equiv": "Content-Security-Policy",
            content,
          },
          injectTo: "head",
        },
      ];
    },
  };

  return {
    // Para despliegue en GitHub Pages (repositorio ERP_Negocios)
    // En producción, asegura rutas correctas: janier1992.github.io/ERP_Negocios/
    base: isDev ? "/" : "/ERP_Negocios/",

    server: {
      host: "::",
      port: 8080,
      strictPort: false,
      proxy: {
        '/api/gemini': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/gemini/, ''),
        },
      },
    },

    plugins: [
      react(),
      cspPlugin,
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        devOptions: {
          enabled: true
        },
        manifest: {
          name: 'Mi Negocio ERP',
          short_name: 'Mi Negocio',
          description: 'Sistema de Gestión Empresarial completo para ferreterías',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    build: {
      cssCodeSplit: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
            if (id.includes("node_modules")) {
              if (id.includes("@supabase/supabase-js")) return "supabase";
              if (id.includes("react") || id.includes("react-dom")) return "react";
              if (id.includes("@tanstack/react-query")) return "query";
              if (id.includes("@radix-ui")) return "radix";
              if (id.includes("lucide-react")) return "icons";
            }
            return undefined;
          },
        },
      },
    },
  };
});