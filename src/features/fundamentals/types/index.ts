export interface EpsHistoryItem {
  date: string;
  actual: number | null;
  estimate: number | null;
}

export interface PeerMetricItem {
  ticker: string;
  forwardPE: number | string;
  priceToBook: number | string;
}

export interface Fundamentals {
  trailingPE: number | null;
  forwardPE: number | null;
  priceToBook: number | null;
  revenueGrowth: number | null;
  epsHistory: EpsHistoryItem[];
  cashAndEquivalents?: number | null;
  cashBurnRate?: number | null;
  cashRunwayMonths?: number | null;
  insidersPercentHeld?: string | null;
  institutionsPercentHeld?: string | null;
  targetPriceDeviationPercent?: number | null;
  peerMetrics?: PeerMetricItem[] | null;
}
