# Auditoria Técnica Completa — SGC-ITEP-NESTJS (Nugecid)

**Data:** 26/06/2026
**Modelo:** GLM-5.2
**Branch analisada:** `codex/update-main-recency`
**Escopo:** Auditoria estática somente leitura. Nenhum código foi alterado, nenhum comando destrutivo executado, nenhum teste rodado contra produção, nenhum secret exposto.

---

## 1. Resumo geral do sistema

Sistema de gestão de documentos e desarquivamentos da Polícia Científica do RN (NUGECID/PCI-RN). Monorepo com:

- **Backend:** NestJS 11 + TypeScript + TypeORM 0.3 + PostgreSQL 16 + Redis 7.
- **Frontend:** React 18 + Vite + TypeScript + TailwindCSS + Zustand/React Query + Radix UI.
- **Infra:** Docker Compose (backend, frontend nginx, db, redis, clamav, minio, meilisearch, metabase, adminer).
- **Serviços auxiliares:** Meilisearch (busca), ClamAV (antivírus), MinIO (storage S3), OCR (ocrmypdf/tesseract), Sentry, Prometheus/Metrics, BullMQ (filas, feature-flag), Web Push.

Domínio central: **desarquivamentos** (solicitação → desarquivado → rearquivamento → finalizado), com anexos, termos de entrega (PDF/DOCX), auditoria com cadeia de hash, import/export Excel, lixeira (soft delete) e restauração. Módulos periféricos: vestígios (custódia), pastas/arquivo, planilhas de controle, tarefas/kanban, notificações, usuários/roles, estatísticas, backup/restore, segurança (IP blocking), integração SEI/escavador-SEIRN, anúncios.

**Postura de segurança geral: madura.** Auth em cookies httpOnly, JWT + refresh com blacklist por jti, CSRF double-submit, Helmet CSP, rate limiting granular, validação de env em produção (Zod), secrets com placeholder detection, bcrypt com timing equalization, antivírus em uploads, SSL de banco com CA obrigatória em produção. Os problemas encontrados são concentrados em **dois módulos periféricos (vestígios, notificações) e em endpoints de health/metrics** — não no core NUGECID, que tem Clean Architecture com checagens de autorização no domínio.

---

## 2. Arquitetura encontrada

### 2.1 Backend

```
src/
  main.ts                  bootstrap: helmet, compression, session Redis, CSRF, ValidationPipe, rate limiters, Swagger (dev-only)
  app.module.ts            módulo raiz; guards GLOBAIS (JwtAuthGuard + RolesGuard) via APP_GUARD
  app.controller.ts        raiz, /dashboard redirect, /search (global search)
  app.service.ts           globalSearch (busca multi-entidade)
  config/                  app/auth/database/validation/static-files (Zod + registerAs)
  common/                  decorators (Roles, IsPublic, Public, CurrentUser), guards, filters, interceptors, middleware (CSRF), pipes, utils
  migrations/              ~35 migrations TypeORM
  modules/
    auth/                  controllers, service, guards (jwt/web/session/local/roles), strategies (jwt/session/local)
    users/                 controller + use-cases (application/) + entities (User, Role) + enums (role-type, role.utils)
    nugecid/               Clean Architecture: domain/ application/ (use-cases, services) infrastructure/ (repositories, entities) controllers/ dto
    pastas/                controller + service + entities (Pasta, PastaArquivo)
    planilhas/             controller + service + entity
    vestigios/             controller + service + entity (sem Clean Architecture, sem RBAC)
    tarefas/               controllers (projetos, colunas, checklists, comentarios, tarefas) + services
    notificacoes/          controller + services (notificacoes, scheduler, push, preferences)
    estatisticas/          controller + service (PDF via Playwright)
    registros/             controller + service (import XLSX)
    sei/                   controller + captura service + mapper
    escavador-seirn/       controller + service (webhook HMAC)
    sync/                  controller SSE + realtime service
    queues/                controller + service (BullMQ, feature-flag)
    search/                service (Meilisearch) + types — sem controller (consumido por app.service e sync)
    security/              controller + service + ip-blocker guard + antivirus
    backup/                controllers (backup, system-settings) + service
    audit/                 controller + service + audit-hash (cadeia SHA-256)
    health/                controller + database-health service (/health, /ready, /metrics)
    observability/         prometheus + runtime-metrics
    storage/               storage service (local/S3)
    ocr/                   ocr service
    mail/                  mail service
    seeding/               seeding service
    announcements/         controller + service
```

### 2.2 Padrão de autorização (importante)

