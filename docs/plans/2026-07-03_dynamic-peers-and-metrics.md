# 동종업계 경쟁사 동적 조회 및 추가 지표 수집 구현 계획서

Yahoo Finance API를 활용하여 하드코딩 없이 동종업계 경쟁사(Peers)를 동적으로 조회하고, AI의 분석 신뢰도(Confidence Score)를 높일 수 있는 핵심 금융 지표들(유동성 런웨이, 지분율 구조, 애널리스트 의견 분산도)을 수집하여 프롬프트에 주입하는 기능의 구현 계획입니다.

## User Review Required

> [!IMPORTANT]
> **API 호출 부담 최소화 및 응답 속도 관리**
> 동종업계 경쟁사를 동적으로 수집한 뒤, 해당 경쟁사들(3개사)의 상세 밸류에이션(P/E, P/B)을 추가로 조회하는 과정에서 병렬 API 요청(`Promise.all`)이 발생합니다. 최대한 빠르고 견고하게 에러 핸들링(`catch` 처리)을 수행하여 특정 경쟁사 조회 실패가 전체 분석을 방해하지 않도록 설계합니다.

---

## Proposed Changes

데이터 수집 파이프라인의 일관성 및 재사용성을 높이기 위해, 기존 API 라우트에 분산되어 있던 야후 파이낸스 데이터 수집 코드를 공통 라이브러리(`src/lib/fundamentals.ts`)로 일괄 이관하고 고도화합니다.

### 1. [NEW] [fundamentals.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/lib/fundamentals.ts)
* `yahoo-finance2`를 통해 동종업계 추천 기업 리스트를 조회하고, 추가 지표 데이터를 결합하여 최종 프롬프트 입력에 매핑해주는 공통 함수 `getFundamentalsData(ticker)`를 정의합니다.
* 수집 대상 지표:
  * **유동성**: 가용현금(`cashCashEquivalentsAndShortTermInvestments`), 자유현금흐름(`FCF = operatingCashFlow + capitalExpenditures`)을 통한 월간 현금 소모액(Burn Rate) 및 현금 런웨이(Runway Months) 계산
  * **수급**: 내부자 지분율(`insidersPercentHeld`), 기관 지분율(`institutionsPercentHeld`)
  * **컨센서스 편차**: 월가 애널리스트들의 최고-최저 목표가 편차율 및 최근 투자의견(Buy/Hold/Sell) 분포
  * **동적 경쟁사**: `recommendationsBySymbol(ticker)`에서 상위 3개사를 가져와 이들의 Forward P/E, P/B를 병렬 조회

### 2. [MODIFY] [prompts.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/api/sec/analyze/prompts.ts)
* `FundamentalsInput` 인터페이스를 확장하여 신규 추가된 지표 타입을 정의합니다.
* `buildAnalysisPrompt` 함수 내부에 추가 지표 포맷팅 영역을 구성하고, AI가 이 지표들을 종합 분석 및 신뢰도 점수 산출에 반영하도록 지시하는 프롬프트 문구를 삽입합니다.

### 3. [MODIFY] [route.ts (Analyze API)](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/api/sec/analyze/route.ts)
* 중복되는 기존 야후 파이낸스 직접 fetch 로직을 들어내고, `getFundamentalsData(upperTicker)` 호출 방식으로 대체하여 코드를 리팩토링합니다.

### 4. [MODIFY] [route.ts (Analyze Stream API)](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/api/sec/analyze/stream/route.ts)
* Stream API에서도 마찬가지로 리팩토링된 `getFundamentalsData(upperTicker)`를 임포트하여 중복 로직을 축소하고 지표 주입을 일치시킵니다.

---

## Verification Plan

### Automated Tests
* 빌드 체크 및 린트 오류 테스트:
  ```bash
  npm run build
  ```

### Manual Verification
* 브라우저 개발 환경(`http://localhost:3000`)에 접속하여 `IREN` 틱커로 정밀 분석을 재실행합니다.
* API 디버깅 로그를 통해 동종업계 경쟁사 틱커(MARA, RIOT 등)가 정상적으로 동적 인식되고, 현금 런웨이 및 지분율 데이터가 수집되어 AI에 전달되는지 확인합니다.
* 최종 반환되는 AI 한줄평 및 분석 보고서 내의 신뢰도 수치가 추가된 금융 지표에 근거하여 논리적으로 산출되는지 검증합니다.
