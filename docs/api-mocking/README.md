# API 응답 캡처 & 목킹

백엔드가 내려간 뒤에도 **실제 응답 형태 그대로** 프론트엔드를 단독 실행하기 위한 작업입니다.

해커톤 종료 후 백엔드 서버가 중단되면 화면 대부분이 동작하지 않습니다.
살아 있는 동안 응답을 수집해 두면, 이후에도 전체 플로우를 시연할 수 있습니다.

> ⏰ **백엔드 가동 예정: 2026-08-31 기준 약 1주.** 캡처는 그 안에 끝내야 합니다.

---

## 1. 캡처 방법

API 서버가 **배포 도메인(`https://allway.vercel.app`)만 CORS 허용**하므로,
로컬 dev 서버(`localhost:5173`)에서는 브라우저가 API를 호출할 수 없습니다.

상황에 따라 두 가지 방법을 씁니다.

| 방법 | 언제 쓰나 | CORS |
| --- | --- | --- |
| **A. 배포 사이트 콘솔 레코더** | 지금 당장 캡처할 때. **화상 상담 등 실제 환경이 필요한 경우** | 해당 없음 |
| **B. 로컬 dev + Vite 프록시** | 코드를 고치면서 캡처할 때 | dev 서버가 대신 호출해 우회 |

---

### 방법 A — 배포 사이트에서 콘솔 레코더

배포를 새로 하지 않아도 되고, 실제 환경 그대로 잡힙니다.

1. `https://allway.vercel.app/home` 접속 (로그인 상태 확인)
2. DevTools(F12) → Console
3. [`console-recorder.js`](./console-recorder.js) **파일 전체를 붙여넣고 Enter**
4. 화면을 실제로 사용 (예약 생성, 화상 상담, 사진 첨부 등)
5. 수집 확인 및 내려받기

```js
__fixtureStatus()   // 수집 현황 (표로 출력)
__dumpFixtures()    // JSON 다운로드
```

> ⚠️ **새로고침하면 수집 내용이 사라집니다.** 내려받기 전에 새로고침하지 마세요.

XHR과 fetch를 모두 가로채므로 axios 요청이 전부 잡힙니다.

---

### 방법 B — 로컬 dev 서버 + Vite 프록시

`.env.local` 을 다음과 같이 설정합니다.

```bash
VITE_API_BASE_URL=              # 비워 둔다 (요청이 같은 오리진 /api/... 로 나감)
VITE_API_PROXY_TARGET=<API 서버 주소>
VITE_RECORD_API=true
```

```bash
npm run dev
```

dev 서버가 `/api` 요청을 대신 호출하므로 CORS가 적용되지 않습니다.
콘솔에 `[api-recorder] 활성화됨` 이 보이면 준비된 상태이며, 사용법은 방법 A와 같습니다.

> `VITE_API_PROXY_TARGET` 이 비어 있으면 프록시는 아예 설정되지 않으므로,
> 이 값을 넣지 않은 팀원의 개발 환경에는 영향이 없습니다.

---

## 진행 상황

**백엔드 서버가 종료되어(2026-08-31) 추가 캡처는 불가능합니다.**
확보한 캡처본과 타입 정의를 근거로 MSW 목을 구성해, 서버 없이 전체 플로우가 동작합니다.

### 실행

```bash
# .env.local
VITE_USE_MOCK_API=true

npm run dev
```

콘솔에 다음이 보이면 목 모드입니다.

```
[mocks] API 목 모드로 실행 중입니다. 캡처본 11건 (2026-08-31)
```

### 데모 배포 (2026-09-04 추가)

백엔드가 종료되어 실서버 배포는 화면만 뜨고 데이터가 오지 않습니다.
포트폴리오에서 **동작하는 링크**를 보여주기 위해 목을 켠 데모를 따로 배포합니다.

