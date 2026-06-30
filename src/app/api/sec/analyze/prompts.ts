export interface EPSHistoryItem {
  date: string;
  actual: number | null;
  estimate: number | null;
}

export interface FundamentalsInput {
  trailingPE: number | null;
  forwardPE: number | null;
  revenueGrowth: number | null;
  epsHistory: EPSHistoryItem[];
}

/**
 * 월스트리트 수석 애널리스트 페르소나를 기반으로 기업의 재무 데이터와 8-K 공시를 분석하기 위한 프롬프트를 생성합니다.
 */
export function buildAnalysisPrompt(
  ticker: string,
  fundamentals: FundamentalsInput | null,
  truncatedText: string
): string {
  const trailingPEStr = fundamentals?.trailingPE !== null && fundamentals?.trailingPE !== undefined
    ? `${fundamentals.trailingPE}`
    : 'N/A';
  const forwardPEStr = fundamentals?.forwardPE !== null && fundamentals?.forwardPE !== undefined
    ? `${fundamentals.forwardPE}`
    : 'N/A';
  
  const revenueGrowthVal = fundamentals?.revenueGrowth ?? 0;
  const revenueGrowthStr = fundamentals?.revenueGrowth !== null && fundamentals?.revenueGrowth !== undefined
    ? `${(revenueGrowthVal * 100).toFixed(2)}`
    : 'N/A';

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

  return `
당신은 월스트리트의 수석 애널리스트입니다. 
다음 기업(${ticker})의 '과거 재무 흐름'과 '새로 발표된 8-K 공시'를 종합적으로 분석하여 투자 의견을 도출하세요.

[1. 기업의 과거 맥락 (Context)]
- 현재 PER: ${trailingPEStr}배 (선행 PER: ${forwardPEStr}배)
- 최근 매출 성장률: ${revenueGrowthStr}%
- 과거 4분기 EPS 달성 추이:
${historyLines}

[2. 새로 발표된 8-K 공시 원문 (New Data)]
${truncatedText || '공시 본문 텍스트를 불러오지 못했습니다.'}

    [분석 지시사항]
    이번 공시 내용이 과거의 성장 둔화 추세를 반전시킬 수 있을 만큼 강력한지, 
    혹은 현재의 높은 PER을 정당화할 수 있는 수준의 가이던스를 제시했는지 엄격하게 판단하세요.

    [중요 규칙]
    - details, keyDrivers, riskFactors, shareholderReturn, oneLineSummary 등 스키마 내의 모든 텍스트/문자열(String) 필드는 반드시 한국어로 작성해 주세요.
    - sentiment, managementTone, status와 같은 enum 값은 스키마에 정의된 영문 값(예: 'STRONG BUY', 'Confident', 'Beat' 등)을 그대로 사용해야 합니다.
    `;
}
