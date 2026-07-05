'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
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
}

type TabType = '8-K' | '10-K' | '10-Q' | 'Form-4';

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
}: FilingListProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>('8-K');
  const [prevTicker, setPrevTicker] = useState(activeTicker);

  if (activeTicker !== prevTicker) {
    setPrevTicker(activeTicker);
    setActiveTab('8-K');
  }

  return (
    <CardWrapper
      title="SEC 주요 공시 원문"
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
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* 탭 인터페이스 (배지 형태의 버튼들) */}
          <div className="flex flex-wrap gap-2 p-1.5 bg-slate-950/60 rounded-xl border border-slate-800/40">
            <button
              onClick={() => setActiveTab('8-K')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                activeTab === '8-K'
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              8-K 수시 ({filings.length})
            </button>

            {filing10K && (
              <button
                onClick={() => setActiveTab('10-K')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  activeTab === '10-K'
                    ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                    : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                10-K 연례
              </button>
            )}

            {filing10Q && (
              <button
                onClick={() => setActiveTab('10-Q')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  activeTab === '10-Q'
                    ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                    : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                10-Q 분기
              </button>
            )}

            {filingsForm4 && filingsForm4.length > 0 && (
              <button
                onClick={() => setActiveTab('Form-4')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  activeTab === 'Form-4'
                    ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                    : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                Form 4 내부자 ({filingsForm4.length})
              </button>
            )}
          </div>

          {/* 탭 콘텐츠 렌더링 */}
          <div className="flex-1 min-h-0">
            {/* 8-K 탭 */}
            {activeTab === '8-K' && (
              filings.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
                    {filings.slice(0, 10).map((filing, index) => {
                      const isAnalyzingCombined = activeFiling?.accessionNumber === 'combined-analysis' && isAnalyzing;
                      return (
                        <div
                          key={filing.accessionNumber}
                          className={`p-3 rounded-xl border transition-all flex flex-col gap-2.5 ${
                            isAnalyzingCombined
                              ? 'bg-slate-900/60 border-blue-500/30'
                              : 'bg-slate-950/40 border-slate-800 hover:border-slate-700/80'
                          }`}
                        >
                          <div className="flex flex-wrap justify-between items-center gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {filing.form}
                              </span>
                              <span className="text-[9px] text-slate-500 font-semibold font-mono">공시 {index + 1}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{filing.filingDate}</span>
                            </div>
                            <a
                              href={filing.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-slate-400 hover:text-blue-400 flex items-center gap-0.5 transition-colors shrink-0 font-medium"
                            >
                              원본 보기 <ArrowUpRight className="w-3.5 h-3.5" />
                            </a>
                          </div>
                          <p className="text-xs font-medium text-slate-200 line-clamp-2 leading-relaxed">
                            {filing.description || `${activeTicker} 8-K 수시 공시`}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  {filings.length > 10 && (
                    <p className="text-[10px] text-slate-500 text-center mt-1">
                      * 최근 10개의 공시만 선별하여 종합 분석을 진행합니다. (총 {filings.length}개 공시 중)
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/40 text-center text-slate-400 text-xs py-8">
                  최근 8-K 수시 공시 기록이 없습니다.
                </div>
              )
            )}

            {/* 10-K 탭 */}
            {activeTab === '10-K' && filing10K && (
              <div className="p-4 rounded-xl border bg-slate-950/40 border-slate-800 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Form 10-K
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">제출일: {filing10K.filingDate}</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200 mb-1">연례 보고서 (Annual Report)</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    기업의 전년도 사업 실적, 재무 상태, 시장 리스크 요인 및 경영진의 분석(MD&A)이 총망라된 공식 연례 보고서입니다.
                  </p>
                </div>
                <div className="flex justify-end pt-2 border-t border-slate-900">
                  <a
                    href={filing10K.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold transition-colors"
                  >
                    10-K 원문 전체 보기 <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {/* 10-Q 탭 */}
            {activeTab === '10-Q' && filing10Q && (
              <div className="p-4 rounded-xl border bg-slate-950/40 border-slate-800 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Form 10-Q
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">제출일: {filing10Q.filingDate}</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200 mb-1">분기 보고서 (Quarterly Report)</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    최근 분기 실적 및 비인증 재무제표가 포함된 보고서로, 연례 보고서에 비해 최신 비즈니스 흐름과 단기 재무 성과를 파악하기에 적합합니다.
                  </p>
                </div>
                <div className="flex justify-end pt-2 border-t border-slate-900">
                  <a
                    href={filing10Q.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold transition-colors"
                  >
                    10-Q 원문 전체 보기 <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}

            {/* Form 4 탭 */}
            {activeTab === 'Form-4' && filingsForm4.length > 0 && (
              <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
                {filingsForm4.map((filing, index) => (
                  <div
                    key={filing.accessionNumber || index}
                    className="p-3 rounded-xl border bg-slate-950/40 border-slate-800 hover:border-slate-700/80 flex flex-col gap-2.5"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Form 4
                        </span>
                        <span className="text-[9px] text-slate-500 font-semibold font-mono">기록 {index + 1}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{filing.filingDate}</span>
                      </div>
                      <a
                        href={filing.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-slate-400 hover:text-blue-400 flex items-center gap-0.5 transition-colors shrink-0 font-medium"
                      >
                        원본 보기 <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <p className="text-xs font-medium text-slate-200 leading-relaxed">
                      {filing.description || `${activeTicker} 내부자(임원/대주주) 주식 매매 공시`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </CardWrapper>
  );
}
