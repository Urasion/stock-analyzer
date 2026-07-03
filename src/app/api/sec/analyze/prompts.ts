import { MacroData } from '@/features/macro-indicators/types';

export interface EPSHistoryItem {
  date: string;
  actual: number | null;
  estimate: number | null;
}

export interface QuarterlyRevenueItem {
  date: string;
  revenue: number | null;
  earnings: number | null;
}

export interface PeerMetricItem {
  ticker: string;
  forwardPE: number | string;
  priceToBook: number | string;
}

export interface FundamentalsInput {
  trailingPE: number | null;
  forwardPE: number | null;
  priceToBook?: number | null;
  revenueGrowth: number | null;
  epsHistory: EPSHistoryItem[];
  quarterlyRevenue?: QuarterlyRevenueItem[];
  nextEarningsEstimate?: {
    revenueAverage: number | null;
    epsAverage: number | null;
  } | null;
  cashAndEquivalents?: number | null;
  cashBurnRate?: number | null;
  cashRunwayMonths?: number | null;
  insidersPercentHeld?: string | null;
  institutionsPercentHeld?: string | null;
  targetPriceDeviationPercent?: number | null;
  consensusDistribution?: {
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
  } | null;
  peerMetrics?: PeerMetricItem[] | null;
}

export interface PriceMetricsInput {
  currentPrice: number | null;
  changePercent: number | null;
  high180d: number | null;
  low180d: number | null;
  volatility180d: number | null;
}

/**
 * 월스트리트 수석 애널리스트 페르소나를 기반으로 기업의 다각적 재무 데이터와 SEC 공시들을 종합 분석하기 위한 프롬프트를 생성합니다.
 */
