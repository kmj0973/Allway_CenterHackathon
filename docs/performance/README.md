# 성능 개선 기록

allway 프론트엔드의 성능·품질 개선 과정을 기록합니다.
측정 → 개선 → 재측정 사이클을 문서로 남겨, 변경의 근거와 효과를 추적합니다.

## 문서

| 문서 | 내용 |
| --- | --- |
| [01-baseline.md](./01-baseline.md) | **개선 전 기준값** (2026-08-31). 모든 비교의 기준 |
| [02-icon-optimization.md](./02-icon-optimization.md) | ai-generate 아이콘 최적화 (2026-09-01). -99.84% |
| [03-code-splitting.md](./03-code-splitting.md) | 화상 상담 라우트 코드 스플리팅 (2026-09-02). 초기 로드 JS -66% |
| [04-background-images.md](./04-background-images.md) | 배경 이미지 최적화 (2026-09-02). 1,251kB → 89kB |
| [05-lighthouse.md](./05-lighthouse.md) | **Lighthouse 재측정 (2026-09-02). LCP -34%, FCP -35%** |

## 원칙

- **개선 전 수치를 먼저 남긴다.** 기준값이 없으면 개선을 증명할 수 없습니다
- **기준값 문서는 수정하지 않는다.** 개선 결과는 새 문서로 추가합니다
- 측정 조건(커밋, 도구 버전, 환경)을 함께 기록합니다
- **1차 지표는 결정론적인 것을 쓴다.** 번들 크기처럼 빌드하면 같은 값이 나오는 지표를 기준으로 삼습니다
- **Lighthouse 는 반드시 5회 중앙값으로 본다.** 단일 측정은 이상치에 휘둘립니다
  (기준 빌드 5회 중 1회가 Performance 38로 튐 — [05](./05-lighthouse.md) 참고)
- **측정 전에 대상이 맞는지 확인한다.** 포트가 밀려 엉뚱한 서버를 잰 적이 있습니다
  ```bash
  curl -s http://localhost:PORT/ | grep -o 'index-[A-Za-z0-9_-]*\.js'
  ```

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
