import { Activity } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20">
            <Activity className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-lg bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              Antigravity Stock Analyzer
            </span>
            <span className="text-xs block text-slate-400 font-medium">Real-Time SEC 8-K AI streaming analysis</span>
          </div>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Gemini 3.5 Flash Model Configured
        </div>
      </div>
    </header>
  );
}
