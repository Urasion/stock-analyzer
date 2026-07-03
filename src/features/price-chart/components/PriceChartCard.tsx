'use client';

import * as React from 'react';
import { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries, Time } from 'lightweight-charts';
import { LineChart, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import CardWrapper from '@/components/CardWrapper';
import InfoTooltip from '@/components/InfoTooltip';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup } from '@/components/ui/toggle-group';
import { ChartRangeData } from '../types';

interface PriceChartCardProps {
  ticker: string;
  chartData: ChartRangeData | null;
  loading: boolean;
  range: string;
  onRangeChange: (range: string) => void;
}

export default function PriceChartCard({
  ticker,
  chartData,
  loading,
  range,
  onRangeChange,
}: PriceChartCardProps): React.JSX.Element {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !chartData || !chartData.quotes || chartData.quotes.length === 0) {
      return;
    }

    const container = chartContainerRef.current;

    // 데이터 가공: 범위에 따른 시간/날짜 키 및 OHLC 맵핑
    const formattedData = chartData.quotes.map((q) => {
      const dateObj = new Date(q.date);
      const timeVal = (range === '1D' || range === '1W')
        ? Math.floor(dateObj.getTime() / 1000) as Time
        : `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}` as Time;

      return {
        time: timeVal,
        open: q.open ?? q.close,
        high: q.high ?? q.close,
        low: q.low ?? q.close,
        close: q.close,
      };
    });

    // 중복 시간 데이터 제거 및 시간순 오름차순 정렬 (Lightweight Charts 제약 조건 대응)
    const uniqueSortedData = formattedData
      .filter((value, index, self) => 
        self.findIndex((v) => v.time === value.time) === index
      )
      .sort((a, b) => {
        if (typeof a.time === 'number' && typeof b.time === 'number') {
          return (a.time as number) - (b.time as number);
        }
        return String(a.time).localeCompare(String(b.time));
      });

    if (uniqueSortedData.length === 0) return;

    // 차트 생성
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8', // slate-400
        fontSize: 10,
        fontFamily: 'sans-serif',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      width: container.clientWidth,
      height: container.clientHeight || 240,
      timeScale: {
        borderVisible: false,
        timeVisible: range === '1D' || range === '1W',
        secondsVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      crosshair: {
        vertLine: {
          color: '#3b82f6', // blue-500
          width: 1,
          style: 3, // Dashed
          labelBackgroundColor: '#1e293b', // slate-800
        },
        horzLine: {
          color: '#3b82f6',
          width: 1,
          style: 3,
          labelBackgroundColor: '#1e293b',
        },
      },
    });

    // 캔들스틱(Candlestick) 시리즈 추가 (한국식 상승/하락 테마 색상 지정)
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#ef4444',      // 양봉: 빨강 (rose-500 / red-500)
      downColor: '#3b82f6',    // 음봉: 파랑 (blue-500)
      borderVisible: false,
      wickUpColor: '#ef4444',  // 양봉 꼬리: 빨강
      wickDownColor: '#3b82f6',// 음봉 꼬리: 파랑
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });

    candlestickSeries.setData(uniqueSortedData);
    chart.timeScale().fitContent();

    // 반응형 크기 변경 대응
    const handleResize = () => {
      if (container) {
        chart.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [chartData, range]);

  return (
    <CardWrapper
      title={ticker ? `${ticker} 주가 차트 및 가격 변동` : '주가 차트 및 가격 변동'}
      icon={<LineChart className="w-5 h-5 text-blue-400" />}
      headerRight={
        ticker ? (
          <ToggleGroup value={range} onValueChange={onRangeChange}>
            <Toggle value="1D">1일</Toggle>
            <Toggle value="1W">1주</Toggle>
            <Toggle value="1M">1달</Toggle>
            <Toggle value="1Y">1년</Toggle>
            <Toggle value="ALL">전체</Toggle>
          </ToggleGroup>
        ) : null
      }
    >
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400 flex-1">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <span className="text-xs">주가 차트 데이터를 가져오는 중...</span>
        </div>
      )}

      {!loading && !ticker && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
          <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 text-slate-400 mb-3 animate-pulse">
            <LineChart className="w-6 h-6" />
          </div>
          <p className="text-xs leading-relaxed max-w-[240px]">
            상단 검색창에 티커를 검색하면 기간별 주가 차트와 변동성 요약 보드가 활성화됩니다.
          </p>
        </div>
      )}

      {!loading && ticker && !chartData && (
        <div className="py-20 text-center text-slate-400 text-xs flex-1 flex items-center justify-center">
          주가 차트 정보를 수집하지 못했습니다.
        </div>
      )}

      {!loading && ticker && chartData && (
        <div className="flex flex-col gap-6 flex-1">
          {/* Range Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase">현재 주가</span>
              <span className="text-base font-bold text-slate-100">${chartData.currentPrice}</span>
            </div>

            <div className="flex flex-col gap-0.5 border-l border-slate-800/60 pl-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase">기간 변동률</span>
              {chartData.changePercent !== null ? (
                <div className={`flex items-center gap-1 text-sm font-bold ${chartData.changePercent >= 0 ? 'text-rose-400' : 'text-blue-400'}`}>
                  {chartData.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4 text-blue-400" />}
                  <span>{chartData.changePercent >= 0 ? '+' : ''}{chartData.changePercent}%</span>
                </div>
              ) : (
                <span className="text-sm font-bold text-slate-400">N/A</span>
              )}
            </div>

            <div className="flex flex-col gap-0.5 border-t border-slate-800/60 pt-4 md:border-t-0 md:pt-0 md:border-l md:border-slate-800/60 md:pl-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase">기간 최고 / 최저</span>
              <span className="text-sm font-bold text-slate-100">
                ${chartData.high} / ${chartData.low}
              </span>
            </div>

            <div className="flex flex-col gap-0.5 border-l border-slate-800/60 pl-4 border-t border-slate-800/60 pt-4 md:border-t-0 md:pt-0">
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase">기간 변동성</span>
                <InfoTooltip content="선택한 기간 동안의 종가 변동성(평균 대비 표준편차 비율, Coefficient of Variation)입니다. 값이 높을수록 단기 주가 널뛰기가 심했음을 의미합니다." />
              </div>
              <span className="text-sm font-bold text-slate-100">
                {chartData.volatility}%
              </span>
            </div>
          </div>

          {/* Area Chart Container */}
          <div className="h-64 w-full bg-slate-950/10 rounded-xl border border-slate-900/60 p-2 overflow-hidden relative">
            {/* Tailwind [&_a]:hidden 선택자를 활용해 캔버스 내부 TradingView attribution 로고 링크 제거 */}
            <div ref={chartContainerRef} className="w-full h-full [&_a]:hidden" />
          </div>
        </div>
      )}
    </CardWrapper>
  );
}
