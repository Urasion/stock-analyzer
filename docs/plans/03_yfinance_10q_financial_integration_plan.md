# Yahoo Finance 재무 연동 강화 및 SEC 10-Q(분기실적) 연계 분석 구현 계획

최근 수시공시(8-K)에서 누락되기 쉬운 **최신 분기 매출액(Revenue)** 및 **가이던스(전망치)** 데이터를 채우기 위해, **Yahoo Finance API의 분기 실적/캘린더 전망치 조회 모듈을 확장 연동**하고, 공식 재무제표가 명시되는 **SEC 10-Q(분기 보고서) 스크래퍼를 추가 연동**하여 연계 종합 분석을 제공합니다.

## User Review Required

> [!IMPORTANT]
> * **Yahoo Finance API 고도화**: `quoteSummary` 호출 시 `calendarEvents` 모듈을 추가하여 월가 애널리스트들의 평균 매출/EPS 전망 가이던스를 수집하고, `earnings` 모듈의 분기 매출 데이터(`financialsChart.quarterly`)를 가져와 8-K 본문 스크랩의 수치 누락 한계를 원천 극복합니다.
> * **10-Q 연결손익계산서 타겟팅 추출**: 10-Q 문서 스크랩 시, 본문 텍스트 내에서 **`Statements of Operations` (Consolidated/Condensed)** 문구를 감지하여 해당 지점부터 **6,000자**만 똑똑하게 추출함으로써 핵심 분기 재무제표 현황을 완벽히 수집합니다.

---

## Proposed Changes

### 1. API Layer

#### [MODIFY] [route.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/api/sec/route.ts) (공시 조회 API)
* CIK 공시 조회 루프 내에서 `10-Q` 포맷을 필터링해 최근 제출된 최신 분기 보고서 **`filing10Q`** 1개를 추가 수집하여 JSON 응답에 포함시킵니다.
* 응답 구조 확장: `{ filings, filing10K, filingsForm4 }` ➡️ `{ filings, filing10K, filing10Q, filingsForm4 }`

#### [MODIFY] [prompts.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/api/sec/analyze/prompts.ts) (프롬프트 빌더)
* `FundamentalsInput` 인터페이스를 확장하여 최근 4분기 매출/순이익 추이(`quarterlyRevenue`) 및 다음 분기 예상 가이던스 정보(`nextEarningsEstimate`)를 넘겨받을 수 있도록 수정합니다.
* 확장된 재무 맥락을 프롬프트 본문에 녹여내어 AI가 구체적인 분기 실적 흐름 및 예상 전망 대비 8-K 수시 공시의 가치를 정량적으로 평가하도록 프롬프트를 보강합니다.

#### [MODIFY] [stream/route.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/api/sec/analyze/stream/route.ts) & [route.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/api/sec/analyze/route.ts) (분석 API)
* **Yahoo Finance API 확장**: `quoteSummary` 모듈에 `calendarEvents`를 추가하고, 최근 4분기 실제 매출 추이와 다음 실적 가이던스 평균 전망치(Revenue/EPS Average)를 수집하여 `fundamentalsData`에 적재합니다.
* **10-Q 분기 보고서 스크랩**: 프론트엔드에서 수신한 `url10Q`를 이용해 HTML을 fetch하고, 연결손익계산서(`Statements of Operations`) 인근 텍스트 6,000자를 스크랩하여 병합합니다.

---

### 2. UI Layer

#### [MODIFY] [page.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/page.tsx)
* `filing10Q` 상태를 신설하고, SEC 조회 완료 시 바인딩합니다.
* `handleAnalyze` 호출 시 `url10Q` 파라미터(10-Q URL)를 함께 주입하여 분석 요청을 송신합니다.
* `FilingList` 컴포넌트의 프로프로 `filing10Q`를 전달합니다.

#### [MODIFY] [FilingList.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/features/stock-analyzer/components/FilingList.tsx)
* `FilingListProps` 인터페이스에 `filing10Q`를 추가합니다.
* 공시 리스트 상단 "연계 분석 대상" 요약 박스에 **"10-Q 분기 보고서 (재무제표 데이터 연계)"** 상태 배지를 노출합니다.
* 하단 종합 분석 버튼 레이블을 **"최근 5개 8-K + 10-K/Q + Form 4 종합 분석"**으로 갱신합니다.

---

## Verification Plan

### Automated & Manual Verification
1. **타입 정합성**: `npx tsc --noEmit`을 실행하여 모든 Typescript 형식이 유효한지 빌드 체크.
2. **디버그 로그 확인**: Yahoo Finance에서 분기 매출액/가이던스 전망치가 잘 받아와지는지 및 10-Q 손익계산서 텍스트 슬라이싱이 정상적으로 작동하는지 터미널 출력 확인.
3. **분석 완성도 검증**: 실시간 AI 보고서에서 최근 분기 매출 누락 없이 정확한 수치가 인용되는지, 가이던스 판단이 이루어지는지 한국어 출력 테스트.
