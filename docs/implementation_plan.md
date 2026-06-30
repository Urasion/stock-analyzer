# 미국 주식 어닝 대시보드 API 구현 계획 (1단계)

이 프로젝트는 미국 상장 기업의 최신 SEC 8-K(수시공시)와 과거 재무 데이터를 융합하여 AI가 실적 및 투자 매력도를 입체적으로 분석하는 **Full-stack 어닝 대시보드**의 1단계(백엔드 API 라우트) 구현을 목표로 합니다.

## User Review Required

> [!IMPORTANT]
> - SEC API 호출 시 `User-Agent` 헤더 설정에 이메일 정보가 포함되어야 차단을 방지할 수 있습니다. 기본값으로 임의의 이메일(`antigravity-bot@example.com`)을 사용할 예정이며, 추후 필요시 변경할 수 있습니다.
> - Vercel AI SDK(`@ai-sdk/openai`) 사용을 위해 `OPENAI_API_KEY` 환경 변수가 필요합니다. `.env.local` 파일을 생성하여 설정해야 합니다.
> - SEC CIK 캐싱은 메모리 내 저장 및 로컬 디렉토리(`/tmp` 혹은 프로젝트 루트 내 임시 파일) 캐싱을 혼합하여 하루(24시간) 동안 캐싱되도록 구현합니다.

## Proposed Changes

### 1. 프로젝트 및 기술 스택 초기화

현재 디렉토리에 이미 `.git`과 `README.md`가 존재하므로 임시 폴더에 Next.js 프로젝트를 생성한 후 파일을 현 위치로 이동하는 방식을 적용합니다.

- **Next.js 생성 명령어**:
  `npx -y create-next-app@latest tmp-next-app --ts --tailwind --app --src-dir --import-alias "@/*" --use-npm --yes`
- **파일 이동 및 종속성 설치**:
  - `tmp-next-app` 내 모든 숨김 파일 및 소스 코드를 프로젝트 루트로 이동 및 병합.
  - 다음 패키지 추가 설치:
    `npm install yahoo-finance2 cheerio jotai ai @ai-sdk/openai zod`

---

### 2. 백엔드 API 라우트 구현

#### [NEW] [route.ts (SEC API)](file:///Users/jeongjiwon/Documents/antigravity/stock-analyzer/src/app/api/sec/route.ts)
- **CIK 매핑 정보 다운로드 & 캐싱**:
  - `https://www.sec.gov/files/company_tickers.json` 호출.
  - `User-Agent: AntigravityStockAnalyzer/1.0 (antigravity-bot@example.com)` 헤더 적용.
  - 데이터를 `/tmp/sec_cik_cache.json`에 저장하고, 수정 시간(mtime) 기준 24시간 이내라면 로컬 캐시 데이터를 사용합니다.
- **최신 8-K 공시 조회**:
  - CIK 번호를 10자리 패딩 처리 후 `https://data.sec.gov/submissions/CIK${paddedCIK}.json`에서 `recent` 목록 파싱.
  - `form` 필드가 `8-K`인 최신 5개 항목 추출.
  - `accessionNumber`와 `primaryDocument`를 사용하여 실제 Archives HTML 원문 주소 조립:
    `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNumberWithoutDashes}/${primaryDocument}`

#### [NEW] [route.ts (Fundamentals API)](file:///Users/jeongjiwon/Documents/antigravity/stock-analyzer/src/app/api/market/fundamentals/route.ts)
- **과거 재무 데이터 수집**:
  - `yahoo-finance2` 모듈 로드.
  - `yahooFinance.quoteSummary(ticker, { modules: ['summaryDetail', 'financialData', 'earnings'] })`를 통해 다음 정보 추출:
    - 현재 PER: `summaryDetail.trailingPE`
    - 선행 PER: `summaryDetail.forwardPE`
    - PBR: `summaryDetail.priceToBook`
    - 전년 대비 매출 성장률: `financialData.revenueGrowth`
    - EPS 히스토리: `earnings.earningsChart.quarterly` 또는 관련 EPS 추이 정보를 최근 4분기 실제/예상 값 형태로 가공.

#### [NEW] [route.ts (AI Analysis API)](file:///Users/jeongjiwon/Documents/antigravity/stock-analyzer/src/app/api/sec/analyze/route.ts)
- **공시 본문 크롤링**:
  - 프론트엔드로부터 SEC 8-K 링크를 수신.
  - `User-Agent` 설정 후 `cheerio`를 사용해 HTML 본문의 텍스트만 추출 (2만 자 제한).
- **종합 AI 분석 수행**:
  - 과거 재무 데이터(Fundamentals API 내부 로직 활용 혹은 병렬 fetch)와 공시 본문 텍스트 결합.
  - Vercel AI SDK `generateObject`와 `gpt-4o-mini` 모델 호출.
  - 요청된 Zod 스키마 구조로 강제 분석 및 결과를 JSON으로 반환.

---

### 3. 설정 파일 추가

#### [NEW] [.env.local](file:///Users/jeongjiwon/Documents/antigravity/stock-analyzer/.env.local)
- `OPENAI_API_KEY` 플레이스홀더 설정.

## Verification Plan

### Automated Tests
각 API의 정상 동작 여부를 확인하기 위해 로컬 개발 서버(`npm run dev`)를 실행한 상태에서 `curl`을 통해 테스트합니다.

1. **SEC 공시 수집 API 검증**:
   ```bash
   curl "http://localhost:3000/api/sec?ticker=NVDA"
   ```
 2. **펀더멘털 API 검증**:
   ```bash
   curl "http://localhost:3000/api/market/fundamentals?ticker=NVDA"
   ```
 3. **AI 분석 API 검증** (임시 데이터로 POST 요청 검증):
   ```bash
   curl -X POST -H "Content-Type: application/json" \
     -d '{"url":"https://www.sec.gov/Archives/edgar/data/1045810/000104581024000173/nvda-20240828.htm", "ticker":"NVDA"}' \
     "http://localhost:3000/api/sec/analyze"
   ```

### Manual Verification
- SEC 공시 CIK 데이터 캐시 파일(`sec_cik_cache.json`)이 정상적으로 생성되고 만료 기한이 체크되는지 로컬 파일 로그 확인.
- `yahoo-finance2`가 반환하는 EPS 히스토리와 펀더멘털 값들의 빈 값 처리(Null-safety) 검증.
