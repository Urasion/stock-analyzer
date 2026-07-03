'use client';

import * as React from 'react';
import { z } from 'zod';
import {
  Sparkles,
  Loader2,
  AlertOctagon,
  Building2,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Info,
  Gauge,
  CheckCircle2,
} from 'lucide-react';
import { stockAnalysisSchema } from '@/app/schema';
import CardWrapper from '@/components/CardWrapper';
import { Filing } from '@/types';

const formatRevenueWithKorean = (revStr: string | undefined | null): string => {
  if (!revStr) return '집계 중...';
  const trimmed = revStr.trim();
  const match = trimmed.match(/^\$?([0-9,.]+)\s*B$/i);
  if (match) {
    const numValue = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(numValue)) {
      const eokValue = numValue * 10;
      const formattedEok = eokValue.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
      return `${trimmed} (${formattedEok}억 달러)`;
    }
  }
  return trimmed;
};

type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

interface AnalysisReportProps {
  ticker: string;
  activeFiling: Filing | null;
  analysis: DeepPartial<z.infer<typeof stockAnalysisSchema>> | undefined;
  isAnalyzing: boolean;
  error: Error | undefined;
  onAnalyze?: () => void;
}

export default function AnalysisReport({
  ticker,
  activeFiling,
  analysis,
  isAnalyzing,
  error,
  onAnalyze,
}: AnalysisReportProps): React.JSX.Element {
  // Safe fallback and type guard to filter out undefined items during streaming
  const keyDrivers = (analysis?.context?.keyDrivers ?? []).filter((d): d is string => typeof d === 'string');
  const riskFactors = (analysis?.context?.riskFactors ?? []).filter((r): r is string => typeof r === 'string');

  return (
    <CardWrapper
      title="AI 종합 분석 리포트"
      icon={<Sparkles className="w-5 h-5 text-blue-400" />}
      className="min-h-[550px]"
      headerRight={isAnalyzing && (
        <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          실시간 작성 중...
        </div>
      )}
    >
      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex gap-2 mb-4">
          <AlertOctagon className="w-5 h-5 shrink-0" />
          <div>
            <h4 className="font-bold">분석 중 오류 발생</h4>
            <p className="text-xs text-slate-400 mt-1">{error.message || 'API 키 혹은 SEC HTML 크기가 제한을 초과했을 수 있습니다.'}</p>
          </div>
        </div>
      )}

      {/* Empty State / Placeholder */}
      {!activeFiling && !analysis && (
        ticker ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 text-slate-400 mb-4 animate-pulse">
              <Gauge className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-slate-200 text-lg mb-1">분석 데이터 준비 완료</h4>
            <p className="text-slate-400 text-sm max-w-sm mb-6">
              최근 공시 데이터와 재무 및 매크로 지표가 준비되었습니다. 아래 버튼을 클릭하여 AI 종합 분석 리포트를 생성하세요.
            </p>
            {onAnalyze && (
              <button
                onClick={onAnalyze}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-blue-500/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
                type="button"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                AI 종합 분석 시작
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-slate-950/20 flex items-center justify-center border border-slate-800/40 text-slate-500 mb-4">
              <Gauge className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-slate-500 text-lg mb-1">분석 대기 중</h4>
            <p className="text-slate-500 text-sm max-w-sm">
              상단 검색창에서 기업 티커를 검색하면 공시 연계 분석 모델이 활성화됩니다.
            </p>
          </div>
        )
      )}

      {/* Streaming Content Display */}
      {(activeFiling || analysis) && (
        <div className="flex-1 flex flex-col gap-6">
          {/* Active Document Indicator */}
          {activeFiling && (
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-200 font-bold">{ticker}</span>
                <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                  {activeFiling.accessionNumber.slice(0, 15)}...
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Report Date: {activeFiling.reportDate}</span>
            </div>
          )}

          {/* 1. Judgment Block */}
          <div className="p-5 bg-linear-to-br from-slate-950 to-slate-900 rounded-xl border border-slate-800 flex flex-col gap-4 shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex justify-between items-center flex-wrap gap-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">INVESTMENT SENTIMENT</span>
                <div className="flex items-center gap-2">
                  {analysis?.judgment?.sentiment ? (
                    <span className={`text-lg font-extrabold px-3.5 py-1 rounded-full tracking-wider border shadow-md ${
                      analysis.judgment.sentiment === 'STRONG BUY' || analysis.judgment.sentiment === 'BUY'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-blue-500/5'
                        : analysis.judgment.sentiment === 'STRONG SELL' || analysis.judgment.sentiment === 'SELL'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-rose-500/5'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-500/5'
                    }`}>
                      {analysis.judgment.sentiment}
                    </span>
                  ) : (
                    <div className="h-8 w-28 bg-slate-800/80 border border-slate-700/50 rounded-full animate-pulse flex items-center justify-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Evaluating...</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">TONE</span>
                  {analysis?.judgment?.managementTone ? (
                    <span className="text-sm font-semibold text-slate-200">
                      {analysis.judgment.managementTone}
                    </span>
                  ) : (
                    <div className="h-5 w-16 bg-slate-800/60 rounded-md animate-pulse mt-0.5" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1 uppercase tracking-wider">CONFIDENCE</span>
                  {analysis?.judgment?.confidenceScore ? (
                    <span className="text-sm font-semibold text-slate-200">
                      {analysis.judgment.confidenceScore}%
                    </span>
                  ) : (
                    <div className="h-5 w-12 bg-slate-800/60 rounded-md animate-pulse mt-0.5" />
                  )}
                </div>
              </div>
            </div>

            {/* Progress Bar for Confidence */}
            {analysis?.judgment?.confidenceScore !== undefined ? (
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-linear-to-r from-blue-600 to-sky-400 h-1.5 transition-all duration-500"
                  style={{ width: `${analysis.judgment.confidenceScore}%` }}
                ></div>
              </div>
            ) : (
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-slate-800/60 w-1/3 h-1.5 rounded-full animate-pulse" />
              </div>
            )}

            {/* One Line Summary */}
            <div className="mt-2 pt-3 border-t border-slate-800/40">
              <span className="text-[10px] text-slate-400 font-bold block mb-1.5 uppercase tracking-wider">AI 한줄 평</span>
              {analysis?.judgment?.oneLineSummary ? (
                <p className="text-sm font-medium text-slate-200 italic leading-relaxed">
                  &ldquo;{analysis.judgment.oneLineSummary}&rdquo;
                </p>
              ) : (
                <div className="space-y-1.5 py-1">
                  <div className="h-3.5 bg-slate-800/60 rounded-sm animate-pulse w-full" />
                  <div className="h-3.5 bg-slate-800/60 rounded-sm animate-pulse w-5/6" />
                </div>
              )}
            </div>
          </div>

          {/* 2. Financials Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Revenue Card */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/60 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">분기 매출 (Revenue)</span>
                {analysis?.financials?.revenue?.status && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    analysis.financials.revenue.status === 'Beat'
                      ? 'bg-blue-500/10 text-blue-400'
                      : analysis.financials.revenue.status === 'Miss'
                      ? 'bg-rose-500/10 text-rose-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {analysis.financials.revenue.status}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                {analysis?.financials?.revenue?.actual ? (
                  <>
                    <span className="text-lg font-bold text-slate-100">
                      {formatRevenueWithKorean(analysis.financials.revenue.actual)}
                    </span>
                    {analysis.financials.revenue.growthYoY && (
                      <span className="text-xs text-blue-400 font-medium">
                        (전년 동기 대비 {analysis.financials.revenue.growthYoY})
                      </span>
                    )}
                  </>
                ) : (
                  <div className="h-7 w-32 bg-slate-800/60 rounded-md animate-pulse my-0.5" />
                )}
              </div>
            </div>

            {/* EPS Card */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/60 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">분기 EPS</span>
                {analysis?.financials?.eps?.status && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    analysis.financials.eps.status === 'Beat'
                      ? 'bg-blue-500/10 text-blue-400'
                      : analysis.financials.eps.status === 'Miss'
                      ? 'bg-rose-500/10 text-rose-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {analysis.financials.eps.status}
                  </span>
                )}
              </div>
              {analysis?.financials?.eps?.actual ? (
                <span className="text-lg font-bold text-slate-100">
                  {analysis.financials.eps.actual}
                </span>
              ) : (
                <div className="h-7 w-16 bg-slate-800/60 rounded-md animate-pulse my-0.5" />
              )}
            </div>
          </div>

          {/* 3. Guidance Card */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/60 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">향후 가이던스 (Guidance)</span>
              {analysis?.financials?.guidance?.status && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  analysis.financials.guidance.status === 'Raised'
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    : analysis.financials.guidance.status === 'Lowered'
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    : analysis.financials.guidance.status === 'Maintained'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {analysis.financials.guidance.status}
                </span>
              )}
            </div>
            {analysis?.financials?.guidance?.details ? (
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {analysis.financials.guidance.details}
              </p>
            ) : (
              <div className="space-y-1.5 py-1">
                <div className="h-3 bg-slate-800/60 rounded-sm animate-pulse w-full" />
                <div className="h-3 bg-slate-800/60 rounded-sm animate-pulse w-5/6" />
              </div>
            )}
          </div>

          {/* 4. Drivers & Risks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Drivers */}
            <div className="p-4 bg-slate-950/30 rounded-xl border border-slate-800/50 flex flex-col gap-3">
              <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                성장 동력 (Key Drivers)
              </span>
              <ul className="flex flex-col gap-2.5">
                {keyDrivers.length > 0 ? (
                  keyDrivers.map((driver: string, i: number): React.JSX.Element => (
                    <li key={i} className="text-xs text-slate-200 flex items-start gap-1.5 leading-relaxed font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <span>{driver}</span>
                    </li>
                  ))
                ) : (
                  <div className="space-y-2 py-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-slate-800/60 shrink-0 animate-pulse" />
                        <div className="h-3 bg-slate-800/60 rounded-sm animate-pulse w-11/12" />
                      </div>
                    ))}
                  </div>
                )}
              </ul>
            </div>

            {/* Risk Factors */}
            <div className="p-4 bg-slate-950/30 rounded-xl border border-slate-800/50 flex flex-col gap-3">
              <span className="text-[10px] text-rose-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                위험 요인 (Risk Factors)
              </span>
              <ul className="flex flex-col gap-2.5">
                {riskFactors.length > 0 ? (
                  riskFactors.map((risk: string, i: number): React.JSX.Element => (
                    <li key={i} className="text-xs text-slate-200 flex items-start gap-1.5 leading-relaxed font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span>{risk}</span>
                    </li>
                  ))
                ) : (
                  <div className="space-y-2 py-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-slate-800/60 shrink-0 animate-pulse" />
                        <div className="h-3 bg-slate-800/60 rounded-sm animate-pulse w-11/12" />
                      </div>
                    ))}
                  </div>
                )}
              </ul>
            </div>
          </div>

          {/* 5. Shareholder Return */}
          {analysis?.context?.shareholderReturn && (
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/60 flex flex-col gap-1.5">
              <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                주주 환원 정책 (Shareholder Return)
              </span>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {analysis.context.shareholderReturn}
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="text-[10px] text-slate-400 leading-relaxed flex gap-1.5 mt-auto pt-4 border-t border-slate-800/40">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              본 분석 보고서는 SEC 8-K 공시 원문과 최근 재무 시장 데이터를 기반으로 AI(Gemini 2.5 Flash)가 실시간 자동 작성한 리포트이며, 최종 투자 책임은 투자자 본인에게 있습니다.
            </span>
          </div>

        </div>
      )}
    </CardWrapper>
  );
}