export function buildAnalysisPrompt(
  ticker: string,
  fundamentals: FundamentalsInput | null,
  combinedText: string,
  macroData: MacroData | null,
  priceMetrics: PriceMetricsInput | null = null
): string {
  const trailingPEStr = fundamentals?.trailingPE !== null && fundamentals?.trailingPE !== undefined
    ? `${fundamentals.trailingPE}`
    : 'N/A';
  const forwardPEStr = fundamentals?.forwardPE !== null && fundamentals?.forwardPE !== undefined
    ? `${fundamentals.forwardPE}`
    : 'N/A';
  const pbrStr = fundamentals?.priceToBook !== null && fundamentals?.priceToBook !== undefined
    ? `${fundamentals.priceToBook}`
    : 'N/A';
  
  const revenueGrowthVal = fundamentals?.revenueGrowth ?? 0;
  const revenueGrowthStr = fundamentals?.revenueGrowth !== null && fundamentals?.revenueGrowth !== undefined
    ? `${(revenueGrowthVal * 100).toFixed(2)}`
    : 'N/A';

  // 과거 EPS 추이
  const historyLines = (fundamentals?.epsHistory || []).map(h => {
    const actual = h.actual ?? 0;
    const estimate = h.estimate ?? 0;
    let surprisePercent = 0;
    if (estimate) {
      surprisePercent = ((actual - estimate) / Math.abs(estimate)) * 100;
    }
    const actualStr = h.actual !== null ? `${h.actual}` : 'N/A';
    const estimateStr = h.estimate !== null ? `${h.estimate}` : 'N/A';
    return `${h.date}: 예상 ${estimateStr} -> 실제 ${actualStr} (서프라이즈 ${surprisePercent.toFixed(1)}%)`;
  }).join('\n') || '과거 EPS 달성 데이터 없음';

  // 과거 분기 매출 및 순이익 추이 (실적 보강)
  const revenueLines = (fundamentals?.quarterlyRevenue || []).map(r => {
    const revStr = r.revenue !== null && r.revenue !== undefined ? `$${(r.revenue / 1000000000).toFixed(2)}B` : 'N/A';
    const earnStr = r.earnings !== null && r.earnings !== undefined ? `$${(r.earnings / 1000000000).toFixed(2)}B` : 'N/A';
    return `${r.date}: 매출 ${revStr} / 순이익 ${earnStr}`;
  }).join('\n') || '과거 분기 실적 데이터 없음';

  // 다음 분기 시장 컨센서스 (가이던스)
  const nextRev = fundamentals?.nextEarningsEstimate?.revenueAverage;
  const nextEps = fundamentals?.nextEarningsEstimate?.epsAverage;
  const nextRevStr = nextRev !== null && nextRev !== undefined ? `$${(nextRev / 1000000000).toFixed(2)}B` : 'N/A';
  const nextEpsStr = nextEps !== null && nextEps !== undefined ? `${nextEps}` : 'N/A';
  const nextEstimateStr = `매출 평균 예상: ${nextRevStr} / 주당순이익(EPS) 평균 예상: ${nextEpsStr}`;

  // 유동성 및 현금 Runway 포맷팅
  const cashAndEquivalentsStr = fundamentals?.cashAndEquivalents !== null && fundamentals?.cashAndEquivalents !== undefined
    ? `$${(fundamentals.cashAndEquivalents / 1000000).toFixed(2)}M`
    : 'N/A';
  const cashBurnRateStr = fundamentals?.cashBurnRate !== null && fundamentals?.cashBurnRate !== undefined
    ? `$${(fundamentals.cashBurnRate / 1000000).toFixed(2)}M/월`
    : 'N/A';
  const cashRunwayStr = fundamentals?.cashRunwayMonths !== null && fundamentals?.cashRunwayMonths !== undefined
    ? `${fundamentals.cashRunwayMonths.toFixed(1)}개월`
    : 'N/A';

  // 수급 및 지분율 포맷팅
  const insidersStr = fundamentals?.insidersPercentHeld ?? 'N/A';
  const institutionsStr = fundamentals?.institutionsPercentHeld ?? 'N/A';

  // 시장 컨센서스 기대 편차 및 애널리스트 의견 분포 포맷팅
  const targetDeviationStr = fundamentals?.targetPriceDeviationPercent !== null && fundamentals?.targetPriceDeviationPercent !== undefined
    ? `${fundamentals.targetPriceDeviationPercent.toFixed(1)}%`
    : 'N/A';
  
  let consensusDistStr = '분포 데이터 없음';
  if (fundamentals?.consensusDistribution) {
    const dist = fundamentals.consensusDistribution;
    consensusDistStr = `적극매수(Strong Buy): ${dist.strongBuy} / 매수(Buy): ${dist.buy} / 관망(Hold): ${dist.hold} / 매도(Sell): ${dist.sell} / 적극매도(Strong Sell): ${dist.strongSell}`;
  }

  // 동종업계 경쟁사 지표 포맷팅
  let peerMetricsStr = '경쟁사 비교 데이터 없음';
  if (fundamentals?.peerMetrics && fundamentals.peerMetrics.length > 0) {
    peerMetricsStr = fundamentals.peerMetrics.map(peer => 
      `- ${peer.ticker}: 선행 PE ${peer.forwardPE}배 / PBR ${peer.priceToBook}배`
    ).join('\n');
  }

  // 거시경제 맥락 데이터 (FRED API) 구성
  let macroSection = '거시경제 데이터를 불러오지 못했습니다.';
  if (macroData) {
    const spreadInverted = macroData.yieldCurveSpread.isInverted 
      ? '역전 상태 (장기 금리가 단기 금리보다 낮음 - 역사적인 경기 침체 신호)' 
      : '정상 상태 (장기 금리가 단기 금리보다 높음)';
    const fedFundsTrend = macroData.fedFundsRate.trend === 'up' ? '상승' : macroData.fedFundsRate.trend === 'down' ? '하락' : '동결/횡보';
    const inflationTrend = macroData.inflationYoY.trend === 'up' ? '상승' : macroData.inflationYoY.trend === 'down' ? '하락' : '횡보';
    const unrateTrend = macroData.unemploymentRate.trend === 'up' ? '상승' : macroData.unemploymentRate.trend === 'down' ? '하락' : '횡보';

    macroSection = `
- 미국 기준금리 (Fed Funds Rate): ${macroData.fedFundsRate.value}% (최근 추이: ${fedFundsTrend}, 최종 발표일: ${macroData.fedFundsRate.date})
- 소비자물가상승률 (CPI YoY Inflation): ${macroData.inflationYoY.value}% (최근 추세: ${inflationTrend}, 최종 발표일: ${macroData.inflationYoY.date})
- 장단기 금리차 (10Y-2Y Treasury Yield Spread): ${macroData.yieldCurveSpread.value}% (${spreadInverted}, 최종 발표일: ${macroData.yieldCurveSpread.date})
- 실업률 (Unemployment Rate): ${macroData.unemploymentRate.value}% (최근 추이: ${unrateTrend}, 최종 발표일: ${macroData.unemploymentRate.date})
`;
  }

  // 최근 180일 주가 지표 구성
  let priceMetricsSection = '최근 주가 데이터 없음';
  if (priceMetrics) {
    const changeDirection = (priceMetrics.changePercent ?? 0) >= 0 ? '상승' : '하락';
    priceMetricsSection = `
- 현재 주가: $${priceMetrics.currentPrice}
- 최근 180일(6개월/2분기) 누적 주가 변동률: ${priceMetrics.changePercent?.toFixed(2)}% (${changeDirection})
- 최근 180일 최고가: $${priceMetrics.high180d} / 최저가: $${priceMetrics.low180d}
- 최근 180일 주가 변동성 (평균 대비 표준편차 비율): ${priceMetrics.volatility180d?.toFixed(2)}%
`;
  }

  return `
당신은 월스트리트의 수석 애널리스트이자 주식시장 리스크 관리 전문가입니다.
다음 기업(${ticker})의 '정밀 재무 흐름', '시장 컨센서스', '수집된 다양한 SEC 공시 데이터', '최근 180일 주가 센티먼트' 및 '미국 연준(FRED)의 거시경제 상황'을 연계하여 종합적인 재무 영향 분석 보고서를 도출하세요.

[1. 기업의 재무 맥락 및 전망 (Fundamentals & Consensus)]
- PER 현황: 현재 PER ${trailingPEStr}배 (선행 PER ${forwardPEStr}배) / PBR: ${pbrStr}배
- 최근 매출 성장률: ${revenueGrowthStr}%
- 최근 4분기 분기 실적 추이 (매출 및 순이익):
${revenueLines}
- 최근 4분기 EPS 및 서프라이즈 추이:
${historyLines}
- 차기 분기 시장 컨센서스 (가이던스 분석 기준):
${nextEstimateStr}

[1-2. 추가 재무 안전성, 수급 및 경쟁사 지표 (Liquidity, Ownership & Peers)]
- 유동성 현황: 가용 현금 및 현금성 자산 ${cashAndEquivalentsStr} / 월평균 현금 소모액 ${cashBurnRateStr} / 예상 현금 런웨이(Runway) ${cashRunwayStr}
- 주주 구성 및 수급: 내부자 지분율 ${insidersStr} / 기관 투자자 지분율 ${institutionsStr}
- 애널리스트 목표가 기대 편차(최고-최저가 격차율): ${targetDeviationStr}
- 애널리스트 투자의견 분포: ${consensusDistStr}
- 동종업계 경쟁사(Peers) 동적 비교 지표:
${peerMetricsStr}

[2. 미국 거시경제 상황 (Macroeconomic Context - FRED API)]
${macroSection}

[3. 최근 180일 주가 추이 및 시장 센티먼트 (Recent 180-Day Price & Sentiment)]
${priceMetricsSection}

[4. 수집된 SEC 공시 데이터 (8-K, 10-K, 10-Q, Form 4 등)]
${combinedText || '공시 데이터를 불러오지 못했습니다.'}

[분석 지시사항]
1. 최근 5개 8-K 수시 공시의 주요 사건들(계약 체결, 시설 한도 증액 등)이 기업의 유동성 및 재무 건전성에 미치는 단기 영향을 분석하세요.
2. 10-K 및 10-Q에서 추출된 연결손익계산서 및 리스크 요인을 바탕으로, 이번 수시 공시 내용이 장기적 위험요소를 상쇄하거나 매출 성장을 가속화할 수 있는 동력인지 판단하세요.
3. Form 4 내부자 거래 기록이 있다면 최근 매도/매수 경향성이 이번 공시의 신뢰도 및 경영진의 심리와 어떻게 맞아떨어지는지(내부자 순매수/순매도 유무) 연계하여 해석하세요.
4. 제공된 [2. 미국 거시경제 상황] 지표를 종합 분석에 적극 반영하십시오:
   - 현재 미국 기준금리 수준이 해당 기업의 신규 자금 조달 비용(부채 이자 부담) 및 현금 흐름에 미칠 압박 정도를 진단하십시오.
   - 장단기 금리차가 역전(음수)되어 있는 경우, 향후 경기 둔화 가능성 대비 이 기업(특히 한계기업/적자기업/개잡주)의 비즈니스 안정성 및 부도 위험을 가치평가에 반영하십시오.
   - 소비자물가상승률(CPI YoY) 및 실업률 추세가 기업의 생산 비용 상승(마진 훼손 여부)과 제품 수요에 미칠 단기/중기적 영향을 평가하십시오.
5. 제공된 [3. 최근 180일 주가 추이 및 시장 센티먼트] 정보를 분석에 연계하십시오:
   - 최근 180일 주가 변동성(평균 대비 표준편차 비율)이 극도로 높거나 주가가 폭락하는 상황에서 악재 공시가 연이어 발생했다면, 시장의 공포 심리 및 신용/추가 담보 리스크를 강조해 주십시오.
   - 반대로 주가가 최근 급등하여 변동성이 높은 상태에서 호재성 공시가 났다면, 해당 공시가 실체 없는 테마성 거품(Pump & Dump)인지 혹은 실제 펀더멘털 개선을 유도할 견조한 모멘텀인지 분석하십시오.
 6. 분석 결과 도출되는 매출액(revenue)이나 EPS, 가이던스 등의 실질 값은 공시 원문과 위 제공된 '재무 맥락' 수치들을 토대로 정확하게 작성하세요. (정보 부재 시 '집계 중' 혹은 'N/A'가 아닌, 제공된 시장 컨센서스 및 과거 매출 데이터를 토대로 유추하여 합당한 가치평가를 제시하십시오.)
 7. 제공된 [1-2. 추가 재무 안전성, 수급 및 경쟁사 지표]를 분석 및 최종 신뢰도 점수(confidenceScore) 산정에 적극 반영하십시오:
    - 현금 런웨이가 12개월 미만으로 짧다면 재무적 리스크 및 추가 지분 희석 우려를 반영하고, 24개월 이상으로 풍부하다면 성장 인프라 투자 지속 가능성에 가산점을 부여하십시오.
    - 내부자 지분율이 극도로 낮거나 최근 매도 일색이라면 경영진 자신감(managementTone) 판정에 반영하고, 기관 투자 비율 변화를 통해 시장 수급의 견조성을 확인하십시오.
    - 동종업계 경쟁사들의 P/E, P/B 멀티플 대비 현재 기업의 밸류에이션(고평가/저평가 여부)을 객관적으로 비교 분석하십시오.
    - 애널리스트들의 의견 대립 편차(목표가 기대 편차)가 크다면, 시장의 불확실성이 크다는 점을 참작하여 최종 분석 신뢰도(confidenceScore)의 보정 근거로 사용하십시오.

[중요 규칙]
- details, keyDrivers, riskFactors, shareholderReturn, oneLineSummary 등 스키마 내의 모든 텍스트/문자열(String) 필드는 반드시 한국어로 격식 있고 프로페셔널하게 작성해 주세요.
- sentiment, managementTone, status와 같은 enum 값은 스키마에 정의된 영문 값(예: 'STRONG BUY', 'Confident', 'Beat' 등)을 그대로 사용해야 합니다.
- confidenceScore는 0부터 100 사이의 백분율 정수값(예: 80, 85, 90)으로 반드시 지정해야 합니다. 10점 만점 기준이나 소수점 비율(0~1)로 작성하면 안 됩니다.
`;
}

