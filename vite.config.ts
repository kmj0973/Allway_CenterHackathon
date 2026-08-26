import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",

      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },

      includeAssets: ["favicon.ico", "apple-touch-icon.png"],

      manifest: {
        name: "allway",
        short_name: "allway",
        description: "글로벌 환자를 위한 사후관리 서비스",

        start_url: "/",
        scope: "/",

        display: "standalone",

        background_color: "#E1E9FF",
        theme_color: "#684BDB",

        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "206x206",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
