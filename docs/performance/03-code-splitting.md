# 02. 화상 상담 라우트 코드 스플리팅

> 작업일 2026-09-02 · 기준값 [01-baseline.md](./01-baseline.md)
> 번들 리포트: [분리 전](./reports/2026-09-01-bundle-before-split.html) / [분리 후](./reports/2026-09-01-bundle-after-split.html)

## 문제

`routes/index.tsx` 가 12개 페이지를 전부 정적 import 하고 있어
**모든 라우트가 단일 청크 2,379.14 kB** 로 묶였다. Vite 도 경고를 냈다.

```
(!) Some chunks are larger than 500 kB after minification.
```

번들 분석 결과 원인이 분명했다.

| 모듈 | 크기 | 비중 |
| --- | --- | --- |
| **agora-rtc-sdk-ng** | **1,982.6 kB** | 화상 상담에서만 사용 |
| react-dom | 449.0 kB | 필수 |
| react-router | 204.1 kB | 필수 |

화상 상담 SDK가 번들 최대 항목인데, **첫 화면에는 전혀 필요 없다.**

## 분리 대상 선정

Agora SDK 의존이 `consultation-room` 안에만 있는지 먼저 확인했다.

```
agora-rtc-sdk-ng 를 import 하는 파일
  consultation-room/components/LocalVideo.tsx    (타입 전용)
  consultation-room/components/RemoteVideo.tsx   (타입 전용)
  consultation-room/hooks/useAgoraRTC.ts         ← 실제 런타임 import

consultation-room 을 밖에서 import 하는 곳
  src/routes/index.tsx  ← 유일
```

타입 전용 import 는 빌드 시 사라지므로 실제 진입점은 하나였다.
외부 참조도 라우터 한 곳뿐이라 **라우터만 고치면 SDK 전체가 분리된다.**

## 적용

React Router 7 의 `lazy` 속성을 사용했다.
`React.lazy` + `Suspense` 와 달리 라우터가 모듈 로딩 동안 네비게이션을 붙잡아
로딩 중 빈 화면이 생기지 않는다.

```tsx
const lazyPage =
  (load: () => Promise<{ default: ComponentType }>) => async () => ({
    Component: (await load()).default,
  });

{
  path: "/consultation/:appointmentId/room",
  lazy: lazyPage(() => import("@/layouts/ConsultationRoomLayout")),
  children: [
    { index: true, lazy: lazyPage(() => import("@/pages/consultation-room")) },
  ],
}
```

`lazy` 는 `{ Component }` 를 반환해야 한다. 페이지들이 `export default` 를 쓰므로
헬퍼에서 `default` 를 꺼내 넘긴다.

### 분리하지 않은 것

| 대상 | 이유 |
| --- | --- |
| `OnboardingPage` | `/` 와 `/patient/access` 의 진입 화면. lazy 로 만들면 첫 화면에 왕복이 늘어 오히려 느려진다 |
| `AppLayout` | 대부분의 라우트가 공유한다. 분리해도 항상 받으므로 요청만 늘어난다 |
| 나머지 11개 페이지 | 메인 청크의 약 66%가 라이브러리라 효과가 제한적이다. 별도 판단 |

---

## 프리캐시 조정과 대기실 선로딩

청크를 나눴지만 **PWA 프리캐시가 새 청크까지 전부 포함**해 첫 방문 전송량은 그대로였다.

```
precache  11 entries (2409.17 KiB)   ← consultation-room 청크 포함
```

프리캐시는 렌더링 이후 백그라운드에서 돌기 때문에 첫 화면 속도를 막지는 않는다.
하지만 화상 상담을 쓰지 않는 사용자도 1.5 MB 를 받는다.
해외 환자 대상이라 모바일 데이터 환경을 고려해 **제외하기로 했다.**

```ts
// vite.config.ts
workbox: {
  globIgnores: ["**/consultation-room-*.js", "**/mockServiceWorker.js"],
}
```

개발용 MSW 워커가 프로덕션 프리캐시에 포함돼 있던 것도 함께 제외했다.

