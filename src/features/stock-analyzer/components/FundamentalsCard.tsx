"use client";

import { Fundamentals, PriceMetrics } from '../types';
import { 
  BarChart3, 
  Loader2, 
  TrendingUp, 
  TrendingDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
} from 'recharts';
import CardWrapper from '@/components/CardWrapper';
import MetricItem from '@/components/MetricItem';
import InfoTooltip from '@/components/InfoTooltip';

interface FundamentalsCardProps {
  ticker: string;
  fundamentals: Fundamentals | null;
  priceMetrics: PriceMetrics | null;
  loading: boolean;
}

export default function FundamentalsCard({ 
  ticker, 
  fundamentals, 
  priceMetrics, 
  loading 
}: FundamentalsCardProps) {
  const formatPercent = (val: number | null) => {
    if (val === null) return 'N/A';
    return `${(val * 100).toFixed(1)}%`;
  };

  const formatPE = (val: number | null) => {
    if (val === null) return 'N/A';
    return `${val.toFixed(2)}배`;
  };

  const formatQuarterDate = (dateStr: string): string => {
    const match1 = dateStr.match(/^([1-4])Q([0-9]{2,4})$/i);
    if (match1) {
      const quarter = match1[1];
      let year = match1[2];
      if (year.length === 2) {
        year = `20${year}`;
      }
      return `${year} ${quarter}분기`;
    }

    const match2 = dateStr.match(/^([0-9]{4})Q([1-4])$/i);
    if (match2) {
      return `${match2[1]} ${match2[2]}분기`;
    }

    const match3 = dateStr.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/);
    if (match3) {
      const year = match3[1];
      const month = parseInt(match3[2], 10);
      const quarter = Math.ceil(month / 3);
      return `${year} ${quarter}분기`;
    }

    return dateStr;
  };

  const getSortScore = (dateStr: string): number => {
    const match1 = dateStr.match(/^([1-4])Q([0-9]{2,4})$/i);
    if (match1) {
      const quarter = parseInt(match1[1], 10);
      let year = parseInt(match1[2], 10);
      if (year < 100) year += 2000;
      return year * 10 + quarter;
    }

    const match2 = dateStr.match(/^([0-9]{4})Q([1-4])$/i);
    if (match2) {
      const year = parseInt(match2[1], 10);
      const quarter = parseInt(match2[2], 10);
      return year * 10 + quarter;
    }

    const match3 = dateStr.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/);
    if (match3) {
      const year = parseInt(match3[1], 10);
      const month = parseInt(match3[2], 10);
      const quarter = Math.ceil(month / 3);
      return year * 10 + quarter;
    }

    const parsed = Date.parse(dateStr);
    return !isNaN(parsed) ? parsed : 0;
  };

  return (
    <CardWrapper
      title={ticker ? `${ticker} 기초 재무 데이터` : '기업 기초 재무 데이터'}
      icon={<BarChart3 className="w-5 h-5 text-blue-400" />}
    >
      {loading && (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 flex-1">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          <span className="text-xs">재무 정보를 불러오는 중...</span>
        </div>
      )}

      {!loading && !ticker && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
          <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 text-slate-400 mb-3 animate-pulse">
            <BarChart3 className="w-6 h-6" />
          </div>
          <p className="text-xs leading-relaxed max-w-[200px]">
            상단 검색창에 티커(예: <strong className="text-blue-400 font-bold">AAPL</strong>)를 입력하시면 개별 기업의 실시간 재무 지표를 로드합니다.
          </p>
        </div>
      )}

      {!loading && ticker && !fundamentals && (
        <div className="py-4 text-center text-slate-500 text-xs flex-1 flex items-center justify-center">
          재무 데이터를 수집하지 못했습니다. (야후 파이낸스 점검 중)
        </div>
      )}

      {!loading && ticker && fundamentals && (
        <div className="flex flex-col gap-5 flex-1">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* 현재 PER (Trailing PE) */}
            <MetricItem
              label="현재 PER (Trailing PE)"
              value={formatPE(fundamentals.trailingPE)}
              tooltipContent="최근 12개월 동안 발표된 실제 주당순이익(EPS)을 기준으로 계산한 주가수익비율입니다. 현재 주가가 기업의 실제 수익력 대비 몇 배 수준인지 보여줍니다."
            />

            {/* 선행 PER (Forward PE) */}
            <MetricItem
              label="선행 PER (Forward PE)"
              value={formatPE(fundamentals.forwardPE)}
              tooltipContent="향후 12개월 동안의 예상 주당순이익(EPS)을 기준으로 계산한 주가수익비율입니다. 미래의 이익 성장 전망치 대비 주가 수준을 평가할 때 사용됩니다."
            />

            {/* 주가순자산비율 (PBR) */}
            <MetricItem
              label="주가순자산비율 (PBR)"
              value={formatPE(fundamentals.priceToBook)}
              tooltipContent="주가를 주당순자산가치(BPS)로 나눈 비율입니다. 기업의 자산가치(청산가치) 대비 주가가 어떻게 평가받고 있는지 나타냅니다."
            />

            {/* 매출 성장률 (전년 동기 대비) */}
            <MetricItem
              label="매출 성장률 (전년 동기 대비)"
              value={
                <span className={`flex items-center gap-1 ${
                  fundamentals.revenueGrowth && fundamentals.revenueGrowth > 0 ? 'text-blue-400' : 'text-rose-400'
                }`}>
                  {fundamentals.revenueGrowth && fundamentals.revenueGrowth > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
                  {formatPercent(fundamentals.revenueGrowth)}
                </span>
              }
              tooltipContent="전년 동기 대비 최근 분기의 매출 성장 비율입니다. 기업의 외형적인 비즈니스 규모가 성장하는 속도를 나타냅니다."
            />
          </div>

          {/* Price Metrics Summary Grid */}
          {priceMetrics && (
            <div className="grid grid-cols-3 gap-2 bg-slate-950/20 p-3 rounded-xl border border-slate-900/50">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase">현재 주가</span>
                <div className="flex items-baseline gap-1 flex-wrap">
                  <span className="text-xs font-bold text-slate-200">${priceMetrics.currentPrice}</span>
                  {priceMetrics.changePercent !== null && (
                    <span className={`text-[9px] font-bold ${priceMetrics.changePercent >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                      ({priceMetrics.changePercent >= 0 ? '+' : ''}{priceMetrics.changePercent}%)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-0.5 border-l border-slate-900 pl-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase">180일 최고/최저</span>
                <span className="text-[10px] font-bold text-slate-300">
                  ${priceMetrics.high180d} / ${priceMetrics.low180d}
                </span>
              </div>

              <div className="flex flex-col gap-0.5 border-l border-slate-900 pl-3">
                <div className="flex items-center gap-0.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">180일 변동성</span>
                  <InfoTooltip content="최근 180일(6개월/2분기) 일일 종가의 변동성(평균 대비 표준편차 비율, Coefficient of Variation)입니다. 값이 높을수록 주가 널뛰기가 심한 고위험 종목임을 나타냅니다." />
                </div>
                <span className="text-[10px] font-bold text-slate-300">
                  {priceMetrics.volatility180d}%
                </span>
              </div>
            </div>
          )}

          {/* 180-Day Price Chart */}
          {priceMetrics && priceMetrics.quotes && priceMetrics.quotes.length > 0 && (
            <div className="flex flex-col">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">최근 180일 주가 추이</span>
              <div className="h-28 w-full bg-slate-950/10 rounded-xl border border-slate-900/60 p-1.5 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceMetrics.quotes} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(tick) => {
                        const parts = tick.split('-');
                        return parts.length === 3 ? `${parts[1]}.${parts[2]}` : tick;
                      }}
                      tick={{ fontSize: 8, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      tick={{ fontSize: 8, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ChartTooltip
                      contentStyle={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                        borderColor: '#1e293b', 
                        borderRadius: '6px',
                        fontSize: '10px',
                        color: '#e2e8f0',
                        padding: '6px'
                      }}
                      labelFormatter={(label) => `날짜: ${label}`}
                      formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '종가']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="close" 
                      stroke="#3b82f6" 
                      strokeWidth={1.5}
                      fillOpacity={1} 
                      fill="url(#priceGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* EPS History Chart */}
          {fundamentals.epsHistory && fundamentals.epsHistory.length > 0 && (() => {
            const sortedEpsHistory = [...fundamentals.epsHistory].sort(
              (a, b) => getSortScore(b.date) - getSortScore(a.date)
            );
            return (
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">최근 4분기 EPS 추이</span>
                  <InfoTooltip
                    content={
                      <>
                        <strong>EPS (주당순이익)</strong>
                        <p className="mt-1 text-[11px] text-slate-400">
                          기업이 벌어들인 순이익을 유통주식수로 나눈 값으로, 1주당 얼마의 이익을 창출했는지를 나타내는 지표입니다.
                        </p>
                      </>
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  {sortedEpsHistory.map((item, index) => {
                    const isBeat = item.actual !== null && item.estimate !== null && item.actual >= item.estimate;
                    return (
                      <div key={index} className="flex justify-between items-center bg-slate-950/30 p-2 rounded-lg border border-slate-800/40 text-[11px]">
                        <span className="font-bold text-slate-200">{formatQuarterDate(item.date)}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">예상: <strong className="text-slate-200">{item.estimate !== null ? `$${item.estimate.toFixed(2)}` : 'N/A'}</strong></span>
                          <span className="text-slate-400">실제: <strong className={isBeat ? 'text-blue-400' : 'text-rose-400'}>{item.actual !== null ? `$${item.actual.toFixed(2)}` : 'N/A'}</strong></span>
                          {item.actual !== null && item.estimate !== null && (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              isBeat ? 'bg-blue-500/10 text-blue-400' : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              {isBeat ? 'Beat' : 'Miss'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </CardWrapper>
  );
}
