# Relatório Inicial de Auditoria — SGC-ITEP-NESTJS

> **Repo:** `SGC-ITEP-NESTJS` · **Branch:** `codex/update-main-recency`
> **Data:** 2026-06-30 · **Modo:** somente leitura (análise) + Fase P0 implementada
> **Autor:** Auditoria automatizada

---

## 1. Arquitetura

Monorepo com **backend NestJS** (raiz) + **frontend React/Vite** (`/frontend`). O Escavador SEIRN opera por webhook externo; não há serviço Python versionado no repositório.

| Camada | Stack |
|---|---|
| Backend | NestJS 11, TypeScript, TypeORM 0.3, PostgreSQL, Redis, BullMQ, Passport (JWT + sessão), Swagger |
| Frontend | React 18, Vite 8, TypeScript, Tailwind, Zustand, TanStack Query, React Hook Form + Zod |
| Infra | Docker Compose (Postgres, Redis, MinIO, Meilisearch, ClamAV, Metabase, Adminer) |
| Observabilidade | Sentry, Prometheus (`prom-client`), health/ready endpoints |
| Testes | Jest (backend), Vitest + Testing Library (frontend), Playwright (e2e) |

**Padrão arquitetural:** Clean Architecture + feature-based folders. Os módulos `nugecid` e `users` seguem DDD completo (`domain/`, `application/use-cases/`, `infrastructure/`), com value-objects e repositórios abstraídos por interface. Os demais módulos usam o padrão NestJS tradicional (controller/service/entity/dto).

**Bootstrap (`src/main.ts`):** Sentry → helmet(CSP) → rate-limit por rota → compression → cookieParser → sessão (Redis store obrigatório em prod) → CSRF middleware (double-submit) → ValidationPipe global (`whitelist` + `forbidNonWhitelisted`) → prefixo `api` → interceptors (logging, transform, database-error) → Swagger (dev) → CORS. Defesa em profundidade: `JwtAuthGuard` + `RolesGuard` registrados como `APP_GUARD` globais; rotas optam-out via `@IsPublic()`.

## 2. Módulos Principais

**Backend — 28 módulos** (`src/modules`):
- **Negócio/core:** `nugecid` (desarquivamentos, DDD completo), `users` (DDD), `vestigios`, `pastas`, `tarefas` (kanban/projetos/checklists/comentários), `planilhas`, `registros`, `estatisticas`
- **Segurança/auth:** `auth` (JWT + sessão httpOnly + guards jwt/session/web/roles + strategies), `security` (IP blocker, lockout, blocked-ips), `audit`
- **Plataforma:** `storage` (local/S3), `search` (Meilisearch + fallback SQL), `sei` (integração SEI), `escavador-seirn` (webhook HMAC), `queues` (BullMQ, feature-flagged), `ocr`, `notificacoes` (push/scheduler), `mail`, `backup`, `health`, `observability`, `sync` (SSE), `redis`, `seeding`, `announcements`
- **Common:** dataloaders (user/pasta/desarquivamento), interceptors, filters, middleware (csrf/static-auth), decorators (`@IsPublic`, `@Roles`, `@CurrentUser`), pipes, validators, `api-response`

**Frontend — feature-based:** `pages/` (35 páginas), `components/` (auth, kanban, desarquivamentos, vestigios, dashboard, layout, ui…), `services/` (api.ts centralizado com axios + CSRF), `store/` (Zustand), `hooks/`, `contexts/`, `lib/`, `routes/`.

**Migrations:** 78 migrations TypeORM (TS) em `src/migrations` + 7 scripts SQL raw em `src/database/migrations`.

## 3. Scripts Disponíveis

**Backend (`package.json`):**
- Dev/Build: `dev`, `dev:safe`, `build` (backend+frontend), `start:prod`, `start:debug`
- Qualidade: `lint`, `lint:fix`, `format`, `format:check`, `typecheck` (backend+frontend)
- Testes: `test`, `test:unit`, `test:critical` (subconjunto fixo), `test:cov`, `test:watch`, `test:debug`, `test:e2e` (Playwright), `test:e2e:api` (Jest e2e), `test:e2e:ui`
- DB: `migration:generate|run|revert` (+ versões `:dist`), `typeorm`
- Ops: `webpush:generate-keys`, `system:check`, `smoke:test`, `quality:check`, `quality:ci`
- E2E helpers: `e2e:start:backend`, `e2e:start:frontend`, `test:e2e:install`