- **Guards globais** (`app.module.ts:131-140`): `JwtAuthGuard` + `RolesGuard` aplicados a TODAS as rotas. Rotas optam-out via `@IsPublic()`.
- `JwtAuthGuard` (`src/modules/auth/guards/jwt-auth.guard.ts:18-26`): bypassa se `IS_PUBLIC_KEY=true`; caso contrário exige JWT válido (cookie `access_token` ou header Bearer). Atualiza atividade do usuário a cada requisição autenticada.
- `RolesGuard` (`src/modules/auth/guards/roles.guard.ts:28-66`): se `@Roles(...)` ausente → **retorna true** (qualquer usuário autenticado). Se presente → exige `user.role.name` em `expandRolesForTransition(requiredRoles)`.
- **Consequência:** módulos que não aplicam `@Roles(...)` nem checam ownership no service ficam abertos a qualquer usuário autenticado. É exatamente o caso de **vestígios** (ver §4.1).

### 2.3 Decores duplicados

Existem dois decoradores públicos equivalentes, ambos setando `IS_PUBLIC_KEY`:
- `src/common/decorators/public.decorator.ts` → `@Public()`
- `src/common/decorators/is-public.decorator.ts` → `@IsPublic()`

Risco funcional zero (mesma chave de metadata), mas é duplicação inconveniente.

### 2.4 Frontend

- Cliente HTTP centralizado em `frontend/src/services/api.ts` (Axios singleton, `baseURL: "/api"`, `withCredentials: true`, CSRF double-submit via cookie `XSRF-TOKEN` → header `X-CSRF-Token`).
- Auth: `AuthContext` (React Context, **não** Zustand). Tokens **não** em localStorage — cookies httpOnly apenas. Objeto `user` (não-sensível) em localStorage (`tokenStorage.ts:23-25`).
- Rotas: `App.tsx` com `ProtectedRoute` (auth + role gate por hierarquia numérica em `lib/auth/roles.ts`). Todas as 30+ páginas em `React.lazy` via `routes/lazyPages.ts`. Apenas `/login` e `/404` públicas.
- React Query com defaults sane (`retry:1`, `refetchOnWindowFocus:false`, `staleTime:60s`); sem `Infinity` caches; `queryClient.clear()` on user switch.
- Sem `dangerouslySetInnerHTML` em todo o `src/` do frontend.

### 2.5 Docker

- `Dockerfile`: multi-stage, node:24-alpine, non-root user (`appuser`), healthcheck, OCR runtime deps. `docker-compose.yml`: networks `backend` (internal) + `frontend` + `bi` (internal); DB/Redis **não** expostos em produção (comentados); `mem_limit`/`cpus`/`pids_limit` no backend; healthchecks em todos; profiles para clamav/storage/search/bi/dev.
- `.env` gitignored e **não rastreado** pelo git (confirmado via `git ls-files`). `.env.example` commitado sem secrets reais.

---

## 3. Fluxos principais

### 3.1 Desarquivamento (CRUD + impressão + reindexação)

- **Criar:** `POST /api/nugecid` → `CreateDesarquivamentoUseCase` (`nugecid.controller.ts:130-150`). `criadoPorId = currentUser.id`. Auditoria CREATE.
- **Listar:** `GET /api/nugecid` → `FindAllDesarquivamentosUseCase` (`find-all-desarquivamentos.use-case.ts`). `applySecurityFilters` (linha ~155): admin/viewer/operator/coordenador veem tudo; usuário comum filtra `criadoPorId = userId`. Filtro adicional `canBeAccessedBy` em memória. Paginação limitada a 100. Sort whitelist.
- **Detalhar:** `GET /api/nugecid/:id` → `FindDesarquivamentoByIdUseCase`. Checa `canBeAccessedBy(userId, userRoles)` (`desarquivamento.entity.ts:384-409`): criador, responsável, admin, nugecid_viewer/operator. Auditoria VIEW.
- **Editar:** `PATCH /api/nugecid/:id` → `UpdateDesarquivamentoUseCase`. Checa `canBeEditedBy` (`entity.ts:413-446`): admin sempre; criador só se pendente; responsável; operator/coordenador/operador. Não editável se finalizado (exceto admin). Defaults de datas por status aplicados no controller.
- **Excluir (soft):** `DELETE /api/nugecid/:id` → `DeleteDesarquivamentoUseCase` (permanent=false). Checa `canBeDeletedBy` (`entity.ts:450-483`).
- **Lixeira / restaurar / hard delete:** `GET /api/nugecid/lixeira` (admin), `PATCH /api/nugecid/lixeira/:id/restaurar` (admin, mas use-case aceita admin+nugecid_operator), `DELETE /api/nugecid/lixeira/:id/permanente` (admin).
- **Importar:** `POST /api/nugecid/import` (admin) — Excel, antivírus scan, importação parcial.
- **Exportar:** `GET /api/nugecid/export` (admin/usuário) — Excel.
- **Imprimir (termo):** `GET /api/nugecid/:id/termo` (PDF), `/termo-docx`, `/termo-pdf`, `/termo-preview` (redirect frontend). Candidatos: `GET /api/nugecid/impressao/candidatos`.
- **Comentários / histórico / relacionados:** `:id/comments`, `:id/historico`, `:id/related`.
- **Reindexação (Meilisearch):** `SearchService` (`search.service.ts`) sincroniza documentos por eventos (`requestSyncDesarquivamento`, `requestSyncPasta`, `requestSyncPlanilha`). Reindex total via `POST /api/sync/search/reindex` (admin, `sync.controller.ts:78-81`) e bootstrap no start se `SEARCH_BOOTSTRAP_ON_START=true`. Visibilidade por `visibilityScope`/`allowedUserIds`/`fullAccessRoles` no documento e filtro Meilisearch (`buildMeiliVisibilityFilter`).

