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
}

/**
 * 월스트리트 수석 애널리스트 페르소나를 기반으로 기업의 다각적 재무 데이터와 SEC 공시들을 종합 분석하기 위한 프롬프트를 생성합니다.
 */
export function buildAnalysisPrompt(
  ticker: string,
  fundamentals: FundamentalsInput | null,
  combinedText: string
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

  return `
당신은 월스트리트의 수석 애널리스트입니다.
다음 기업(${ticker})의 '정밀 재무 흐름', '시장 컨센서스', 그리고 '수집된 다양한 SEC 공시 데이터'를 연계하여 종합적인 재무 영향 분석 보고서를 도출하세요.

[1. 기업의 재무 맥락 및 전망 (Fundamentals & Consensus)]
- PER 현황: 현재 PER ${trailingPEStr}배 (선행 PER ${forwardPEStr}배) / PBR: ${pbrStr}배
- 최근 매출 성장률: ${revenueGrowthStr}%
- 최근 4분기 분기 실적 추이 (매출 및 순이익):
${revenueLines}
- 최근 4분기 EPS 및 서프라이즈 추이:
${historyLines}
- 차기 분기 시장 컨센서스 (가이던스 분석 기준):
${nextEstimateStr}

[2. 수집된 SEC 공시 데이터 (8-K, 10-K, 10-Q, Form 4 등)]
${combinedText || '공시 데이터를 불러오지 못했습니다.'}

[분석 지시사항]
1. 최근 5개 8-K 수시 공시의 주요 사건들(계약 체결, 시설 한도 증액 등)이 기업의 유동성 및 재무 건전성에 미치는 단기 영향을 분석하세요.
2. 10-K 및 10-Q에서 추출된 연결손익계산서 및 리스크 요인을 바탕으로, 이번 수시 공시 내용이 장기적 위험요소를 상쇄하거나 매출 성장을 가속화할 수 있는 동력인지 판단하세요.
3. Form 4 내부자 거래 기록이 있다면 최근 매도/매수 경향성이 이번 공시의 신뢰도 및 경영진의 심리와 어떻게 맞아떨어지는지(내부자 순매수/순매도 유무) 연계하여 해석하세요.
4. 분석 결과 도출되는 매출액(revenue)이나 EPS, 가이던스 등의 실질 값은 공시 원문과 위 제공된 '재무 맥락' 수치들을 토대로 정확하게 작성하세요. (정보 부재 시 '집계 중' 혹은 'N/A'가 아닌, 제공된 시장 컨센서스 및 과거 매출 데이터를 토대로 유추하여 합당한 가치평가를 제시하십시오.)

[중요 규칙]
- details, keyDrivers, riskFactors, shareholderReturn, oneLineSummary 등 스키마 내의 모든 텍스트/문자열(String) 필드는 반드시 한국어로 격식 있고 프로페셔널하게 작성해 주세요.
- sentiment, managementTone, status와 같은 enum 값은 스키마에 정의된 영문 값(예: 'STRONG BUY', 'Confident', 'Beat' 등)을 그대로 사용해야 합니다.
`;
}
