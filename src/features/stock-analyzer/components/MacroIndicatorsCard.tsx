"use client";

import { MacroData } from '../types';
import { 
  Globe, 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  HelpCircle,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MacroIndicatorsCardProps {
  macroData: MacroData | null;
  loading: boolean;
  error?: string;
}

export default function MacroIndicatorsCard({ macroData, loading, error }: MacroIndicatorsCardProps) {
  
  const getTrendIcon = (trend: 'up' | 'down' | 'flat', metricType: 'rate' | 'inflation' | 'unrate') => {
    if (trend === 'up') {
      // For macro metrics in a stock analyzer, rising rates/inflation are generally warnings (rose), rising unemployment is also warning (rose)
      const color = 'text-rose-400';
      return <TrendingUp className={`w-3.5 h-3.5 ${color}`} />;
    }
    if (trend === 'down') {
      // Falling rates/inflation are generally favorable (blue)
      const color = 'text-blue-400';
      return <TrendingDown className={`w-3.5 h-3.5 ${color}`} />;
    }
    return <Minus className="w-3.5 h-3.5 text-slate-500" />;
  };

  const getTrendText = (trend: 'up' | 'down' | 'flat') => {
    if (trend === 'up') return '상승세';
    if (trend === 'down') return '하락세';
    return '동결/횡보';
  };

  const getTrendBgColor = (trend: 'up' | 'down' | 'flat') => {
    if (trend === 'up') return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    if (trend === 'down') return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    return 'bg-slate-800/40 text-slate-400 border border-slate-800/40';
  };

  const formatQuarterDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}년 ${month}월`;
  };

  return (
    <TooltipProvider>
      <div className={`backdrop-blur-md border rounded-2xl p-6 shadow-xl h-full flex flex-col transition-all duration-300 ${
        macroData?.yieldCurveSpread.isInverted 
          ? 'bg-rose-950/5 border-rose-950/40 shadow-rose-950/5'
          : 'bg-slate-900/40 border-slate-900 shadow-slate-950/20'
      }`}>
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <Globe className={`w-5 h-5 ${macroData?.yieldCurveSpread.isInverted ? 'text-rose-400' : 'text-blue-400'}`} />
            <h3 className="font-bold text-lg text-slate-100">글로벌 거시경제 지표</h3>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
            macroData?.yieldCurveSpread.isInverted 
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          }`}>
            FRED API 연동
          </span>
        </div>

        {loading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 flex-1">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span className="text-xs font-medium">연준(FRED) 경제 지표를 불러오는 중...</span>
          </div>
        )}

        {!loading && error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex gap-2 flex-1 items-start">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold block mb-0.5">거시경제 로드 실패</span>
              <span className="text-[10px] text-slate-400">FRED API 연결에 실패했거나 키 설정을 확인하십시오. ({error})</span>
            </div>
          </div>
        )}

        {!loading && !macroData && !error && (
          <div className="py-4 text-center text-slate-500 text-xs flex-1 flex items-center justify-center">
            거시경제 데이터를 수집하지 못했습니다.
          </div>
        )}

        {!loading && macroData && (
          <div className="flex flex-col gap-5 flex-1">
            <p className="text-[11px] text-slate-400 leading-normal mb-1">
              미국 연방준비제도(Fed)에서 실시간 제공하는 핵심 지표입니다. 고금리 및 인플레이션 추이는 특히 부채 비율이 높고 성장에 자금 공급이 시급한 <strong className="text-rose-400/90 font-semibold">한계 기업(개잡주)</strong>에 결정적인 부도 리스크로 작용합니다.
            </p>

            {/* Inversion Alert if yield curve is inverted */}
            {macroData.yieldCurveSpread.isInverted && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex gap-2.5 items-start">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                <div className="text-xs">
                  <h4 className="font-bold text-rose-400">장단기 금리차 역전 (Recession Warning)</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                    10년물과 2년물 국채 금리가 역전된 상태입니다. 역사적으로 평균 1~2년 이내 높은 확률로 경기 침체가 동반되었습니다. 부채가 많거나 현금 흐름이 적자인 투기성 종목 투자를 특히 조심하십시오.
                  </p>
                </div>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3.5">
              
              {/* 1. Federal Funds Rate */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 mb-1 justify-between">
                    <span className="text-slate-400 text-[11px] font-bold block truncate">미국 기준금리</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-slate-500 hover:text-slate-200 transition-colors cursor-help shrink-0">
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[220px] leading-relaxed">
                        <p><strong>연방기금 실효금리 (FEDFUNDS)</strong></p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          미국 기준금리 수준입니다. 고금리 환경은 기업의 차입 비용(이자)을 증가시켜, 유동성이 부족한 중소형 및 투기성 종목에 치명적인 타격을 줍니다.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="text-lg font-bold text-slate-100">{macroData.fedFundsRate.value}%</span>
                </div>
                <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-slate-900/60 text-[10px]">
                  <span className="text-slate-500 font-medium font-mono">{formatQuarterDate(macroData.fedFundsRate.date)}</span>
                  <span className={`px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5 ${getTrendBgColor(macroData.fedFundsRate.trend)}`}>
                    {getTrendIcon(macroData.fedFundsRate.trend, 'rate')}
                    {getTrendText(macroData.fedFundsRate.trend)}
                  </span>
                </div>
              </div>

              {/* 2. Inflation YoY */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 mb-1 justify-between">
                    <span className="text-slate-400 text-[11px] font-bold block truncate">물가상승률 (YoY)</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-slate-500 hover:text-slate-200 transition-colors cursor-help shrink-0">
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[220px] leading-relaxed">
                        <p><strong>소비자물가지수 전년비 (CPI YoY)</strong></p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          물가 상승 속도입니다. 인플레이션이 높으면 기업의 생산 원가 및 인건비가 가파르게 오릅니다. 제품 가격에 이를 전가하지 못하는 한계 기업은 마진이 파괴됩니다.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="text-lg font-bold text-slate-100">{macroData.inflationYoY.value}%</span>
                </div>
                <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-slate-900/60 text-[10px]">
                  <span className="text-slate-500 font-medium font-mono">{formatQuarterDate(macroData.inflationYoY.date)}</span>
                  <span className={`px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5 ${getTrendBgColor(macroData.inflationYoY.trend)}`}>
                    {getTrendIcon(macroData.inflationYoY.trend, 'inflation')}
                    {getTrendText(macroData.inflationYoY.trend)}
                  </span>
                </div>
              </div>

              {/* 3. Yield Curve Spread */}
              <div className={`p-3 bg-slate-950/60 rounded-xl border flex flex-col justify-between ${
                macroData.yieldCurveSpread.isInverted ? 'border-rose-950/50' : 'border-slate-800/60'
              }`}>
                <div>
                  <div className="flex items-center gap-1 mb-1 justify-between">
                    <span className="text-slate-400 text-[11px] font-bold block truncate">장단기 금리차 (10Y-2Y)</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-slate-500 hover:text-slate-200 transition-colors cursor-help shrink-0">
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[220px] leading-relaxed">
                        <p><strong>국채 스프레드 (T10Y2Y)</strong></p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          10년물 국채 금리에서 2년물 금리를 뺀 값입니다. 이 값이 음수(역전)로 떨어지면 은행 대출 회수와 경기 둔화 우려가 깊어지며 불황의 강력한 전조가 됩니다.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className={`text-lg font-bold ${macroData.yieldCurveSpread.isInverted ? 'text-rose-400 font-extrabold' : 'text-slate-100'}`}>
                    {macroData.yieldCurveSpread.value}%
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-slate-900/60 text-[10px]">
                  <span className="text-slate-500 font-medium font-mono">{macroData.yieldCurveSpread.date.substring(5)}</span>
                  {macroData.yieldCurveSpread.isInverted ? (
                    <span className="px-1.5 py-0.5 rounded-md font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] flex items-center gap-0.5 shrink-0">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      금리역전
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-md font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] flex items-center gap-0.5 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      정상상태
                    </span>
                  )}
                </div>
              </div>

              {/* 4. Unemployment Rate */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 mb-1 justify-between">
                    <span className="text-slate-400 text-[11px] font-bold block truncate">미국 실업률</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-slate-500 hover:text-slate-200 transition-colors cursor-help shrink-0">
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[220px] leading-relaxed">
                        <p><strong>실업률 지표 (UNRATE)</strong></p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          실직자 비율입니다. 실업률이 급등하면 경기 침체가 실제로 진행 중임을 뜻하며, 실업률이 비정상적으로 낮으면 고용 시장 과열로 인한 연준의 고금리 장기화 가능성이 커집니다.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="text-lg font-bold text-slate-100">{macroData.unemploymentRate.value}%</span>
                </div>
                <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-slate-900/60 text-[10px]">
                  <span className="text-slate-500 font-medium font-mono">{formatQuarterDate(macroData.unemploymentRate.date)}</span>
                  <span className={`px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5 ${getTrendBgColor(macroData.unemploymentRate.trend)}`}>
                    {getTrendIcon(macroData.unemploymentRate.trend, 'unrate')}
                    {getTrendText(macroData.unemploymentRate.trend)}
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
