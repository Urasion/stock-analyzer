import { Fundamentals } from '../types';
import { 
  BarChart3, 
  Loader2, 
  TrendingUp, 
  TrendingDown 
} from 'lucide-react';

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

  return (
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
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <span className="text-slate-400 text-xs font-semibold block mb-1">Trailing PE</span>
              <span className="text-lg font-bold text-slate-100">{formatPE(fundamentals.trailingPE)}</span>
            </div>
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <span className="text-slate-400 text-xs font-semibold block mb-1">Forward PE</span>
              <span className="text-lg font-bold text-slate-100">{formatPE(fundamentals.forwardPE)}</span>
            </div>
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <span className="text-slate-400 text-xs font-semibold block mb-1">PBR (Price/Book)</span>
              <span className="text-lg font-bold text-slate-100">{formatPE(fundamentals.priceToBook)}</span>
            </div>
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
              <span className="text-slate-400 text-xs font-semibold block mb-1">매출 성장률 (YoY)</span>
              <span className={`text-lg font-bold flex items-center gap-1 ${
                fundamentals.revenueGrowth && fundamentals.revenueGrowth > 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {fundamentals.revenueGrowth && fundamentals.revenueGrowth > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4 text-rose-400" />}
                {formatPercent(fundamentals.revenueGrowth)}
              </span>
            </div>
          </div>

          {/* EPS History Chart */}
          {fundamentals.epsHistory && fundamentals.epsHistory.length > 0 && (
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-3 uppercase tracking-wider">최근 4분기 EPS 추이</span>
              <div className="flex flex-col gap-3">
                {fundamentals.epsHistory.map((item, index) => {
                  const isBeat = item.actual !== null && item.estimate !== null && item.actual >= item.estimate;
                  return (
                    <div key={index} className="flex justify-between items-center bg-slate-950/30 p-2.5 rounded-lg border border-slate-800/40 text-xs">
                      <span className="font-bold text-slate-300">{item.date}</span>
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
          )}
        </div>
      )}
    </div>
  );
}
