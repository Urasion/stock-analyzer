import { Filing } from '../types';
import { 
  FileText, 
  Loader2, 
  AlertOctagon, 
  ArrowUpRight, 
  Sparkles 
} from 'lucide-react';

interface FilingListProps {
  filings: Filing[];
  loading: boolean;
  error: string;
  activeFiling: Filing | null;
  isAnalyzing: boolean;
  activeTicker: string;
  onAnalyze: (filing: Filing) => void;
}

export default function FilingList({
  filings,
  loading,
  error,
  activeFiling,
  isAnalyzing,
  activeTicker,
  onAnalyze
}: FilingListProps) {
  return (
    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800/60">
        <FileText className="w-5 h-5 text-emerald-400" />
        <h3 className="font-bold text-lg text-slate-100">최근 SEC 8-K 수시 공시</h3>
      </div>

      {loading && (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <span className="text-sm font-medium">SEC에서 공시 목록을 불러오는 중...</span>
        </div>
      )}

      {!loading && filings.length === 0 && !error && (
        <div className="py-12 text-center text-slate-500 text-sm">
          {activeTicker ? '해당 티커의 최신 8-K 수시 공시를 찾지 못했습니다.' : '티커를 검색하여 공시 리스트를 확인하세요.'}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex gap-2">
          <AlertOctagon className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && filings.length > 0 && (
        <div className="flex flex-col gap-3">
          {filings.map((filing) => {
            const isSelected = activeFiling?.accessionNumber === filing.accessionNumber;
            return (
              <div
                key={filing.accessionNumber}
                className={`p-4 rounded-xl border transition-all flex flex-col gap-3 ${
                  isSelected 
                    ? 'bg-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-500/5' 
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700/80'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {filing.form}
                    </span>
                    <span className="text-xs text-slate-400 ml-2 font-medium">{filing.filingDate}</span>
                  </div>
                  <a
                    href={filing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-0.5 transition-colors"
                  >
                    원본 보기 <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-sm font-medium text-slate-200 line-clamp-2 leading-relaxed">
                  {filing.description || `${activeTicker} 8-K 어닝 공시`}
                </p>
                <button
                  onClick={() => onAnalyze(filing)}
                  disabled={isAnalyzing}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 cursor-default'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer disabled:opacity-50'
                  }`}
                >
                  {isSelected && isAnalyzing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      분석 스트리밍 중...
                    </>
                  ) : isSelected ? (
                    '선택된 공시'
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      AI 분석하기
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
