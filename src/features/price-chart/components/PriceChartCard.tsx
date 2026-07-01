'use client';

import * as React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import { LineChart, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import CardWrapper from '@/components/CardWrapper';
import InfoTooltip from '@/components/InfoTooltip';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup } from '@/components/ui/toggle-group';
import { ChartRangeData } from '@/lib/price';

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
  // Format XAxis ticks based on range
  const formatXAxis = (tickStr: string | number): string => {
    try {
      if (!tickStr) return '';
      const date = new Date(tickStr);
      if (range === '1D') {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      }
      if (range === '1W' || range === '1M') {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}.${day}`;
      }
      // 1Y
      const year = String(date.getFullYear()).substring(2);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${year}.${month}`;
    } catch {
      return String(tickStr || '');
    }
  };

  // Format Tooltip label (date/time)
  const formatTooltipLabel = (labelStr: React.ReactNode): React.ReactNode => {
    try {
      if (typeof labelStr !== 'string' && typeof labelStr !== 'number') {
        return labelStr;
      }
      const date = new Date(labelStr);
      if (range === '1D') {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${date.toLocaleDateString('ko-KR')} ${hours}:${minutes}`;
      }
      return date.toLocaleDateString('ko-KR');
    } catch {
      return labelStr;
    }
  };

  return (
    <CardWrapper
      title={ticker ? `${ticker} 주가 차트 및 가격 변동` : "주가 차트 및 가격 변동"}
      icon={<LineChart className="w-5 h-5 text-blue-400" />}
      headerRight={
        ticker ? (
          <ToggleGroup value={range} onValueChange={onRangeChange}>
            <Toggle value="1D">1일</Toggle>
            <Toggle value="1W">1주</Toggle>
            <Toggle value="1M">1달</Toggle>
            <Toggle value="1Y">1년</Toggle>
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
                <div className={`flex items-center gap-1 text-sm font-bold ${chartData.changePercent >= 0 ? "text-blue-400" : "text-rose-400"}`}>
                  {chartData.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
                  <span>{chartData.changePercent >= 0 ? "+" : ""}{chartData.changePercent}%</span>
                </div>
              ) : (
                <span className="text-sm font-bold text-slate-400">N/A</span>
              )}
            </div>

            <div className="flex flex-col gap-0.5 border-l border-slate-800/60 pl-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase">기간 최고 / 최저</span>
              <span className="text-sm font-bold text-slate-100">
                ${chartData.high} / ${chartData.low}
              </span>
            </div>

            <div className="flex flex-col gap-0.5 border-l border-slate-800/60 pl-4">
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
          <div className="h-64 w-full bg-slate-950/10 rounded-xl border border-slate-900/60 p-2 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.quotes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceRangeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 9, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  domain={["auto", "auto"]} 
                  tick={{ fontSize: 9, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <ChartTooltip
                  contentStyle={{ 
                    backgroundColor: "rgba(15, 23, 42, 0.95)", 
                    borderColor: "#1e293b", 
                    borderRadius: "8px",
                    fontSize: "11px",
                    color: "#e2e8f0",
                    padding: "8px",
                  }}
                  labelFormatter={formatTooltipLabel}
                  formatter={(value: unknown) => {
                    if (typeof value === 'number' || typeof value === 'string') {
                      return [`$${Number(value).toFixed(2)}`, '종가'];
                    }
                    return ['', '종가'];
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="close" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#priceRangeGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </CardWrapper>
  );
}
