import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "@/i18n";
import "@/styles/index.css";

import App from "@/App";

const queryClient = new QueryClient();

function render() {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.StrictMode>,
  );
}

/*
  VITE_USE_MOCK_API=true 이면 API 목 워커를 먼저 띄운 뒤 렌더한다.
  워커가 준비되기 전에 첫 요청이 나가면 목이 적용되지 않으므로 순서가 중요하다.

  동적 import라 프로덕션 번들에는 포함되지 않는다.
*/
if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API === "true") {
  void import("@/mocks/browser")
    .then(({ startMockWorker }) => startMockWorker())
    .catch((error) => console.error("[mocks] 워커 시작 실패", error))
    .finally(render);
} else {
  render();
}
