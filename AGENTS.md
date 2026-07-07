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
- **AGENTS.md Language**: Any rules or content added to `AGENTS.md` must always be written in English.
- **API and Function Documentation**: When adding, modifying, or deleting API routes (under `src/app/api/`) or core helper functions (under `src/lib/`), you must update the documentation in [api_and_functions.md](file:///Users/jeongjiwon/projects/2026/stock-analyzer/docs/api_and_functions.md) to reflect the changes.

## 4. Type and Interface Declaration Rules
- **Global Types**: Types or interfaces that are used across multiple features, components, or libraries must be declared in the global `src/types` directory (e.g., `src/types/index.ts`).
- **Feature-Specific Types**: Types or interfaces that are specific to a single feature must be declared in the feature's `types` directory (e.g., `src/features/[feature-name]/types/index.ts`).
- **No Inline Domain Types in Libs or Components**: Do not declare domain models, data structures, or API response schemas directly inside component files or `src/lib` utility files. Always separate them into the appropriate `types` directory and import them. (Component-only props interfaces can remain in the component file).

## 5. Plan Logging Rules
- **Automatic Plan Archiving**: When the AI agent writes an `implementation_plan.md` and the user approves it (by clicking the `Proceed` button), the agent must copy the contents of the plan to the project's `docs/plans/` directory under a filename formatted as `YYYY-MM-DD_short-description.md`.

## 6. Git Workflow Rules
- **Follow Git Commit Convention**: Once the task is completed, structure the changes according to standard Git commit conventions (e.g., `feat:`, `fix:`, `refactor:`, `style:`, etc.).
- **Korean Commit Comments & User Review**: Ensure that commit details/comments are written in **Korean**. Before creating the commit and pushing, output the summary of changes and the draft commit message for **user review and final approval**.
- **Automatic Git Push**: Upon receiving explicit approval from the user, execute the git commit and perform `git push` to the remote repository.

