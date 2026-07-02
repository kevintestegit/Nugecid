# Banco de Vestígios Visível Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir registros catalogados no Banco de Vestígios e redirecionar o usuário ao registro salvo.

**Architecture:** Centralizar a extração do array paginado em um helper reutilizado pelas duas telas. Manter o backend intacto; a navegação envia o `vestigioId` existente e o Banco já abre e destaca esse registro.

**Tech Stack:** React, React Router, TypeScript, Vitest, Testing Library.

---

### Task 1: Fixar listagem e redirecionamento em testes

**Files:**
- Create: `frontend/src/components/custodia/banco-vestigios.test.tsx`
- Modify: `frontend/src/pages/CatalogacaoVestigiosPage.test.tsx`

- [ ] **Step 1: Testar resposta paginada no Banco de Vestígios**

Mockar `GET /vestigios` com `{ data: { success: true, data: { data: [catalogado] } } }`, renderizar a página e esperar `103.154`, `4102` e `catalogado` na tabela.

- [ ] **Step 2: Testar redirecionamento após salvar**

Renderizar rotas de catalogação e banco, salvar `vest-1` e esperar a navegação para:

```text
/custodia/banco-vestigios?vestigioId=vest-1
```

- [ ] **Step 3: Confirmar falhas**

Run: `cd frontend && npm run test:unit -- src/components/custodia/banco-vestigios.test.tsx src/pages/CatalogacaoVestigiosPage.test.tsx`

Expected: FAIL porque o banco não extrai o array aninhado e a catalogação ainda não navega.

### Task 2: Implementar o fluxo mínimo

**Files:**
- Create: `frontend/src/components/custodia/vestigiosResponse.ts`
- Modify: `frontend/src/pages/CatalogacaoVestigiosPage.tsx`
- Modify: `frontend/src/components/custodia/banco-vestigios.tsx`
- Modify: `frontend/src/components/layout/Layout.tsx`

- [ ] **Step 1: Extrair a resposta de vestígios**

Criar `extractVestigiosFromResponse<T>(payload: unknown): T[]`, aceitando array direto, `data: []` e `data: { data: [] }`.

- [ ] **Step 2: Reutilizar o helper nas duas páginas**

Substituir os parsers locais pela chamada tipada do helper compartilhado.

- [ ] **Step 3: Redirecionar após o PATCH concluído**

Usar `useNavigate()` e chamar:

```ts
navigate(`/custodia/banco-vestigios?vestigioId=${encodeURIComponent(selectedVestigio.id)}`);
```

- [ ] **Step 4: Restaurar navegação e filtros**

Descomentar “Banco de Vestígios” e adicionar opções `catalogacao_pendente`, `catalogado`, `em_analise` e `finalizado` ao filtro de status.

- [ ] **Step 5: Confirmar testes verdes**

Run: `cd frontend && npm run test:unit -- src/components/custodia/banco-vestigios.test.tsx src/pages/CatalogacaoVestigiosPage.test.tsx`

Expected: PASS.

### Task 3: Verificar e publicar no Docker local

**Files:**
- Verify: `frontend/`

- [ ] **Step 1: Executar qualidade completa**

Run: `cd frontend && npm run test:unit && npm run typecheck && npm run lint && npm run format:check && npm run build`

Expected: todos com exit 0.

- [ ] **Step 2: Atualizar o frontend Docker**

Run: `docker compose up -d --build frontend`

Expected: `sgc-frontend` recriado e saudável.

- [ ] **Step 3: Conferir escopo**

Run: `git diff --check && git status --short`

Expected: sem erros de whitespace; alterações preexistentes permanecem preservadas.