**Shell (`scripts/`):** backup/restore (`backup_db.sh`, `restore_db.sh`, `backup-cli.sh`, `backup-offsite-sync.sh`, `backup-verify.sh`), perf (`apply-performance-fixes.sh`, `performance-validator.ts`, `performance-tests/`), `check-docker.js`, `check-database.js`, `check-system.sh`, `smoke-test.sh`, `start/stop/run.sh`, `install.sh`, `optimize-assets.sh`, `move-heavy-assets.sh`, `generate-web-push-vapid-keys.js`, `ocr_arquivo_ribeira.py`.

**Frontend:** `dev`, `build`, `preview`, `test` (vitest), `test:unit`, `lint`, `lint:fix`, `typecheck`, `format`, `format:check`, `check:bundle-size`.

## 4. Riscos de Segurança

| # | Risco | Severidade | Evidência | Status |
|---|---|---|---|---|
| S1 | **Tipagem fraca** contradiz `AGENTS.md`: ESLint `@typescript-eslint/no-explicit-any: off` + tsconfig `strictNullChecks:false` e `noImplicitAny:false`. 56 arquivos com `: any`. | Média | `.eslintrc.js`, `tsconfig.json` | Aberto (P1) |
| S2 | **Logs de dados pessoais (LGPD)** em use-case de criação de desarquivamento registravam `dadosAdicionais`, `nomeCompleto`, `numeroNicLaudoAuto`, `codigoBarras`. | Média | `create-desarquivamento.use-case.ts` | **Corrigido (P0)** |
| S3 | `console.log` em código de aplicação. | Baixa | — | **Verificado (P0):** os 26 `console.log` estão apenas em 2 migrations one-off (`008`, `009`); código de app já usa `Logger`. Sem ação. |
| S4 | **CSP com `'unsafe-inline'` em styles**. | Baixa-Média | `main.ts:104-110` | Aberto (P1) |
| S5 | **Endpoint de debug em produção**: `GET /auth/online-users/debug` (admin-only) expõe detalhes de usuários online. | Baixa | `auth.controller.ts:578` | Aberto (P1) |
| S6 | **Antivírus desativado por padrão**: `CLAMAV_ENABLED=false`. | Média | `.env.example:126` | Aberto (P1) |
| S7 | **Execução de processos externos** (`child_process.spawn`/`execFile`): backup, OCR, escavador. | Média | `backup.service.ts`, `ocr.service.ts`, `escavador-seirn.service.ts` | **Verificado (P0):** todos usam args separados (sem `shell:true`) → sem command injection. Credenciais SEI passadas via env do processo filho (padrão aceitável). Sem alteração. |
| S8 | **TOCTOU** em geração de código de barras (`existsByCodigoBarras` → `save` sem lock). | Baixa | `create-desarquivamento.use-case.ts:294` | Aberto (mitigado por 10 retries + unique constraint) |
| S9 | **Secrets com defaults `change-me`** no `.env.example`. `.env` real existe e está gitignored. | Média (operacional) | `.env.example` | Aberto (P1) |
| S10 | **Histórico git contém dumps SQL com PII**: `backup_full_*.sql` foi commitado (commit `76c5a8b`) e depois removido (`d5ba21c`). O arquivo atual no working dir é gitignored (`.gitignore:47`) — não será recomitado. | Alta | `git log -- backup_full_*.sql` | **Recomenda `git filter-repo`** + force-push coordenado (operação destrutiva, exige alinhamento da equipe). Não executado automaticamente. |

