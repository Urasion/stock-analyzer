'use client';

import * as React from 'react';
import {
  FileText,
  Loader2,
  AlertOctagon,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import CardWrapper from '@/components/CardWrapper';
import { Filing } from '@/types';

interface FilingListProps {
  filings: Filing[];
  filing10K: Filing | null;
  filing10Q: Filing | null;
  filingsForm4: Filing[];
  loading: boolean;
  error: string;
  activeFiling: Filing | null;
  isAnalyzing: boolean;
  activeTicker: string;
  onAnalyze: (
    filings: Filing[],
    filing10K: Filing | null,
    filing10Q: Filing | null,
    filingsForm4: Filing[],
  ) => void;
}

export default function FilingList({
  filings,
  filing10K,
  filing10Q,
  filingsForm4,
  loading,
  error,
  activeFiling,
  isAnalyzing,
  activeTicker,
  onAnalyze,
}: FilingListProps): React.JSX.Element {
  return (
    <CardWrapper
      title="최근 SEC 8-K 수시 공시"
      icon={<FileText className="w-5 h-5 text-blue-400" />}
    >
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 flex-1">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <span className="text-sm font-medium">SEC에서 공시 목록을 불러오는 중...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex gap-2 flex-1 items-start">
          <AlertOctagon className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !activeTicker && !error && (
        <div className="py-12 text-center text-slate-400 text-sm flex-1 flex items-center justify-center">
          티커를 검색하여 공시 리스트를 확인하세요.
        </div>
      )}

      {!loading && activeTicker && !error && (
        <div className="flex flex-col gap-4 flex-1">
          {/* 연계 분석 대상 요약 상태 노출 */}
          {(filing10K || filing10Q || (filingsForm4 && filingsForm4.length > 0)) && (
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/40 flex flex-col gap-2 text-xs">
              <span className="text-slate-400 font-bold block">연계 분석 대상 (단기 수시공시 외)</span>
              <div className="flex flex-wrap gap-2">
                {filing10K && (
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                    10-K 연례 보고서 (리스크 연계)
                  </span>
                )}
                {filing10Q && (
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                    10-Q 분기 보고서 (실적 연계)
                  </span>
                )}
                {filingsForm4 && filingsForm4.length > 0 && (
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                    최근 Form 4 내부자 매매 ({filingsForm4.length}건 연계)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 8-K 공시 목록 */}
          {filings.length > 0 ? (
            <div className="flex flex-col gap-3">
              {filings.slice(0, 5).map((filing, index) => {
                const isAnalyzingCombined = activeFiling?.accessionNumber === 'combined-analysis' && isAnalyzing;
                return (
                  <div
                    key={filing.accessionNumber}
                    className={`p-4 rounded-xl border transition-all flex flex-col gap-2.5 ${
                      isAnalyzingCombined
                        ? 'bg-slate-900/60 border-blue-500/30'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700/80'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {filing.form}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold font-mono">공시 {index + 1}</span>
                        <span className="text-xs text-slate-400 font-medium">{filing.filingDate}</span>
                      </div>
                      <a
                        href={filing.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-400 hover:text-blue-400 flex items-center gap-0.5 transition-colors"
                      >
                        원본 보기 <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <p className="text-sm font-medium text-slate-200 line-clamp-2 leading-relaxed">
                      {filing.description || `${activeTicker} 8-K 수시 공시`}
                    </p>
                  </div>
                );
              })}

              {filings.length > 5 && (
                <p className="text-[11px] text-slate-500 text-center mt-1">
                  * 최근 5개의 공시만 선별하여 종합 분석을 진행합니다. (총 {filings.length}개 공시 중)
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/40 text-center text-slate-400 text-xs py-8">
              최근 8-K 수시 공시 기록이 없습니다.
              <span className="block text-[10px] text-slate-500 mt-1">
                (10-K, 10-Q, Form 4 및 거시경제/재무 지표를 토대로 분석을 수행합니다.)
              </span>
            </div>
          )}

          <button
            onClick={() => onAnalyze(filings.slice(0, 5), filing10K, filing10Q, filingsForm4)}
            disabled={isAnalyzing}
            className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 mt-auto ${
              isAnalyzing
                ? 'bg-slate-900 border border-blue-500/30 text-blue-400 cursor-default'
                : 'bg-blue-600 hover:bg-blue-500 text-slate-950 shadow-lg shadow-blue-500/10 cursor-pointer disabled:opacity-50'
            }`}
            type="button"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                종합 분석 진행 중...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {filings.length > 0
                  ? '최근 5개 8-K + 10-K/Q + Form 4 종합 분석'
                  : '10-K/Q + Form 4 종합 분석 시작'}
              </>
            )}
          </button>
        </div>
      )}
    </CardWrapper>
  );
}
