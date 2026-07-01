import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export interface PriceQuote {
  date: string;
  close: number;
}

export interface PriceMetrics {
  currentPrice: number | null;
  changePercent: number | null;
  high30d: number | null;
  low30d: number | null;
  volatility30d: number | null;
  quotes: PriceQuote[];
}

/**
 * 최근 30일간의 주가 데이터를 조회하고, 현재 가격, 수익률, 최고/최저가 및 변동성 지표를 계산하여 반환합니다.
 */
export async function get30DayPriceMetrics(ticker: string): Promise<PriceMetrics | null> {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const chartResult = await yahooFinance.chart(ticker, {
      period1: thirtyDaysAgo.toISOString().split('T')[0],
      period2: today.toISOString().split('T')[0],
      interval: '1d',
    });

    if (!chartResult || !chartResult.quotes || chartResult.quotes.length === 0) {
      return null;
    }

    const quotes: PriceQuote[] = chartResult.quotes
      .filter((q: any) => q.close !== undefined && q.close !== null)
      .map((q: any) => {
        let dateStr = '';
        if (q.date instanceof Date) {
          dateStr = q.date.toISOString().split('T')[0];
        } else {
          dateStr = new Date(q.date).toISOString().split('T')[0];
        }
        return {
          date: dateStr,
          close: Number(q.close.toFixed(2)),
        };
      });

    if (quotes.length === 0) {
      return null;
    }

    const currentPrice = chartResult.meta.regularMarketPrice ?? quotes[quotes.length - 1].close;
    const firstPrice = quotes[0].close;
    const changePercent = firstPrice ? Number((((currentPrice - firstPrice) / firstPrice) * 100).toFixed(2)) : null;

    const prices = quotes.map(q => q.close);
    const high30d = Number(Math.max(...prices).toFixed(2));
    const low30d = Number(Math.min(...prices).toFixed(2));

    // 변동성 계산 (평균 대비 표준편차 비율, Coefficient of Variation)
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const volatility30d = mean ? Number(((stdDev / mean) * 100).toFixed(2)) : 0;

    return {
      currentPrice,
      changePercent,
      high30d,
      low30d,
      volatility30d,
      quotes,
    };
  } catch (err) {
    console.error(`Error fetching 30-day price metrics for ${ticker}:`, err);
    return null;
  }
}