**Pontos fortes já implementados:** guard JWT global, CSRF double-submit, rate-limit por rota (login/register/refresh/upload/search), helmet+CSP, sessão Redis obrigatória em prod, tokens em httpOnly cookies (frontend só guarda perfil em `localStorage`), `whitelist`+`forbidNonWhitelisted` no ValidationPipe, webhook externo com HMAC+anti-replay, `DATABASE_SSL_ALLOW_UNAUTHORIZED=false`, `ALLOW_MEMORY_SESSION_STORE` bloqueado em prod.

## 5. Riscos de Performance

| # | Risco | Severidade | Evidência | Status |
|---|---|---|---|---|
| P1 | **Potencial N+1**: 61 usos de `relations: [...]`. DataLoader existe (mitigação parcial) mas não em todos os fluxos. | Média | grep `relations: [` | Aberto (P3) |
| P2 | **Serviços gigantes**: `pastas.service` 1409 LOC, `tarefas.service` 1159, `nugecid.service` 1143, `search.service` 898, `auth.service` 793. | Média | `wc -l` | Aberto (P3) |
| P3 | **Cache TTL curto (30s, max 100)**. | Baixa | `app.module.ts:120` | Aberto (P3) |
| P4 | **Duplicação de criação de schema**: `pastas.service.createSchemaIfNeeded` cria `pasta_arquivos` em runtime **e** há migration `1760546200000-CreatePastaArquivos`. | Baixa-Média | `pastas.service.ts:130` | Aberto (P1) |
| P5 | **Ausência de transação explícita** em fluxos multi-escrita: `nugecid` repository `create/update` usam `repository.save` simples. | Média | `desarquivamento.typeorm-repository.ts:58` | Aberto (P3) |
| P6 | **78 migrations + 7 SQL raw** — ordem/consistência merece auditoria. | Baixa | `src/migrations`, `src/database/migrations` | Aberto (P3) |
| P7 | **`jest maxWorkers: 1`** — suite serial (lento em CI). | Baixa | `jest.config.js` | Aberto (P4) |

**Pontos fortes já implementados:** race condition de `reorderTasks` **corrigida** (usa `reorderTasksWithManager` com manager/transação); query raw de reordenação usa parâmetros (`$1,$2,$3`); índices adicionados via migrations; compression ativo; busca via Meilisearch com fallback SQL controlado por `SEARCH_FAIL_OPEN`; pool DB configurável.

## 6. Testes Existentes

- **Backend (Jest):** 44 arquivos `.spec.ts` em `src`. Threshold global **20%**. `maxWorkers:1` (serial). `test:critical` executa subconjunto fixo de ~12 specs.
- **Frontend (Vitest + Testing Library):** ~30 arquivos de teste (páginas, componentes, serviços, hooks, lib).
- **E2E (Playwright):** 2 configs — `playwright.config.ts` (`/e2e/login.spec.ts`) e `playwright.hermes.config.ts` (`/tests/e2e/hermes-*.spec.ts`, 4 specs).
- **Factories:** `test/factories` (desarquivamento, role, user).
- **Config Jest e2e:** `test/jest-e2e.config.js`.

## 7. Testes Ausentes (Gaps)

| Gap | Detalhe |
|---|---|
| **Use-cases sem teste:** 18 use-cases, **0 specs** | Camada `application/` de `nugecid` e `users` sem cobertura. |
| **Controllers sem spec (17)** | vestigios, tarefas (colunas, comentários, projetos, tarefas, projeto-membros, checklists), announcements, backup/system-settings, security, registros, escavador-seirn, queues, nugecid/anexos, sei, audit, pastas. |
| **Services sem spec (28)** | tarefas (6 services), redis, announcements, system-settings, seeding, registros, planilhas, notificacoes-scheduler, database-health, sync-realtime, runtime-metrics, queue, user-preferences, nugecid (audit, stats, docx, pdf, export, import), sei-captura, audit, audit-hash, app.service. |
| **E2E de API (Jest) vazio** | `test/jest-e2e.config.js` existe mas **0 arquivos** `*.e2e-spec.ts`. |
| **Cobertura threshold baixo (20%)**. | Acima do mínimo mas longe do recomendado para sistema com PII. |
| **Testes de segurança ausentes** | Sem testes de CSRF, rate-limit, lockout/IP-block, webhook HMAC, upload malicioso. |

