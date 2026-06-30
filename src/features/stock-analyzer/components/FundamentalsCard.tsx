"use client";

import { Fundamentals } from '../types';
import { 
  BarChart3, 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  HelpCircle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FundamentalsCardProps {
  ticker: string;
  fundamentals: Fundamentals | null;
  loading: boolean;
}

export default function FundamentalsCard({ ticker, fundamentals, loading }: FundamentalsCardProps) {
  const formatPercent = (val: number | null) => {
    if (val === null) return 'N/A';
    return `${(val * 100).toFixed(1)}%`;
  };

  const formatPE = (val: number | null) => {
    if (val === null) return 'N/A';
    return `${val.toFixed(2)}x`;
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
    <TooltipProvider>
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800/60">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-lg text-slate-100">{ticker} 기초 재무 데이터</h3>
        </div>

        {loading && (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span className="text-xs">재무 정보를 불러오는 중...</span>
          </div>
        )}

        {!loading && !fundamentals && (
          <div className="py-4 text-center text-slate-500 text-xs">
            재무 데이터를 수집하지 못했습니다. (야후 파이낸스 점검 중)
          </div>
        )}

        {!loading && fundamentals && (
          <div className="flex flex-col gap-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* 현재 PER (Trailing PE) */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-slate-400 text-xs font-semibold block">현재 PER (Trailing PE)</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-slate-500 hover:text-slate-300 transition-colors cursor-help">
                        <HelpCircle className="w-3 h-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[220px] leading-relaxed">
                      <p>최근 12개월 동안 발표된 실제 주당순이익(EPS)을 기준으로 계산한 주가수익비율입니다. 현재 주가가 기업의 실제 수익력 대비 몇 배 수준인지 보여줍니다.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-lg font-bold text-slate-100">{formatPE(fundamentals.trailingPE)}</span>
              </div>

              {/* 선행 PER (Forward PE) */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-slate-400 text-xs font-semibold block">선행 PER (Forward PE)</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-slate-500 hover:text-slate-300 transition-colors cursor-help">
                        <HelpCircle className="w-3 h-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[220px] leading-relaxed">
                      <p>향후 12개월 동안의 예상 주당순이익(EPS)을 기준으로 계산한 주가수익비율입니다. 미래의 이익 성장 전망치 대비 주가 수준을 평가할 때 사용됩니다.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-lg font-bold text-slate-100">{formatPE(fundamentals.forwardPE)}</span>
              </div>

              {/* 주가순자산비율 (PBR) */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-slate-400 text-xs font-semibold block">주가순자산비율 (PBR)</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-slate-500 hover:text-slate-300 transition-colors cursor-help">
                        <HelpCircle className="w-3 h-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[220px] leading-relaxed">
                      <p>주가를 주당순자산가치(BPS)로 나눈 비율입니다. 기업의 자산가치(청산가치) 대비 주가가 어떻게 평가받고 있는지 나타냅니다.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-lg font-bold text-slate-100">{formatPE(fundamentals.priceToBook)}</span>
              </div>

              {/* 매출 성장률 (YoY) */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-slate-400 text-xs font-semibold block">매출 성장률 (YoY)</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-slate-500 hover:text-slate-300 transition-colors cursor-help">
                        <HelpCircle className="w-3 h-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[220px] leading-relaxed">
                      <p>전년 동기 대비 최근 분기의 매출 성장 비율입니다. 기업의 외형적인 비즈니스 규모가 성장하는 속도를 나타냅니다.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className={`text-lg font-bold flex items-center gap-1 ${
                  fundamentals.revenueGrowth && fundamentals.revenueGrowth > 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {fundamentals.revenueGrowth && fundamentals.revenueGrowth > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
                  {formatPercent(fundamentals.revenueGrowth)}
                </span>
              </div>
            </div>

            {/* EPS History Chart */}
            {fundamentals.epsHistory && fundamentals.epsHistory.length > 0 && (() => {
              const sortedEpsHistory = [...fundamentals.epsHistory].sort(
                (a, b) => getSortScore(b.date) - getSortScore(a.date)
              );
              return (
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">최근 4분기 EPS 추이</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-slate-500 hover:text-slate-300 transition-colors cursor-help">
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[260px] leading-relaxed">
                        <p><strong>EPS (주당순이익)</strong></p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          기업이 벌어들인 순이익을 유통주식수로 나눈 값으로, 1주당 얼마의 이익을 창출했는지를 나타내는 지표입니다.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex flex-col gap-3">
                    {sortedEpsHistory.map((item, index) => {
                      const isBeat = item.actual !== null && item.estimate !== null && item.actual >= item.estimate;
                      return (
                        <div key={index} className="flex justify-between items-center bg-slate-950/30 p-2.5 rounded-lg border border-slate-800/40 text-xs">
                          <span className="font-bold text-slate-300">{formatQuarterDate(item.date)}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-slate-400">예상: <strong className="text-slate-200">{item.estimate?.toFixed(2) ?? 'N/A'}</strong></span>
                            <span className="text-slate-400">실제: <strong className={isBeat ? 'text-emerald-400' : 'text-rose-400'}>{item.actual?.toFixed(2) ?? 'N/A'}</strong></span>
                            {item.actual !== null && item.estimate !== null && (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isBeat ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
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
      </div>
    </TooltipProvider>
  );
}
