'use client';

import { useState } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { stockAnalysisSchema } from '@/app/schema';

// Components
import Navbar from '@/components/Navbar';
import SearchForm from '@/features/stock-analyzer/components/SearchForm';
import FilingList from '@/features/stock-analyzer/components/FilingList';
import FundamentalsCard from '@/features/stock-analyzer/components/FundamentalsCard';
import AnalysisReport from '@/features/stock-analyzer/components/AnalysisReport';

// Types
import { Filing, Fundamentals } from '@/features/stock-analyzer/types';

export default function Home() {
  const [tickerInput, setTickerInput] = useState('');
  const [activeTicker, setActiveTicker] = useState('');
  
  // SEC Filings state
  const [filings, setFilings] = useState<Filing[]>([]);
  const [loadingSec, setLoadingSec] = useState(false);
  const [secError, setSecError] = useState('');

  // Fundamentals state
  const [fundamentals, setFundamentals] = useState<Fundamentals | null>(null);
  const [loadingFundamentals, setLoadingFundamentals] = useState(false);

  // Active filing state
  const [activeFiling, setActiveFiling] = useState<Filing | null>(null);

  // Streaming AI Analysis hook
  const { 
    object: analysis, 
    submit, 
    isLoading: isAnalyzing, 
    error: analysisError 
  } = useObject({
    api: '/api/sec/analyze/stream',
    schema: stockAnalysisSchema,
  });

  // Search handler
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tickerInput.trim()) return;

    const queryTicker = tickerInput.trim().toUpperCase();
    setActiveTicker(queryTicker);
    setSecError('');
    setFilings([]);
    setFundamentals(null);
    setActiveFiling(null);

    // Fetch SEC Filings
    setLoadingSec(true);
    try {
      const res = await fetch(`/api/sec?ticker=${queryTicker}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch SEC filings');
      }
      const data = await res.json();
      setFilings(data.filings || []);
    } catch (err) {
      setSecError(err instanceof Error ? err.message : '공시 조회에 실패했습니다.');
    } finally {
      setLoadingSec(false);
    }

    // Fetch Fundamentals
    setLoadingFundamentals(true);
    try {
      const res = await fetch(`/api/market/fundamentals?ticker=${queryTicker}`);
      if (res.ok) {
        const data = await res.json();
        setFundamentals(data.fundamentals || null);
      }
    } catch (err) {
      console.error('Failed to fetch fundamentals', err);
    } finally {
      setLoadingFundamentals(false);
    }
  };

  // Trigger AI Analysis
  const handleAnalyze = (filing: Filing) => {
    setActiveFiling(filing);
    submit({ url: filing.url, ticker: activeTicker });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Header Form */}
        <SearchForm 
          tickerInput={tickerInput} 
          setTickerInput={setTickerInput} 
          onSubmit={handleSearch} 
        />

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column - Search Results, Filings, Fundamentals */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            
            {/* SEC Filings Card */}
            <FilingList 
              filings={filings}
              loading={loadingSec}
              error={secError}
              activeFiling={activeFiling}
              isAnalyzing={isAnalyzing}
              activeTicker={activeTicker}
              onAnalyze={handleAnalyze}
            />

            {/* Fundamentals Card */}
            {activeTicker && (
              <FundamentalsCard 
                ticker={activeTicker}
                fundamentals={fundamentals}
                loading={loadingFundamentals}
              />
            )}
          </div>

          {/* Right Column - Streaming AI Report */}
          <div className="lg:col-span-7">
            <AnalysisReport 
              ticker={activeTicker}
              activeFiling={activeFiling}
              analysis={analysis}
              isAnalyzing={isAnalyzing}
              error={analysisError}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
