/*
  배포 사이트(https://allway.vercel.app)의 DevTools 콘솔에 통째로 붙여넣어 실행합니다.

  로컬 dev 서버는 CORS 때문에 API를 호출할 수 없으므로,
  실제 배포 환경에서 XHR/fetch를 가로채 응답을 수집합니다.

  사용법
    1. https://allway.vercel.app/home 접속 후 로그인 상태 확인
    2. DevTools(F12) > Console 에 이 파일 전체를 붙여넣고 Enter
    3. 화면을 실제로 사용 (예약 생성, 화상 상담, 사진 첨부 등)
    4. __fixtureStatus()  로 수집 현황 확인
    5. __dumpFixtures()   로 JSON 다운로드
    6. 받은 파일을 docs/api-mocking/fixtures/ 에 넣기

  주의: 새로고침하면 수집한 내용이 사라집니다. 내려받기 전에 새로고침하지 마세요.
*/

(() => {
  const MASKED_KEYS = new Set([
    "accessToken", "refreshToken", "token", "rtcToken",
    "birthDate", "birthdate", "patientName", "name", "englishName", "displayName", "email",
    "medicalStaffName", "doctorName",
    "phoneNumber", "clinicPhoneNumber", "guardianPhoneNumber", "guardianName",
  ]);

  const mask = (value) => {
    if (Array.isArray(value)) return value.map(mask);
    if (value !== null && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          MASKED_KEYS.has(key) ? "__MASKED__" : mask(item),
        ])
      );
    }
    return value;
  };

  /* /api/appointments/12 -> /api/appointments/:id */
  const normalize = (url) => {
    try {
      const { pathname, search } = new URL(url, location.origin);
      return { path: pathname.replace(/\/\d+/g, "/:id"), search };
    } catch {
      return { path: url, search: "" };
    }
  };

  const calls = new Map();

  const record = (method, url, status, rawBody) => {
    const { path, search } = normalize(url);
    if (!path.includes("/api/")) return;

    let data;
    try {
      data = JSON.parse(rawBody);
    } catch {
      data = String(rawBody).slice(0, 200);
    }

    const key = `${method.toUpperCase()} ${path}`;
    calls.set(key, {
      method: method.toUpperCase(),
      path,
      params: search ? Object.fromEntries(new URLSearchParams(search)) : null,
      status,
      data: mask(data),
      recordedAt: new Date().toISOString(),
    });

    console.info(`[recorder] ${key} → ${status} (수집 ${calls.size}건)`);
  };

  /* axios는 XHR을 사용한다 */
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__rec = { method, url };
    return originalOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener("load", () => {
      const info = this.__rec;
      if (!info) return;
      if (this.responseType && this.responseType !== "text" && this.responseType !== "json") return;
      record(info.method, info.url, this.status, this.responseText);
    });
    return originalSend.apply(this, args);
  };

  /* fetch도 함께 감싼다 */
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init);
    const url = typeof input === "string" ? input : input.url;
    const method = init?.method ?? (typeof input === "object" ? input.method : "GET") ?? "GET";

    response
      .clone()
      .text()
      .then((text) => record(method, url, response.status, text))
      .catch(() => {});

    return response;
  };

  window.__fixtureStatus = () => {
    console.table([...calls.values()].map(({ method, path, status }) => ({ method, path, status })));
    return calls.size;
  };

  window.__dumpFixtures = () => {
    if (calls.size === 0) return console.warn("[recorder] 수집된 응답이 없습니다.");

    const payload = {
      recordedAt: new Date().toISOString(),
      source: location.origin,
      count: calls.size,
      fixtures: Object.fromEntries(calls),
    };

    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `api-fixtures-${new Date().toISOString().slice(0, 10)}-browser.json`;
    anchor.click();
    URL.revokeObjectURL(url);

    console.info(`[recorder] ${calls.size}건 다운로드 완료`);
  };

  console.info(
    "%c[recorder] 활성화됨. 화면을 사용한 뒤 __dumpFixtures() 를 실행하세요.",
    "color:#684BDB;font-weight:bold"
  );
})();