### 3.2 Anexos (nugecid)

- `AnexosController` (`/api/nugecid/:desarquivamentoId/anexos`), `AnexosProcessoController` (`/api/nugecid/processo/:numeroProcesso/anexos`), `AnexosProcessoQueryController`.
- **Autorização por usuário: aplicada.** `assertCanAccessDesarquivamento` / `assertCanAccessProcesso` (`nugecid-anexos.service.ts:627-693`) — permite admin/coordenador/nugecid_viewer/nugecid_operator OU criador OU responsável; caso contrário `NotFoundException` (sem leak de existência).
- Upload: magic-byte + antivírus + MIME allowlist. Download/stream: todos passam pelas asserts.

### 3.3 Pastas / arquivo

- `PastasController` (`/api/pastas`). Mutações `@Roles(ADMIN, COORDENADOR)`. Leituras sem `@Roles` mas controller passa `isAdmin ? undefined : user.id`; service `ensureOwnership` (`pastas.service.ts:117-121`) lança Forbidden se `criadoPorId !== userId`. Path traversal hardened (`resolveLegacyStoragePath` valida contenção, `pastas.service.ts:1266-1271`).

### 3.4 Backup / restore

- `BackupController` (`/api/backup`) — admin. Restore (`POST /api/backup/restore/:filename`) gated por `BACKUP_HTTP_RESTORE_ENABLED` + `validateBackupFilename` (regex + basename + sem `..`) + `resolveBackupFilePath` (containment check) + `validateTarArchiveEntries` (zip-slip). **Hardened.**

### 3.5 Auth

- Login `POST /api/auth/login` (público, `IpBlockerGuard`) → access+refresh em cookies httpOnly + CSRF cookie + sessão. Logout blacklists refresh jti no Redis. Refresh `POST /api/auth/refresh` (público) lê refresh **somente** do cookie. Register `POST /api/auth/register` (admin). `auth.service.ts` com timing equalization (dummy bcrypt), lockout após 5 tentativas, auditoria.

---

## 4. Vulnerabilidades encontradas

> Toda vulnerabilidade tem evidência `file:line`. `[Hipótese]` marca o que não foi confirmado estaticamente.

### CRÍTICO

#### V-01 — IDOR/BOLA total no módulo de Vestígios (custódia forense)
**Evidência:**
- `src/modules/vestigios/vestigios.controller.ts:26` — `@UseGuards(JwtAuthGuard)` apenas. **Sem `RolesGuard`, sem nenhum `@Roles`.**
- `src/modules/vestigios/vestigios.service.ts:84-95` (`findOne`): `where: { id }` — **sem checagem de ownership/role**.
- `:97-110` (`update`): carrega via `findOne` (sem ownership), faz `Object.assign(vestigio, updateVestigioDto)` — **qualquer usuário autenticado muta qualquer vestígio**.
- `:121-124` (`remove`): hard delete sem ownership — qualquer usuário exclui qualquer vestígio.
- `:126-132` (`clearCatalogacaoPendente`): bulk delete de toda a fila `catalogacao_pendente` — **sem role, sem confirmação**.
- `:134-138` (`updateStatus`): `vestigio.status = status` a partir de `@Body("status")` string crua — **sem validação de enum, sem ownership**. Qualquer usuário seta status arbitrário em qualquer vestígio.
- `vestigios.controller.ts:90-93` (`updateStatus`) e `:96-101` (`clearCatalogacaoPendente`) — sem `@Roles`.

**Impacto:** Vazamento e adulteração não-autorizada de evidências forenses (dados sensíveis de custódia). Qualquer usuário de role baixa pode ler, editar, excluir ou alterar status de qualquer vestígio, e esvaziar a fila de catalogação. É a vulnerabilidade mais grave do sistema.

#### V-02 — Endpoints de health/metrics públicos vazam metadados de infra
**Evidência:**
- `src/modules/health/health.controller.ts:42` (`@Get("health") @IsPublic()`): retorna `process.version` (linha 49) — divulga versão do Node.
- `:54` (`@Get("ready") @IsPublic()`): retorna `database: dbHealth` (linha 74) que inclui `details.host`, `port`, `database` (`src/modules/health/database-health.service.ts:76-82`) + `redis.connected`. Em falha, lança `ServiceUnavailableException(readiness)` (linha 88) cujo body contém `dbHealth.error` com a mensagem de erro do driver (`database-health.service.ts:144-155`).
- `:206` (`@Get("metrics") @IsPublic()`): expõe exposição completa Prometheus (contadores/labels de rotas) sem auth.

