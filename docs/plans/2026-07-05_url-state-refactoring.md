# URL 기반 라우팅 동기화 및 렌더링 최적화 구현 계획서

`useEffect` 내부에서 동기적으로 `setState`를 호출하여 발생하는 Cascading Render(이중 렌더링) 린트 에러와 로컬 `DeepPartial` 타입 불일치 문제를 근본적으로 해결하기 위해, 핵심 도메인 상태를 브라우저 URL 쿼리 파라미터(Single Source of Truth)로 이관하고 리액트 컴포넌트 생명주기와 일치시키는 리팩토링 구현 계획서입니다.

---

## 📌 목표 및 해결 방안

1. **상태 동기화 이중 렌더링 제거**: 
   * `page.tsx`에서 수동으로 화면 초기화 및 연동을 위해 사용하던 `reportData` 로컬 상태와 `useEffect` 동기화 로직을 완전히 걷어냅니다.
   * `useObject`의 스트리밍 데이터(`analysis`)를 직접 하위 컴포넌트에 주입합니다.
2. **URL을 단일 진실 공급원(Single Source of Truth)으로 사용**:
   * `activeTicker`, `hasPosition`, `avgPrice` 등의 주요 상태를 Next.js의 `useSearchParams` 기반의 쿼리 파라미터로 대체합니다.
   * 검색(`handleSearch`) 및 분석 요청(`handleAnalyze`) 실행 시 상태를 직접 변경하지 않고, URL을 업데이트(`router.push`)하여 브라우저 라우팅을 일치시킵니다.
3. **컴포넌트 리셋 제어**:
   * `AnalysisReport` 컴포넌트의 `key` 속성에 현재 분석 중인 공시의 식별값(`activeFiling?.accessionNumber || activeTicker`)을 전달하여, 티커나 공시가 변경되는 순간 컴포넌트가 완전히 청소 및 초기화(Remount)되도록 설계합니다.
4. **Next.js 빌드 안전성 보장**:
   * `useSearchParams` 사용에 따른 Next.js 정적 빌드 오류(Static Generation Deopt) 방지를 위해, `page.tsx` 내부를 `Suspense`로 래핑하는 최적화를 수행합니다.

---

## 🛠️ 제안하는 변경 사항

### 1. 프론트엔드 대시보드 리팩토링 및 URL 라우팅 연동

#### [MODIFY] [page.tsx](file:///Users/jeongjiwon/projects/2026/stock-analyzer/src/app/page.tsx)
* `useSearchParams` 및 `useRouter`를 사용해 URL 파라미터(`ticker`, `analyze`, `hasPosition`, `avgPrice`)를 읽어와 핵심 비즈니스 로직에 주입합니다.
* 기존 `reportData` 상태 및 `useEffect` 동기화 로직을 삭제합니다.
* `ticker` 변경 감지 `useEffect`와 `analyzeTrigger` 감지 `useEffect`를 선언적으로 나누어 처리합니다.
* `Home` 컴포넌트를 `Suspense`로 감싸고, 본문 로직은 `HomeContent` 컴포넌트로 분리합니다.

```typescript
// 핵심 구조 예시
export default function Home() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">
        데이터 로딩 중...
      </div>
    }>
      <HomeContent />
    </React.Suspense>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL에서 상태 파싱
  const activeTicker = searchParams.get('ticker')?.toUpperCase() || '';
  const analyzeTrigger = searchParams.get('analyze') === 'true';
  const queryHasPosition = searchParams.get('hasPosition') === 'true';
  const queryAvgPrice = searchParams.get('avgPrice') ? parseFloat(searchParams.get('avgPrice')!) : null;
  ...
}
```

---

## 🧪 검증 계획 (Verification Plan)

### 자동화 및 정적 테스트
* `npm run build`를 수행하여 빌드 타임에 Next.js of 정적 생성(Static Generation) 에러나 TypeScript 컴파일 에러가 발생하지 않는지 검증합니다.

### 수동 테스트
1. **검색 연동 확인**:
   * 검색창에 티커를 검색했을 때 브라우저 주소창이 `/?ticker=NVDA` 형태로 변경되고, 대시보드 지표들이 해당 티커에 맞게 로드되는지 확인합니다.
2. **분석 트리거 확인**:
   * "AI 포지션 맞춤 분석 시작"을 누를 시 주소창이 `/?ticker=NVDA&analyze=true&hasPosition=true&avgPrice=130` 형태로 갱신되면서 즉시 AI 스트리밍 분석이 정상적으로 개시되는지 점검합니다.
3. **컴포넌트 리셋 확인**:
   * 분석 도중 다른 티커를 검색하여 진입했을 때, 기존 분석 화면과 폼 내용이 깔끔하게 지워지고 대기 상태(Empty State)로 초기화되는지 검증합니다.
