# Classificação Oficial da Custódia Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Atualizar etiquetas e catalogação para refletirem o documento oficial de classificação de 1º de julho de 2026 sem alterar o contrato da API.

**Architecture:** Manter `scvClassification.ts` como fonte da árvore de etiquetas e `catalogacaoSchemas.ts` como fonte dos formulários de catalogação. Corrigir somente dados oficiais verificáveis, deixando ausentes códigos e facetas que o documento não define.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, Vite.

---

### Task 1: Fixar as correções oficiais em testes

**Files:**
- Modify: `frontend/src/components/custodia/scvClassification.test.ts`
- Modify: `frontend/src/components/custodia/catalogacaoSchemas.test.ts`

- [x] **Step 1: Escrever testes inicialmente falhos para a árvore**

Adicionar expectativas que comprovem:

```ts
expect(toxicologiaCodes).toEqual(
  expect.arrayContaining(["103.14", "103.141", "103.15", "103.154"]),
);
expect(toxicologiaCodes).not.toEqual(
  expect.arrayContaining(["102.14", "102.141", "102.15", "102.154"]),
);
expect(meioAmbienteGroupCodes).toEqual([
  "104.1", "104.2", "104.3", "104.4", "104.5",
  "104.6", "104.7", "104.8", "104.9", "104.10",
]);
expect(psiquiatriaCodes).toEqual(
  expect.arrayContaining(["201.1", "201.10"]),
);
expect(psiquiatriaCodes.some((code) => code.startsWith("200."))).toBe(false);
expect(psicologiaCodes).toContain("202.10");
```

- [x] **Step 2: Escrever testes inicialmente falhos para schemas**

```ts
expect(catalogacaoSchemas.filter((schema) => schema.id === "107-tecnologia"))
  .toHaveLength(1);
expect(findCatalogacaoSchema({ classeCatalogacao: "206" })?.categories.periciais
  .map((field) => field.label))
  .toEqual([
    "Quanto ao instrumento causador",
    "Quanto ao mecanismo de produção",
    "Quanto à região anatômica",
    "Quanto à gravidade",
  ]);
expect(findCatalogacaoSchema({ classeCatalogacao: "207" })?.categories.periciais
  .map((field) => field.label))
  .toEqual([
    "Quanto ao elemento dentário",
    "Quanto ao método de identificação",
    "Quanto ao estado de conservação",
    "Quanto à finalidade pericial",
  ]);
```

- [x] **Step 3: Executar os testes e confirmar as falhas**

Run: `cd frontend && npm test -- --run src/components/custodia/scvClassification.test.ts src/components/custodia/catalogacaoSchemas.test.ts`

Expected: FAIL nos códigos ainda incorretos, no schema duplicado de Tecnologia e nos critérios genéricos de 206/207.

### Task 2: Corrigir a árvore usada pelas etiquetas

**Files:**
- Modify: `frontend/src/components/custodia/scvClassification.ts`
- Test: `frontend/src/components/custodia/scvClassification.test.ts`

- [x] **Step 1: Aplicar as correções mínimas nos dados**

Renumerar Toxicologia para `103`, remover duplicações `104.11`–`104.19`, omitir `109.45`, `109.46` e `109.69`, usar `201.1`–`201.10` uma vez e corrigir `203.10` de Psicologia para `202.10`. Não atribuir códigos às categorias biológicas sem código oficial.

- [x] **Step 2: Normalizar apenas erros textuais autorizados**

Usar grafia correta nas opções apresentadas ao usuário, incluindo `Fotografia`, `Interruptor`, `Redutor`, `Combustíveis`, `Metanfetamina`, `deflagrado`, `rigidez`, `Amputação múltipla`, `Pele` e `nível`.

- [x] **Step 3: Executar o teste da árvore**

Run: `cd frontend && npm test -- --run src/components/custodia/scvClassification.test.ts`

Expected: PASS.

### Task 3: Alinhar schemas e integração da catalogação

**Files:**
- Modify: `frontend/src/components/custodia/catalogacaoSchemas.ts`
- Modify: `frontend/src/components/custodia/catalogacaoSchemas.test.ts`
- Modify if required: `frontend/src/components/custodia/balistica.tsx`
- Modify if required: `frontend/src/components/custodia/balistica.test.tsx`
- Modify if required: `frontend/src/pages/CatalogacaoVestigiosPage.test.tsx`

- [x] **Step 1: Remover a definição duplicada de Tecnologia**

Manter uma única entrada:

```ts
{ id: "107-tecnologia", classCode: "107", classLabel: "Tecnologia", subclassLabel: "Tecnologia", typeLabel: "Geral" }
```

- [x] **Step 2: Usar os critérios textuais oficiais de 206 e 207**

```ts
const CRITERIOS_206 = [
  txt("Quanto ao instrumento causador"),
  txt("Quanto ao mecanismo de produção"),
  txt("Quanto à região anatômica"),
  txt("Quanto à gravidade"),
];

const CRITERIOS_207 = [
  txt("Quanto ao elemento dentário"),
  txt("Quanto ao método de identificação"),
  txt("Quanto ao estado de conservação"),
  txt("Quanto à finalidade pericial"),
];
```

Não criar opções que o documento não fornece.

- [x] **Step 3: Renderizar os níveis hierárquicos disponíveis**

Renderizar seletores encadeados a partir do nível 3 e persistir o código selecionado mais profundo sem alterar o contrato da API.

- [x] **Step 4: Executar os testes direcionados**

Run: `cd frontend && npm test -- --run src/components/custodia/scvClassification.test.ts src/components/custodia/catalogacaoSchemas.test.ts src/components/custodia/balistica.test.tsx src/pages/CatalogacaoVestigiosPage.test.tsx`

Expected: PASS.

### Task 4: Verificar o frontend

**Files:**
- Verify only: `frontend/`

- [x] **Step 1: Executar typecheck**

Run: `cd frontend && npm run typecheck`

Expected: exit 0.

- [x] **Step 2: Executar lint**

Run: `cd frontend && npm run lint`

Expected: exit 0 ou somente problemas preexistentes documentados fora dos arquivos alterados.

- [x] **Step 3: Executar formatação**

Run: `cd frontend && npm run format -- --check`

Expected: exit 0; se o script não aceitar `--check`, usar o verificador configurado no projeto sem reformatar arquivos alheios.

- [x] **Step 4: Executar build**

Run: `cd frontend && npm run build`

Expected: exit 0.

- [x] **Step 5: Conferir o escopo final**

Run: `git diff --check && git status --short`

Expected: nenhuma alteração fora dos arquivos de classificação, catalogação, testes e documentação criada para esta atualização.