**Impacto:** Reconhecimento de infra (host/port/dbname do Postgres, versão do Node, topologia de erros DB) facilita ataques direcionados. Métricas Prometheus públicas expõem padrões de uso.

### ALTO

#### V-03 — Content-Disposition header injection em download de anexos
**Evidência:**
- `src/modules/nugecid/controllers/anexos.controller.ts:251`, `:408`, `:530`:
  `` `attachment; filename="${anexo.nomeOriginal}"` ``
- `anexo.nomeOriginal` é definido no upload a partir do nome do arquivo enviado pelo usuário (`nugecid-anexos.service.ts:116`) e armazenado sem sanitização de CR/LF/aspas.

**Impacto:** Header injection / response splitting se `nomeOriginal` contiver `\r\n` ou `"`. Express pode mitigar parcialmente, mas não garantido. Permite, no mínimo, quebra de cabeçalho e potencialmente injeção de headers adicionais.

#### V-04 — Endpoints de varredura de notificações sem autorização (DoS/abuso)
**Evidência:**
- `src/modules/notificacoes/controllers/notificacoes.controller.ts:591` (`@Post("verificar-pendentes")`), `:607` (`@Post("verificar-prazos")`), `:623` (`@Post("verificar-atrasadas")`) — **sem `@Roles`**. Controller só tem `@UseGuards(JwtAuthGuard)` (linha 54).
- Cada um dispara batch DB scan com fan-out N+1: `verificarTarefasComPrazoProximo` / `verificarTarefasAtrasadas` fazem `Promise.all` por tarefa com chamadas de dedup (`findExistingByEntidade`/`findRecentDuplicate`) — O(tarefas × DB).

**Impacto:** Qualquer usuário autenticado pode disparar repetidamente varreduras system-wide, gerando carga pesada no banco (DoS interno). Deveria ser admin ou scheduler-only.

#### V-05 — Busca global expõe vestígios e planilhas sem filtro de visibilidade
**Evidência:**
- `src/app.service.ts:635-682` (bloco vestígios em `globalSearch`): **nenhum filtro de ownership/role** — qualquer usuário (admin/coordenador/usuario) vê vestígios correspondentes ao termo.
- `src/app.service.ts:730-767` (bloco planilhas): **nenhum filtro de ownership** — qualquer usuário vê nome/tamanho/data de todas `PlanilhaControle` correspondentes.
- Contrastar com desarquivamentos (`:396-401` filtra `criadoPorId/responsavelId`), tarefas (`:489-497`), projetos (`:545-555`), pastas (`:602-606`), notificações (`:698`) — todos filtrados.

**Impacto:** Usuário de role baixa descobre metadados de evidências forenses (via vestígios) e de planilhas de arquivo que não deveria ver. Consistente com a lacuna de V-01, mas via busca unificada.

### MÉDIO

#### V-06 — SSE do sync pode broadcastar cross-tenant
**Evidência:**
- `src/modules/sync/sync-realtime.service.ts:103`, `:126-136`: `broadcast()` envia a TODOS os clientes quando `userIds` não é escopado pelo emissor.

**Impacto:** Se algum emissor de evento domínio não escopar `userIds`, dados de um tenant/usuário chegam a outro. `[Hipótese]` — depende dos emitters; não verifiquei todos os call sites do publisher.

#### V-07 — Anexo: branch legacyAbsolutePath sem containment check
**Evidência:**
- `src/modules/nugecid/nugecid-anexos.service.ts:386-391`: `storageService.getObject(anexo.caminhoArquivo, { legacyAbsolutePath: path.isAbsolute(anexo.caminhoArquivo) ? anexo.caminhoArquivo : undefined })`.
- Diferente de `pastas.service.ts:1266-1271` e `planilhas.service.ts:775-780`, que validam contenção do path legado.

**Impacto:** Se alguma linha de `anexo.caminhoArquivo` no DB for path absoluto (legado/migration), é servida diretamente sem validação de prefixo. `caminhoArquivo` é gravado server-side, então risco depende de dados legados. `[Hipótese]` baixo.

#### V-08 — Disclosure de path interno de storage ao cliente
**Evidência:**
- `src/modules/nugecid/nugecid-anexos.service.ts:162` (`mapAnexoResponse`): retorna `caminhoArquivo` cru ao cliente.

**Impacto:** Info disclosure de estrutura de storage. Baixo risco, mas desnecessário.

#### V-09 — Frontend: chamadas `fetch()` dispersas bypassam cliente central (CSRF + 401)
**Evidência:**
- `frontend/src/components/desarquivamentos/print-utils.ts:55` (`fetch('/api/nugecid/${id}/related', ...)`).
- `frontend/src/components/desarquivamentos/ImageThumbnail.tsx:41,49,60`.
- `frontend/src/pages/PrateleiraDetailPage.tsx:114,291`.
- `frontend/src/pages/DetalhesDesarquivamentoPage.tsx:286,341,354`.

**Impacto:** Esses calls não passam pelo interceptor Axios (sem injeção de header CSRF, sem handler 401→redirect). Hoje são GETs (CSRF-exempt), mas o padrão é inconsistente e um futuro POST via `fetch` pularia CSRF silenciosamente.

