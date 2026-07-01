import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { get180DayPriceMetrics } from '@/lib/price';

const yahooFinance = new YahooFinance();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker')?.toUpperCase();

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker parameter is required' }, { status: 400 });
  }

  try {
    const [summary, priceMetrics] = await Promise.all([
      yahooFinance.quoteSummary(ticker, {
        modules: ['summaryDetail', 'financialData', 'earnings', 'defaultKeyStatistics'],
      }),
      get180DayPriceMetrics(ticker).catch(err => {
        console.error('Failed to fetch price metrics:', err);
        return null;
      })
    ]);

    if (!summary) {
      return NextResponse.json({ error: `No summary found for ticker: ${ticker}` }, { status: 404 });
    }

    const trailingPE = summary.summaryDetail?.trailingPE ?? null;
    const forwardPE = summary.summaryDetail?.forwardPE ?? null;
    const priceToBook = summary.defaultKeyStatistics?.priceToBook ?? null;
    const revenueGrowth = summary.financialData?.revenueGrowth ?? null;

    const rawEarnings = summary.earnings?.earningsChart?.quarterly ?? [];
    const epsHistory = rawEarnings.map((item: { date: string; actual?: number; estimate?: number }) => ({
      date: item.date,
      actual: item.actual ?? null,
      estimate: item.estimate ?? null,
    }));

    return NextResponse.json({
      ticker,
      fundamentals: {
        trailingPE,
        forwardPE,
        priceToBook,
        revenueGrowth,
        epsHistory,
      },
      priceMetrics,
    });
  } catch (error) {
    console.error('Yahoo Finance API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch fundamentals data';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
