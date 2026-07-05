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
  open?: number;
  high?: number;
  low?: number;
}

export interface PriceMetrics {
  currentPrice: number | null;
  changePercent: number | null;
  high365d: number | null;
  low365d: number | null;
  volatility365d: number | null;
  quotes: PriceQuote[];
}

export interface YahooFinanceQuote {
  date: Date | string | number;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  close: number | null | undefined;
}

export type DeepPartial<T> = T extends Function ? T
  : T extends Array<infer U> ? _DeepPartialArray<U>
  : T extends object ? _DeepPartialObject<T>
  : T | undefined;

interface _DeepPartialArray<T> extends Array<DeepPartial<T>> {}

type _DeepPartialObject<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

