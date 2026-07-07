'use client';

import * as React from 'react';
import { Loader2, Wallet } from 'lucide-react';
import CardWrapper from '@/components/CardWrapper';
import MetricItem from '@/components/MetricItem';
import { Fundamentals } from '../types';

interface LiquidityAndConsensusCardProps {
  ticker: string;
  fundamentals: Fundamentals | null;
  loading: boolean;
}

export default function LiquidityAndConsensusCard({
  ticker,
  fundamentals,
  loading,
}: LiquidityAndConsensusCardProps): React.JSX.Element {
  const formatCash = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return 'N/A';
    return `$${(val / 1000000).toFixed(1)}M`;
  };

  const formatRunwayMonths = (months: number | null | undefined): string => {
    if (months === null || months === undefined) return 'N/A';
    if (months === 999) return '안정적 (순유입)';
    return `${months.toFixed(1)}개월`;
  };

  return (
    <CardWrapper
      title={ticker ? `${ticker} 재무 안전성 & 시장 컨센서스` : "재무 안전성 & 시장 컨센서스"}
      icon={<Wallet className="w-5 h-5 text-emerald-400" />}
    >
      {loading && (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 flex-1">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          <span className="text-xs">재무 안전성 정보를 불러오는 중...</span>
        </div>
      )}

      {!loading && !ticker && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
          <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 text-slate-400 mb-3 animate-pulse">
            <Wallet className="w-6 h-6" />
          </div>
          <p className="text-xs leading-relaxed max-w-[200px]">
            상단 검색창에 티커를 입력하시면 재무 안전성 및 컨센서스 지표를 로드합니다.
          </p>
        </div>
      )}

      {!loading && ticker && !fundamentals && (
        <div className="py-4 text-center text-slate-400 text-xs flex-1 flex items-center justify-center">
          재무 안전성 데이터를 수집하지 못했습니다.
        </div>
      )}

      {!loading && ticker && fundamentals && (
        <div className="flex flex-col gap-5 flex-1">
          {/* 유동성 및 주주 구성 */}
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-2.5">재무 유동성 및 주주 지분 구조</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MetricItem
                label="가용 현금 자산"
                value={formatCash(fundamentals.cashAndEquivalents)}
                tooltipContent="대차대조표상 기업이 즉시 현금화하여 운영비나 인프라 증설에 사용할 수 있는 현금 및 단기 투자 자산의 총합입니다."
              />
              <MetricItem
                label="예상 현금 런웨이 (Runway)"
                value={
                  <span className={`font-bold ${
                    fundamentals.cashRunwayMonths && fundamentals.cashRunwayMonths < 12 
                      ? "text-rose-600 dark:text-rose-400" 
                      : fundamentals.cashRunwayMonths === 999 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-slate-600 dark:text-slate-200"
                  }`}>
                    {formatRunwayMonths(fundamentals.cashRunwayMonths)}
                  </span>
                }
                tooltipContent="현재 현금 소모 속도(Cash Burn) 대비 가용 자산으로 버틸 수 있는 예상 개월 수입니다. 12개월 미만인 경우 자금난 우려가 있습니다."
              />
              <MetricItem
                label="내부자 지분율 (Insider)"
                value={fundamentals.insidersPercentHeld ?? 'N/A'}
                tooltipContent="회사 경영진 및 주요 주주(내부자)가 보유한 주식의 지분율입니다. 지분율이 높을수록 책임 경영 및 주주 친화 경영 가능성이 높습니다."
              />
              <MetricItem
                label="기관 투자자 지분율 (Institution)"
                value={fundamentals.institutionsPercentHeld ?? 'N/A'}
                tooltipContent="투자은행, 뮤추얼 펀드, 연기금 등 전문 금융 기관들이 보유한 주식의 비율입니다. 기관 지분율이 높을수록 주가 안정성이 높아지는 경향이 있습니다."
              />
            </div>
          </div>

          <hr className="border-slate-800/60" />

          {/* 시장 컨센서스 분산도 */}
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-2.5">시장 컨센서스 기대 편차</span>
            <div className="grid grid-cols-1 gap-3">
              <MetricItem
                label="목표가 기대 편차율 (Variance)"
                value={
                  fundamentals.targetPriceDeviationPercent !== undefined && fundamentals.targetPriceDeviationPercent !== null ? (
                    <span className={fundamentals.targetPriceDeviationPercent > 40 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-slate-600 dark:text-slate-200"}>
                      {fundamentals.targetPriceDeviationPercent.toFixed(1)}%
                    </span>
                  ) : 'N/A'
                }
                tooltipContent="월가 애널리스트들의 최고 목표가와 최저 목표가의 격차 비율입니다. 이 수치가 높을수록 기업의 미래 가치에 대한 시장의 의견 대립과 불확실성이 크다는 뜻입니다."
              />
            </div>
          </div>

          {/* 동종업계 경쟁사 비교 */}
          {fundamentals.peerMetrics && fundamentals.peerMetrics.length > 0 && (
            <>
              <hr className="border-slate-800/60" />
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-2.5">동종업계 경쟁사 비교 (Peers)</span>
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-3 text-[10px] text-slate-400 font-semibold px-2">
                    <span>경쟁사 티커</span>
                    <span className="text-center">선행 PER</span>
                    <span className="text-right">PBR</span>
                  </div>
                  {fundamentals.peerMetrics.map((peer, idx) => (
                    <div key={idx} className="grid grid-cols-3 bg-slate-950/40 px-2 py-1.5 rounded-md border border-slate-800/50 text-[11px]">
                      <span className="font-bold text-blue-400">{peer.ticker}</span>
                      <span className="text-center text-slate-200">{typeof peer.forwardPE === 'number' ? `${peer.forwardPE.toFixed(2)}배` : peer.forwardPE}</span>
                      <span className="text-right text-slate-200">{typeof peer.priceToBook === 'number' ? `${peer.priceToBook.toFixed(2)}배` : peer.priceToBook}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </CardWrapper>
  );
}
