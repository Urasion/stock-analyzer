import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CACHE_FILE = path.join(os.tmpdir(), 'sec_cik_cache.json');
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const USER_AGENT = 'AntigravityStockAnalyzer/1.0 (antigravity-bot@example.com)';

interface TickerMapping {
  cik_str: number;
  ticker: string;
  title: string;
}

interface SECCompanyTickers {
  [key: string]: TickerMapping;
}

interface SECSubmissions {
  cik: string;
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      reportDate: string[];
      form: string[];
      primaryDocument: string[];
      primaryDocDescription: string[];
    };
  };
}

// CIK 매핑 캐시 로드 또는 fetch
async function getCikMap(): Promise<Map<string, number>> {
  let useCache = false;

  if (fs.existsSync(CACHE_FILE)) {
    try {
      const stats = fs.statSync(CACHE_FILE);
      const now = Date.now();
      if (now - stats.mtimeMs < CACHE_DURATION_MS) {
        useCache = true;
      }
    } catch (err) {
      console.error('Error checking cache file stats:', err);
    }
  }

  if (useCache) {
    try {
      const cacheData = fs.readFileSync(CACHE_FILE, 'utf-8');
      const parsed = JSON.parse(cacheData) as Record<string, number>;
      return new Map(Object.entries(parsed));
    } catch (err) {
      console.error('Error reading CIK cache file, falling back to fetch:', err);
    }
  }

  // Fetch from SEC
  try {
    const response = await fetch('https://www.sec.gov/files/company_tickers.json', {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`SEC company_tickers request failed with status: ${response.status}`);
    }

    const data = (await response.json()) as SECCompanyTickers;
    const mapping = new Map<string, number>();
    const saveObj: Record<string, number> = {};

    Object.values(data).forEach((item) => {
      const upperTicker = item.ticker.toUpperCase();
      mapping.set(upperTicker, item.cik_str);
      saveObj[upperTicker] = item.cik_str;
    });

    // Save to cache asynchronously
    try {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(saveObj), 'utf-8');
    } catch (err) {
      console.error('Failed to write SEC CIK cache:', err);
    }

    return mapping;
  } catch (error) {
    console.error('Error fetching CIK map:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker')?.toUpperCase();

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker parameter is required' }, { status: 400 });
  }

  try {
    const cikMap = await getCikMap();
    const cikNum = cikMap.get(ticker);

    if (cikNum === undefined) {
      return NextResponse.json({ error: `CIK not found for ticker: ${ticker}` }, { status: 404 });
    }

    // CIK 10자리 패딩
    const paddedCik = String(cikNum).padStart(10, '0');

    // SEC submissions fetch
    const response = await fetch(`https://data.sec.gov/submissions/CIK${paddedCik}.json`, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `SEC submissions API failed with status: ${response.status}` },
        { status: response.status }
      );
    }

    const data = (await response.json()) as SECSubmissions;
    const recent = data.filings?.recent;

    if (!recent || !recent.form) {
      return NextResponse.json({ ticker, cik: paddedCik, filings: [] });
    }

    const filings: Array<{
      accessionNumber: string;
      filingDate: string;
      reportDate: string;
      form: string;
      description: string;
      url: string;
    }> = [];

    let filing10K: {
      accessionNumber: string;
      filingDate: string;
      reportDate: string;
      form: string;
      description: string;
      url: string;
    } | null = null;

    let filing10Q: {
      accessionNumber: string;
      filingDate: string;
      reportDate: string;
      form: string;
      description: string;
      url: string;
    } | null = null;

    const filingsForm4: Array<{
      accessionNumber: string;
      filingDate: string;
      reportDate: string;
      form: string;
      description: string;
      url: string;
    }> = [];

    for (let i = 0; i < recent.form.length; i++) {
      const formType = recent.form[i];
      const accessionNumber = recent.accessionNumber[i];
      const accessionNumberWithoutDashes = accessionNumber.replace(/-/g, '');
      const primaryDocument = recent.primaryDocument[i];
      
      const url = `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accessionNumberWithoutDashes}/${primaryDocument}`;

      if (formType === '8-K' && filings.length < 10) {
        filings.push({
          accessionNumber,
          filingDate: recent.filingDate[i],
          reportDate: recent.reportDate[i],
          form: '8-K',
          description: recent.primaryDocDescription[i] || '8-K 수시 공시',
          url,
        });
      }

      if (formType === '10-K' && !filing10K) {
        filing10K = {
          accessionNumber,
          filingDate: recent.filingDate[i],
          reportDate: recent.reportDate[i],
          form: '10-K',
          description: recent.primaryDocDescription[i] || '10-K 연례 보고서',
          url,
        };
      }

      if (formType === '10-Q' && !filing10Q) {
        filing10Q = {
          accessionNumber,
          filingDate: recent.filingDate[i],
          reportDate: recent.reportDate[i],
          form: '10-Q',
          description: recent.primaryDocDescription[i] || '10-Q 분기 보고서',
          url,
        };
      }

      if ((formType === '4' || formType === 'Form 4') && filingsForm4.length < 5) {
        filingsForm4.push({
          accessionNumber,
          filingDate: recent.filingDate[i],
          reportDate: recent.reportDate[i],
          form: 'Form 4',
          description: recent.primaryDocDescription[i] || 'Form 4 내부자 거래',
          url,
        });
      }

      if (filings.length === 10 && filing10K !== null && filing10Q !== null && filingsForm4.length === 5) {
        break;
      }
    }

    return NextResponse.json({ 
      ticker, 
      cik: paddedCik, 
      filings, 
      filing10K, 
      filing10Q,
      filingsForm4 
    });
  } catch (error) {
    console.error('SEC API error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
