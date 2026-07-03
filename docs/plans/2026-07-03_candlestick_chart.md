# 차트 캔들스틱(Candlestick) 교체 및 로고 숨김 구현 계획

현재 영역(Area)으로 표시되는 주가 차트를 봉 차트(**Candlestick Chart**)로 변경하기 위해 주가 조회 API 데이터를 확장하고, 차트 렌더링 방식을 캔들스틱 형식으로 개편합니다. 아울러 차트 하단의 TradingView 워터마크 로고를 CSS 스타일링을 통해 숨김 처리합니다.

## User Review Required

> [!NOTE]
> **양봉 및 음봉 색상 테마 설정**
> 
> 국내 투자자에게 가장 익숙하고 직관적인 **한국 증권 시장 차트 테마**를 적용합니다.
> - **양봉 (상승)**: 빨간색 계열 (`#ef4444` / Red)
> - **음봉 (하락)**: 파란색 계열 (`#3b82f6` / Blue)
>
> **TradingView 워터마크 로고 제거**
> - Lightweight Charts는 공식적으로 차트 캔버스 내의 상표 로고를 끄는 API를 지원하지 않습니다.
> - 따라서 차트 컨테이너 하위의 링크 요소(`a` 태그)를 CSS 선택자(`[&_a]:hidden`)를 활용해 보이지 않도록 숨김 처리합니다.

## Proposed Changes

### Data Layer & Types

#### [MODIFY] [index.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/types/index.ts)
- `PriceQuote` 및 `YahooFinanceQuote` 인터페이스에 캔들스틱 그리기에 필요한 **시가(`open`)**, **고가(`high`)**, **저가(`low`)** 속성을 추가합니다.

```typescript
export interface PriceQuote {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
}

export interface YahooFinanceQuote {
  date: Date | string | number;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  close: number | null | undefined;
}
```

#### [MODIFY] [price.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/lib/price.ts)
- `getPriceChartData` 함수에서 Yahoo Finance 데이터로부터 `close`뿐만 아니라 `open`, `high`, `low` 정보도 함께 가공하여 반환하도록 변경합니다.
- 각 수치는 소수점 2자리로 반올림 처리하여 일관된 형식으로 반환합니다.

---

### UI Components

#### [MODIFY] [PriceChartCard.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/features/price-chart/components/PriceChartCard.tsx)
- `AreaSeries` 대신 `CandlestickSeries`를 임포트하여 사용합니다.
- 차트 초기화 시 `addSeries` 메서드에 `CandlestickSeries`를 넘겨 한국식 양봉/음봉 색상 테마를 부여합니다.
- `formattedData` 매핑 로직에서 `time` 외에 `open`, `high`, `low`, `close` 값을 정상 바인딩합니다. (데이터 누락 시를 대비해 `close`로 폴백 처리)
- 차트 캔버스를 렌더링하는 `div` 태그의 부모 혹은 본체에 `[&_a]:hidden` CSS 클래스를 지정하여 TradingView의 로고 링크가 보이지 않도록 제거합니다.

## Verification Plan

### Automated Tests
- 빌드 테스트: `npx tsc --noEmit`을 통해 인터페이스 구조 변경에 의한 타입 컴파일 에러 유무 확인.

### Manual Verification
- 브라우저를 통해 주가 차트 영역에 양봉/음봉 봉 차트가 선명하게 그려지는지 확인.
- 차트 좌측/우측 하단 등에 표시되던 TradingView 링크 및 로고가 CSS를 통해 완벽히 가려졌는지 검증.
- 1일, 1주, 1달, 1년 기간 필터를 변경할 때 캔들이 올바른 간격과 색상으로 교체 렌더링되는지 확인.
