# SEC 10-K(리스크) 및 Form 4(내부자 거래) 연계 AI 종합 분석 구현 계획

기존의 최근 5개 8-K(수시 공시) 연계 분석에 더해, 기업의 장기 리스크가 담긴 **10-K(연례 보고서)**와 경영진의 심리를 보여주는 **Form 4(내부자 매매 공시)** 데이터를 실시간 연동하여 한 차원 높은 수준의 입체적 애널리스트 리포트를 작성할 수 있도록 고도화합니다.

## User Review Required

> [!IMPORTANT]
> 10-K 연례 보고서는 텍스트 크기가 수십만 자에 달하므로 효율적인 텍스트 분리가 필수적입니다.
> * **10-K 최적화**: 문서를 전체 스크랩하지 않고, HTML 내에서 `Item 1A (Risk Factors)` 검색 지점부터 약 **6,000자**만 잘라내어 컨텍스트 과부하를 막겠습니다.
> * **Form 4 최적화**: 네트워크 호출 지연을 최소화하기 위해, 최근 3개의 Form 4 공시 문서만 선별해 각각 초반 **1,500자**씩 긁어와 거래 요약 정보를 제공하겠습니다.

---

## Proposed Changes

### 1. API Layer

#### [MODIFY] [route.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/api/sec/route.ts) (공시 조회 API)
* SEC Submissions API를 분석해 `recent.form` 루프를 돌릴 때, `8-K`뿐만 아니라 최근 `10-K` 1개와 최근 `Form 4` 5개를 추가 필터링하여 JSON에 담아 반환합니다.
* 응답 구조 예시:
  ```json
  {
    "filings": [...], // 8-K 최근 5개
    "filing10K": { ... }, // 최신 10-K 1개 또는 null
    "filingsForm4": [...] // 최근 Form 4 5개
  }
  ```

#### [MODIFY] [stream/route.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/api/sec/analyze/stream/route.ts) & [route.ts](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/api/sec/analyze/route.ts) (분석 API)
* 프론트엔드로부터 `urls: string[]`, `url10K: string | null`, `urlsForm4: string[]`을 인자로 받습니다.
* **10-K 리스크 스크랩**: `url10K`에서 HTML 다운로드 후, 정규식 매칭을 통해 `Item 1A. Risk Factors` 영역만 6,000자 내외로 추출합니다.
* **Form 4 내부자 스크랩**: `urlsForm4` 중 최근 3개에 한해 HTML을 가져와 초반부 1,500자를 수집합니다.
* **프롬프트 고도화**: 분석 프롬프트에 10-K 및 Form 4 텍스트 영역을 추가하고, 장기 리스크와 내부자 거래 경향을 종합적으로 비추어 단기 수시공시(8-K)의 유의성을 판단하도록 지시사항을 보강합니다.

---

### 2. UI Layer

#### [MODIFY] [page.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/page.tsx)
* `secError` 및 `filings` 외에 `filing10K` 및 `filingsForm4` 상태를 새롭게 정의하고, `/api/sec` 호출 후 상태를 업데이트합니다.
* `handleAnalyze` 호출 시 `filings` 외에도 `filing10K`의 url 정보와 `filingsForm4`의 url 리스트를 취합해 `submit` 매개변수로 전달합니다.

#### [MODIFY] [FilingList.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/features/stock-analyzer/components/FilingList.tsx)
* 공시 리스트 상단에 연계 분석될 10-K 및 Form 4 상태를 확인 가능한 **"종합 분석 대상 리포트 리스트 요약 요소를 배치"**하여 직관성을 높입니다.
  - "연례 보고서 (10-K) 확보됨"
  - "최근 내부자 거래 (Form 4) 5건 감지"
* 통합 분석 버튼 명칭을 **"최근 5개 공시 + 10-K 리스크 + Form 4 내부자 동향 종합 분석하기"** 형태로 업데이트합니다.

---

## Verification Plan

### Automated & Manual Verification
1. **타입 정합성**: `npx tsc --noEmit`을 통해 JSX 구조 및 Props 데이터 구조 무결성 검증.
2. **콘솔 로그 검사**: 10-K 및 Form 4 정보가 정상적으로 분할 스크랩되어 통합 프롬프트 텍스트에 포함되는지 디버그 모드로 확인.
3. **분석 품질 테스트**: 생성된 AI 분석 보고서에 장기 위험요인 분석 및 내부자 거래 동향이 한국어로 매끄럽게 작성되는지 확인.
