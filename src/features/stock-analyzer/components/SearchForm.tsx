import { Search } from 'lucide-react';

interface SearchFormProps {
  tickerInput: string;
  setTickerInput: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function SearchForm({ tickerInput, setTickerInput, onSubmit }: SearchFormProps) {
  return (
    <section className="mb-10 text-center max-w-2xl mx-auto">
      <h2 className="text-3xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
        미국 상장 기업 어닝 리포트 분석
      </h2>
      <p className="text-slate-400 text-sm mb-6 leading-relaxed">
        미국 주식 티커를 입력하여 최근 SEC 8-K 수시 공시와 실시간 재무 기초 데이터를 수집하고, <br/>
        Gemini 3.5 Flash AI를 통해 어닝 서프라이즈 여부와 향후 투자 판단을 스트리밍으로 진단해보세요.
      </p>

      <form onSubmit={onSubmit} className="flex gap-2 p-1.5 rounded-2xl bg-slate-900/50 backdrop-blur-md border border-slate-800/80 shadow-2xl focus-within:border-emerald-500/50 transition-all max-w-lg mx-auto">
        <div className="flex-1 flex items-center px-3 gap-2">
          <Search className="w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="티커를 입력하세요 (예: NVDA, AAPL, MSFT)"
            value={tickerInput}
            onChange={(e) => setTickerInput(e.target.value)}
            className="bg-transparent border-0 outline-none text-slate-100 placeholder-slate-500 w-full font-medium"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-1 text-sm cursor-pointer shadow-lg shadow-emerald-500/10"
        >
          조회하기
        </button>
      </form>
    </section>
  );
}
