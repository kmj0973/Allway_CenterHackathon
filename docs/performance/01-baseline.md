# 개선 전 기준값 (Baseline)

> 측정일 **2026-08-31** · 브랜치 `dev` · 커밋 `79b9c41`
> **이 문서는 수정하지 않습니다.** 개선 결과는 새 문서로 추가합니다.

## 측정 환경

| 항목 | 값 |
| --- | --- |
| 빌드 | `npm run build` (Vite 8, production) |
| Lighthouse | v13.4.1 |
| 디바이스 에뮬레이션 | Mobile |
| 스로틀링 | Simulated |
| 대상 URL | `http://localhost:4173/` (vite preview) |
| 리포트 원본 | [`reports/2026-08-31-baseline.html`](./reports/2026-08-31-baseline.html) |

> 백엔드 API 없이 측정했습니다. 데이터 로딩이 필요한 화면의 지표는 실제와 다를 수 있습니다.

---

> ⚠️ **Lighthouse 수치 신뢰도 주의 (2026-09-01 추가)**
> 아래 Lighthouse 값은 **단일 측정**입니다. 이후 동일 빌드를 3회 측정한 결과
> Performance 35~44, TBT 625~1,616 ms 의 편차가 관측됐습니다.
> **Lighthouse 점수는 개선 효과의 근거로 쓰지 않습니다.** 자세한 내용은
> [02-icon-optimization.md](./02-icon-optimization.md) 참고.
> 빌드 산출물 크기(3장)는 결정론적이므로 그대로 기준값으로 유효합니다.

## 1. Lighthouse 점수

| 카테고리 | 점수 |
| --- | --- |
| **Performance** | **52** |
| Accessibility | 96 |
| Best Practices | 100 |
| SEO | 91 |

## 2. 핵심 지표

| 지표 | 값 | 평가 |
| --- | --- | --- |
| First Contentful Paint | **7.2 s** | 나쁨 |
| **Largest Contentful Paint** | **9.4 s** | **나쁨** |
| Speed Index | 7.2 s | 나쁨 |
| Time to Interactive | 9.5 s | 나쁨 |
| Total Blocking Time | 290 ms | 보통 |
| Cumulative Layout Shift | **0** | 양호 |

CLS가 0인 것은 레이아웃이 안정적이라는 뜻입니다. **문제는 전적으로 로딩 용량**에 있습니다.

Lighthouse 지적: **사용되지 않는 JavaScript 476 KiB**

---

## 3. 빌드 산출물

| 파일 | 크기 | gzip |
| --- | --- | --- |
| `assets/index.js` | **2,375.86 kB** | 684.39 kB |
| `assets/ai-generate.svg` | **2,119.12 kB** | 1,593.91 kB |
| `assets/bg-stripe.png` | 552.90 kB | — |
| `assets/home-gradient-top.png` | 366.33 kB | — |
| `assets/home-gradient-bottom.png` | 332.29 kB | — |
| `assets/index.css` | 75.22 kB | 13.82 kB |
| `index.html` | 1.50 kB | 0.62 kB |

- PWA precache: **8 entries / 2,395.24 KiB**
- 빌드 시간: 22.14s · 모듈 1,434개
- **초기 로드 자산 총합 약 5.8 MB**

---

## 4. 원인 분석

### 4-1. 아이콘 하나가 2.1 MB

```
src/assets/icons/consultation-summary/ai-generate.svg   2,119,126 bytes
```

`icons/` 하위 자산이 2 MB입니다. 최적화되지 않은 벡터가 그대로 포함된 것으로 보입니다.
단일 파일 기준 JS 번들 다음으로 큽니다.

**개선 방향** — SVGO 최적화 → 그래도 크면 래스터 포맷(WebP) 변환 또는 재제작

### 4-2. 배경 이미지 PNG 3개가 1.25 MB

| 파일 | 크기 | 성격 |
| --- | --- | --- |
| `bg-stripe.png` | 552.9 kB | 반복 스트라이프 패턴 |
| `home-gradient-top.png` | 366.3 kB | 그라디언트 |
| `home-gradient-bottom.png` | 332.3 kB | 그라디언트 |

그라디언트와 반복 패턴은 **CSS로 표현 가능**합니다. 이미지로 유지하더라도 WebP 변환 여지가 큽니다.

**개선 방향** — CSS `linear-gradient` / `repeating-linear-gradient` 대체, 또는 WebP 변환

### 4-3. 코드 스플리팅 없음

JS가 **단일 청크 2,375.86 kB**입니다. Vite 빌드 경고:

```
(!) Some chunks are larger than 500 kB after minification.
```

12개 페이지 라우트가 전부 초기 번들에 포함됩니다.
특히 **화상 상담 화면에서만 사용하는 Agora RTC SDK**(설치 크기 5.2 MB)가 첫 화면에서 함께 로드됩니다.
Lighthouse가 지적한 미사용 JS 476 KiB와 직접 연결됩니다.

**개선 방향** — `React.lazy` + 라우트 단위 동적 import. `consultation-room`(Agora) 우선 분리

### 4-4. i18n 4개 언어 전량 포함

`src/i18n/index.ts`가 번역 JSON 40개를 static import 합니다.

| 언어 | 크기 |
| --- | --- |
| ko-KR | 14,110 B |
| ja-JP | 14,951 B |
| en-US | 13,278 B |
| zh-CN | 12,356 B |
| **합계** | **54,695 B** |

사용자는 한 번에 한 언어만 사용하므로 **약 41 KB가 상시 낭비**됩니다.

**개선 방향** — 언어별 리소스 동적 import (`i18next-http-backend` 또는 `import()`)

---

## 5. 품질 항목

| 항목 | 상태 |
| --- | --- |
| 접근성 — `landmark-one-main` | 실패. 페이지에 `<main>` 랜드마크가 없음 |
| SEO — `robots-txt` | 실패. `robots.txt` 없음 |

접근성 96점은 이미 높은 편이며, `<main>` 추가만으로 개선 가능합니다.

---

## 6. 개선 우선순위 (비용 대비 효과 순)

| 순위 | 작업 | 예상 효과 |
| --- | --- | --- |
| 1 | `ai-generate.svg` 최적화 | 최대 **-2.1 MB** |
| 2 | PNG 3개 → CSS 그라디언트 / WebP | 최대 **-1.25 MB** |
| 3 | 라우트 코드 스플리팅 (Agora 분리) | 초기 JS 대폭 감소, TTI 개선 |
| 4 | i18n 동적 import | **-41 KB** |
| 5 | `<main>` 랜드마크 추가 | 접근성 96 → 100 |

---

## 7. 개선 후 비교표 (템플릿)

| 지표 | Baseline | 개선 후 | 변화 |
| --- | --- | --- | --- |
| Lighthouse Performance | 52 | | |
| LCP | 9.4 s | | |
| FCP | 7.2 s | | |
| TTI | 9.5 s | | |
| TBT | 290 ms | | |
| JS 초기 번들 | 2,375.86 kB | | |
| JS 초기 번들 (gzip) | 684.39 kB | | |
| 최대 단일 에셋 | 2,119.12 kB | | |
| 초기 로드 자산 총합 | ~5.8 MB | | |
| PWA precache | 2,395.24 KiB | | |
