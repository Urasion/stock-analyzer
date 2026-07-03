import { Dog } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-none mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-linear-to-tr from-blue-600 to-sky-400 text-slate-950 font-bold shadow-md shadow-blue-500/20">
            <Dog className="w-5 h-5 text-slate-950" />
          </div>
          <span className="font-bold tracking-tight text-xl bg-linear-to-r from-blue-400 to-sky-200 bg-clip-text text-transparent">
            개잡주 판독기
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
