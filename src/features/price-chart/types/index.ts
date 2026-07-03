import { PriceQuote } from '@/types';

export interface ChartRangeData {
  range: string;
  currentPrice: number | null;
  changePercent: number | null;
  high: number | null;
  low: number | null;
  volatility: number | null;
  quotes: PriceQuote[];
}