## 8. Plano de Correção em Etapas

### P0 — Rápido / Alto impacto
- [x] **P0.1** Documentar risco de histórico git com dumps (S10). Recomendar `git filter-repo` coordenado. O dump atual é gitignored.
- [x] **P0.2** Sanitizar logs de PII em 6 arquivos do modulo nugecid (`create`/`update`/`delete`/`import-registros` use-cases, `desarquivamento.typeorm-repository`, `nugecid.service`): removidos `dadosAdicionais`, `nomeCompleto`, `numeroNicLaudoAuto`, `codigoBarras` dos logs de diagnostico; substituidos por booleanos (`temDadosAdicionais`) e identificadores internos (`id`); mantidos `criadoPorId`/`numeroProcesso` em logs de erro/validacao para rastreabilidade. Mensagens de auditoria formal (modulo `audit`) mantem detalhes (proposito legitimo). Validado: `typecheck:backend` OK, `lint:backend` OK, `test:critical` (11 suites / 51 tests) OK.
- [x] **P0.3** Verificado: `console.log` só em migrations one-off — sem ação.
- [x] **P0.4** Auditado `spawn`/`execFile`: args separados, sem command injection. Sem alteração.

### P1 — Configuração/Qualidade
- [ ] Endurecer tipagem (`no-explicit-any: warn`, planejar `strictNullChecks`). Reduzir 56 `: any`.
- [ ] Ativar ClamAV em prod + teste EICAR.
- [ ] Rotacionar secrets `change-me` + documentar rotação no runbook.
- [ ] Consolidar criação de `pasta_arquivos` via migration apenas.
- [ ] Revisar CSP (nonces para remover `'unsafe-inline'`).
- [ ] Guardar `/auth/online-users/debug` atrás de feature-flag de dev.
- [ ] **Reescrever histórico git** com `git filter-repo` para remover dumps (S10) — operação coordenada.

### P2 — Testes
- [ ] Cobrir 18 use-cases (priorizar create/update/delete/import de desarquivamento; create/change-password de users).
- [ ] Cobrir controllers críticos sem spec (audit, pastas, security, queues, anexos).
- [ ] Criar E2E de API (Jest): auth flow, desarquivamento CRUD, upload, search.
- [ ] Testes de segurança: CSRF, rate-limit (429), lockout, webhook HMAC inválido, upload proibido.
- [ ] Elevar threshold de cobertura 40%→60% em fases.

### P3 — Performance/Arquitetura
- [ ] Auditar N+1 nos 61 `relations:` (leftJoinAndSelect/DataLoaders).
- [ ] Quebrar serviços gigantes (pastas/tarefas/nugecid) por responsabilidade.
- [ ] Adicionar transações explícitas em fluxos multi-escrita.
- [ ] Ajustar cache TTL/max conforme perfil de leitura.
- [ ] Auditar ordem/consistência das 78 migrations vs 7 SQL raw.

### P4 — Observabilidade contínua
- [ ] Testes de regressão de performance no CI.
- [ ] Alertas Sentry/Prometheus para 429, falhas de login, erros de DB, fila BullMQ.

---

## Observações

- Há análise técnica prévia em `docs/technical/ANALISE-MODULOS.md` (2025-11-15) e `ROADMAP-MELHORIAS.md`. Vários itens críticos de lá **já foram corrigidos** (duplicação de `projetos`, race condition de `reorderTasks`, SQL injection em `createSchemaIfNeeded`).
- Existe uma alteração não-commitada em `src/modules/nugecid/nugecid.controller.ts` (adiciona `pdfUrl`/`previewUrl`/`detailUrl` ao response de export/list) — trabalho em andamento do mantenedor, **não alterado** por esta auditoria.
- Esta auditoria não executou `npm run typecheck`/`lint`/`build` globais (apenas leitura + a alteração cirúrgica de P0.2); a validação da Fase P0 foi feita via `typecheck:backend`, `lint:backend` e `test:critical`.
