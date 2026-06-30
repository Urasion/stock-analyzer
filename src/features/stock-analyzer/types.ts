export interface Filing {
  accessionNumber: string;
  filingDate: string;
  reportDate: string;
  form: string;
  description: string;
  url: string;
}

export interface EpsHistoryItem {
  date: string;
  actual: number | null;
  estimate: number | null;
}

export interface Fundamentals {
  trailingPE: number | null;
  forwardPE: number | null;
  priceToBook: number | null;
  revenueGrowth: number | null;
  epsHistory: EpsHistoryItem[];
}
