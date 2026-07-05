'use client';

import * as React from 'react';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';
import { stockAnalysisSchema } from '@/app/schema';

// Components
import Navbar from '@/components/Navbar';
import SearchForm from '@/features/search/components/SearchForm';
import FilingList from '@/features/sec-filings/components/FilingList';
import FundamentalsCard from '@/features/fundamentals/components/FundamentalsCard';
import LiquidityAndConsensusCard from '@/features/fundamentals/components/LiquidityAndConsensusCard';
import MacroIndicatorsCard from '@/features/macro-indicators/components/MacroIndicatorsCard';
import PriceChartCard from '@/features/price-chart/components/PriceChartCard';
import AnalysisReport from '@/features/ai-analysis/components/AnalysisReport';

// Types
import { Filing, DeepPartial } from '@/types';
import { Fundamentals } from '@/features/fundamentals/types';
import { MacroData } from '@/features/macro-indicators/types';
import { ChartRangeData } from '@/features/price-chart/types';

export default function Home(): React.JSX.Element {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center font-sans">
        데이터 로딩 중...
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL Query Params as State (Single Source of Truth)
  const activeTicker = searchParams.get('ticker')?.toUpperCase() || '';
  const analyzeTrigger = searchParams.get('analyze') === 'true';
  const queryHasPosition = searchParams.get('hasPosition') === 'true';
  const queryAvgPrice = searchParams.get('avgPrice') ? parseFloat(searchParams.get('avgPrice')!) : null;

  const [tickerInput, setTickerInput] = useState(activeTicker);

  // Sync input value with activeTicker if URL changes directly
  useEffect(() => {
    setTickerInput(activeTicker);
  }, [activeTicker]);

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

  // Search handler (Updates URL)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const queryTicker = tickerInput.trim().toUpperCase();
    if (!queryTicker) return;

    router.push(`/?ticker=${queryTicker}`);
  };

  // Trigger AI Analysis (Updates URL to trigger the analysis effect)
  const handleAnalyze = (
    hp: boolean,
    ap: number | null,
  ) => {
    if (!activeTicker) return;

    const query = new URLSearchParams();
    query.set('ticker', activeTicker);
    query.set('analyze', 'true');
    query.set('hasPosition', String(hp));
    if (ap !== null && ap !== undefined) {
      query.set('avgPrice', String(ap));
    }
    router.push(`/?${query.toString()}`);
  };

  // Effect to load ticker data when activeTicker changes
  useEffect(() => {
    if (!activeTicker) {
      setActiveFiling(null);
      setFilings([]);
      setFiling10K(null);
      setFiling10Q(null);
      setFilingsForm4([]);
      setSecError('');
      setFundamentals(null);
      setChartData(null);
      return;
    }

    // Reset previous search values
    setActiveFiling(null);
    setFilings([]);
    setFiling10K(null);
    setFiling10Q(null);
    setFilingsForm4([]);
    setSecError('');
    setFundamentals(null);
    setChartData(null);

    const loadData = async () => {
      // Fetch SEC Filings
      setLoadingSec(true);
      try {
        const res = await fetch(`/api/sec?ticker=${activeTicker}`);
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
        const res = await fetch(`/api/market/fundamentals?ticker=${activeTicker}`);
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
      fetchChartData(activeTicker, chartRange);
    };

    loadData();
  }, [activeTicker]);

  // Effect to start analysis once target filings are loaded and analyzeTrigger is active
  useEffect(() => {
    if (!activeTicker || !analyzeTrigger || loadingSec) return;

    const virtualFiling: Filing = {
      accessionNumber: 'combined-analysis',
      form: 'SEC 종합',
      filingDate: new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
      reportDate: '최근 다각 분석',
      description: filings.length > 0
        ? `8-K 수시공시 ${filings.length}건, 10-K/10-Q 재무/리스크 리포트 및 Form 4 내부자 거래내역 ${filingsForm4.length}건을 연계 분석합니다.`
        : `10-K/10-Q 재무/리스크 리포트 및 Form 4 내부자 거래내역 ${filingsForm4.length}건을 연계 분석합니다.`,
      url: '',
    };

    setActiveFiling(virtualFiling);
    submit({
      urls: filings.map((f) => f.url),
      url10K: filing10K ? filing10K.url : null,
      url10Q: filing10Q ? filing10Q.url : null,
      urlsForm4: filingsForm4.map((f) => f.url),
      ticker: activeTicker,
      hasPosition: queryHasPosition,
      avgPrice: queryAvgPrice,
    });
  }, [activeTicker, analyzeTrigger, loadingSec]);

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
            <div className="lg:col-span-3 h-full">
              <MacroIndicatorsCard
                macroData={macroData}
                loading={loadingMacro}
                error={macroError}
              />
            </div>

            {/* 2. 기초 재무 데이터 */}
            <div className="lg:col-span-3 h-full">
              <FundamentalsCard
                ticker={activeTicker}
                fundamentals={fundamentals}
                loading={loadingFundamentals}
              />
            </div>

            {/* 3. 재무 안전성 및 컨센서스 */}
            <div className="lg:col-span-3 h-full">
              <LiquidityAndConsensusCard
                ticker={activeTicker}
                fundamentals={fundamentals}
                loading={loadingFundamentals}
              />
            </div>

            {/* 4. 최근 SEC 8-K 수시 공시 */}
            <div className="lg:col-span-3 h-full">
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
              key={activeFiling?.accessionNumber || activeTicker}
              ticker={activeTicker}
              activeFiling={activeFiling}
              analysis={analysis}
              isAnalyzing={isAnalyzing}
              error={analysisError}
              onAnalyze={(hp, ap) => {
                handleAnalyze(hp, ap);
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
