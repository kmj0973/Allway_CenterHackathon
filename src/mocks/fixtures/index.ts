import captured from "./captured.json";

/*
  목 응답의 출처는 두 가지이며, 신뢰도가 다르므로 구분해서 관리한다.

  - captured : 2026-08-31 실제 서버에서 캡처한 응답. 값까지 실제 데이터
  - authored : 서버 종료 후 src/types 정의를 근거로 작성한 응답.
               형태(shape)는 타입과 일치하지만 값은 예시

  authored 를 실제 응답으로 오해하지 않도록, 새로 캡처할 기회가 생기면
  해당 항목을 captured 로 교체한다.
*/

/*
  캡처본은 응답 봉투(ApiResponse)까지 그대로 저장돼 있다.
  JSON에서 읽어오므로 구체 타입은 알 수 없고, 직렬화 가능한 값임만 보장된다.
*/
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

interface CapturedCall {
  method: string;
  path: string;
  params: Record<string, string> | null;
  status: number;
  data: JsonValue;
  recordedAt: string;
}

const capturedCalls = captured.fixtures as unknown as Record<
  string,
  CapturedCall
>;

/*
  캡처된 응답 본문을 꺼낸다. 없으면 명시적으로 실패시켜
  핸들러가 조용히 빈 값을 반환하는 상황을 막는다.
*/
export function capturedBody(key: string) {
  const call = capturedCalls[key];

  if (!call) {
    throw new Error(
      `[mocks] 캡처되지 않은 응답입니다: ${key}. authored 픽스처를 사용하세요.`,
    );
  }

  return call.data;
}

/*
  핸들러가 참조하는 캡처 키가 실제로 존재하는지 시작 시점에 확인한다.

  키가 틀리면 capturedBody()가 요청 시점에 예외를 던지고, MSW는 그 요청을
  처리하지 못해 실제 네트워크로 흘려보낸다. 목 모드인데도 조용히 실서버로
  나가는 상황이 되므로, 요청을 기다리지 말고 실행 직후에 드러내야 한다.
*/
export function assertCapturedKeys(keys: readonly string[]) {
  const missing = keys.filter((key) => !(key in capturedCalls));

  if (missing.length > 0) {
    console.error(
      "[mocks] 캡처본에 없는 키를 참조하고 있습니다. 해당 요청은 실서버로 나갑니다:\n" +
        missing.map((key) => `  - ${key}`).join("\n") +
        `\n사용 가능한 키:\n${CAPTURED_KEYS.map((key) => `  - ${key}`).join("\n")}`,
    );
  }
}

export const CAPTURED_KEYS = Object.keys(capturedCalls);
export const CAPTURED_AT = captured.recordedAt;
