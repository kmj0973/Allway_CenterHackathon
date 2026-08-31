# 성능 개선 기록

allway 프론트엔드의 성능·품질 개선 과정을 기록합니다.
측정 → 개선 → 재측정 사이클을 문서로 남겨, 변경의 근거와 효과를 추적합니다.

## 문서

| 문서 | 내용 |
| --- | --- |
| [01-baseline.md](./01-baseline.md) | **개선 전 기준값** (2026-08-31). 모든 비교의 기준 |
| [02-icon-optimization.md](./02-icon-optimization.md) | ai-generate 아이콘 최적화 (2026-09-01). -99.84% |

## 원칙

- **개선 전 수치를 먼저 남긴다.** 기준값이 없으면 개선을 증명할 수 없습니다
- **기준값 문서는 수정하지 않는다.** 개선 결과는 새 문서로 추가합니다
- 측정 조건(커밋, 도구 버전, 환경)을 함께 기록합니다
- **1차 지표는 결정론적인 것을 쓴다.** 번들 크기처럼 빌드하면 같은 값이 나오는 지표를 기준으로 삼고,
  Lighthouse 점수는 편차가 크므로 5회 중앙값으로만 참고합니다
  (동일 빌드 3회 측정에서 Performance 35~44 편차 관측 — [02](./02-icon-optimization.md) 참고)

## 측정 방법

### 번들 분석
```bash
npm run build
```

### Lighthouse
```bash
npm run build
npx vite preview --port 4173

# 다른 터미널에서
npx lighthouse http://localhost:4173/ \
  --output=html --output-path=./docs/performance/reports/<날짜>.html \
  --chrome-flags="--headless=new"
```

리포트 원본은 [`reports/`](./reports/)에 날짜별로 보관합니다.
