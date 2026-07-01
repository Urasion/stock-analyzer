<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI Agent Development Rules: Folder Structure & Component Conventions

## 1. Core Principle: Feature-Based Architecture
Our project follows a **Feature-Based Architecture** where code is grouped by feature. AI agents must adhere to this structure when adding new components or logic, and are strictly prohibited from creating unnecessary global components.

### 📂 Directory Structure Tree
```text
src/
├── components/          # Shared/Global components (Domain-agnostic)
│   ├── ui/              # Design system basic components (Button, Input, Modal, etc.)
│   └── layout/          # Shared layout components (Header, Sidebar, Footer, etc.)
├── features/            # Feature-centric modules (Domain-specific)
│   ├── [feature-name]/  # e.g., auth, profile, dashboard, market
│   │   ├── components/  # Components used only within this feature
│   │   ├── hooks/       # Feature-specific custom hooks
│   │   ├── services/    # Business logic such as API requests
│   │   ├── store/       # Feature-specific state management (Jotai atoms, etc.)
│   │   ├── types/       # Feature-specific type definitions
│   │   └── index.ts     # Encapsulation layer, exporting only what's needed externally
├── hooks/               # Global shared custom hooks
├── utils/               # Global shared utility functions
└── types/               # Global shared type definitions
```

## 2. Code Conventions
Code within the project strictly follows the **Airbnb JavaScript/React Style Guide** by default.
- **Strings**: Must use single quotes (`'`) for normal JavaScript/TypeScript strings, and double quotes (`"`) for HTML attributes in TSX/JSX.
- **Semicolons**: Do not omit semicolons (`;`) at the end of statements.
- **Trailing Comma**: Always add a trailing comma (`,`) at the end of multi-line objects, arrays, parameter declarations, etc.
- **Constants**: Variables that are not reassigned must be declared with `const`.
- **Explicit Type Declarations**: Do not omit return types when defining TypeScript functions (especially API router functions, etc.); always specify them explicitly.
- **No `any` Type**: Do not use the `any` type under any circumstances. Always use precise, descriptive types.
- **Explicit Types and Interfaces**: Always define and use explicit `type` or `interface` declarations for all data structures, objects, function parameters, component props, and state.

## 3. Documentation Rules
- **Implementation Plan Language**: The implementation plan (`implementation_plan.md`) must always be written in Korean.

