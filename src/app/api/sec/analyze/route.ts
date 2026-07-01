import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import * as cheerio from 'cheerio';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();
const USER_AGENT = 'AntigravityStockAnalyzer/1.0 (antigravity-bot@example.com)';

import { stockAnalysisSchema } from '@/app/schema';
import { buildAnalysisPrompt, FundamentalsInput } from './prompts';
import { getMacroData } from '@/lib/macro';
import { get180DayPriceMetrics } from '@/lib/price';

export async function POST(request: NextRequest) {
  // 환경변수 체크
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json(
      { error: 'Google Generative AI API key is missing. Please set GOOGLE_GENERATIVE_AI_API_KEY in .env.local.' },
      { status: 500 }
    );
  }

  try {
    const { urls, url10K, url10Q, urlsForm4, ticker } = await request.json();

    if (!ticker) {
      return NextResponse.json(
        { error: 'The ticker parameter is required in the request body.' },
        { status: 400 }
      );
    }

    const finalUrls = Array.isArray(urls) ? urls : [];

    const upperTicker = ticker.toUpperCase();

    // 1. Cheerio로 8-K, 10-K, 10-Q, Form 4 HTML 스크랩 및 텍스트 병합
    let scrapedText = '';
    try {
      // (1) 8-K 수집
      const fetchAndScrape8K = async (url: string, index: number) => {
        try {
          const htmlResponse = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
          if (!htmlResponse.ok) return `[수시공시 8-K ${index + 1}] 가져오기 실패 (Status ${htmlResponse.status})`;
          const html = await htmlResponse.text();
          const $ = cheerio.load(html);
          $('script, style, iframe, noscript, head').remove();
          const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 4000);
          return `[수시공시 8-K ${index + 1} 원문 요약]\n${text}`;
        } catch (err) {
          return `[수시공시 8-K ${index + 1}] 스크랩 에러: ${err instanceof Error ? err.message : String(err)}`;
        }
      };

      // (2) 10-K 리스크 정보 수집
      const fetchAndScrape10K = async (url: string) => {
        try {
          const htmlResponse = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
          if (!htmlResponse.ok) return `[연례보고서 10-K] 리스크 정보 가져오기 실패 (Status ${htmlResponse.status})`;
          const html = await htmlResponse.text();
          const $ = cheerio.load(html);
          $('script, style, iframe, noscript, head').remove();
          const text = $('body').text().replace(/\s+/g, ' ').trim();
          const riskIndex = text.search(/Item\s+1A\.?\s+Risk\s+Factors/i);
          const riskText = riskIndex !== -1 ? text.slice(riskIndex, riskIndex + 6000) : text.slice(0, 6000);
          return `[연례보고서 10-K 장기 리스크 맥락 (Item 1A 요약)]\n${riskText}`;
        } catch (err) {
          return `[연례보고서 10-K] 스크랩 에러: ${err instanceof Error ? err.message : String(err)}`;
        }
      };

      // (2-2) 10-Q 분기 보고서 실적 정보 수집
      const fetchAndScrape10Q = async (url: string) => {
        try {
          const htmlResponse = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
          if (!htmlResponse.ok) return `[분기보고서 10-Q] 연결 손익계산서 가져오기 실패 (Status ${htmlResponse.status})`;
          const html = await htmlResponse.text();
          const $ = cheerio.load(html);
          $('script, style, iframe, noscript, head').remove();
          const text = $('body').text().replace(/\s+/g, ' ').trim();
          const statementIndex = text.search(/Statements\s+of\s+Operations/i);
          const statementText = statementIndex !== -1 ? text.slice(statementIndex, statementIndex + 6000) : text.slice(0, 6000);
          return `[분기보고서 10-Q 연결손익계산서 맥락]\n${statementText}`;
        } catch (err) {
          return `[분기보고서 10-Q] 스크랩 에러: ${err instanceof Error ? err.message : String(err)}`;
        }
      };

      // (3) Form 4 내부자 거래 정보 수집 (최근 3개만 수집)
      const fetchAndScrapeForm4 = async (url: string, index: number) => {
        try {
          const htmlResponse = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
          if (!htmlResponse.ok) return `[내부자거래 Form 4 ${index + 1}] 가져오기 실패 (Status ${htmlResponse.status})`;
          const html = await htmlResponse.text();
          const $ = cheerio.load(html);
          $('script, style, iframe, noscript, head').remove();
          const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 1500);
          return `[내부자거래 Form 4 ${index + 1} 요약]\n${text}`;
        } catch (err) {
          return `[내부자거래 Form 4 ${index + 1}] 스크랩 에러: ${err instanceof Error ? err.message : String(err)}`;
        }
      };

      const tasks8K = finalUrls.map((url: string, index: number) => fetchAndScrape8K(url, index));
      const task10K = url10K ? [fetchAndScrape10K(url10K)] : [];
      const task10Q = url10Q ? [fetchAndScrape10Q(url10Q)] : [];
      const tasksForm4 = (urlsForm4 || []).slice(0, 3).map((url: string, index: number) => fetchAndScrapeForm4(url, index));

      const [res8K, res10K, res10Q, resForm4] = await Promise.all([
        Promise.all(tasks8K),
        Promise.all(task10K),
        Promise.all(task10Q),
        Promise.all(tasksForm4)
      ]);

      const parts = [];
      if (res8K.length > 0) parts.push(res8K.join('\n\n---\n\n'));
      if (res10K.length > 0) parts.push(res10K[0]);
      if (res10Q.length > 0) parts.push(res10Q[0]);
      if (resForm4.length > 0) parts.push(resForm4.join('\n\n---\n\n'));

      scrapedText = parts.join('\n\n=================================\n\n');
      if (!scrapedText) {
        scrapedText = '[수집된 SEC 공시 데이터 없음: 최근 공시 기록이 조회되지 않았습니다. 거시경제 및 기초 재무지표만을 토대로 분석을 수행합니다.]';
      }
    } catch (err) {
      console.error('SEC Bulk Scraping error:', err);
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { error: `Failed to scrape SEC filings: ${message}` },
        { status: 502 }
      );
    }

    // 2. 외부 데이터 수집 (Fundamentals, Price Metrics, Macro Data) 병렬 비동기 처리
    let fundamentalsData: FundamentalsInput | null = null;
    let priceMetricsData = null;
    let macroData = null;

    try {
      const [summary, priceMetrics, macro] = await Promise.all([
        yahooFinance.quoteSummary(upperTicker, {
          modules: ['summaryDetail', 'financialData', 'earnings', 'defaultKeyStatistics', 'calendarEvents'],
        }).catch(err => {
          console.warn('Could not fetch quote summary:', err);
          return null;
        }),
        get180DayPriceMetrics(upperTicker).catch(err => {
          console.warn('Could not fetch price metrics:', err);
          return null;
        }),
        getMacroData().catch(err => {
          console.warn('Could not fetch macro data:', err);
          return null;
        })
      ]);

      macroData = macro;
      priceMetricsData = priceMetrics;

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

        // 분기별 실제 매출 및 순이익 차트
        const rawQuarterlyRevenue = summary.earnings?.financialsChart?.quarterly ?? [];
        const quarterlyRevenue = rawQuarterlyRevenue.map((item: { date: string; revenue?: number; earnings?: number }) => ({
          date: item.date,
          revenue: item.revenue ?? null,
          earnings: item.earnings ?? null,
        }));

        // 다음 분기 가이던스 전망치 평균
        const nextEarningsEstimate = {
          revenueAverage: summary.calendarEvents?.earnings?.revenueAverage ?? null,
          epsAverage: (summary.calendarEvents?.earnings?.epsAverage as number | null) ?? null,
        };

        fundamentalsData = {
          trailingPE,
          forwardPE,
          priceToBook,
          revenueGrowth,
          epsHistory,
          quarterlyRevenue,
          nextEarningsEstimate,
        };
      }
    } catch (err) {
      console.warn('Error fetching parallel data, proceeding with analysis:', err);
    }

    // 3. AI 분석 실행 (generateObject)
    const prompt = buildAnalysisPrompt(upperTicker, fundamentalsData, scrapedText, macroData, priceMetricsData);

    const { object: analysisResult } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: stockAnalysisSchema,
      prompt: prompt,
    });

    return NextResponse.json({
      ticker: upperTicker,
      urls,
      analysis: analysisResult,
    });
  } catch (error) {
    console.error('AI Analysis API error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
