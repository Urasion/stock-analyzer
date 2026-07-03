export interface MacroIndicator {
  value: number;
  date: string;
  trend: 'up' | 'down' | 'flat';
}

export interface YieldCurveIndicator {
  value: number;
  date: string;
  isInverted: boolean;
}

export interface MacroData {
  fedFundsRate: MacroIndicator;
  inflationYoY: MacroIndicator;
  yieldCurveSpread: YieldCurveIndicator;
  unemploymentRate: MacroIndicator;
}

export interface FredObservation {
  date: string;
  value: string;
}