### BAIXO

#### V-10 — Cadeia de hash de auditoria com canonicalização parcial
**Evidência:**
- `src/modules/audit/audit-hash.service.ts:135`: `JSON.stringify(payload, Object.keys(payload).sort())` ordena apenas chaves top-level. Objetos aninhados em `details` não têm chaves ordenadas.

**Impacto:** Se `details` tiver ordem de chaves variável, o hash muda sem alteração semântica → falsos positivos/negativos na cadeia tamper-evident. `[Hipótese]` depende da forma de `details`.

#### V-11 — Webhook escavador: bearer legado com comparação não-constant-time
**Evidência:**
- `src/modules/escavador-seirn/escavador-seirn.service.ts:179`: `legacyBearer === secret` (comparação direta de string).
- Só ativo quando `ESCAVADOR_WEBHOOK_ALLOW_LEGACY_TOKEN=true`. O caminho primário (HMAC SHA-256 + `timingSafeEqual`, linhas 155-166) é seguro.

**Impacto:** Timing attack na comparação do bearer legado. Baixo (flag opt-in e destinada a migração).

#### V-12 — Objeto `user` em localStorage no frontend
**Evidência:**
- `frontend/src/utils/tokenStorage.ts:23-25`: serializa `user` em `localStorage`.

**Impacto:** Tokens NÃO estão em localStorage (correto). Mas se o DTO `User` do backend incluir PII sensível (ex.: CPF), essa PII vai parar em localStorage acessível via XSS. `[Hipótese]` — não confirmei campos do DTO `User` vs `types/User`.

#### V-13 — Log de senha mascarada em debug
**Evidência:**
- `src/config/database.config.ts:90-92`: `logger.debug(\`DB password (masked): ${masked}\`)`.

**Impacto:** Em produção os níveis de log são `["error","warn"]` (`main.ts:18-20`), então debug não é impresso. Risco residual apenas se alguém subir nível de log. Mascarado (deixa 2 últimos chars).

### Itens verificados e OK (não-vulnerabilidades)

- `.env` gitignored e **não rastreado** (`git ls-files` confirmou).
- Secrets com placeholder detection em prod (`config/validation.ts`, `auth.config.ts`).
- Cookies httpOnly, secure=auto, sameSite; refresh cookie-only; blacklist jti no Redis.
- CSRF double-submit correto, safe-methods exempt (`csrf.middleware.ts`).
- Rate limiting global + login/register/refresh/upload/search.
- `ValidationPipe` com `whitelist + forbidNonWhitelisted + transform`.
- Sem `dangerouslySetInnerHTML` no frontend; HTML→PDF de estatísticas escapa valores (`estatisticas.service.ts:1292-1300`).
- Path traversal protegido em backup (`backup.service.ts:852-882`), pastas (`pastas.service.ts:1266`), planilhas (`planilhas.service.ts:775-780`).
- SQL: queries usam QueryBuilder parametrizado; sem interpolação de input em SQL. `accentInsensitiveCol` interpola apenas nomes de coluna hardcoded (`app.service.ts:211-216`).
- SSL de banco exige CA em produção (`database.config.ts:18-26`).
- Avatares servidos estaticamente (`/uploads/avatars`) — baixo risco (fotos de perfil).
- Web Push: VAPID private key só no backend; endpoint validado contra allowlist (anti-SSRF).

---

## 5. Problemas de performance

### ALTO

#### P-01 — Estatísticas: carga full-table para PDF
**Evidência:** `src/modules/estatisticas/estatisticas.service.ts:457-485` (`getAllDesarquivamentos`) — `createQueryBuilder` sem `.take()`, `.getMany()` carrega **todos** os desarquivamentos (com joins `criadoPor`/`responsavel`) em memória para `generateRelatorioPdf` (`:509`). Admin/coordenador podem disparar sem limite de período.

**Impacto:** O(tabela) memória + tempo. Risco OOM em base grande.

#### P-02 — Pastas: N+1 aninhado em busca de itens
**Evidência:** `src/modules/pastas/pastas.service.ts:464-473` (`buscarItens` itera pastas chamando `carregarPlanilhas`) e `:592-597` (`carregarPlanilhas` faz `for...of` awaited `parsePlanilhaArquivo` — cada um busca objeto do storage e parsea). Busca é em memória sobre todo o acervo, depois `slice(limit)`.

**Impacto:** O(pastas × planilhas × file reads) por busca. Mitigado parcialmente por `planilhaCache` (`:90`, `:760-798`).

#### P-03 — SEI: N+1 por linha na importação
**Evidência:** `src/modules/sei/sei-captura.service.ts:56-86` — loop por linha da planilha com 2 chamadas DB de `detectarDuplicidade` por linha. O(rows × 2).

**Impacto:** Importações grandes lentas; pressão no pool de conexões.

### MÉDIO

