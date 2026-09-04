import { setupWorker } from "msw/browser";

import { assertCapturedKeys, CAPTURED_AT, CAPTURED_KEYS } from "./fixtures";
import { handlers, USED_CAPTURED_KEYS } from "./handlers";

const worker = setupWorker(...handlers);

/*
  MSW 워커를 등록하기 전에 다른 서비스 워커를 걷어낸다.

  같은 스코프에는 서비스 워커가 하나만 남으므로, 예전 Workbox 워커가 살아 있으면
  MSW 가 요청을 가로채지 못하거나 캐시된 옛 번들이 그대로 뜬다.
  캐시까지 지우는 이유는 워커를 해제해도 Cache Storage 는 남기 때문이다.
*/
async function removeOtherServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  const stale = registrations.filter(
    (registration) =>
      !registration.active?.scriptURL.includes("mockServiceWorker"),
  );

  if (stale.length === 0) return;

  await Promise.all(stale.map((registration) => registration.unregister()));

  if ("caches" in globalThis) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  console.info(`[mocks] 남아 있던 서비스 워커 ${stale.length}건을 해제했습니다.`);
}

export async function startMockWorker() {
  /* 키가 어긋나면 해당 요청만 조용히 실서버로 새므로 먼저 확인한다 */
  assertCapturedKeys(USED_CAPTURED_KEYS);

  await removeOtherServiceWorkers();

  await worker.start({
    /*
      정적 파일이나 Agora SDK 요청은 조용히 통과시키되,
      /api 요청이 목을 만나지 못하면 반드시 알린다.
      목 모드에서 실서버로 새는 요청은 대부분 핸들러 누락이나 경로 불일치다.
    */
    onUnhandledRequest(request, print) {
      if (new URL(request.url).pathname.includes("/api/")) {
        console.warn(
          `[mocks] 처리되지 않은 API 요청입니다. 실서버로 나갑니다: ${request.method} ${request.url}`,
        );
        print.warning();
      }
    },
    quiet: true,
  });

  console.info(
    `%c[mocks] API 목 모드로 실행 중입니다. 캡처본 ${CAPTURED_KEYS.length}건 (${CAPTURED_AT.slice(0, 10)})`,
    "color:#684BDB;font-weight:bold",
  );
  console.info(
    "[mocks] 나머지 응답은 src/types 정의를 근거로 작성한 예시입니다. src/mocks/fixtures/authored.ts 참고",
  );
}
