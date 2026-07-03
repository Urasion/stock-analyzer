# Gemini 모델 선택 UI 및 동적 API 연동 구현 계획 (승인 후 Lightweight Charts 교체 작업으로 수정됨)

기존 `recharts` 기반의 주가 차트를 보다 직관적이고 금융 서비스에 적합한 **TradingView Lightweight Charts** 라이브러리로 교체합니다. 이 변경을 통해 성능이 향상되고 금융 특화 차트의 완성도를 높입니다.

## User Review Required

> [!IMPORTANT]
> **패키지 추가 설치 필요**
>
> 본 계획 승인 시 `lightweight-charts` 라이브러리를 프로젝트에 추가로 설치합니다.
> - 설치 명령어: `npm install lightweight-charts`
>
> **디자인 변경점**
> - 기존 Recharts 기반의 SVG 영역 차트에서 HTML5 Canvas 기반의 금융 전문 인터랙티브 영역 차트로 변경됩니다.
> - 마우스 호버 시 십자선(Crosshair) 가이드라인 및 툴팁이 차트 캔버스 내부에 네이티브하게 표시되며, 드래그를 통한 줌(Zooming) 및 패닝(Panning)이 가능해집니다.

## Proposed Changes

### Dependencies & Setup

#### [MODIFY] [package.json](file:///Users/jeongjiwon/projects/2026/stock-analyzer/package.json)
- `lightweight-charts` 패키지를 종속성 목록에 추가합니다.

---

### UI Components

#### [MODIFY] [PriceChartCard.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/features/price-chart/components/PriceChartCard.tsx)
- `recharts` 라이브러리 임포트 및 관련 차트 선언 블록을 삭제합니다.
- `lightweight-charts`를 사용한 React Ref 기반 차트 렌더링 로직을 작성합니다.
  - `useRef`로 차트를 생성할 컨테이너 `div`를 관리합니다.
  - `useEffect` 내에서 `createChart`를 수행하고, 컴포넌트 언마운트 시 혹은 데이터 업데이트 시 이전 차트 인스턴스를 메모리에서 클린업(`chart.remove()`)합니다.
  - 다크 테마(`slate-950` 배경, `slate-800` 격자선, `blue-500` 메인 테마 색상)와 어울리도록 차트 옵션을 커스터마이징합니다.
  - 차트의 크기 변화에 대응하기 위해 `ResizeObserver` 또는 `window.resize` 리스너를 활용해 컨테이너 크기에 맞춰 차트를 자동으로 리사이징합니다.
- API에서 내려온 `quotes`(`{ date: string, close: number }[]`) 데이터를 `lightweight-charts` 포맷에 맞게 변환합니다.
  - **포맷 변환 로직**:
    - `1D` 및 `1W`와 같은 인트라데이(분/시간 단위) 차트는 UNIX 타임스탬프(초 단위)로 매핑합니다: `time: Math.floor(new Date(quote.date).getTime() / 1000)`
    - `1M` 및 `1Y`와 같은 일 단위 차트는 로컬 타임스탬프 혹은 `YYYY-MM-DD` 문자열로 매핑하여 X축 레이블이 날짜별로 올바르게 표시되도록 설정합니다.

## Verification Plan

### Automated Tests
- 패키지 설치 확인: `npm install` 후 성공 여부 검증.
- TypeScript 컴파일 검사: `npx tsc --noEmit`을 돌려 컴포넌트 변경 후 타입 에러가 생기지 않는지 검증.

### Manual Verification
- 로컬 개발 서버(`npm run dev`)를 통해 브라우저에서 차트 로드 상태 확인.
- 임의의 티커(예: TSLA, AAPL 등)를 검색하여 차트 데이터가 Canvas 형태로 정상 렌더링되는지 확인.
- 기간 필터(`1D`, `1W`, `1M`, `1Y`)를 변경할 때 차트 영역과 X축 날짜/시간 레이블이 포맷에 맞추어 매끄럽게 갱신되는지 확인.
- 마우스 드래그 및 마우스 휠을 통해 확대/축소 및 좌우 이동(Pan/Zoom)이 원활하게 동작하는지 검증.
