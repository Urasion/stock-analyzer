import { NextRequest, NextResponse } from 'next/server';
import { get180DayPriceMetrics } from '@/lib/price';
import { getFundamentalsData } from '@/lib/fundamentals';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker')?.toUpperCase();

  if (!ticker) {
    return NextResponse.json(
      { error: 'Ticker parameter is required' },
      { status: 400 },
    );
  }

  try {
    const [fundamentals, priceMetrics] = await Promise.all([
      getFundamentalsData(ticker).catch((err) => {
        console.error('Failed to fetch fundamentals data:', err);
        return null;
      }),
      get180DayPriceMetrics(ticker).catch((err) => {
        console.error('Failed to fetch price metrics:', err);
        return null;
      }),
    ]);

    if (!fundamentals) {
      return NextResponse.json(
        { error: `No summary found for ticker: ${ticker}` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ticker,
      fundamentals,
      priceMetrics,
    });
  } catch (error) {
    console.error('Yahoo Finance API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch fundamentals data';
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
