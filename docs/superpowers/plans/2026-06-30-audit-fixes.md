# Repository Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved repository-audit fixes while preserving the login footer text `Em caso de acesso bloqueado, To nem ai`.

**Architecture:** Delete stale local-webscraping control paths and keep Escavador as webhook-only. Fix frontend initial-load regressions at source by removing eager manual chunks, then make the bundle gate measure the initial HTML dependency set instead of total deployment assets. Keep UI/accessibility changes small and reuse existing dialog/toast utilities.

**Tech Stack:** NestJS, React, Vite, TypeScript, Vitest/Jest, ESLint, Prettier.

---

### Task 1: Escavador webhook-only cleanup

**Files:**
- Modify: `src/modules/escavador-seirn/escavador-seirn.controller.ts`
- Modify: `src/modules/escavador-seirn/escavador-seirn.service.ts`
- Modify: `src/modules/escavador-seirn/escavador-seirn.service.spec.ts`
- Delete: `frontend/src/services/escavadorService.ts`
- Modify: `frontend/src/pages/Configuracoes/SystemSettings.tsx`
- Modify: `frontend/src/pages/Configuracoes/__tests__/SystemSettings.spec.tsx`
- Modify: `docs/webscraping-seirn-notas.md`

- [ ] Remove `start`, `stop`, and `status` routes/methods and the local `child_process.spawn` code.
- [ ] Preserve signed webhook behavior and existing captures/notifications.
- [ ] Remove the frontend settings panel that controls the local scraper.
- [ ] Update docs to describe external webhook-only operation.
- [ ] Run backend/frontend targeted tests.

### Task 2: Frontend login/auth and initial bundle

**Files:**
- Modify: `frontend/src/contexts/AuthContext.tsx`
- Modify: `frontend/src/__tests__/AuthContext.test.tsx`
- Modify: `frontend/src/pages/LoginPage.tsx`
- Modify: `frontend/src/pages/LoginPage.test.tsx` or existing login test
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/scripts/check-bundle-size.mjs`
- Create: `.nvmrc`

- [ ] Add/adjust tests for anonymous auth refresh failure and password toggle focusability.
- [ ] Make refresh return success/failure and avoid a second profile call after failed anonymous refresh.
- [ ] Remove `tabIndex={-1}` from the password toggle.
- [ ] Remove custom `manualChunks` that force charts into the initial preload list.
- [ ] Change bundle check to fail on initial assets and warn on total deployment size.
- [ ] Add `.nvmrc` with Node 24.

### Task 3: Dead code/dependencies/native dialogs

**Files:**
- Delete: `frontend/src/components/ui/ConfirmDialog.tsx`
- Delete: `frontend/src/components/ui/LoadingSpinner.tsx`
- Delete: `frontend/src/components/ui/DateRangePicker.tsx`
- Delete: `frontend/src/components/test/SearchIconTest.tsx`
- Modify: `frontend/src/components/ui/index.ts`
- Modify: `frontend/src/routes/lazyPages.ts`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Modify native `confirm`/`alert` call sites found by `rg`

- [ ] Remove unused components and dev-only route.
- [ ] Remove unused direct dependencies `@types/recharts` and `follow-redirects`.
- [ ] Replace native dialogs with existing dialog/toast patterns.

### Task 4: Quality gate

**Files:**
- Modify only files needed by formatting/lint fixes.

- [ ] Apply Prettier to touched frontend/backend files.
- [ ] Reduce frontend `no-console` warnings by using the existing logger or scoped lint disables for logger/test setup.
- [ ] Run `npm run typecheck`, `npm run lint`, backend unit tests, frontend tests, `npm run build`, and bundle check.
- [ ] Verify the protected login text still exists unchanged.
