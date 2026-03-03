# AI BEHAVIOR & PROJECT RULES (LINUX ENVIRONMENT)

## 0. Scope (IMPORTANT)
- This file defines rules for the **Frontend** (React/Vite/TS/Tailwind).
- If this repository also contains a backend (NestJS), put backend rules in: `backend/AGENTS.md` (or similar path).
- Don't fight errors! whenever you encounter the same error twice, research the web and find 3-5 possible ways to fix it. Then choose the most efficient solution and implement it."

## 1. Project Context
- Stack: React, Vite, TypeScript, TailwindCSS
- Architecture: Clean Architecture + feature-based folders
- Goal: Sistema de gestão de documentos e desarquivamento (PCI/RN)

## 2. Linux & Terminal Constraints
- Case Sensitivity: imports must match exact filename casing
- Path separators: use `/`
- Scripts: if creating `.sh`, remind to `chmod +x <script>`

## 3. Tooling & Versions (keep consistent)
- Node version: (fill) e.g. use `.nvmrc` or `package.json#engines`

## 4. Mandatory Commands (run before finishing a task)
- Install: `npm install`
- Dev: `npm run dev`
- Unit tests: `npm test:unit`
- Build: `npm build`
- Lint: `npm lint` (add if not exists)
- Format: `npm format` (add if not exists)
- Typecheck: `npm typecheck` (add if not exists)
- Up Container: `docker compose up -d` 
- Down Container: `docker compose down`
- Restart Container: `docker compose restart`
- Migrations: `npm run migration:run`


## 5. Coding Standards
- Components: Functional components + explicit TypeScript types (no `any`)
- Styling: Tailwind only (no inline styles)
- State: Zustand (avoid Context for complex state)
- Naming: camelCase vars/functions, PascalCase components
- Imports: use `@/` alias for absolute imports (no brittle relative chains)

## 6. API Consumption Rules
- Always handle: loading / empty / error states
- Centralize HTTP client (e.g., `src/services/http`), never scatter fetch logic
- Auth: check auth before API calls; never store tokens in insecure places
- Errors: normalize API errors (map to a typed error model)

## 7. Security & Hardening (frontend)
- Avoid `dangerouslySetInnerHTML`. If unavoidable, sanitize explicitly.
- Never log secrets/tokens in console.
- Prefer httpOnly cookies (if backend supports); avoid localStorage for sensitive tokens.
- Validate/encode anything rendered from user input or external APIs.

## 8. Common Mistakes to Avoid
- No `any` in TS
- Don’t use Windows-only commands (`cls`, `dir`)
- Don’t introduce “quick hacks” without types/tests
- Don’t add dependencies without a clear reason

## 9. Definition of Done (short)
- Builds locally
- Typecheck ok
- Lint ok
- Tests ok (or justified if none)
- UI: no regressions; basic accessibility (labels, focus, keyboard nav) for changed screens



