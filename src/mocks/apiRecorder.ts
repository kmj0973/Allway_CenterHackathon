import type { AxiosInstance, AxiosResponse } from "axios";

/*
  개발 환경에서 실제 API 응답을 수집하는 레코더.

  백엔드가 내려간 뒤에도 실제 응답 형태 그대로 목(mock) 데이터를 만들 수 있도록,
  살아 있는 동안 응답을 모아 둔다.

  VITE_RECORD_API=true 일 때만 동작하며 프로덕션 번들에는 포함되지 않는다.
  브라우저 콘솔에서 __dumpFixtures() 를 호출하면 JSON 파일로 내려받는다.
*/

interface RecordedCall {
  method: string;
  path: string;
  params?: unknown;
  status: number;
  data: unknown;
  recordedAt: string;
}

/*
  토큰과 환자 식별 정보는 저장하지 않는다.
  의료 서비스 데이터이므로 캡처 단계에서 미리 지운다.
*/
const MASKED_KEYS = [
  // 인증
  "accessToken",
  "refreshToken",
  "token",
  "rtcToken",
  // 환자 식별 정보
  "birthDate",
  "birthdate",
  "patientName",
  "name",
  "englishName",
  "displayName",
  "email",
  // 의료진 식별 정보
  "medicalStaffName",
  "doctorName",
  // 연락처
  "phoneNumber",
  "clinicPhoneNumber",
  "guardianPhoneNumber",
  "guardianName",
];

function maskSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(maskSensitive);

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        MASKED_KEYS.includes(key) ? "__MASKED__" : maskSensitive(item),
      ]),
    );
  }

  return value;
}

/*
  /api/appointments/12 -> /api/appointments/:id
  경로에 박힌 식별자를 자리표시자로 바꿔 같은 엔드포인트끼리 묶는다.
*/
function normalizePath(url: string, baseURL?: string) {
  const path = baseURL ? url.replace(baseURL, "") : url;

  return path.replace(/\/\d+/g, "/:id");
}

const calls = new Map<string, RecordedCall>();

function record(response: AxiosResponse) {
  const method = (response.config.method ?? "get").toUpperCase();
  const path = normalizePath(
    response.config.url ?? "",
    response.config.baseURL,
  );
  const key = `${method} ${path}`;

  calls.set(key, {
    method,
    path,
    params: response.config.params,
    status: response.status,
    data: maskSensitive(response.data),
    recordedAt: new Date().toISOString(),
  });

  console.info(`[api-recorder] ${key} (수집 ${calls.size}건)`);
}

function dumpFixtures() {
  if (calls.size === 0) {
    console.warn("[api-recorder] 수집된 응답이 없습니다.");
    return;
  }

  const payload = {
    recordedAt: new Date().toISOString(),
    count: calls.size,
    fixtures: Object.fromEntries(calls),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `api-fixtures-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();

  URL.revokeObjectURL(url);
  console.info(`[api-recorder] ${calls.size}건을 내려받았습니다.`);
}

export function setupApiRecorder(instance: AxiosInstance) {
  instance.interceptors.response.use((response) => {
    record(response);
    return response;
  });

  /*
    콘솔에서 바로 호출할 수 있게 전역에 노출한다.
    수집 현황은 __fixtureStatus() 로 확인한다.
  */
  Object.assign(window, {
    __dumpFixtures: dumpFixtures,
    __fixtureStatus: () => {
      console.table([...calls.keys()].map((key) => ({ endpoint: key })));
      return calls.size;
    },
  });

  console.info(
    "[api-recorder] 활성화됨. 화면을 둘러본 뒤 __dumpFixtures() 를 실행하세요.",
  );
}