#### P-04 — Notificações: fan-out N+1 nas varreduras
**Evidência:** `src/modules/notificacoes/services/notificacoes.service.ts` (~1552-1561, ~1595-1604): `Promise.all` por tarefa chamando `salvarNotificacaoPrazoProximo`, cada uma com dedup DB (`findExistingByEntidade`/`findRecentDuplicate`). Combinado com V-04 (sem auth), qualquer usuário dispara isso.

#### P-05 — Planilhas: `obterPlanilhaGeral` monta array full em memória
**Evidência:** `src/modules/planilhas/planilhas.service.ts:283-412` — percorre todas as pastas, `Promise.all` de `listarItens` cada uma, acumula `linhas[]` completo. Sem paginação. Admin-only.

#### P-06 — Vestígios: search sem limite
**Evidência:** `src/modules/vestigios/vestigios.service.ts:140-147` (`searchByCodigoScv`): `LIKE` sem `.take()` — `getMany()` sem limite.

#### P-07 — Anexos: listagem sem paginação
**Evidência:** `src/modules/nugecid/nugecid-anexos.service.ts:237-240` (`findAnexosByDesarquivamento`) e `:262-267` (`findAnexosByProcesso`) — `find` sem `take`/paginação. Processo com muitos anexos cresce sem bound.

### BAIXO

#### P-08 — `findAll` de pastas sem paginação quando chamado sem params
**Evidência:** `src/modules/pastas/pastas.service.ts:213-286` overload sem `skip/take` quando sem paginação. Controller sempre passa paginação (`parsePagination`), então residual.

### Itens verificados e OK (otimizações já presentes)

- `getOnlineUsers` usa Redis `MGET` batch (`auth.service.ts`).
- `globalSearch` roda entidades em paralelo (`Promise.all`) com `.take(perTypeLimit)` e cache por usuário (`app.service.ts:294-301, 772`).
- `announcements.findActiveForUser` batch via `In(...)` evita N+1 (`announcements.service.ts:184-190`).
- `findAll` de nugecid clamp limit 100 e sort whitelist.
- Frontend: manualChunks, lazy-load de todas as páginas, `terser drop_console`, `chunkSizeWarningLimit:500`, guard de bundle-size no CI.

---

## 6. Problemas de testes

### 6.1 Inventário
- **Backend:** 33 arquivos `*.spec.ts` em `src/`.
- **Frontend:** ~17 arquivos de teste em `frontend/src/**/__tests__/`.
- **E2E:** apenas `e2e/login.spec.ts` (Playwright) + `test/test_ocr_arquivo_ribeira.py`.
- CI define `test:critical` e `frontend:test:critical` (caminhos críticos) e `quality:ci` (format+lint+typecheck+unit+build+bundle).

### 6.2 Qualidade
- Pontos fortes: specs para auth (controller, service, guards), nugecid (controller, service, anexos, domain entity, repository, effects publisher), search, backup (controller + service), escavador (webhook HMAC), health, CSRF middleware, env validation.
- `vestigios.service.spec.ts` testa create/update de catalogação — mas **não testa autorização** (porque não há autorização para testar; ver V-01).

### 6.3 Lacunas
- **T-01:** Sem testes negativos de IDOR/BOLA para vestígios, anexos, pastas, nugecid (e.g. "usuário A não acessa desarquivamento do usuário B → 403/404"). O nugecid tem `canBeAccessedBy` mas não há spec de controller garantindo o 403 no fluxo HTTP.
- **T-02:** Sem testes de regressão de segurança para CSRF (rejeitar POST sem token), rate limit, header injection em Content-Disposition.
- **T-03:** Sem teste de path traversal para backup restore / pastas / planilhas (a lógica defensiva existe, mas sem spec que a exercise).
- **T-04:** E2E quase inexistente (só login). Sem e2e cobrindo fluxo de desarquivamento ponta-a-ponta, impressão, import/export, reindexação.
- **T-05:** Sem testes de performance/carga para os N+1 (P-01 a P-03).
- **T-06:** Sem teste para o broadcast cross-tenant do sync (V-06).
- **T-07:** Frontend: sem teste cobrindo as chamadas `fetch()` dispersas (V-09) nem o fluxo de refresh de token falhando.
- **T-08:** Sem teste de cadeia de hash de auditoria com `details` de chaves reordenadas (V-10).

---

## 7. Melhorias recomendadas

