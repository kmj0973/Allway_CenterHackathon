import { setupWorker } from "msw/browser";

import { assertCapturedKeys, CAPTURED_AT, CAPTURED_KEYS } from "./fixtures";
import { handlers, USED_CAPTURED_KEYS } from "./handlers";

export const worker = setupWorker(...handlers);

export async function startMockWorker() {
  /* 키가 어긋나면 해당 요청만 조용히 실서버로 새므로 먼저 확인한다 */
  assertCapturedKeys(USED_CAPTURED_KEYS);

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
