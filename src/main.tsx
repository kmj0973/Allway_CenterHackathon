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

  로컬 개발뿐 아니라 데모 배포(allway-demo.vercel.app)에서도 켠다.
  백엔드 없이 전체 플로우를 보여주기 위한 빌드다.

  플래그가 꺼진 빌드에서는 이 조건이 상수 false로 접혀
  아래 동적 import 가 통째로 제거된다. 즉 목 코드와 픽스처는
  프로덕션 번들에 들어가지 않는다.
*/
if (import.meta.env.VITE_USE_MOCK_API === "true") {
  void import("@/mocks/browser")
    .then(({ startMockWorker }) => startMockWorker())
    .catch((error) => console.error("[mocks] 워커 시작 실패", error))
    .finally(render);
} else {
  render();
}