| 배포 | 플래그 | 데이터 | PWA |
| --- | --- | --- | --- |
| https://allway-demo.vercel.app | `VITE_USE_MOCK_API=true` | MSW 목 | ❌ 꺼짐 |
| 프로덕션 | 미설정 | 실서버 | ✅ 켜짐 |

Vercel 프로젝트 설정 > Environment Variables 에 `VITE_USE_MOCK_API=true` 를 넣으면 됩니다.

#### 왜 데모에서는 PWA 를 끄는가

MSW 워커(`mockServiceWorker.js`)와 Workbox 워커(`sw.js`)가 **둘 다 스코프 `/` 에 등록**됩니다.
같은 스코프에는 서비스 워커가 하나만 남으므로 나중에 등록된 쪽이 앞의 것을 덮어씁니다.
그대로 두면 목이 먹거나 캐시가 먹거나 둘 중 하나가 매 로드마다 뒤집힙니다.
데모의 목적은 데이터가 보이는 것이므로 목을 우선하고, PWA 는 [`vite.config.ts`](../../vite.config.ts) 에서 제외합니다.

#### 로컬에서 성능을 측정할 때 주의

`.env.local` 에 `VITE_USE_MOCK_API=true` 가 남아 있으면 **`npm run build` 도 데모 빌드가 됩니다.**
MSW 런타임(450 kB)이 초기 로드에 얹히고 PWA 산출물이 사라져 수치가 달라집니다.
성능을 측정할 때는 플래그를 명시적으로 끄세요.

```bash
VITE_USE_MOCK_API=false npm run build
```

빌드 로그 끝에 `PWA v1.3.0 ... precache 9 entries` 가 보이면 프로덕션 빌드가 맞습니다.

### 응답 출처 (25개 엔드포인트 전부 처리됨)

| 출처 | 개수 | 신뢰도 |
| --- | --- | --- |
| **캡처본** — 실제 서버 응답 | 9 | 값까지 실제 데이터 |
| **작성본** — `src/types` 근거 | 16 | **형태는 정확, 값은 예시** |

캡처했지만 사용하지 않는 응답이 2개 있습니다.
`GET /api/appointments` 와 `available-dates` 는 캡처 당시 **빈 배열**이라
시연에 쓸 수 없어 작성본으로 대체했습니다. (캡처본은 `captured.json` 에 그대로 보관)

> ⚠️ **작성본을 실제 응답으로 오해하지 마세요.**
> 형태는 타입 정의와 일치하지만 값은 시연용으로 만든 것입니다.
> 서버가 다시 살아나면 [`console-recorder.js`](./console-recorder.js) 로 재캡처해 교체하세요.

### 화상 상담에 대하여

실제 Agora 연결은 재현하지 않습니다. 유효한 토큰과 채널이 필요하기 때문입니다.
대신 API 응답만 목킹해 **입장 → 연결 상태 → 자막 → 종료 → 요약** 흐름을 재현합니다.
`ConnectionStatus`, `getJoinErrorMessage`, `decodeSttMessage` 등 직접 구현한 로직은
목 데이터로 실패 케이스까지 자유롭게 재현할 수 있어 오히려 검증이 쉽습니다.

---

## 2. 캡처 체크리스트 (엔드포인트 24개)

플로우 순서대로 진행하면 대부분 자연히 수집됩니다.

### 온보딩
- [ ] `POST /api/patients/access-links/verify` — 매직링크 + 생년월일 인증
- [ ] `PATCH /api/patients/me/settings` — 언어·국가·시간대 저장

### 홈 / 사후관리
- [x] `GET /api/aftercare/home` ✅
- [x] `GET /api/aftercare/dashboard` ✅
- [x] `GET /api/aftercare/emergency-medical-report` ✅

### AI 상담
- [x] `GET /api/ai-chats/rooms` ✅ (18개 방)
- [x] `GET /api/ai-chats/rooms/:id/messages` ✅
- [ ] `POST /api/ai-chats/messages` — **사진 첨부 케이스도 함께**
- [ ] 채팅 이미지 조회

