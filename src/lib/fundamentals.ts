import YahooFinance from 'yahoo-finance2';
import { FundamentalsInput } from '@/app/api/sec/analyze/prompts';

const yahooFinance = new YahooFinance();

interface ExtendedBalanceSheetStatement {
  cashCashEquivalentsAndShortTermInvestments?: number;
  cashAndCashEquivalents?: number;
  [key: string]: unknown;
}

interface ExtendedCashflowStatement {
  operatingCashFlow?: number;
  capitalExpenditures?: number;
  [key: string]: unknown;
}

export async function getFundamentalsData(ticker: string): Promise<FundamentalsInput | null> {
  const upperTicker = ticker.toUpperCase();

  try {
    // 1. 야후 파이낸스 기본 데이터 및 추가 분석 지표 모듈 로드
    const summary = await yahooFinance.quoteSummary(upperTicker, {
      modules: [
        'summaryDetail',
        'financialData',
        'earnings',
        'defaultKeyStatistics',
        'calendarEvents',
        'balanceSheetHistoryQuarterly',
        'cashflowStatementHistoryQuarterly',
        'majorHoldersBreakdown',
        'recommendationTrend'
      ],
    }).catch(err => {
      console.warn(`[getFundamentalsData] Could not fetch quote summary for ${upperTicker}:`, err);
      return null;
    });

    // 2. 동종업계 경쟁사 틱커 동적 조회 및 밸류에이션 병렬 획득
    let peerMetrics = null;
    try {
      const recommendations = await yahooFinance.recommendationsBySymbol(upperTicker);
      if (recommendations && recommendations.recommendedSymbols) {
        const topPeers = recommendations.recommendedSymbols
          .slice(0, 3)
          .map((rec: { symbol: string }) => rec.symbol);

        const peerPromises = topPeers.map(async (peerTicker) => {
          try {
            const peerSummary = await yahooFinance.quoteSummary(peerTicker, {
              modules: ['summaryDetail', 'defaultKeyStatistics']
            });
            return {
              ticker: peerTicker,
              forwardPE: peerSummary.summaryDetail?.forwardPE ?? 'N/A',
              priceToBook: peerSummary.defaultKeyStatistics?.priceToBook ?? 'N/A'
            };
          } catch (err) {
            console.warn(`[getFundamentalsData] Failed to fetch peer metrics for ${peerTicker}:`, err);
            return null;
          }
        });

        peerMetrics = (await Promise.all(peerPromises)).filter((item): item is NonNullable<typeof item> => item !== null);
      }
    } catch (err) {
      console.warn(`[getFundamentalsData] Failed to fetch peer recommendations for ${upperTicker}:`, err);
    }

    if (!summary) {
      return null;
    }

    // 3. 기존 데이터 파싱
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

    const rawQuarterlyRevenue = summary.earnings?.financialsChart?.quarterly ?? [];
    const quarterlyRevenue = rawQuarterlyRevenue.map((item: { date: string; revenue?: number; earnings?: number }) => ({
      date: item.date,
      revenue: item.revenue ?? null,
      earnings: item.earnings ?? null,
    }));

    const nextEarningsEstimate = {
      revenueAverage: summary.calendarEvents?.earnings?.revenueAverage ?? null,
      epsAverage: (summary.calendarEvents?.earnings?.epsAverage as number | null) ?? null,
    };

    // 4. 신규 유동성 지표 파싱 및 연산
    const rawBalanceSheet = summary.balanceSheetHistoryQuarterly?.balanceSheetStatements?.[0];
    const balanceSheet = rawBalanceSheet as unknown as ExtendedBalanceSheetStatement | undefined;
    const cashAndEquivalents = balanceSheet?.cashCashEquivalentsAndShortTermInvestments 
      ?? balanceSheet?.cashAndCashEquivalents 
      ?? null;

    const rawCashflows = summary.cashflowStatementHistoryQuarterly?.cashflowStatements ?? [];
    const cashflows = rawCashflows as unknown as ExtendedCashflowStatement[];
    let cashBurnRate = null;
    let cashRunwayMonths = null;

    if (cashflows.length > 0) {
      const totalFCF = cashflows.reduce((acc, stmt) => {
        const ocf = stmt.operatingCashFlow ?? 0;
        const capex = stmt.capitalExpenditures ?? 0;
        return acc + (ocf + capex);
      }, 0);
      const averageQuarterlyBurn = totalFCF / cashflows.length;
      
      // 분기 평균 FCF가 음수(현금 소모)일 때 월간 Burn Rate 환산
      if (averageQuarterlyBurn < 0) {
        cashBurnRate = Math.abs(averageQuarterlyBurn) / 3;
        if (cashAndEquivalents !== null && cashAndEquivalents > 0) {
          cashRunwayMonths = cashAndEquivalents / cashBurnRate;
        }
      } else {
        cashBurnRate = 0; // 현금 순유입 상태
        cashRunwayMonths = 999; // 사실상 런웨이 무한대 표시용 플래그
      }
    }

    // 5. 수급 지표 파싱
    const majorHolders = summary.majorHoldersBreakdown;
    const insidersPercentHeld = majorHolders?.insidersPercentHeld !== undefined 
      ? `${(majorHolders.insidersPercentHeld * 100).toFixed(2)}%` 
      : null;
    const institutionsPercentHeld = majorHolders?.institutionsPercentHeld !== undefined 
      ? `${(majorHolders.institutionsPercentHeld * 100).toFixed(2)}%` 
      : null;

    // 6. 시장 편차 및 분포 지표 파싱
    const targetMean = summary.financialData?.targetMeanPrice;
    const targetHigh = summary.financialData?.targetHighPrice;
    const targetLow = summary.financialData?.targetLowPrice;
    let targetPriceDeviationPercent = null;
    if (targetMean && targetHigh && targetLow) {
      targetPriceDeviationPercent = ((targetHigh - targetLow) / targetMean) * 100;
    }

    const latestTrend = summary.recommendationTrend?.trend?.[0]; 
    const consensusDistribution = latestTrend ? {
      strongBuy: latestTrend.strongBuy ?? 0,
      buy: latestTrend.buy ?? 0,
      hold: latestTrend.hold ?? 0,
      sell: latestTrend.sell ?? 0,
      strongSell: latestTrend.strongSell ?? 0,
    } : null;

    return {
      trailingPE,
      forwardPE,
      priceToBook,
      revenueGrowth,
      epsHistory,
      quarterlyRevenue,
      nextEarningsEstimate,
      cashAndEquivalents,
      cashBurnRate,
      cashRunwayMonths,
      insidersPercentHeld,
      institutionsPercentHeld,
      targetPriceDeviationPercent,
      consensusDistribution,
      peerMetrics
    };
  } catch (error) {
    console.error(`[getFundamentalsData] Global error for ${ticker}:`, error);
    return null;
  }
}
