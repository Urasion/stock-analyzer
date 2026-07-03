# 타입 선언 규칙 정의 및 타입 리팩토링 계획 (수정본)

현재 프로젝트의 `src/lib` 파일들과 일부 피처 컴포넌트 내에 도메인 관련 `interface` 및 `type`이 직접 정의되어 있어, 구조적 일관성이 부족하고 중복 선언이 발생하고 있습니다. 또한, 작업 계획서의 변경 이력을 프로젝트 내에서 추적할 수 있도록 하는 기록 보존 규칙을 수립하고자 합니다.

이를 위해 `AGENTS.md`에 타입 선언 및 관리 규칙, 그리고 계획서 이력 관리 규칙을 추가하고, 기존 코드들을 해당 규칙에 맞춰 리팩토링합니다.

## User Review Required

> [!NOTE]
> - `AGENTS.md` 파일에 두 가지 주요 개발 규칙을 추가합니다:
>   1. 타입 선언 경로 및 분리 규칙 (전역 `src/types` vs. 피처별 `src/features/[feature-name]/types`)
>   2. 사용자가 `implementation_plan.md`를 승인(Proceed)할 경우, 해당 계획서를 프로젝트의 `docs/plans/` 디렉토리에 자동으로 기록/저장하는 규칙
> - 이번 작업을 진행하기에 앞서, 본 계획서를 `docs/plans/2026-07-01_type_refactoring.md` 파일로 먼저 자동 저장하여 규칙을 몸소 실천합니다.

## Proposed Changes

### 1. 개발 규칙 추가

#### [MODIFY] [AGENTS.md](file:///Users/jeongjiwon/projects/2026/stock-analyzer/AGENTS.md)
- `AGENTS.md` 파일에 다음 내용을 추가합니다:
  - **4. 타입 선언 및 관리 규칙**:
    - 여러 피처에서 공통으로 사용되는 전역 타입은 `src/types/index.ts`에 정의합니다.
    - 특정 피처 내부에서만 사용하는 타입은 `src/features/[feature-name]/types/index.ts`에 정의합니다.
    - `src/lib` 유틸리티 및 컴포넌트 파일 내에 핵심 도메인/API 인터페이스를 직접 선언하지 않고 분리하여 사용합니다.
  - **5. 계획서 이력 관리 규칙**:
    - AI 에이전트가 `implementation_plan.md`를 작성하고 사용자가 `Proceed` 버튼을 누르면, 해당 계획서 내용을 프로젝트의 `docs/plans/` 디렉토리 아래에 `YYYY-MM-DD_작업명.md` 형식의 파일로 복사하여 기록을 보존해야 합니다.

---

### 2. 계획서 이력 관리 실천

#### [NEW] [docs/plans/2026-07-01_type_refactoring.md](file:///Users/jeongjiwon/projects/2026/stock-analyzer/docs/plans/2026-07-01_type_refactoring.md)
- 이 작업 계획서를 규칙에 맞춰 프로젝트의 `docs/plans/` 디렉토리에 복사하여 저장합니다.

---

### 3. 전역 타입 보완

#### [MODIFY] [index.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/types/index.ts)
- `src/lib/price.ts`에서 사용 중이던 야후 파이낸스 원시 응답 타입 `YahooFinanceQuote`를 전역 타입 파일로 이동시킵니다.
  ```typescript
  export interface YahooFinanceQuote {
    date: Date | string | number;
    close: number | null | undefined;
  }
  ```

---

### 4. 피처별 타입 정의 및 분리

#### [NEW] [index.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/features/price-chart/types/index.ts)
- `src/features/price-chart/types` 디렉토리를 신규 생성합니다.
- `src/lib/price.ts`에 정의되어 있던 `ChartRangeData` 인터페이스를 이 위치로 이동합니다.

#### [MODIFY] [index.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/features/macro-indicators/types/index.ts)
- `src/lib/macro.ts` 내부 API 응답 객체 분석에 쓰이는 `FredObservation` 타입을 이 피처 타입 파일에 추가합니다.

---

### 5. 라이브러리 및 컴포넌트 리팩토링 (Import 변경)

#### [MODIFY] [macro.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/lib/macro.ts)
- 인라인으로 선언된 `MacroIndicator`, `YieldCurveIndicator`, `MacroData`, `FredObservation` 인터페이스를 제거합니다.
- 제거한 타입들을 `src/features/macro-indicators/types`에서 import하여 사용하도록 수정합니다.

#### [MODIFY] [price.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/lib/price.ts)
- 인라인으로 선언된 `PriceQuote`, `YahooFinanceQuote`, `PriceMetrics`, `ChartRangeData` 인터페이스를 제거합니다.
- `PriceQuote`, `PriceMetrics`, `YahooFinanceQuote`는 전역 `@/types`에서 import합니다.
- `ChartRangeData`는 `@/features/price-chart/types`에서 import합니다.

#### [MODIFY] [PriceChartCard.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/features/price-chart/components/PriceChartCard.tsx)
- `ChartRangeData`를 `@/lib/price`에서 직접 가져오지 않고, `@/features/price-chart/types` 또는 relative path를 통해 가져오도록 수정합니다.

---

## Verification Plan

### Automated Tests
- TypeScript 컴파일러(`tsc --noEmit`) 또는 빌드 명령(`npm run build`)을 실행하여 타입 참조 오류가 없는지 확인합니다.

### Manual Verification
- 로컬 개발 서버(`npm run dev`)를 실행하고, 브라우저에서 `/` (개잡주 판독기) 페이지의 주가 차트 및 매크로 지표 기능이 정상 작동하는지 확인합니다.
