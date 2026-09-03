import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  /*
    데모 배포(allway-demo.vercel.app)는 백엔드 없이 MSW 로 동작한다.

    이때 PWA 는 끈다. MSW 워커(mockServiceWorker.js)와 Workbox 워커(sw.js)가
    모두 스코프 "/" 에 등록되는데, 같은 스코프에는 서비스 워커가 하나만 남는다.
    나중에 등록된 쪽이 앞의 것을 덮어써서 목이 먹거나 캐시가 먹거나 둘 중
    하나가 매 로드마다 뒤집힌다. 데모 빌드에서는 목이 우선이다.
  */
  const useMockApi = env.VITE_USE_MOCK_API === "true";

  return {
  /*
    API 서버가 배포 도메인만 CORS 허용하므로 로컬에서는 직접 호출할 수 없다.
    dev 서버가 대신 호출하도록 프록시를 둔다. (브라우저가 아니므로 CORS 미적용)

    사용하려면 .env.local 에서 VITE_API_BASE_URL 을 비워 둔다.
    그러면 요청이 같은 오리진의 /api/... 로 나가고 아래 프록시가 받는다.
  */
  server: {
    proxy: env.VITE_API_PROXY_TARGET
      ? {
          "/api": {
            target: env.VITE_API_PROXY_TARGET,
            changeOrigin: true,
            secure: false,
          },
        }
      : undefined,
  },

  plugins: [
    react(),
    tailwindcss(),
    ...(useMockApi ? [] : [VitePWA({
      registerType: "prompt",

      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,

        /*
          화상 상담 청크는 Agora SDK 때문에 1.5MB가 넘는데,
          상담을 하지 않는 사용자에게는 필요 없다.
          프리캐시에서 빼서 첫 방문 전송량을 줄이고,
          대기실 화면에서 미리 내려받아 입장 지연을 막는다.
          (src/pages/consultation-waiting/index.tsx 참고)

          개발용 MSW 워커도 프로덕션 프리캐시에 들어갈 이유가 없다.
        */
        globIgnores: ["**/consultation-room-*.js", "**/mockServiceWorker.js"],
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
    })]),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
