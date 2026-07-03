# 모바일 화면 대응 및 UI 스타일 뭉개짐 개선 계획

현재 모바일 뷰포트에서 발생할 수 있는 레이아웃 겹침, 컴포넌트 뭉개짐, 부자연스러운 줄바꿈 및 가로 오버플로우 문제를 해결하기 위해 반응형 레이아웃 및 폰트 크기, 마진 등을 개선합니다.

## User Review Required

> [!IMPORTANT]
> 이번 개선은 데스크톱 환경의 레이아웃에는 영향을 주지 않으면서, 모바일(모바일 가로/세로) 및 태블릿 기기에서 가독성을 높이고 스타일이 뭉개지는 것을 방지하는 데 초점을 맞춥니다.
> 주요 변경 사항으로 내비게이션 바의 AI 모델 표시 뱃지가 모바일(640px 미만)에서는 공간 확보를 위해 숨겨집니다.

## Open Questions

- 없음 (기본 UI 디자인 및 색상 톤은 그대로 유지하고 반응형 클래스만 보완합니다.)

## Proposed Changes

---

### Global & Shared Components

#### [MODIFY] [Navbar.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/components/Navbar.tsx)
- 우측의 `"Gemini 3.5 Flash Model Configured"` 뱃지가 모바일 화면에서 로고 영역과 겹쳐서 레이아웃을 무너뜨리는 문제를 해결하기 위해, 모바일 화면에서는 뱃지를 숨기고 데스크톱 화면에서만 노출하도록 `hidden sm:flex` 클래스를 적용합니다.

#### [MODIFY] [CardWrapper.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/components/CardWrapper.tsx)
- 카드 헤더의 제목과 우측 커스텀 컴포넌트(`headerRight`, 예: 기간 변경 토글 버튼)가 모바일 가로 폭에서 서로 충돌하는 문제를 방지하기 위해, 모바일 뷰포트에서는 세로로 적층되고 태블릿 이상에서 가로 정렬되도록 헤더 영역을 `flex-col sm:flex-row sm:items-center justify-between gap-3`으로 변경합니다.

---

### Search Feature

#### [MODIFY] [SearchForm.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/features/search/components/SearchForm.tsx)
- 메인 타이틀 폰트 크기를 모바일 뷰포트에 맞게 반응형(`text-2xl sm:text-3xl`)으로 수정합니다.
- 본문 텍스트 내 강제 줄바꿈 `<br />` 태그에 `hidden md:inline`을 적용하여 좁은 화면에서 어색하게 래핑되는 현상을 방지합니다.
- 모바일 가로 공간을 배려하여 검색 입력창의 placeholder를 더 간결한 `"티커 입력 (예: NVDA, AAPL)"`로 조절합니다.

---

### Macro & Fundamentals Features

#### [MODIFY] [MacroIndicatorsCard.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/features/macro-indicators/components/MacroIndicatorsCard.tsx)
- 핵심 지표 4개 그리드 레이아웃을 `grid-cols-2`에서 모바일 대응 `grid-cols-1 sm:grid-cols-2`로 변경하여, 좁은 가로 폭에서 뱃지와 수치 텍스트가 겹치거나 뭉개지지 않도록 공간을 충분히 확보합니다.

#### [MODIFY] [FundamentalsCard.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/features/fundamentals/components/FundamentalsCard.tsx)
- 마찬가지로 핵심 재무 지표 4개 그리드를 `grid-cols-1 sm:grid-cols-2`로 개선합니다.
- `최근 4분기 EPS 추이` 목록 항목들을 모바일 초소형 화면(320px~375px)에서도 깨지지 않도록 `flex-col xs:flex-row xs:items-center` 레이아웃으로 변경하고 패딩을 조절합니다.

---

### Price Chart Feature

#### [MODIFY] [PriceChartCard.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/features/price-chart/components/PriceChartCard.tsx)
- 주가 정보 요약 보드(`현재 주가`, `기간 변동률`, `최고/최저`, `변동성`)가 모바일에서 2열 배치(2x2)가 될 때, 2행 1열에 위치한 세 번째 항목에 어색하게 남아 있는 왼쪽 경계선(`border-l`)을 제거합니다.
- 2x2 배치 구조에 적합하도록, 두 번째 열에만 `border-l`을 남기고, 2행(3, 4번 항목)에는 상단 경계선(`border-t pt-4`)을 적용하며, 데스크톱(`md`) 뷰포트 진입 시에는 원래의 1x4 횡형 분할선으로 자연스럽게 전환되도록 수정합니다.

---

### SEC Filings Feature

#### [MODIFY] [FilingList.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/features/sec-filings/components/FilingList.tsx)
- 8-K 공시 리스트 항목 내 헤더 정보(`Form 유형`, `공시 번호`, `날짜`, `원본 보기 링크`)가 폭이 좁은 화면에서 가로 영역 밖으로 밀려나거나 겹치는 현상을 방지하도록 flex 래핑 스타일(`flex-wrap items-center gap-2`)을 적용하고 모바일 정렬 구조를 다듬습니다.

---

## Verification Plan

### Automated Tests
- 프로젝트 빌드 테스트: `npm run build`를 실행하여 컴파일 에러 및 구문 오류가 없는지 검증합니다.

### Manual Verification
- 브라우저 개발자 도구의 기기 에뮬레이터(Device Toolbar)를 사용해 iPhone SE(320px), iPhone 12 Pro(390px), iPad(768px) 등의 환경에서 각 컴포넌트의 뭉개짐 여부와 반응형 레이아웃의 정상 작동 여부를 눈으로 확인합니다.
