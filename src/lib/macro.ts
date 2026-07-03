import { MacroData, FredObservation } from '@/features/macro-indicators/types';

const FRED_API_BASE = 'https://api.stlouisfed.org/fred';

async function fetchFredSeries(seriesId: string, limit = 5): Promise<FredObservation[]> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    throw new Error('FRED_API_KEY is not defined in environment variables.');
  }

  const url = `${FRED_API_BASE}/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=${limit}`;
  const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour

  if (!response.ok) {
    throw new Error(`Failed to fetch FRED series ${seriesId}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.observations || [];
}

// Helper to filter out "." values (holiday placeholders in daily data) and parse numbers
function getValidObservations(observations: FredObservation[]): { date: string; value: number }[] {
  return observations
    .filter(obs => obs.value !== '.' && obs.value !== undefined && obs.value !== null)
    .map(obs => ({
      date: obs.date,
      value: parseFloat(obs.value),
    }));
}

export async function getMacroData(): Promise<MacroData> {
  try {
    // 1. Fetch Federal Funds Rate (FEDFUNDS) - Monthly
    const fedFundsObsRaw = await fetchFredSeries('FEDFUNDS', 5);
    const fedFundsObs = getValidObservations(fedFundsObsRaw);
    if (fedFundsObs.length < 2) throw new Error('Insufficient observations for FEDFUNDS');
    
    const latestFedFunds = fedFundsObs[0];
    const prevFedFunds = fedFundsObs[1];
    const fedFundsTrend = latestFedFunds.value > prevFedFunds.value 
      ? 'up' 
      : latestFedFunds.value < prevFedFunds.value 
        ? 'down' 
        : 'flat';

    // 2. Fetch CPI (CPIAUCSL) - Monthly
    // To get YoY inflation: latest month vs 12 months ago.
    // To get previous YoY inflation (for trend): prev month vs 13 months ago.
    // Fetching 20 elements ensures we have enough data points.
    const cpiObsRaw = await fetchFredSeries('CPIAUCSL', 20);
    const cpiObs = getValidObservations(cpiObsRaw);
    if (cpiObs.length < 14) throw new Error('Insufficient observations for CPIAUCSL');

    // latest index: 0, index 12 months ago: 12
    const latestCPI = cpiObs[0].value;
    const cpi12MonthsAgo = cpiObs[12].value;
    const latestInflation = ((latestCPI - cpi12MonthsAgo) / cpi12MonthsAgo) * 100;

    // prev index: 1, index 13 months ago: 13
    const prevCPI = cpiObs[1].value;
    const cpi13MonthsAgo = cpiObs[13].value;
    const prevInflation = ((prevCPI - cpi13MonthsAgo) / cpi13MonthsAgo) * 100;

    const inflationTrend = latestInflation > prevInflation 
      ? 'up' 
      : latestInflation < prevInflation 
        ? 'down' 
        : 'flat';

    // 3. Fetch Yield Curve Spread (T10Y2Y) - Daily
    // Since it is daily and can have market holidays, fetch 10 elements to ensure valid points
    const yieldObsRaw = await fetchFredSeries('T10Y2Y', 10);
    const yieldObs = getValidObservations(yieldObsRaw);
    if (yieldObs.length < 1) throw new Error('No observations for T10Y2Y');

    const latestYield = yieldObs[0];

    // 4. Fetch Unemployment Rate (UNRATE) - Monthly
    const unrateObsRaw = await fetchFredSeries('UNRATE', 5);
    const unrateObs = getValidObservations(unrateObsRaw);
    if (unrateObs.length < 2) throw new Error('Insufficient observations for UNRATE');

    const latestUnrate = unrateObs[0];
    const prevUnrate = unrateObs[1];
    const unrateTrend = latestUnrate.value > prevUnrate.value 
      ? 'up' 
      : latestUnrate.value < prevUnrate.value 
        ? 'down' 
        : 'flat';

    return {
      fedFundsRate: {
        value: parseFloat(latestFedFunds.value.toFixed(2)),
        date: latestFedFunds.date,
        trend: fedFundsTrend,
      },
      inflationYoY: {
        value: parseFloat(latestInflation.toFixed(2)),
        date: cpiObs[0].date,
        trend: inflationTrend,
      },
      yieldCurveSpread: {
        value: parseFloat(latestYield.value.toFixed(2)),
        date: latestYield.date,
        isInverted: latestYield.value < 0,
      },
      unemploymentRate: {
        value: parseFloat(latestUnrate.value.toFixed(2)),
        date: latestUnrate.date,
        trend: unrateTrend,
      },
    };
  } catch (error) {
    console.error('Error fetching/calculating FRED macro data:', error);
    throw error;
  }
}
