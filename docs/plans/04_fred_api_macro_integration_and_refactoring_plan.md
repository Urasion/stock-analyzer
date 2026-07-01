# FRED 거시경제 지표 연동, 대시보드 리팩토링 및 레이아웃 개편 계획

이 계획서는 주식시장 리스크 판독기("개잡주 판독기")에 FRED(Federal Reserve Economic Data) API를 연동하여 미국 기준금리, 인플레이션, 실업률, 장단기 금리차 데이터를 실시간 수집·표시하고, 이를 AI 분석에 주입하여 리스크 진단을 강화합니다. 또한, 코드 중복을 제거하기 위해 공통 UI 컴포넌트를 설계하여 리팩토링을 수행하고, 화면 레이아웃을 상/하단 2단 구조로 전면 개편합니다.

## User Review Required

> [!IMPORTANT]
> * **FRED API 연동 고도화**: `FEDFUNDS`(기준금리), `CPIAUCSL`(소비자물가), `T10Y2Y`(장단기 금리차), `UNRATE`(실업률)를 실시간 수집하고 YoY 인플레이션을 계산합니다. 장단기 금리 역전 시 시각적인 경고 효과(붉은 네온 등)를 적용합니다.
> * **거시경제 맥락 기반 AI 분석**: 수집된 거시경제 지표를 AI 스트리밍/비스트리밍 분석 API의 프롬프트에 주입하여, AI가 개별 종목의 부채 및 자금 조달 리스크를 현재의 금리·불황 우려 환경 속에서 평가하도록 지시합니다.
> * **공통 UI 컴포넌트 추출**: 대시보드 내 카드 디자인과 보일러플레이트 마크업을 개선하기 위해 `CardWrapper`, `InfoTooltip`, `MetricItem` 컴포넌트를 새로 개발하여 중복 코드를 제거하고 가독성을 높입니다.
> * **상/하단 2단 레이아웃 개편**: 상단에 3단 주요 지표 카드(거시지표, 재무정보, 수시공지)를 배치하고, 하단 가로폭 전체에 분석 리포트 카드를 배치해 가독성을 높이며, 종목 검색 전에도 재무 지표 가이드 카드가 미려하게 유지되도록 디폴트 상태(Default State)를 구현합니다.

---

## Proposed Changes

### 1. Configuration & Backend (API & Lib Layer)

#### [MODIFY] [.env.local](file:///Users/jeongjiwon/projects/2026/stock-analyzer/.env.local)
* 발급된 FRED API Key (`FRED_API_KEY=bb965cee58886e4cfd19123c1742349d`)를 환경 변수에 추가합니다.

#### [NEW] [macro.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/lib/macro.ts) (거시경제 유틸리티)
* FRED API에서 4대 경제지표를 수집하고, YoY 인플레이션을 계산하며, 장단기 금리 스프레드 역전 여부를 판단하는 백엔드 코드를 작성합니다.

#### [NEW] [route.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/api/market/macro/route.ts) (거시경제 API)
* `macro.ts` 유틸리티를 호출하여 정제된 거시경제 데이터를 클라이언트에 JSON 형태로 노출합니다.

#### [MODIFY] [route.ts (스트리밍)](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/api/sec/analyze/stream/route.ts) & [route.ts (비스트리밍)](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/api/sec/analyze/route.ts)
* 분석 시작 시 FRED 거시 데이터를 로드하여 프롬프트 빌더에 매개변수로 전달합니다.

#### [MODIFY] [prompts.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/api/sec/analyze/prompts.ts) (프롬프트 빌더)
* `buildAnalysisPrompt`에 거시 지표 테이블을 전달받아 주입하고, 고금리 및 경기침체 신호(장단기 금리역전)가 해당 주식의 부채 부담과 생존력에 미치는 리스크를 AI가 정밀 분석하도록 프롬프트 지시사항을 강화합니다.

---

## 2. Common UI Components (Shared Layer)

#### [NEW] [CardWrapper.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/components/CardWrapper.tsx)
* 대시보드 위젯의 Glassmorphism 외관 테두리 및 헤더 영역 마크업을 공통화합니다.

#### [NEW] [InfoTooltip.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/components/InfoTooltip.tsx)
* 물음표 모양의 설명 툴팁 보일러플레이트 코드를 줄이고 내부에 자체 `<TooltipProvider>`를 적용해 Context 에러를 원천 차단합니다.

#### [NEW] [MetricItem.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/components/MetricItem.tsx)
* 지표 라벨, 설명 툴팁, 수치 값, 하단 정보 분할 영역(`footer`)을 제공하는 정렬된 지표 박스 요소를 표준화합니다.

---

## 3. Widget & Page Refactoring (UI Layer)

#### [MODIFY] [FilingList.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/features/stock-analyzer/components/FilingList.tsx) & [AnalysisReport.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/features/stock-analyzer/components/AnalysisReport.tsx)
* 카드 껍데기를 공통 `<CardWrapper>` 컴포넌트로 리팩토링합니다.

#### [MODIFY] [FundamentalsCard.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/features/stock-analyzer/components/FundamentalsCard.tsx)
* 외관을 `<CardWrapper>`로 감싸고 4대 재무 정보 및 EPS 추이 도움말을 `<MetricItem>`과 `<InfoTooltip>`으로 리팩토링하여 중복 코드를 제거합니다.
* 종목 미검색 시 디폴트 안내 화면(Default State) 및 동적 카드 타이틀을 추가합니다.

#### [NEW] [MacroIndicatorsCard.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/features/stock-analyzer/components/MacroIndicatorsCard.tsx)
* FRED 경제 데이터를 표시해 주는 대시보드 카드 컴포넌트를 설계합니다. 금리역전 우려 상태를 붉은 경고창과 애니메이션으로 경고하며, 개별 수치는 `<MetricItem>` 구조를 적용합니다.

#### [MODIFY] [theme-toggle.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/components/theme-toggle.tsx) & [layout.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/layout.tsx)
* `theme-toggle` 내 `setMounted` 호출 시 발생하는 ESLint 규칙(`react-hooks/set-state-in-effect`)을 해결하기 위해 `requestAnimationFrame`을 적용합니다.
* 브라우저 크롬 확장 프로그램 등으로 생기는 body 태그 속성 불일치 경고를 제거하도록 body 태그에 `suppressHydrationWarning`을 부여합니다.

#### [MODIFY] [page.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/page.tsx)
- 상단 행: 글로벌 거시경제 지표, 기업 기초 재무 데이터(검색 전 상시 노출), 수시공지 카드가 가로 3열 배치됩니다.
- 하단 행: AI 종합 분석 리포트가 전체 가로폭 너비로 배치됩니다.

---

## Verification Plan

### Automated & Manual Verification
1. **타입 및 빌드 정합성**: `npm run build` 결과 TypeScript 타입 체킹 및 웹팩 최적화 빌드가 100% 성공(Exit Code: 0)하는지 확인.
2. **ESLint 정적 검사**: `npx eslint`를 실행하여 컴포넌트 린트 위반 에러가 발견되지 않는지 검증.
3. **디폴트 유도 화면 검증**: 첫 로딩 시 기초 재무 카드 내에 검색 안내 텍스트가 깨짐 없이 미려하게 잘 들어가는지 확인.
4. **리포트 정렬 검증**: 리포트 종합 분석 시 하단 공간을 효율적으로 채우며 스트리밍이 정상적으로 일어나는지 브라우저 수동 확인.
