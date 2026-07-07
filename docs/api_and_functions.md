# API 및 주요 함수 명세서 (API and Function Documentation)

이 문서는 프로젝트 내의 백엔드 API 엔드포인트와 `src/lib` 디렉토리 아래의 주요 핵심 함수들을 설명합니다.

---

## 1. API 엔드포인트 (API Routes)

모든 API 경로는 Next.js App Router 스타일(`src/app/api/`)에 맞춰져 있으며, JSON 형식 또는 스트리밍 텍스트 응답을 반환합니다.

### ① 주가 차트 데이터 API
*   **엔드포인트:** `GET /api/market/chart`
*   **파일:** [src/app/api/market/chart/route.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/api/market/chart/route.ts)
*   **쿼리 파라미터:**
    *   `ticker` (필수): 주식 티커 (예: `AAPL`)
    *   `range` (옵션, 기본값 `1M`): 기간 (`1D`, `1W`, `1M`, `1Y`, `ALL`)
*   **설명:** 지정한 티커의 차트 주가 데이터를 가져오며, `1D`일 경우 최근 거래일 기준의 세부 15분 단위 데이터만 필터링하여 제공합니다.

### ② 기업 재무 데이터 API
*   **엔드포인트:** `GET /api/market/fundamentals`
*   **파일:** [src/app/api/market/fundamentals/route.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/api/market/fundamentals/route.ts)
*   **쿼리 파라미터:**
    *   `ticker` (필수): 주식 티커
*   **설명:** 야후 파이낸스를 통해 기업의 기본 재무 지표(P/E, P/B, EPS 이력 등) 및 최근 365일 주가 변동성 통계 데이터를 병렬로 획득하여 반환합니다.

### ③ 거시경제(매크로) 지표 API
*   **엔드포인트:** `GET /api/market/macro`
*   **파일:** [src/app/api/market/macro/route.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/api/market/macro/route.ts)
*   **설명:** 미국 FRED(St. Louis Fed) API로부터 연방기금금리(Fed Funds), CPI(YoY 물가상승률), 장단기 금리차(10Y-2Y), 실업률 데이터를 가공해 반환합니다.

### ④ SEC 공시 목록 조회 API
*   **엔드포인트:** `GET /api/sec`
*   **파일:** [src/app/api/sec/route.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/api/sec/route.ts)
*   **쿼리 파라미터:**
    *   `ticker` (필수): 주식 티커
*   **설명:** 미국 SEC EDGAR 시스템에 접근하여 티커에 해당되는 CIK 번호를 맵핑(캐시 적용)한 뒤, 최근 작성된 `10-K`, `10-Q`, `8-K`, `Form 4` 등의 공시 목록과 상세 HTML URL을 반환합니다.

### ⑤ AI 기반 SEC 공시 및 지표 종합 분석 API (단일 반환)
*   **엔드포인트:** `POST /api/sec/analyze`
*   **파일:** [src/app/api/sec/analyze/route.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/api/sec/analyze/route.ts)
*   **요청 바디 (JSON):**
    *   `ticker` (필수): 분석 대상 주식 티커
    *   `urls` / `url10K` / `url10Q` / `urlsForm4`: 분석할 SEC 공시 URL 배열 및 단일 스트링
    *   `hasPosition` / `avgPrice` (옵션): 사용자의 포지션 유무 및 평단가 정보
*   **설명:** SEC 공시 HTML의 특정 핵심 항목(예: 10-K의 Item 1A Risk Factors 등)을 Cheerio로 크롤링하고, 기본 재무 및 매크로 지표 데이터 및 **최근 1년 치 일일 주가 시계열 흐름 데이터**를 포함해 Google Gemini API (`gemini-2.5-flash`)를 통해 종합적인 투자 분석 보고서 데이터를 생성하여 단일 JSON 객체로 반환합니다.

### ⑥ AI 기반 SEC 공시 및 지표 종합 분석 API (스트리밍 반환)
*   **엔드포인트:** `POST /api/sec/analyze/stream`
*   **파일:** [src/app/api/sec/analyze/stream/route.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/api/sec/analyze/stream/route.ts)
*   **설명:** `POST /api/sec/analyze`와 역할은 동일하나, 생성된 보고서 데이터를 클라이언트에 실시간 스트리밍(`ai` SDK의 `streamObject` 활용) 형태로 전송합니다.

---

## 2. 핵심 라이브러리 함수 (Core Library Functions)

공통으로 재사용되는 비즈니스 로직 및 API 연동 함수들이 `src/lib/`에 구현되어 있습니다.

### ① `src/lib/fundamentals.ts`
*   **`getFundamentalsData(ticker: string): Promise<FundamentalsInput | null>`**
    *   야후 파이낸스(`yahoo-finance2`) 모듈을 이용해 밸류에이션, 이익/매출 추이, 유동성 지표(현금 Runway 계산), 주가 최고-최저 목표 편차율 계산(`targetPriceDeviationPercent`), 매수 의견 분포 데이터 등을 종합 수집합니다.
    *   목표가 기대 편차는 API 내부 원천 데이터를 받아와 `((targetHigh - targetLow) / targetMean) * 100` 수식으로 계산합니다.

### ② `src/lib/macro.ts`
*   **`getMacroData(): Promise<MacroData>`**
    *   FRED API에서 거시경제의 기준금리, 인플레이션(CPI), 장단기 금리차, 실업률 데이터를 가져오며, Next.js의 `fetch` revalidate 옵션을 사용해 1시간 동안 응답 결과를 캐싱합니다.

### ③ `src/lib/price.ts`
*   **`get365DayPriceMetrics(ticker: string): Promise<PriceMetrics | null>`**
    *   최근 1년(365일) 동안의 일일 종가 데이터를 기반으로 현재가, 첫 가격 대비 변동율, 1년 최고가/최저가, 연간 표준 편차 기반 변동성(`volatility365d`)을 계산하여 반환합니다.
*   **`getPriceChartData(ticker: string, range: string): Promise<ChartRangeData | null>`**
    *   차트 시각화를 위해 요청 범위(1D, 1W, 1M, 1Y, ALL)에 맞게 시작일과 인터벌(15분, 1시간, 1일)을 동적으로 조정하고 주가 이력 데이터를 가져와 변동 폭 등을 가공해 반환합니다.

### ④ `src/lib/utils.ts`
*   **`cn(...inputs: ClassValue[]): string`**
    *   `clsx`와 `tailwind-merge` 라이브러리를 사용해 Tailwind CSS 클래스명을 조건부 병합하고 중복을 제거하는 컴포넌트 스타일용 헬퍼 유틸리티입니다.
