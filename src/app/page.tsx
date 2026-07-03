'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { stockAnalysisSchema } from '@/app/schema';

// Components
import Navbar from '@/components/Navbar';
import SearchForm from '@/features/search/components/SearchForm';
import FilingList from '@/features/sec-filings/components/FilingList';
import FundamentalsCard from '@/features/fundamentals/components/FundamentalsCard';
import MacroIndicatorsCard from '@/features/macro-indicators/components/MacroIndicatorsCard';
import PriceChartCard from '@/features/price-chart/components/PriceChartCard';
import AnalysisReport from '@/features/ai-analysis/components/AnalysisReport';

// Types
import { Filing } from '@/types';
import { Fundamentals } from '@/features/fundamentals/types';
import { MacroData } from '@/features/macro-indicators/types';
import { ChartRangeData } from '@/features/price-chart/types';

export default function Home(): React.JSX.Element {
  const [tickerInput, setTickerInput] = useState('');
  const [activeTicker, setActiveTicker] = useState('');

  // SEC Filings state
  const [filings, setFilings] = useState<Filing[]>([]);
  const [filing10K, setFiling10K] = useState<Filing | null>(null);
  const [filing10Q, setFiling10Q] = useState<Filing | null>(null);
  const [filingsForm4, setFilingsForm4] = useState<Filing[]>([]);
  const [loadingSec, setLoadingSec] = useState(false);
  const [secError, setSecError] = useState('');

  // Fundamentals state
  const [fundamentals, setFundamentals] = useState<Fundamentals | null>(null);
  const [loadingFundamentals, setLoadingFundamentals] = useState(false);

  // Price Chart state
  const [chartRange, setChartRange] = useState<string>('1M');
  const [chartData, setChartData] = useState<ChartRangeData | null>(null);
  const [loadingChart, setLoadingChart] = useState(false);

  // Macro Indicators state (FRED)
  const [macroData, setMacroData] = useState<MacroData | null>(null);
  const [loadingMacro, setLoadingMacro] = useState(false);
  const [macroError, setMacroError] = useState('');

  // Active filing state
  const [activeFiling, setActiveFiling] = useState<Filing | null>(null);

  // Fetch Macro Data on mount
  useEffect(() => {
    const fetchMacroData = async () => {
      setLoadingMacro(true);
      setMacroError('');
      try {
        const res = await fetch('/api/market/macro');
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to fetch macro data');
        }
        const data = await res.json();
        setMacroData(data);
      } catch (err) {
        console.error('Failed to fetch macro data:', err);
        setMacroError(err instanceof Error ? err.message : '거시경제 데이터 조회 실패');
      } finally {
        setLoadingMacro(false);
      }
    };
    fetchMacroData();
  }, []);

  // Streaming AI Analysis hook
  const {
    object: analysis,
    submit,
    isLoading: isAnalyzing,
    error: analysisError,
  } = useObject({
    api: '/api/sec/analyze/stream',
    schema: stockAnalysisSchema,
  });

  // Fetch Price Chart Data
  const fetchChartData = async (ticker: string, range: string) => {
    setLoadingChart(true);
    try {
      const res = await fetch(`/api/market/chart?ticker=${ticker}&range=${range}`);
      if (res.ok) {
        const data = await res.json();
        setChartData(data);
      } else {
        setChartData(null);
      }
    } catch (err) {
      console.error('Failed to fetch chart data:', err);
      setChartData(null);
    } finally {
      setLoadingChart(false);
    }
  };

  const handleRangeChange = (newRange: string) => {
    if (!newRange) return;
    setChartRange(newRange);
    if (activeTicker) {
      fetchChartData(activeTicker, newRange);
    }
  };

  // Search handler
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryTicker = tickerInput.trim().toUpperCase();
    if (!queryTicker) return;

    setActiveTicker(queryTicker);
    setActiveFiling(null);
    setFilings([]);
    setFiling10K(null);
    setFiling10Q(null);
    setFilingsForm4([]);
    setSecError('');
    setFundamentals(null);
    setChartData(null); // Clear previous chart data

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
      setFiling10K(data.filing10K || null);
      setFiling10Q(data.filing10Q || null);
      setFilingsForm4(data.filingsForm4 || []);
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

    // Fetch Chart Data
    fetchChartData(queryTicker, chartRange);
  };

  // Trigger AI Analysis
  const handleAnalyze = (
    targetFilings: Filing[],
    target10K: Filing | null,
    target10Q: Filing | null,
    targetForm4: Filing[],
  ) => {
    if (!activeTicker) return;

    const virtualFiling: Filing = {
      accessionNumber: 'combined-analysis',
      form: 'SEC 종합',
      filingDate: new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
      reportDate: '최근 다각 분석',
      description: targetFilings.length > 0
        ? `8-K 수시공시 ${targetFilings.length}건, 10-K/10-Q 재무/리스크 리포트 및 Form 4 내부자 거래내역 ${targetForm4.length}건을 연계 분석합니다.`
        : `10-K/10-Q 재무/리스크 리포트 및 Form 4 내부자 거래내역 ${targetForm4.length}건을 연계 분석합니다.`,
      url: '',
    };

    setActiveFiling(virtualFiling);
    submit({
      urls: targetFilings.map((f) => f.url),
      url10K: target10K ? target10K.url : null,
      url10Q: target10Q ? target10Q.url : null,
      urlsForm4: targetForm4.map((f) => f.url),
      ticker: activeTicker,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30 selection:text-blue-200">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="w-full max-w-none mx-auto px-6 md:px-10 py-8">
        {/* Search Header Form */}
        <SearchForm
          tickerInput={tickerInput}
          setTickerInput={setTickerInput}
          onSubmit={handleSearch}
        />

        {/* Dashboard Layout */}
        <div className="flex flex-col gap-8">
          {/* Top Row: Indicators */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* 1. 글로벌 거시경제 지표 */}
            <div className="lg:col-span-4 h-full">
              <MacroIndicatorsCard
                macroData={macroData}
                loading={loadingMacro}
                error={macroError}
              />
            </div>

            {/* 2. 기초 재무 데이터 */}
            <div className="lg:col-span-4 h-full">
              <FundamentalsCard
                ticker={activeTicker}
                fundamentals={fundamentals}
                loading={loadingFundamentals}
              />
            </div>

            {/* 3. 최근 SEC 8-K 수시 공시 */}
            <div className="lg:col-span-4 h-full">
              <FilingList
                filings={filings}
                filing10K={filing10K}
                filing10Q={filing10Q}
                filingsForm4={filingsForm4}
                loading={loadingSec}
                error={secError}
                activeFiling={activeFiling}
                isAnalyzing={isAnalyzing}
                activeTicker={activeTicker}
              />
            </div>
          </div>

          {/* Middle Row: Standalone Price Chart */}
          {(activeTicker || loadingChart) && (
            <div className="w-full">
              <PriceChartCard
                ticker={activeTicker}
                chartData={chartData}
                loading={loadingChart}
                range={chartRange}
                onRangeChange={handleRangeChange}
              />
            </div>
          )}

          {/* Bottom Row: AI Report */}
          <div className="w-full">
            <AnalysisReport
              ticker={activeTicker}
              activeFiling={activeFiling}
              analysis={analysis}
              isAnalyzing={isAnalyzing}
              error={analysisError}
              onAnalyze={() => handleAnalyze(filings, filing10K, filing10Q, filingsForm4)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
