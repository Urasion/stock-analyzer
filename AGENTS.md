<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI Agent Development Rules: Folder Structure & Component Conventions

## 1. Core Principle: Feature-Based Architecture
우리의 프로젝트는 기능 단위로 코드를 응집하는 **Feature-Based 구조**를 따릅니다. AI 에이전트는 새로운 컴포넌트나 로직을 추가할 때 반드시 이 구조를 준수해야 하며, 무분별한 글로벌 컴포넌트 생성을 금지합니다.

### 📂 Directory Structure Tree
```text
src/
├── components/          # 공통/글로벌 공유 컴포넌트 (Domain-agnostic)
│   ├── ui/              # 디자인 시스템 기초 컴포넌트 (Button, Input, Modal 등)
│   └── layout/          # 공용 레이아웃 컴포넌트 (Header, Sidebar, Footer 등)
├── features/            # 기능 중심 모듈 (Domain-specific)
│   ├── [feature-name]/  # 예: auth, profile, dashboard, market
│   │   ├── components/  # 해당 기능 내에서만 재사용되는 컴포넌트
│   │   ├── hooks/       # 해당 기능 전용 커스텀 훅
│   │   ├── services/    # API 요청 등 비즈니스 로직
│   │   ├── store/       # 해당 기능 전용 상태 관리 (Jotai atoms 등)
│   │   ├── types/       # 해당 기능 전용 타입 정의
│   │   └── index.ts     # 외부로 노출할 요소만 export (캡슐화)
├── hooks/               # 전역 공통 커스텀 훅
├── utils/               # 전역 공통 유틸리티 함수
└── types/               # 전역 공통 타입 정의
```

## 2. Code Conventions
프로젝트 내의 코드는 기본적으로 **Airbnb JavaScript/React Style Guide**를 철저히 따릅니다.
- **문자열**: 일반 JavaScript/TypeScript 문자열은 홑따옴표(`'`)를 필수 사용하고, TSX/JSX 내의 HTML 속성은 쌍따옴표(`"`)를 사용합니다.
- **세미콜론**: 모든 구문 종료 시 세미콜론(`;`)을 생략하지 않습니다.
- **후행 쉼표(Trailing Comma)**: 여러 줄로 구성된 객체, 배열, 매개변수 선언 등의 마지막 요소 끝에 항상 쉼표(`,`)를 추가합니다.
- **상수 변수**: 재할당되지 않는 변수는 반드시 `const`로 선언합니다.
- **명시적 타입 선언**: TypeScript 함수(특히 API 라우터 함수 등) 정의 시 반환형(Return Type)을 생략하지 않고 명시적으로 작성합니다.