### 7.1 Segurança
1. **Vestígios:** aplicar `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)` por endpoint; adicionar ownership check no service (`ensureOwnership` como em pastas); validar `status` contra enum; restringir `clearCatalogacaoPendente` a admin. Alinhar o módulo ao padrão Clean Architecture do nugecid.
2. **Health/metrics:** tornar `/ready` e `/metrics` autenticados (ou behind rede interna / token de scrape); remover `host`/`port`/`database`/`error.message` do payload público de `/ready`; deixar `/health` (liveness) público só com `status:ok` + `uptime`, sem `process.version`.
3. **Anexos:** sanitizar `nomeOriginal` em Content-Disposition (remover CR/LF, escapar aspas, usar `filename*=UTF-8''<encoded>` per RFC 6266); não retornar `caminhoArquivo` em `mapAnexoResponse`.
4. **Notificações:** `@Roles("admin")` (ou migrar para scheduler-only) em `verificar-pendentes/prazos/atrasadas`.
5. **Busca global:** adicionar filtro de visibilidade para vestígios e planilhas em `app.service.ts` (alinhado a V-05), ou restringir esses tipos a admin/coordenador.
6. **Sync SSE:** auditar todos emitters de `sync-realtime.service` para garantir `userIds` sempre escopado; adicionar default deny-all quando ausente.
7. **Anexos legacy path:** adicionar containment check simétrico ao de pastas/planilhas para `legacyAbsolutePath`.
8. **Audit hash:** canonicalização recursiva (sort de chaves em todos os níveis) ou `JSON.stringify` de objeto previamente normalizado recursivamente.
9. **Frontend:** consolidar todas as chamadas HTTP no `ApiService` (eliminar `fetch()` disperso) para garantir CSRF + 401 uniformes.
10. **Decoradores:** unificar `@Public`/`@IsPublic` em um só.

### 7.2 Performance
1. **Estatísticas PDF:** paginar/limitar `getAllDesarquivamentos` (streaming ou `take` máximo + chunked render); exigir filtro de período.
2. **Pastas busca:** mover busca para o índice Meilisearch (já existe infra) em vez de scan em memória; ou pré-indexar itens de planilhas.
3. **SEI import:** pré-cargar duplicatas conhecidas em batch antes do loop (dedup em memória) em vez de 2 queries por linha.
4. **Notificações varreduras:** batch das dedups (`In([...])`) antes do fan-out; restringir trigger (V-04).
5. **Anexos listagem:** adicionar `take`/paginação nos `findAnexosBy*`.
6. **Vestígios search:** adicionar `.take(limit)`.

### 7.3 Arquitetura/organização
1. Padronizar todos os módulos no padrão Clean Architecture + RBAC do nugecid (especialmente vestígios).
2. Centralizar ownership checks num helper/base service reutilizável (`ensureOwnership`, `canBeAccessedBy`).
3. Documentar o contrato "rotas sem `@Roles` = qualquer autenticado" num ADR para evitar regressões como vestígios.
4. Frontend: usar a matriz `checkPermission` (`AuthContext.tsx:232-289`) no guard de rotas em vez da hierarquia numérica coarse (coordenador herda tudo de usuário implicitamente).

---

## 8. Plano de ação por prioridade

### Crítico
| ID | Ação | Esforço |
|----|------|---------|
| V-01 | Proteger módulo de Vestígios: `RolesGuard` + `@Roles` por endpoint + ownership no service + validação de enum de status + restringir `clearCatalogacaoPendente` a admin | Médio |
| V-02 | Tornar `/ready` e `/metrics` autenticados/internos; remover `host/port/database/error` do payload público de `/ready`; remover `process.version` de `/health` | Pequeno |
| T-01 | Adicionar testes negativos de IDOR/BOLA (vestígios, nugecid, anexos, pastas) | Médio |

### Alto
| ID | Ação | Esforço |
|----|------|---------|
| V-03 | Sanitizar `nomeOriginal` em Content-Disposition (RFC 6266) | Pequeno |
| V-04 | `@Roles("admin")` ou scheduler-only nos endpoints de varredura de notificações | Pequeno |
| V-05 | Filtro de visibilidade para vestígios e planilhas na busca global | Pequeno |
| P-01 | Limitar/streamar `getAllDesarquivamentos` do PDF de estatísticas; exigir período | Médio |
| P-02 | Mover busca de itens de pastas para Meilisearch ou pré-indexação | Médio |
| P-03 | Eliminar N+1 da importação SEI (batch dedup) | Pequeno |

### Médio
| ID | Ação | Esforço |
|----|------|---------|
| V-06 | Auditar emitters do sync SSE para escopar `userIds` | Médio |
| V-07 | Containment check para `legacyAbsolutePath` de anexos | Pequeno |
| V-08 | Remover `caminhoArquivo` do response de anexos | Pequeno |
| V-09 | Consolidar `fetch()` disperso no `ApiService` do frontend | Pequeno |
| P-04 | Batch das dedups nas varreduras de notificações | Médio |
| P-05 | Paginar/limitar `obterPlanilhaGeral` | Médio |
| P-06 | `.take(limit)` em `searchByCodigoScv` | Pequeno |
| P-07 | Paginação nos `findAnexosBy*` | Pequeno |
| T-04 | Ampliar E2E (fluxo ponta-a-ponta de desarquivamento) | Médio |

