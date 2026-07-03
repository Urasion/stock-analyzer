import YahooFinance from 'yahoo-finance2';
import { PriceQuote, PriceMetrics, YahooFinanceQuote } from '@/types';
import { ChartRangeData } from '@/features/price-chart/types';

const yahooFinance = new YahooFinance();

/**
 * 최근 180일(6개월/2분기)간의 주가 데이터를 조회하고, 현재 가격, 수익률, 최고/최저가 및 변동성 지표를 계산하여 반환합니다.
 */
export async function get180DayPriceMetrics(ticker: string): Promise<PriceMetrics | null> {
  try {
    const today = new Date();
    const oneHundredEightyDaysAgo = new Date();
    oneHundredEightyDaysAgo.setDate(today.getDate() - 180);

    const chartResult = await yahooFinance.chart(ticker, {
      period1: oneHundredEightyDaysAgo.toISOString().split('T')[0],
      period2: today.toISOString().split('T')[0],
      interval: '1d',
    });

    if (!chartResult || !chartResult.quotes || chartResult.quotes.length === 0) {
      return null;
    }

    const quotes: PriceQuote[] = chartResult.quotes
      .filter((q: YahooFinanceQuote) => q.close !== undefined && q.close !== null)
      .map((q: YahooFinanceQuote): PriceQuote => {
        let dateStr = '';
        if (q.date instanceof Date) {
          dateStr = q.date.toISOString().split('T')[0];
        } else {
          dateStr = new Date(q.date).toISOString().split('T')[0];
        }
        return {
          date: dateStr,
          close: Number((q.close ?? 0).toFixed(2)),
        };
      });

    if (quotes.length === 0) {
      return null;
    }

    const currentPrice = chartResult.meta.regularMarketPrice ?? quotes[quotes.length - 1].close;
    const firstPrice = quotes[0].close;
    const changePercent = firstPrice
      ? Number((((currentPrice - firstPrice) / firstPrice) * 100).toFixed(2))
      : null;

    const prices = quotes.map((q) => q.close);
    const high180d = Number(Math.max(...prices).toFixed(2));
    const low180d = Number(Math.min(...prices).toFixed(2));

    // 변동성 계산 (평균 대비 표준편차 비율, Coefficient of Variation)
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const volatility180d = mean ? Number(((stdDev / mean) * 100).toFixed(2)) : 0;

    return {
      currentPrice,
      changePercent,
      high180d,
      low180d,
      volatility180d,
      quotes,
    };
  } catch (err) {
    console.error(`Error fetching 180-day price metrics for ${ticker}:`, err);
    return null;
  }
}



export async function getPriceChartData(ticker: string, range: string): Promise<ChartRangeData | null> {
  try {
    const today = new Date();
    const startDate = new Date();
    let interval: '15m' | '1h' | '1d' = '1d';

    const normalizedRange = range.toUpperCase();

    if (normalizedRange === '1D') {
      // 3일 전으로 설정하여 주말 등의 공백 보완
      startDate.setDate(today.getDate() - 3);
      interval = '15m';
    } else if (normalizedRange === '1W') {
      startDate.setDate(today.getDate() - 7);
      interval = '1h';
    } else if (normalizedRange === '1M') {
      startDate.setDate(today.getDate() - 30);
      interval = '1d';
    } else if (normalizedRange === '1Y') {
      startDate.setDate(today.getDate() - 365);
      interval = '1d';
    } else {
      // 기본값 1M
      startDate.setDate(today.getDate() - 30);
      interval = '1d';
    }

    const chartResult = await yahooFinance.chart(ticker, {
      period1: startDate.toISOString().split('T')[0],
      period2: today.toISOString().split('T')[0],
      interval,
    });

    if (!chartResult || !chartResult.quotes || chartResult.quotes.length === 0) {
      return null;
    }

    // 1D의 경우, 마지막 거래일 하루치의 intraday 데이터만 추출하여 보여주는 것이 가장 정확함
    let rawQuotes = chartResult.quotes.filter((q: YahooFinanceQuote) => q.close !== undefined && q.close !== null);

    if (normalizedRange === '1D' && rawQuotes.length > 0) {
      const lastQuote = rawQuotes[rawQuotes.length - 1];
      const lastQuoteDate = lastQuote.date instanceof Date ? lastQuote.date : new Date(lastQuote.date);
      const lastTradingDayStr = lastQuoteDate.toISOString().split('T')[0];

      // 마지막 영업일의 데이터만 필터링
      rawQuotes = rawQuotes.filter((q: YahooFinanceQuote) => {
        const d = q.date instanceof Date ? q.date : new Date(q.date);
        return d.toISOString().split('T')[0] === lastTradingDayStr;
      });
    }

    const quotes: PriceQuote[] = rawQuotes.map((q: YahooFinanceQuote): PriceQuote => {
      let dateStr = '';
      if (q.date instanceof Date) {
        dateStr = q.date.toISOString();
      } else {
        dateStr = new Date(q.date).toISOString();
      }
      return {
        date: dateStr,
        close: Number((q.close ?? 0).toFixed(2)),
        open: q.open !== undefined && q.open !== null ? Number(q.open.toFixed(2)) : undefined,
        high: q.high !== undefined && q.high !== null ? Number(q.high.toFixed(2)) : undefined,
        low: q.low !== undefined && q.low !== null ? Number(q.low.toFixed(2)) : undefined,
      };
    });

    if (quotes.length === 0) {
      return null;
    }

    const currentPrice = chartResult.meta.regularMarketPrice ?? quotes[quotes.length - 1].close;
    const firstPrice = quotes[0].close;
    const changePercent = firstPrice
      ? Number((((currentPrice - firstPrice) / firstPrice) * 100).toFixed(2))
      : null;

    const prices = quotes.map((q) => q.close);
    const high = Number(Math.max(...prices).toFixed(2));
    const low = Number(Math.min(...prices).toFixed(2));

    // 변동성 계산 (평균 대비 표준편차 비율, Coefficient of Variation)
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const volatility = mean ? Number(((stdDev / mean) * 100).toFixed(2)) : 0;

    return {
      range: normalizedRange,
      currentPrice,
      changePercent,
      high,
      low,
      volatility,
      quotes,
    };
  } catch (err) {
    console.error(`Error fetching chart price data for ${ticker} (${range}):`, err);
    return null;
  }
}
