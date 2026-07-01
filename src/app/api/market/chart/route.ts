import { NextRequest, NextResponse } from 'next/server';
import { getPriceChartData } from '@/lib/price';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  const range = searchParams.get('range') || '1M';

  if (!ticker) {
    return NextResponse.json(
      { error: 'Ticker parameter is required' },
      { status: 400 },
    );
  }

  try {
    const chartData = await getPriceChartData(ticker, range);
    if (!chartData) {
      return NextResponse.json(
        { error: `Failed to fetch chart data for ${ticker}` },
        { status: 404 },
      );
    }
    return NextResponse.json(chartData);
  } catch (err) {
    console.error('Failed to handle chart data GET:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 },
    );
  }
}