### 입장 지연 문제와 대응

프리캐시에서 빼면 상담 방 입장 시점에 gzip 435.88 kB 를 받아야 한다.
느린 네트워크에서는 수 초가 걸릴 수 있고, **예약 시각에 맞춰 들어오는 화면이라
그 지연이 특히 나쁘다.**

라우팅 구조상 상담 방 앞에는 항상 대기실이 있다.

```
/consultation/:appointmentId/waiting  →  /consultation/:appointmentId/room
```

대기실에 머무는 동안 청크를 미리 받아두면 입장 지연이 사라진다.

```tsx
// consultation-waiting/index.tsx
useEffect(() => {
  void import("@/pages/consultation-room").catch(() => {});
}, []);
```

동적 import 는 모듈 캐시를 공유하므로 라우터가 같은 모듈을 요청할 때 네트워크를 타지 않는다.
실패해도 입장 시 다시 시도되므로 조용히 넘긴다.

---

## 결과

| 지표 | 기준값 | 분리 후 | 프리캐시 조정 후 |
| --- | --- | --- | --- |
| **초기 로드 JS** | 2,379.14 kB | **810.17 kB** | **810.26 kB** |
| 초기 로드 JS (gzip) | 687.11 kB | 251.95 kB | **251.99 kB** |
| **PWA 프리캐시** | 2,395.24 KiB | 2,409.17 KiB | **868.68 KiB** |
| 프리캐시 항목 | 8 | 11 | 9 |

### 생성된 청크

| 청크 | 크기 | gzip | 구성 |
| --- | --- | --- | --- |
| `index-*.js` | 810.26 kB | 251.99 kB | 공통 라이브러리 + 11개 페이지 |
| `consultation-room-*.js` | 1,567.88 kB | 435.88 kB | **97.2%가 Agora SDK** |
| `ConsultationRoomLayout-*.js` | 0.19 kB | 0.18 kB | 레이아웃 |

> **표현 주의**: 전체 JS 합계는 줄지 않았다. 코드가 사라진 게 아니라 **옮겨진 것**이다.
> "번들 66% 감소"가 아니라 **"초기 로드 JS 66% 감소"** 가 정확한 표현이다.

### 검증

빌드 산출물에서 확인한 내용이다.

```
프리캐시 목록
  consultation-room 청크  → 없음
  mockServiceWorker.js    → 없음

메인 청크 내 consultation-room 참조 2곳
  1. 대기실 프리페치  useEffect(()=>{ import("./consultation-room-*.js").catch(()=>{}) })
  2. 라우터 lazy      {index:!0, lazy:(()=>import("./consultation-room-*.js"))}
```

두 참조가 같은 모듈을 가리키므로 대기실에서 받아두면 입장 시 네트워크를 타지 않는다.
개발 서버에서 대기실 진입 시 프리페치 요청이 나가는 것도 확인했다.

---

## Lighthouse 를 근거로 쓰지 않는 이유

초기 로드 JS 를 66% 줄였지만 **LCP 개선폭은 아직 측정하지 못했다.**
이 환경의 Lighthouse 편차가 이번 변경의 효과보다 크기 때문이다
(동일 빌드 3회에서 Performance 35~44, 자세한 내용은 [02](./02-icon-optimization.md)).

의미 있는 비교를 하려면 5회 중앙값으로 재측정해야 한다.
번들 크기는 결정론적이므로 그대로 근거로 쓸 수 있다.

---

## 남은 작업

이제 초기 전송량에서 가장 큰 것은 JS 가 아니라 이미지다.

| 우선순위 | 작업 | 예상 효과 |
| --- | --- | --- |
| 1 | 배경 PNG 3개 → CSS 그라디언트 | **-1,251 kB** |
| 2 | i18n 4개 언어 동적 import | -58 kB |
| 3 | 예약 라우트 분리 (react-day-picker 동반) | -92 kB |
| 4 | LCP 5회 중앙값 재측정 | 실제 효과 확인 |