### 상담 예약
- [x] `GET /api/appointments/available-dates` ⚠️ **빈 배열** — 예약 가능일이 없는 상태로 캡처됨. 재캡처 권장
- [x] `GET /api/appointments/available-slots` ✅
- [ ] `GET /api/preconsult-submissions`
- [ ] `GET /api/preconsult-submissions/files/...`
- [ ] `POST /api/appointments` — 예약 생성 (FormData)

### 상담 목록 / 상세
- [x] `GET /api/appointments` ⚠️ **빈 배열** — 진행 중 예약이 없어 빈 응답. 예약 생성 후 재캡처 필요
- [ ] `GET /api/appointments/:id` — 예약 상세
- [x] `GET /api/consultations/history` ✅ (27건)
- [ ] `DELETE /api/appointments/:id` — 취소 (**마지막에 할 것. 예약이 사라집니다**)

### 화상 상담 ⚠️ 난이도 높음
- [ ] `POST /api/consultations/:id/join`
- [ ] `POST /api/consultations/:id/transcription/start`
- [ ] `GET /api/consultations/:id/transcription/status`
- [ ] `POST /api/consultations/:id/token/renew`
- [ ] `POST /api/consultations/:id/captions/batch`
- [ ] `POST /api/consultations/:id/end`

> 화상 상담은 **의료진 쪽 접속이 필요할 수 있습니다.**
> 팀원과 시간을 맞춰 한 번에 끝내세요. 이 6개가 가장 놓치기 쉽습니다.

### 상담 요약
- [ ] `POST /api/consultation-summaries`
- [x] `GET /api/consultation-summaries` ✅ (12건)
- [x] `GET /api/consultation-summaries/:id` ✅

---

## 3. 개인정보 처리

의료 서비스 데이터이므로 **캡처 단계에서 미리 마스킹**합니다.
아래 키는 `__MASKED__` 로 치환되어 저장됩니다.

```
accessToken, refreshToken, token, rtcToken,
birthDate, phoneNumber, email, patientName, name
```

마스킹 대상은 [`src/mocks/apiRecorder.ts`](../../src/mocks/apiRecorder.ts) 의 `MASKED_KEYS` 에서 조정합니다.

> 수집한 JSON을 커밋하기 전에 **반드시 눈으로 한 번 확인하세요.**
> 증상 메모·업로드 사진처럼 마스킹 목록에 없는 필드가 있을 수 있습니다.

---

## 4. 이후 계획

1. 수집한 fixtures로 **MSW 핸들러** 작성
2. 백엔드 없이 `npm run dev` 만으로 전체 플로우가 도는 상태 확보
3. 같은 fixtures를 **Vitest 테스트**에 재사용

---

## 5. 구현

| 파일 | 역할 |
| --- | --- |
| [`console-recorder.js`](./console-recorder.js) | 배포 사이트 콘솔에 붙여넣는 레코더 (방법 A) |
| [`src/mocks/apiRecorder.ts`](../../src/mocks/apiRecorder.ts) | 로컬 dev용 axios 인터셉터 (방법 B) |
| [`src/apis/axiosInstance.ts`](../../src/apis/axiosInstance.ts) | `VITE_RECORD_API=true` 일 때만 동적 import |
| [`vite.config.ts`](../../vite.config.ts) | `VITE_API_PROXY_TARGET` 설정 시 `/api` 프록시 |

| [`src/main.tsx`](../../src/main.tsx) | `VITE_USE_MOCK_API=true` 일 때만 워커를 띄우고 렌더 |

플래그가 꺼진 빌드에서는 조건이 상수 `false` 로 접혀 동적 import 가 통째로 제거됩니다.
즉 목 코드와 픽스처는 프로덕션 번들에 **들어가지 않습니다.** 확인 방법:

```bash
VITE_USE_MOCK_API=false npm run build
grep -rl "mockServiceWorker" dist/assets/*.js   # 결과가 없어야 정상
```
