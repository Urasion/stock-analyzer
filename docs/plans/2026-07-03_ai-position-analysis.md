# 사용자 보유 포지션 기반 AI 대응 전략 및 투자의견 분석 구현 계획서

사용자가 현재 보유하고 있는 주식의 **평균 매수 단가(Average Cost)** 정보를 입력받아, Gemini AI가 해당 평단가와 현재 주가를 비교 분석하여 **보유(Hold) / 추가 매수(Buy) / 비중 축소(Reduce) / 전량 매도(Sell)** 시나리오를 맞춤형으로 도출하도록 분석 파이프라인과 UI를 개선하는 구현 계획서입니다.

---

## 📌 목표 및 범위

* **목표**: 일방향적인 기업 정보 요약을 넘어 사용자의 개별 투자 단가(포지션) 대비 실질적이고 구체적인 의사결정(팔지 말지 결정) 리스크 관리 가이드를 제공합니다.
* **범위**:
  1. **스키마 확장 (`schema.ts`)**: AI 분석 출력 구조에 포지션별 맞춤 전략(`positionStrategy`) 스키마 추가.
  2. **프롬프트 튜닝 (`prompts.ts`)**: 평균 매수 단가와 현재 주가의 차이(수익률) 및 기업의 SEC 공시 리스크를 결합하여 구체적인 탈출/보유 근거 및 목표 대응 단가를 생성하도록 프롬프트 작성 지침 고도화.
  3. **UI 입력 폼 제공 (`AnalysisReport.tsx`)**: 분석 시작 전, "포지션 보유 여부" 및 "평균 매수 단가(USD)"를 기입할 수 있는 폼 제공.
  4. **시각적 보고서 고도화 (`AnalysisReport.tsx`)**: 분석 결과에서 AI의 포지션 추천 액션(추매, 홀딩, 손절 등) 및 근거를 직관적인 카드 형태로 강조 노출.

---

## 🙋‍♀️ 사용자 검토 사항 및 오픈 퀘스천

> [!IMPORTANT]
> **1. 미보유 상태에 대한 대응 액션**
> 사용자가 주식을 보유하지 않은 상태(신규 진입 고민)일 경우에도 KIS/야후 시세와 리스크 분석을 조합해 **"신규 진입 대기 (WAIT_FOR_ENTRY)"** 혹은 **"현재가 분할 진입 추천 (BUY)"** 등으로 유연한 대응 지침이 반환되도록 스키마를 구성하고자 합니다. 이 방향에 동의하시는지 확인을 요청드립니다.
> 
> **2. 입력 통화 규격**
> 미국 상장 기업들을 대상으로 하므로, 평균 매수 단가는 **달러(USD)** 단위 입력을 기본으로 하되, 원화 입력을 원하시는 경우 원-달러 실시간 환율을 연동하거나 단순히 입력창에 달러 기준으로 기입하도록 가이드하는 방식 중 선택이 필요합니다. (심플하게 달러 입력 가이드를 우선 추천합니다.)

---

## 🛠️ 제안하는 변경 사항

### 1. 스키마 확장

#### [MODIFY] [schema.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/schema.ts)
* `stockAnalysisSchema` 최하단에 사용자 맞춤형 포지션 전략 객체(`positionStrategy`)를 추가 정의합니다.
  ```typescript
  positionStrategy: z.object({
    recommendation: z.enum(['BUY_MORE', 'HOLD', 'REDUCE', 'SELL_ALL', 'WAIT_FOR_ENTRY']),
    targetPrice: z.string(), // 대응 권장 기준 가격 (예: "$120 이하 분할 추매" 또는 "$155 이탈 시 손절")
    reasoning: z.string(), // 포지션 대응 추천에 대한 구체적 리스크/재무적 근거
  }).optional()
  ```

---

### 2. 백엔드 API 및 프롬프트 주입

