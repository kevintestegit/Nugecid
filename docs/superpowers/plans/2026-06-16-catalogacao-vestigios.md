# Catalogacao de Vestigios Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o fluxo etiqueta -> catalogacao para vestigios, com status pendente, schema por categoria e formulario dinamico.

**Architecture:** Manter `vestigios` como registro mestre e adicionar metadados de catalogacao em JSONB. O frontend usa um schema local versionado para gerar a ficha de catalogacao conforme a categoria escolhida na etiqueta.

**Tech Stack:** NestJS, TypeORM, PostgreSQL JSONB, React, Vite, TypeScript, Vitest/Jest conforme testes existentes.

---

### Task 1: Backend Catalogacao Fields

**Files:**
- Modify: `src/modules/vestigios/entities/vestigio.entity.ts`
- Modify: `src/modules/vestigios/dto/create-vestigio.dto.ts`
- Modify: `src/modules/vestigios/vestigios.service.ts`
- Create: `src/migrations/1770200000000-AddCatalogacaoFieldsToVestigios.ts`
- Test: `src/modules/vestigios/vestigios.service.spec.ts`

- [ ] Write a failing service test asserting default status `catalogacao_pendente`.
- [ ] Write a failing service test asserting catalogacao metadata update sets status `catalogado`.
- [ ] Add entity columns for `classeCatalogacao`, `subclasseCatalogacao`, `tipoCatalogacao`, `schemaVersao`, `metadadosGerais`, and `metadadosEspecificos`.
- [ ] Extend DTOs with typed optional fields for the new catalogacao data.
- [ ] Add service logic for default status and catalogacao completion.
- [ ] Add a migration that creates the new columns without dropping existing data.
- [ ] Run `npm test -- src/modules/vestigios/vestigios.service.spec.ts --runInBand`.

### Task 2: Frontend Schema

**Files:**
- Create: `frontend/src/components/custodia/catalogacaoSchemas.ts`
- Test: `frontend/src/components/custodia/catalogacaoSchemas.test.ts`

- [ ] Write a failing test for the Papiloscopia schema, including `iris`.
- [ ] Implement catalogacao field types and class schemas for classes 0 to 9.
- [ ] Export helpers to find schema by selected class/group/subdivision/type.
- [ ] Run `cd frontend && npm test -- --run src/components/custodia/catalogacaoSchemas.test.ts`.

### Task 3: Etiqueta Creates Pending Catalogacao

**Files:**
- Modify: `frontend/src/components/custodia/balistica.tsx`
- Test: `frontend/src/components/custodia/balistica.test.tsx`

- [ ] Write a failing test that the save payload includes catalogacao fields and status `catalogacao_pendente`.
- [ ] Add tipo/categoria mapping from selected SCV to catalogacao schema.
- [ ] Include catalogacao fields in `POST /vestigios`.
- [ ] Keep existing label printing and database save behavior intact.
- [ ] Run the focused frontend test.

### Task 4: Catalogacao Page

**Files:**
- Modify: `frontend/src/pages/CatalogacaoVestigiosPage.tsx`
- Test: `frontend/src/pages/CatalogacaoVestigiosPage.test.tsx`

- [ ] Write a failing test that pending vestigios render in the catalogacao queue.
- [ ] Write a failing test that saving sends `metadadosGerais`, `metadadosEspecificos`, and status `catalogado`.
- [ ] Replace the placeholder page with a queue and details form.
- [ ] Render fields dynamically from `catalogacaoSchemas.ts`.
- [ ] Add loading, empty and error states.
- [ ] Run the focused frontend test.

### Task 5: Verification

**Files:**
- No new files.

- [ ] Run `npm run typecheck`.
- [ ] Run `npm test:unit`.
- [ ] Run `npm run build`.
- [ ] If frontend-only failures appear in unrelated dirty files, document them separately and keep this change scoped.