### Baixo
| ID | Ação | Esforço |
|----|------|---------|
| V-10 | Canonicalização recursiva no hash de auditoria | Pequeno |
| V-11 | Migrar webhook escavador para HMAC-only (remover bearer legado) | Pequeno |
| V-12 | Confirmar que DTO `User` não leva PII para localStorage | Pequeno |
| V-13 | Remover log de senha mascarada em debug | Pequeno |
| P-08 | Garantir paginação em todos os `findAll` de pastas | Pequeno |
| T-02/T-03/T-06/T-07/T-08 | Testes de regressão: CSRF, path traversal, sync cross-tenant, fetch disperso, hash com details reordenado | Médio |
| Arq | Unificar `@Public`/`@IsPublic`; padronizar Clean Architecture; ADR do contrato de roles | Pequeno |

---

## 9. Metodologia e limitações

### Arquivos analisados (leitura direta)
- Raiz: `package.json`, `frontend/package.json`, `docker-compose.yml`, `Dockerfile`, `frontend/Dockerfile`, `.gitignore`, `.env.example`, `README.md`, `AGENTS.md`.
- Config: `src/config/{app,auth,database,static-files,validation,migration}.config.ts`.
- Core: `src/main.ts`, `src/app.module.ts`, `src/app.controller.ts`, `src/app.service.ts`.
- Auth: `auth.controller.ts`, `auth.service.ts`, guards (`jwt/web/session/local/roles`), strategies (`jwt/session`), `ip-blocker.guard.ts`, `csrf.middleware.ts`, decoradores (`roles/is-public/public/current-user`).
- Nugecid: `nugecid.controller.ts`, use-cases (`find-all/find-by-id/update/delete`), `desarquivamento.entity.ts` (domain authz), `nugecid-anexos.service.ts`, `anexos.controller.ts`.
- Outros controllers/services: `pastas`, `registros`, `search`, `backup` (+ service restore), `system-settings`, `security`, `escavador-seirn` (+ service webhook), `health` (+ database-health).
- Vestígios: `vestigios.controller.ts`, `vestigios.service.ts`, `vestigios.service.spec.ts`.
- Frontend: `services/api.ts`, `contexts/AuthContext.tsx`, `utils/tokenStorage.ts`, `components/auth/ProtectedRoute.tsx`, `lib/auth/roles.ts`, `App.tsx`, `routes/lazyPages.ts`, `vite.config.ts` (via subagente).
- Testes: inventário de specs (33 backend, ~17 frontend, 1 e2e).
- Migrations: listagem (~35).

### Arquivos analisados via subagentes (explore)
- Backend remanescente: `sei`, `sync`, `queues`, `users`, `announcements`, `notificacoes`, `estatisticas`, `planilhas`, `audit`, `health`, `pastas.service` (com relatório estruturado file:line).
- Frontend completo: HTTP client, auth, rotas, XSS, secrets, bundle, React Query, forms, CORS (com relatório estruturado file:line).

### Comandos executados
Apenas comandos **somente leitura**: `ls`, `find`, `grep`/`rg` (via tooling), `git log`, `git branch`, `git status`, `git ls-files`, e leitura de arquivos. **Nenhum comando de mutação** (`npm install`, build, lint, typecheck, test, migration, docker) foi executado. **Nenhum comando destrutivo.** **Nenhum teste contra produção.**

### Pontos que não consegui verificar
- **Conteúdo do `.env` real:** não lido para não expor secrets (regra do enunciado). Confirmei apenas que está gitignored e não rastreado.
- **`frontend/nginx.conf`:** não lido em detalhe (headers de proxy/segurança do edge). `[Hipótese]` reverse-proxy padrão.
- **`webscraping-service/`:** não auditado (serviço auxiliar separado).
- **Config do Sentry / DSN:** não validado conteúdo (apenas presença no código).
- **Dados reais do banco:** não acessado (regra: nada contra produção). Por isso V-06, V-07, V-12 permanecem `[Hipótese]`.
- **Todos os call sites de `sync-realtime.service` emitters:** não tracei exaustivamente (V-06).
- **DTO `User` vs `types/User`:** não cruzei para confirmar ausência de PII em localStorage (V-12).
- **Comportamento em runtime:** auditoria estática; não executei lint/typecheck/tests para não ultrapassar o escopo somente-leitura e por tempo.

### Próximo passo recomendado
1. **Corrigir V-01 (Vestígios) e V-02 (health/metrics) primeiro** — são críticos e de esforço pequeno/médio, com alto retorno.
2. Em paralelo, rodar a suíte de qualidade localmente para estabelecer baseline antes das mudanças: `npm run quality:ci` (format+lint+typecheck+unit+build+bundle). Não é destrutivo.
3. Antes das mudanças em V-06/V-07/V-12, confirmar as hipóteses: grep de emitters do `SyncRealtimeService`, query em DB de homologação para `anexo.caminhoArquivo` absoluto, e diff de campos entre DTO `User` (backend) e `types/User` (frontend).
4. Após correções, adicionar os testes de regressão listados em §6.3 (T-01 a T-08), priorizando T-01 (IDOR/BOLA negativos) e T-04 (e2e de desarquivamento).
5. Reauditar após P0/P1 fechados, focando em performance (P-01 a P-03) e na ampliação de E2E.