#### [MODIFY] [prompts.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/api/sec/analyze/prompts.ts)
* `buildAnalysisPrompt` 인자에 `hasPosition?: boolean`, `avgPrice?: number | null`를 추가합니다.
* 프롬프트에 `[5. 사용자 보유 포지션 분석 상황 (User Position Info)]` 섹션을 주입합니다.
* AI가 현재가 대비 수익률 상황을 계산하고, SEC EDGAR 공시 분석 리스크 및 거시경제 상황을 연동하여 `positionStrategy`에 적합한 추천 액션과 판단 근거를 도출하도록 분석 규칙(Analysis Instructions)을 추가합니다.

#### [MODIFY] [route.ts (Stream API)](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/api/sec/analyze/stream/route.ts)
* 요청 페이로드(`request.json()`)에서 `hasPosition`, `avgPrice` 값을 읽어와 `buildAnalysisPrompt` 함수에 안전하게 전달하도록 연결합니다.

---

### 3. 프론트엔드 대시보드 페이지 연동

#### [MODIFY] [page.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/page.tsx)
* 사용자의 포지션 기입을 제어하기 위한 로컬 상태 `hasPosition` (boolean) 및 `avgPrice` (number | null)를 신설합니다.
* `handleAnalyze` 호출 시 이 두 가지 포지션 상태값을 `submit` 호출 시 인자로 실어서 전송하도록 수정합니다.
  ```typescript
  submit({
    urls: targetFilings.map((f) => f.url),
    url10K: target10K ? target10K.url : null,
    url10Q: target10Q ? target10Q.url : null,
    urlsForm4: targetForm4.map((f) => f.url),
    ticker: activeTicker,
    hasPosition,
    avgPrice,
  });
  ```
* `AnalysisReport` 컴포넌트에 이 상태값과 상태 변경 셋터(Setter)를 props로 넘겨줍니다.

---

### 4. 포지션 입력 및 결과 분석 보고서 UI 구현

#### [MODIFY] [AnalysisReport.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/features/ai-analysis/components/AnalysisReport.tsx)
* **분석 전 입력 폼**:
  * "포지션 상태"를 체크하는 토글 단추(보유 중 / 미보유)를 제공합니다.
  * "보유 중"을 선택할 시, 평균 매수 단가($)를 입력할 수 있는 슬림한 input 필드를 활성화합니다.
* **분석 진행 및 완료 후**:
  * 사용자가 입력했던 평단가와 현재 주가를 상단에 간략히 박스로 표출합니다.
  * AI가 전달해 주는 `positionStrategy` 데이터를 바탕으로 **"AI 대응 진단"** 전용 결과 카드를 보고서 최상단에 미려하게 렌더링합니다.
  * 추천 행동(`BUY_MORE`, `SELL_ALL` 등)별로 다채로운 테마 테두리 및 어시스트 문구를 표기하여 직관적인 UX를 실현합니다.

---

## 🧪 검증 계획 (Verification Plan)

### 자동화 및 정적 테스트
* `npm run build`를 실행하여 Zod 스키마 및 Props 변경에 따른 TS 정적 분석 통과 여부를 검증합니다.

### 수동 테스트
1. **미보유 시**:
   * 포지션 미보유 상태로 검색 후 분석을 실행하여 "WAIT_FOR_ENTRY" 혹은 "BUY" 대응 및 진입 단가 가이드가 정상적으로 리포트에 뜨는지 확인합니다.
2. **보유 시 (손실 구간)**:
   * 현재가보다 현저히 높은 매수 평단가를 기입하고 분석을 실행하여, AI가 재무 리스크를 연계한 분할 손절(`REDUCE` / `SELL_ALL`) 대응 가이드를 타당하게 산출하는지 검증합니다.
3. **보유 시 (수익 구간)**:
   * 현재가보다 낮은 매수 평단가를 기입하고 분석하여 홀딩(`HOLD`) 및 익절 목표 단가 가이드를 내리는지 확인합니다.
