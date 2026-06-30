# 5개 공시 동시 종합 분석 아키텍처 및 UI 변경 구현 계획

기존에는 여러 8-K 수시 공시 중 사용자가 직접 1개를 클릭하여 분석하는 구조였습니다. 그러나 특정 공시에는 재무 정보가 누락되어 분석 결과가 불충분할 수 있어, 최근 노출된 5개 공시를 모두 긁어와 하나로 합쳐서 종합적인 재무 영향도를 분석하는 시나리오로 변경하고자 합니다.

## User Review Required

> [!IMPORTANT]
> 5개 공시를 동시에 수집하여 분석을 요청하면 각 공시의 원문을 병렬로 스크랩(Scraping)하므로 네트워크 호출 횟수가 늘어나고, AI의 분석 컨텍스트 크기도 커지게 됩니다. 
> * **최적화 대응**: 각 공시 원문의 텍스트 추출 한도를 **최대 4,000자**로 제한하여 총 20,000자 내외로 유지하고, Gemini 모델이 빠른 속도로 안정적으로 답변할 수 있도록 제어하겠습니다.

---

## Proposed Changes

### 1. API Layer

#### [MODIFY] [route.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/api/sec/analyze/route.ts)
* 단일 `url` 파라미터 대신 `urls: string[]` 배열을 받아 처리하도록 파라미터 파싱부 수정.
* `Promise.all`을 이용해 여러 개 공시의 HTML을 비동기 스크랩하여 통합된 텍스트(`combinedScrapedText`)로 합치고, 각 공시 텍스트는 구분자(`[공시 1 원문]`, `[공시 2 원문]`)를 붙여서 구분합니다.

#### [MODIFY] [stream/route.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/api/sec/analyze/stream/route.ts)
* 위 `route.ts`와 동일하게 스트리밍 전용 API에도 `urls` 기반 스크랩 및 텍스트 병합 로직을 이식합니다.

---

### 2. UI Layer

#### [MODIFY] [page.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/page.tsx)
* `handleAnalyze` 함수가 `Filing[]` 배열을 인자로 받도록 수정합니다.
* 분석이 실행되면 `activeFiling` 상태에 **종합 분석용 가상 Filing 객체**를 삽입하여 UI 플레이스홀더를 통과하게 합니다.
* `useObject`의 `submit`을 호출할 때 `{ urls: string[], ticker: string }` 형식으로 전달합니다.

#### [MODIFY] [FilingList.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/features/stock-analyzer/components/FilingList.tsx)
* `FilingListProps`의 `onAnalyze` 타입을 `(filings: Filing[]) => void`로 변경합니다.
* 개별 카드 내부에 존재하던 `AI 분석하기` 버튼을 제거하고, 공시 정보와 원본 보기 링크만 렌더링하도록 디자인을 깔끔하게 유지합니다.
* 공시 리스트 영역 최하단에 **"최근 5개 공시 종합 AI 분석"**을 실행하는 대형 버튼을 추가합니다.
* 분석 실행 중(`isAnalyzing`)일 때 버튼의 로딩 상태 피드백을 사용자에게 보여줍니다.

---

## Verification Plan

### Automated & Manual Verification
1. **타입 확인**: `npx tsc --noEmit`으로 컴파일 에러 유무 확인.
2. **기능 검증**:
   * 티커 검색 후 최근 공시 목록 노출 확인.
   * 하단의 **"최근 5개 공시 종합 AI 분석"** 버튼 클릭 시, 5개 공시의 텍스트가 병합되어 Gemini AI에 올바르게 전달되는지 터미널 로그로 확인.
   * AI 분석 리포트의 타이틀 영역에 "8-K 종합 분석 (최근 5개 공시)"과 같은 표시가 나타나며 한글로 답변이 스트리밍되는지 확인.
