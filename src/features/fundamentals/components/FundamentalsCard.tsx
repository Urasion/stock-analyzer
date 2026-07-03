'use client';

import * as React from 'react';
import { BarChart3, Loader2, TrendingUp, TrendingDown, DollarSign, Users, Target, Activity } from 'lucide-react';
import CardWrapper from '@/components/CardWrapper';
import MetricItem from '@/components/MetricItem';
import InfoTooltip from '@/components/InfoTooltip';
import { Fundamentals } from '../types';

interface FundamentalsCardProps {
  ticker: string;
  fundamentals: Fundamentals | null;
  loading: boolean;
}

export default function FundamentalsCard({
  ticker,
  fundamentals,
  loading,
}: FundamentalsCardProps): React.JSX.Element {
  const formatPercent = (val: number | null): string => {
    if (val === null) return 'N/A';
    return `${(val * 100).toFixed(1)}%`;
  };

  const formatPE = (val: number | null): string => {
    if (val === null) return 'N/A';
    return `${val.toFixed(2)}배`;
  };

  const formatCash = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return 'N/A';
    return `$${(val / 1000000).toFixed(1)}M`;
  };

  const formatRunway = (months: number | null | undefined): string => {
    if (months === null || months === undefined) return 'N/A';
    if (months === 999) return '안정적 (순유입)';
    return `${months.toFixed(1)}개월`;
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
      title={ticker ? `${ticker} 기초 재무 데이터` : "기업 기초 재무 데이터"}
      icon={<BarChart3 className="w-5 h-5 text-blue-400" />}
    >
      {loading && (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400 flex-1">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          <span className="text-xs">재무 정보를 불러오는 중...</span>
        </div>
      )}

      {!loading && !ticker && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
          <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 text-slate-400 mb-3 animate-pulse">
            <BarChart3 className="w-6 h-6" />
          </div>
          <p className="text-xs leading-relaxed max-w-[200px]">
            상단 검색창에 티커(예: <strong className="text-blue-400 font-bold">AAPL</strong>)를 입력하시면 개별 기업의 실시간 재무 지표를 로드합니다.
          </p>
        </div>
      )}

      {!loading && ticker && !fundamentals && (
        <div className="py-4 text-center text-slate-400 text-xs flex-1 flex items-center justify-center">
          재무 데이터를 수집하지 못했습니다. (야후 파이낸스 점검 중)
        </div>
      )}

      {!loading && ticker && fundamentals && (
        <div className="flex flex-col gap-6 flex-1 overflow-y-auto">
          {/* 섹션 1: 기본 밸류에이션 및 성장성 */}
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-2.5">기본 밸류에이션 및 성장성</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MetricItem
                label="현재 PER (Trailing PE)"
                value={formatPE(fundamentals.trailingPE)}
                tooltipContent="최근 12개월 동안 발표된 실제 주당순이익(EPS)을 기준으로 계산한 주가수익비율입니다. 현재 주가가 기업의 실제 수익력 대비 몇 배 수준인지 보여줍니다."
              />
              <MetricItem
                label="선행 PER (Forward PE)"
                value={formatPE(fundamentals.forwardPE)}
                tooltipContent="향후 12개월 동안의 예상 주당순이익(EPS)을 기준으로 계산한 주가수익비율입니다. 미래의 이익 성장 전망치 대비 주가 수준을 평가할 때 사용됩니다."
              />
              <MetricItem
                label="주가순자산비율 (PBR)"
                value={formatPE(fundamentals.priceToBook)}
                tooltipContent="주가를 주당순자산가치(BPS)로 나눈 비율입니다. 기업의 자산가치(청산가치) 대비 주가가 어떻게 평가받고 있는지 나타냅니다."
              />
              <MetricItem
                label="매출 성장률 (전년 동기 대비)"
                value={
                  <span className={`flex items-center gap-1 ${
                    fundamentals.revenueGrowth && fundamentals.revenueGrowth > 0 ? "text-blue-400" : "text-rose-400"
                  }`}>
                    {fundamentals.revenueGrowth && fundamentals.revenueGrowth > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
                    {formatPercent(fundamentals.revenueGrowth)}
                  </span>
                }
                tooltipContent="전년 동기 대비 최근 분기의 매출 성장 비율입니다. 기업의 외형적인 비즈니스 규모가 성장하는 속도를 나타냅니다."
              />
            </div>
          </div>

          <hr className="border-slate-800/60" />

          {/* 섹션 2: 유동성 및 주주 구성 */}
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
                      ? "text-rose-400" 
                      : fundamentals.cashRunwayMonths === 999 
                        ? "text-blue-400" 
                        : "text-slate-200"
                  }`}>
                    {formatRunway(fundamentals.cashRunwayMonths)}
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

          {/* 섹션 3: 시장 컨센서스 분산도 */}
          <div>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-2.5">시장 컨센서스 기대 편차</span>
            <div className="grid grid-cols-1 gap-3">
              <MetricItem
                label="목표가 기대 편차율 (Variance)"
                value={
                  fundamentals.targetPriceDeviationPercent !== undefined && fundamentals.targetPriceDeviationPercent !== null ? (
                    <span className={fundamentals.targetPriceDeviationPercent > 40 ? "text-amber-400" : "text-slate-200"}>
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

          <hr className="border-slate-800/60" />

          {/* EPS History Chart */}
          {fundamentals.epsHistory && fundamentals.epsHistory.length > 0 && (() => {
            const sortedEpsHistory = [...fundamentals.epsHistory].sort(
              (a, b) => getSortScore(b.date) - getSortScore(a.date),
            );
            return (
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">최근 4분기 EPS 추이</span>
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
                      <div key={index} className="flex flex-col min-[400px]:flex-row justify-between min-[400px]:items-center items-start gap-2 bg-slate-950/30 p-2.5 rounded-lg border border-slate-800/40 text-[11px]">
                        <span className="font-bold text-slate-200">{formatQuarterDate(item.date)}</span>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-slate-400">예상: <strong className="text-slate-200">{item.estimate !== null ? `$${item.estimate.toFixed(2)}` : "N/A"}</strong></span>
                          <span className="text-slate-400">실제: <strong className={isBeat ? "text-blue-400" : "text-rose-400"}>{item.actual !== null ? `$${item.actual.toFixed(2)}` : "N/A"}</strong></span>
                          {item.actual !== null && item.estimate !== null && (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                              isBeat ? "bg-blue-500/10 text-blue-400" : "bg-rose-500/10 text-rose-400"
                            }`}>
                              {isBeat ? "Beat" : "Miss"}
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
