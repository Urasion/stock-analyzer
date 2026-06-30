import { NextRequest, NextResponse } from 'next/server';
import { streamObject } from 'ai';
import { google } from '@ai-sdk/google';
import * as cheerio from 'cheerio';
import YahooFinance from 'yahoo-finance2';
import { stockAnalysisSchema } from '@/app/schema';

const yahooFinance = new YahooFinance();
const USER_AGENT = 'AntigravityStockAnalyzer/1.0 (antigravity-bot@example.com)';

export async function POST(request: NextRequest) {
  // 환경변수 체크
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json(
      { error: 'Google Generative AI API key is missing. Please set GOOGLE_GENERATIVE_AI_API_KEY in .env.local.' },
      { status: 500 }
    );
  }

  try {
    const { url, ticker } = await request.json();

    if (!url || !ticker) {
      return NextResponse.json(
        { error: 'Both url and ticker parameters are required in the request body.' },
        { status: 400 }
      );
    }

    const upperTicker = ticker.toUpperCase();

    // 1. Cheerio로 8-K HTML 원문 스크랩 및 텍스트 추출
    let scrapedText = '';
    try {
      const htmlResponse = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
        },
      });

      if (!htmlResponse.ok) {
        throw new Error(`Failed to fetch SEC Archives HTML: Status ${htmlResponse.status}`);
      }

      const html = await htmlResponse.text();
      const $ = cheerio.load(html);

      // 불필요한 태그 제거 및 텍스트 추출
      $('script, style, iframe, noscript, head').remove();
      scrapedText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 20000);
    } catch (err) {
      console.error('SEC Scraping error:', err);
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { error: `Failed to scrape SEC 8-K document: ${message}` },
        { status: 502 }
      );
    }

    // 2. 과거 재무 데이터 가져오기 (Fundamentals)
    let fundamentalsData: Record<string, unknown> | null = null;
    try {
      const summary = await yahooFinance.quoteSummary(upperTicker, {
        modules: ['summaryDetail', 'financialData', 'earnings', 'defaultKeyStatistics'],
      });

      if (summary) {
        const trailingPE = summary.summaryDetail?.trailingPE ?? null;
        const forwardPE = summary.summaryDetail?.forwardPE ?? null;
        const priceToBook = summary.defaultKeyStatistics?.priceToBook ?? null;
        const revenueGrowth = summary.financialData?.revenueGrowth ?? null;
        const rawEarnings = summary.earnings?.earningsChart?.quarterly ?? [];
        const epsHistory = rawEarnings.map((item: { date: string; actual?: number; estimate?: number }) => ({
          date: item.date,
          actual: item.actual ?? null,
          estimate: item.estimate ?? null,
        }));

        fundamentalsData = {
          trailingPE,
          forwardPE,
          priceToBook,
          revenueGrowth,
          epsHistory,
        };
      }
    } catch (err) {
      console.warn('Could not fetch fundamentals data from Yahoo Finance, proceeding with analysis anyway:', err);
    }

    // 3. AI 스트리밍 분석 실행 (streamObject)
    const prompt = `
      You are an expert US stock analyst. Analyze the following earnings/announcement from the SEC 8-K document, and fuse it with the historical/market fundamentals data.
      
      [Stock Information]
      Ticker: ${upperTicker}
      
      [Market & Historical Fundamentals Data]
      ${fundamentalsData ? JSON.stringify(fundamentalsData, null, 2) : 'No historical data available.'}
      
      [SEC 8-K Document Text (Truncated up to 20,000 characters)]
      ${scrapedText}

      Please provide a structured analysis response matching the schema.
    `;

    const result = streamObject({
      model: google('gemini-2.5-flash'),
      schema: stockAnalysisSchema,
      prompt: prompt,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('AI Streaming Analysis API error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
