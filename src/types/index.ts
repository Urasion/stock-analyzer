export interface Filing {
  accessionNumber: string;
  filingDate: string;
  reportDate: string;
  form: string;
  description: string;
  url: string;
}

export interface PriceQuote {
  date: string;
  close: number;
}

export interface PriceMetrics {
  currentPrice: number | null;
  changePercent: number | null;
  high180d: number | null;
  low180d: number | null;
  volatility180d: number | null;
  quotes: PriceQuote[];
}
