# QUESTIONS

Repository-wide review generated on 2026-03-31.

Purpose:
- This file is a decision log for the next refactor round.
- Each item is phrased as an independent question.
- Please answer directly under each question and state whether the current behavior is:
  - intended
  - a bug
  - temporary technical debt
  - a refactor target

Suggested answer format:

Answer:

Decision:

Notes:

## 1. Repository Shape And High-Level Architecture

### Q001. Is this repository intentionally a mixed backend/frontend monorepo with two separate package roots?
Files: `package.json`, `frontend/package.json`, `README.md`
Why this stood out: the backend lives at the repo root, the frontend lives under `frontend/`, and both have their own scripts, dependencies, and build concerns.
Answer:

### Q002. What is the authoritative architecture target for the backend: classic Nest modular monolith, or gradual Clean Architecture by module?
Files: `src/app.module.ts`, `src/modules/nugecid/**`, `src/modules/users/**`
Why this stood out: most modules are classic Nest service/controller modules, but `nugecid` and parts of `users` already have domain/use-case/repository abstractions.
Answer:

### Q003. Which documents are currently authoritative when README, planning docs, and code disagree?
Files: `README.md`, `docs/technical/ANALISE-MODULOS.md`, `docs/RESUMO_FINAL_MELHORIAS.md`
Why this stood out: the docs mention structures and decisions that no longer match the current module layout in several places.
Answer:

### Q004. What are the intended bounded contexts of the system today?
Files: `src/modules/nugecid/**`, `src/modules/tarefas/**`, `src/modules/pastas/**`, `src/modules/notificacoes/**`, `src/modules/search/**`
Why this stood out: several modules call each other directly and exchange domain rules in ways that make boundaries blurry.
Answer:

### Q005. What production scale should this codebase be designed for in the next 12-24 months?
Files: whole repository
Why this stood out: some choices are fine for small scale, but risky for medium/high scale, especially in-memory scans, huge services, and broad refetches.
Answer:

### Q006. Should the root `AppService` remain an integration layer for dashboard and global search, or should those concerns move into dedicated modules?
Files: `src/app.service.ts`, `src/app.controller.ts`, `src/modules/search/**`
Why this stood out: the root application service already acts like a cross-cutting domain service instead of a thin app shell.
Answer:

### Q007. What is the policy for keeping legacy files after a refactor wave?
Files: `src/modules/nugecid/entities/desarquivamento.entity.ts`, `src/modules/nugecid/nugecid-pdf.services.ts`, commented imports in `src/modules/nugecid/nugecid.module.ts`
Why this stood out: I found files and comments marked as legacy/removed that still live in the tree and may confuse future changes.
Answer:

### Q008. What is the canonical role catalog for the whole platform?
Files: `src/modules/users/enums/role-type.enum.ts`, `src/app.service.ts`, `src/modules/search/search.service.ts`, `frontend/src/types/index.ts`
Why this stood out: `nugecid_viewer` appears in backend access checks, but the main role enum and frontend role model do not expose it.
Answer:

### Q009. Are server-rendered routes still a supported product surface, or is the React SPA now the only intended UI?
Files: `src/app.controller.ts`, `src/modules/auth/auth.controller.ts`, `src/modules/users/users.controller.ts`, `frontend/src/**`
Why this stood out: the codebase still ships server-rendered auth/users pages while also maintaining a full SPA.
Answer:

### Q010. What is the canonical Node.js version for backend and frontend development?
Files: `AGENTS.md`, `package.json`, `frontend/package.json`
Why this stood out: there is no `.nvmrc`, no `engines` field, and no documented Node baseline in the reviewed files.
Answer:

### Q011. Is Linux the primary supported development environment, despite some Windows-specific scripts remaining in the repo?
Files: `scripts/create_dump_secure.ps1`, `scripts/restore_dump_local.ps1`, root `AGENTS.md`
Why this stood out: the repo instructions in this session are Linux-focused, but some operational scripts are still PowerShell-only.
Answer:

### Q012. Should this repo have separate backend-specific local agent guidance instead of only frontend-oriented instructions?
Files: `AGENTS.md`
Why this stood out: the current local instructions are detailed for React/Vite/Tailwind, but the repository is heavily backend-centric as well.
Answer:

## 2. API Contracts, Cross-Cutting Patterns, And Operational Semantics

### Q013. What is the mandatory API response contract for controllers?
Files: `src/common/interceptors/transform.interceptor.ts`, multiple controllers
Why this stood out: some controllers return raw data, some return `{ success, data }`, and the global interceptor sometimes wraps responses again.
Answer:

### Q014. Should controllers manually shape `{ success, data, meta }` responses, or should that be centralized entirely in the response interceptor layer?
Files: `src/common/interceptors/transform.interceptor.ts`, `src/modules/backup/controllers/system-settings.controller.ts`, `src/modules/security/security.controller.ts`
Why this stood out: both patterns are used today, which increases frontend unwrapping complexity.
Answer:

### Q015. What is the canonical pagination contract for the API?
Files: `src/modules/users/users.controller.ts`, `src/modules/tarefas/controllers/tarefas.controller.ts`, `src/modules/notificacoes/controllers/notificacoes.controller.ts`, `frontend/src/services/**`
Why this stood out: I found page/limit/meta pagination, cursor pagination, and ad-hoc list responses coexisting.
Answer:

### Q016. Where should DTO aliasing and input normalization happen?
Files: `src/modules/nugecid/**`, `frontend/src/services/api.ts`, `frontend/src/services/tarefasService.ts`
Why this stood out: field aliases and shape normalization are currently spread across DTOs, services, use cases, and frontend service layers.
Answer:

### Q017. What is the project-wide tolerance for `any` in production code?
Files: many backend controllers/services/interceptors and some frontend mappers
Why this stood out: I found `any` in request handling, DTO adaptation, audit sanitization, import results, and domain mutation paths.
Answer:

### Q018. Should the platform support both camelCase and snake_case field names on the wire, or should one format be enforced?
Files: `frontend/src/services/tarefasService.ts`, `frontend/src/services/kanbanService.ts`, `src/modules/tarefas/**`
Why this stood out: the frontend often normalizes both `colunaId`/`coluna_id`, `projetoId`/`projeto_id`, `createdAt`/`created_at`, which suggests contract drift.
Answer:

### Q019. What is the logging policy for business data and PII?
Files: `src/modules/auth/auth.service.ts`, `src/modules/auth/strategies/jwt.strategy.ts`, `src/modules/backup/services/system-settings.service.ts`, frontend `console.error` usage
Why this stood out: current logs include payloads, user objects, and raw settings values in multiple places.
Answer:

### Q020. What is the expected behavior when optional infrastructure is disabled or degraded?
Files: `src/modules/search/search.service.ts`, `src/modules/security/antivirus.service.ts`, `src/modules/ocr/ocr.service.ts`, `.env.example`
Why this stood out: the app appears to fail-open for some subsystems, but not all of them, and I could not infer the intended reliability stance.
Answer:

### Q021. Are in-memory maps acceptable for state that affects user-visible behavior in production?
Files: `src/modules/auth/auth.service.ts`, `src/modules/notificacoes/services/notificacoes.service.ts`, `src/modules/sync/sync-realtime.service.ts`
Why this stood out: online users, SSE channels, and notification subjects all keep per-user state in process memory.
Answer:

### Q022. What is the intended cache invalidation strategy across modules?
Files: `src/app.service.ts`, `src/modules/notificacoes/services/notificacoes.service.ts`, `src/modules/estatisticas/estatisticas.service.ts`
Why this stood out: several modules roll their own cache version bumping and TTL conventions rather than using one shared pattern.
Answer:

### Q023. Should the root service layer remain responsible for full-text search aggregation across many entities?
Files: `src/app.service.ts`, `src/modules/search/search.service.ts`
Why this stood out: both the root service and the search module participate in search concerns, which makes ownership less obvious.
Answer:

### Q024. What is the project-wide policy for keeping feature flags, optional modules, and commented-out imports?
Files: `src/app.module.ts`, commented `WebscrapingModule`, queue feature flag handling
Why this stood out: there are disabled modules and optional modules, but no obvious single policy for when those paths should be removed or stabilized.
Answer:

## 3. Authentication, Authorization, And Security Model

### Q025. Should the system keep both session authentication and JWT cookie authentication active at the same time?
Files: `src/main.ts`, `src/modules/auth/auth.controller.ts`, `src/modules/auth/auth.service.ts`, `frontend/src/services/api.ts`
Why this stood out: login sets JWT cookies and also writes session state, and different endpoints still depend on different guards.
Answer:

### Q026. Is `SessionStrategy` intentionally not registered in `AuthModule`, or is that an omission?
Files: `src/modules/auth/strategies/session.strategy.ts`, `src/modules/auth/auth.module.ts`
Why this stood out: the strategy exists, but the module providers do not register it.
Answer:

### Q027. If auth is cookie-based, should `/auth/login` and `/auth/refresh` still return access tokens in JSON?
Files: `src/modules/auth/auth.controller.ts`, `frontend/src/contexts/AuthContext.tsx`
Why this stood out: the frontend comments say cookies handle auth, but the backend still exposes token bodies.
Answer:

### Q028. Should `/auth/logout` depend on `SessionAuthGuard`, or should logout work whenever JWT cookies are present?
Files: `src/modules/auth/auth.controller.ts`
Why this stood out: logout is session-guarded while most API access is JWT-guarded.
Answer:

### Q029. Should `/auth/check` and `/auth/profile` keep different guard semantics?
Files: `src/modules/auth/auth.controller.ts`
Why this stood out: one path is effectively session-oriented and the other is JWT-oriented, which complicates the client auth story.
Answer:

### Q030. What is the intended CSRF protection strategy for cookie-authenticated state-changing endpoints?
Files: `src/main.ts`, `src/modules/auth/**`, whole API surface
Why this stood out: the app uses cookies broadly, but I did not find an explicit CSRF strategy in the reviewed paths.
Answer:

### Q031. Is it intentional that the frontend can keep showing a logged-in user from `localStorage` when the backend is offline?
Files: `frontend/src/contexts/AuthContext.tsx`, `frontend/src/utils/tokenStorage.ts`
Why this stood out: `AuthContext` preserves optimistic login state on network failure, even if the server session may already be invalid.
Answer:

### Q032. Should the global Axios interceptor redirect to `/login` on almost every 401 by default?
Files: `frontend/src/services/api.ts`
Why this stood out: broad redirect behavior can mask permission bugs and produce rough UX when a single request fails.
Answer:

### Q033. Is storing the cached user profile in `localStorage` still acceptable from a privacy/security perspective?
Files: `frontend/src/utils/tokenStorage.ts`
Why this stood out: the code avoids storing tokens, but still persists identity/profile data client-side.
Answer:

### Q034. Is it intentional that login accepts an email-like input and then falls back to the username prefix before `@`?
Files: `src/modules/auth/auth.service.ts`
Why this stood out: that behavior is convenient, but it can create ambiguity if usernames and emails diverge later.
Answer:

### Q035. Should verbose auth logging stay enabled in development only, or is some of it currently leaking too much detail even there?
Files: `src/modules/auth/auth.service.ts`, `src/modules/auth/strategies/jwt.strategy.ts`
Why this stood out: the code logs payloads, user activity, and auth decisions at a fairly detailed level.
Answer:

### Q036. Is `disableErrorMessages: false` in the global validation pipe intentional for all environments?
Files: `src/main.ts`
Why this stood out: that favors debugging, but it also increases the amount of validation detail returned to clients.
Answer:

### Q037. Is `rejectUnauthorized: false` for database SSL an intentional production posture?
Files: `src/config/database.config.ts`, `src/config/migration.config.ts`
Why this stood out: disabling certificate verification weakens TLS guarantees and should usually be an explicit infrastructure choice.
Answer:

### Q038. Is the current Redis/session-store bootstrap behavior intentionally strict for local development?
Files: `src/main.ts`
Why this stood out: the app fails hard unless Redis is configured or a specific in-memory fallback flag is enabled.
Answer:

### Q039. Should the IP blocker guard be active globally right now, or is it only an admin tool for manual operations?
Files: `src/modules/security/guards/ip-blocker.guard.ts`, `src/modules/security/security.module.ts`
Why this stood out: the guard exists and the security module exports related services, but I did not find global registration in the reviewed wiring.
Answer:

### Q040. Should detailed health, database, metrics, and search endpoints be visible to any authenticated user, or only to admins/operators?
Files: `src/modules/health/health.controller.ts`
Why this stood out: the more operationally sensitive endpoints are JWT-protected but not role-restricted.
Answer:

## 4. Users Module And RBAC

### Q041. Should `UsersController` be split into smaller controllers by concern?
Files: `src/modules/users/users.controller.ts`
Why this stood out: the same controller handles API listing, server-rendered pages, avatar operations, preferences, role settings, and profile flows.
Answer:

### Q042. Why does the users module maintain two DTO trees?
Files: `src/modules/users/application/dto/**`, `src/modules/users/dto/**`
Why this stood out: there appear to be duplicated DTO layers with overlapping responsibilities.
Answer:

### Q043. Should the nearly duplicated list endpoints `/users` and `/users/api` remain separate?
Files: `src/modules/users/users.controller.ts`
Why this stood out: both endpoints appear to cover similar retrieval concerns with slightly different response shaping.
Answer:

### Q044. Are the server-rendered users pages still part of the product, or should they be removed?
Files: `src/modules/users/users.controller.ts`
Why this stood out: `@Render("usuarios/...")` actions still exist even though the React SPA already covers user management.
Answer:

### Q045. Are role settings and user settings intentionally stored as flexible JSON blobs, or should they become typed configuration models?
Files: `src/modules/users/entities/role.entity.ts`, `src/modules/users/entities/user.entity.ts`, `src/modules/users/users.controller.ts`
Why this stood out: settings are sanitized manually rather than validated against a strong schema.
Answer:

### Q046. Should frontend role checks mirror backend role settings from the database, or are frontend checks only cosmetic convenience?
Files: `frontend/src/contexts/AuthContext.tsx`, `frontend/src/components/auth/ProtectedRoute.tsx`, backend role settings endpoints
Why this stood out: the backend stores role settings, but the frontend still hardcodes permission rules and route logic.
Answer:

### Q047. Is it intentional that the sidebar hides the Users menu from coordinators while the route itself allows coordinators to access it?
Files: `frontend/src/components/layout/Layout.tsx`, `frontend/src/App.tsx`
Why this stood out: the menu item is `adminOnly`, but the route is protected with `requiredRole={UserRole.COORDENADOR}`.
Answer:

### Q048. Should `ProtectedRoute` treat `nugecid_operator` as equivalent to `coordenador` in hierarchy-based checks?
Files: `frontend/src/components/auth/ProtectedRoute.tsx`
Why this stood out: the current hierarchy gives both the same numeric level, which may or may not match business intent.
Answer:

### Q049. What is the intended privacy model for avatars: public static asset, authenticated asset, or configurable by deployment?
Files: `src/common/middleware/static-auth.middleware.ts`, `src/modules/users/users.controller.ts`, `frontend/src/pages/Configuracoes/UserSettings.tsx`
Why this stood out: avatars are the one upload class explicitly allowed through the static auth middleware.
Answer:

### Q050. What is the lifecycle policy for old avatar files when a user replaces or removes an avatar?
Files: `src/modules/users/users.controller.ts`, upload directories
Why this stood out: I reviewed the frontend update flow, but the storage cleanup policy was not obvious from the reviewed surface.
Answer:

### Q051. What is the authoritative RBAC matrix for admins, coordenadores, `nugecid_operator`, and `usuario`?
Files: backend decorators, `frontend/src/contexts/AuthContext.tsx`, `frontend/src/components/auth/ProtectedRoute.tsx`
Why this stood out: the role semantics are duplicated in controllers, app services, search rules, and frontend route guards.
Answer:

### Q052. Should we treat role names and role IDs as stable API-facing data, or only as internal backend persistence details?
Files: `frontend/src/types/index.ts`, backend auth payloads and user responses
Why this stood out: the frontend depends directly on `role.name`, which makes string drift risky.
Answer:

## 5. NUGECID / Desarquivamentos

### Q053. Is the `nugecid` module intentionally in a hybrid migration state between legacy service logic and Clean Architecture use cases?
Files: `src/modules/nugecid/nugecid.module.ts`, `src/modules/nugecid/nugecid.controller.ts`, `src/modules/nugecid/nugecid.service.ts`
Why this stood out: the module exports both use cases and the legacy service, and the controller uses both styles.
Answer:

### Q054. Which code path is canonical for desarquivamento write behavior today: use cases/repository or legacy `NugecidService`?
Files: `src/modules/nugecid/application/use-cases/**`, `src/modules/nugecid/nugecid.service.ts`, `src/modules/nugecid/nugecid.controller.ts`
Why this stood out: without a single canonical write path, bug fixes can land in the wrong layer.
Answer:

### Q055. Should the controller own audit diffing, response shaping, and business orchestration?
Files: `src/modules/nugecid/nugecid.controller.ts`
Why this stood out: the controller is very large and contains substantial business logic rather than only HTTP adaptation.
Answer:

### Q056. Should `UpdateDesarquivamentoUseCase` be allowed to mutate domain private fields through `as any`?
Files: `src/modules/nugecid/application/use-cases/update-desarquivamento/update-desarquivamento.use-case.ts`
Why this stood out: that bypasses aggregate encapsulation and suggests missing mutation methods on the domain object.
Answer:

### Q057. Should repository implementations emit search/sync side effects, or should repositories stay persistence-only?
Files: `src/modules/nugecid/infrastructure/repositories/desarquivamento.typeorm-repository.ts`
Why this stood out: the repository appears to do more than persistence, which complicates tests and domain ownership.
Answer:

### Q058. Should alias normalization like `tipoDesarquivamento` vs `desarquivamentoFisicoDigital` happen at the DTO/input mapper boundary only?
Files: `src/modules/nugecid/**`, `frontend/src/services/api.ts`
Why this stood out: alias support is useful, but it currently leaks into deeper layers.
Answer:

### Q059. Why does the deleted-items flow still require controller-side filtering by `deletedAt` after a use case returns records?
Files: `src/modules/nugecid/nugecid.controller.ts`
Why this stood out: that suggests the application/repository contract may not clearly separate active vs deleted queries.
Answer:

### Q060. What is the canonical naming convention for desarquivamento relations and actors?
Files: `src/modules/nugecid/**`
Why this stood out: I found `usuario`, `criadoPor`, `responsavel`, and DTO aliases mixed together.
Answer:

### Q061. Is `findByBarcode` still using valid relation names?
Files: `src/modules/nugecid/nugecid.service.ts`
Why this stood out: I found `relations: ["usuario", "responsavel"]`, while most other paths use names like `criadoPor`.
Answer:

### Q062. Should audit resource/type strings be standardized and machine-safe?
Files: `src/modules/nugecid/nugecid.service.ts`, `src/modules/nugecid/nugecid-audit.service.ts`
Why this stood out: I found inconsistent strings such as `DESARQUIVAMENTO` vs `DESARQUIVamento`.
Answer:

### Q063. Are emoji-bearing notification titles/messages part of the intended product style for NUGECID events?
Files: `src/modules/nugecid/nugecid.service.ts`
Why this stood out: some notification content is stylistically different from the rest of the platform and may affect UI/push consistency.
Answer:

### Q064. Should comments, attachments, historico, OCR, export, PDF/DOCX generation, and search all remain inside the same module boundary?
Files: `src/modules/nugecid/**`
Why this stood out: the module is functionally rich and may already be acting as several subdomains at once.
Answer:

### Q065. What is the canonical aggregate root API for desarquivamentos?
Files: `src/modules/nugecid/domain/entities/desarquivamento.entity.ts`, use cases
Why this stood out: the current use cases still need to reach around the aggregate instead of relying on a complete domain method surface.
Answer:

### Q066. Should import result DTOs keep loosely typed `details` payloads?
Files: `src/modules/nugecid/dto/import-result.dto.ts`
Why this stood out: import errors/results are an important support surface, but the DTO still exposes `any`.
Answer:

### Q067. Are the current large controller/service file sizes in NUGECID considered acceptable, or do you want explicit decomposition targets now?
Files: `src/modules/nugecid/nugecid.controller.ts`, `src/modules/nugecid/nugecid.service.ts`, `src/modules/nugecid/nugecid-pdf.service.ts`
Why this stood out: these files are among the largest backend files in the repository.
Answer:

### Q068. Is the mojibake/encoding corruption in parts of the desarquivamento domain file intentional, or should that be treated as a real defect?
Files: `src/modules/nugecid/domain/entities/desarquivamento.entity.ts`
Why this stood out: I saw garbled comments/messages that look like encoding drift rather than legitimate source text.
Answer:

## 6. Tarefas, Projetos, And Kanban

### Q069. What is the exact permission matrix for tasks and projects?
Files: `src/modules/tarefas/**`, `frontend/src/contexts/AuthContext.tsx`, `frontend/src/components/auth/ProtectedRoute.tsx`
Why this stood out: project/task permissions are enforced in service logic, but the frontend also has its own simplified assumptions.
Answer:

### Q070. Is the raw SQL workaround inside task movement logic an accepted temporary fix, or should it be eliminated soon?
Files: `src/modules/tarefas/services/tarefas.service.ts`
Why this stood out: `moveTarefa` still appears to rely on a direct SQL update due to a TypeORM issue/workaround.
Answer:

### Q071. Should column/task reordering semantics be consistently transactional across all reorder operations?
Files: `src/modules/tarefas/services/tarefas.service.ts`, `src/modules/tarefas/services/colunas.service.ts`
Why this stood out: some reorder flows use stronger locking/ordering discipline than others.
Answer:

### Q072. What is the authoritative meaning of project member roles `admin`, `editor`, and `viewer`?
Files: `src/modules/tarefas/entities/membro-projeto.entity.ts`, `frontend/src/services/kanbanService.ts`, `frontend/src/components/kanban/ProjectMembersModal.tsx`
Why this stood out: the role labels exist, but I did not see a single explicit permissions matrix documenting what each can actually do.
Answer:

### Q073. Should WIP limits be enforced server-side, or are they only UI metadata?
Files: `src/modules/tarefas/**`, `frontend/src/components/kanban/**`
Why this stood out: WIP fields exist in the model, but the enforcement responsibility is not obvious from the reviewed paths.
Answer:

### Q074. Should the deprecated `StatusTarefa` concept disappear entirely from the frontend?
Files: `frontend/src/types/index.ts`, `frontend/src/hooks/useTarefas.ts`, task pages/components
Why this stood out: the type file explicitly says backend tasks do not have a persisted status field, but some UI logic still reasons in status-like terms.
Answer:

### Q075. Is it intentional that the codebase maintains both a paginated task CRUD view and a Kanban-centric project/task view?
Files: `frontend/src/pages/TarefasPage.tsx`, `frontend/src/pages/KanbanPage.tsx`, `frontend/src/services/tarefasService.ts`, `frontend/src/services/kanbanService.ts`
Why this stood out: both fronts map and normalize similar task data in different ways, which increases maintenance cost.
Answer:

### Q076. Should only the creator be able to delete a project, or should admins/coordenadores have override powers?
Files: `src/modules/tarefas/controllers/projetos.controller.ts`, `src/modules/tarefas/services/projetos.service.ts`
Why this stood out: the controller description implies creator-only deletion, which may or may not match operational expectations.
Answer:

### Q077. Should the project member lookup endpoint expose all candidate users to any project member?
Files: `src/modules/tarefas/controllers/projetos.controller.ts`, `src/modules/tarefas/services/projetos.service.ts`
Why this stood out: user lookup is a useful feature, but it also has privacy and scalability implications.
Answer:

### Q078. What is the retention/deletion model for task comments, attachments, checklists, and history?
Files: `src/modules/tarefas/**`
Why this stood out: the entities and controllers exist, but the lifecycle expectations were not obvious from the reviewed surfaces.
Answer:

### Q079. Is the heavy client-side mapping in `TarefasPage` considered an acceptable adapter layer, or should the backend payload be normalized enough to remove most of it?
Files: `frontend/src/pages/TarefasPage.tsx`, `frontend/src/services/kanbanService.ts`
Why this stood out: the page recreates a significant amount of domain normalization locally.
Answer:

### Q080. Is persisting task board density and selected project in `localStorage` the intended UX, or should those states become route-driven / server-driven preferences?
Files: `frontend/src/pages/TarefasPage.tsx`
Why this stood out: these preferences are currently local-only and could drift from user expectations across devices.
Answer:

## 7. Pastas, Planilhas, Storage, Search, OCR, Statistics, And Backup

### Q081. Why is `PastasService` creating the `pasta_arquivos` table at runtime instead of relying only on migrations?
Files: `src/modules/pastas/pastas.service.ts`
Why this stood out: runtime schema creation increases startup complexity and can hide migration drift.
Answer:

### Q082. Should filesystem/object-storage writes inside folder creation be compensated if the database transaction fails afterward?
Files: `src/modules/pastas/pastas.service.ts`
Why this stood out: file persistence is mixed with database persistence, which can leave orphaned files or records.
Answer:

### Q083. Why do `persistArquivos` and `persistArquivosWithManager` both exist instead of sharing one code path?
Files: `src/modules/pastas/pastas.service.ts`
Why this stood out: duplication in storage flows usually causes subtle drift in validation, indexing, and cleanup behavior.
Answer:

### Q084. Is the current folder item search intentionally implemented as an in-memory scan over all spreadsheets and folder contents?
Files: `src/modules/pastas/pastas.service.ts`
Why this stood out: `buscarItens()` appears to parse and search across content in memory rather than delegating to a purpose-built index.
Answer:

### Q085. What scale of spreadsheets/folders should `buscarItens()` and related folder listing flows support before we redesign them?
Files: `src/modules/pastas/pastas.service.ts`, `src/modules/planilhas/planilhas.service.ts`
Why this stood out: the current approach is sensitive to content volume and file count.
Answer:

### Q086. Should folder and spreadsheet uploads validate real file content in the same way announcement image uploads already do?
Files: `src/modules/pastas/pastas.controller.ts`, `src/modules/planilhas/planilhas.controller.ts`, `src/modules/announcements/controllers/announcements.controller.ts`
Why this stood out: announcement uploads use stronger validation and antivirus flow than some other upload entry points.
Answer:

### Q087. Why is `PlanilhasService` creating `planilhas_controle` at runtime instead of relying only on migrations?
Files: `src/modules/planilhas/planilhas.service.ts`
Why this stood out: this mirrors the folder runtime schema pattern and suggests migration ownership is still split.
Answer:

### Q088. Is `obterPlanilhaGeral()` intentionally a full scan across folders and spreadsheets on demand?
Files: `src/modules/planilhas/planilhas.service.ts`
Why this stood out: it appears to aggregate all folder/spreadsheet content rather than querying a denormalized reporting model.
Answer:

### Q089. What are the intended authorization rules for folders and spreadsheets?
Files: `src/modules/pastas/pastas.controller.ts`, `src/modules/planilhas/planilhas.controller.ts`, `src/modules/search/search.service.ts`
Why this stood out: folders, spreadsheets, and search documents use overlapping but not obviously identical access rules.
Answer:

### Q090. What is the canonical storage backend for production: local filesystem, S3-compatible object storage, or both?
Files: `src/modules/storage/storage.service.ts`, `README.md`, `.env.example`
Why this stood out: the repository supports multiple storage paths, but the intended production default is not obvious.
Answer:

### Q091. What is the orphan cleanup policy for uploaded files that are no longer referenced by rows?
Files: `src/modules/storage/storage.service.ts`, `src/modules/pastas/**`, `src/modules/nugecid/**`, `src/modules/users/**`
Why this stood out: multiple modules upload and delete files, but I did not see one centralized orphan reaper policy.
Answer:

### Q092. What is the intended failure mode when OCR dependencies are missing or slow?
Files: `src/modules/ocr/ocr.service.ts`, `src/modules/nugecid/ocr-signature-analysis.ts`
Why this stood out: OCR uses external processes with timeouts, so the operational expectation matters for uploads and previews.
Answer:

### Q093. Should antivirus scanning cover every binary upload path, or only selected ones?
Files: `src/modules/announcements/controllers/announcements.controller.ts`, `src/modules/security/antivirus.service.ts`, folder/attachment upload flows
Why this stood out: I saw strong scanning on announcements, but I want to confirm whether all other upload surfaces are meant to be equally protected.
Answer:

### Q094. Is it acceptable for Meilisearch documents to contain large chunks of extracted spreadsheet and attachment text from a privacy/compliance standpoint?
Files: `src/modules/search/search.service.ts`
Why this stood out: the search index stores normalized searchable text that may duplicate sensitive source material outside PostgreSQL.
Answer:

### Q095. Should all authenticated users be able to search indexed spreadsheet content?
Files: `src/modules/search/search.service.ts`
Why this stood out: planilha documents currently use `visibilityScope = "authenticated"` in the indexed access model.
Answer:

### Q096. Is full reindexing of the search index in-process and on-demand an acceptable operational model?
Files: `src/modules/search/search.service.ts`, `src/modules/sync/sync.controller.ts`
Why this stood out: reindexation appears to rebuild in the application process rather than through a dedicated worker or offline job path.
Answer:

### Q097. Should large statistics/report generation remain inside the API process?
Files: `src/modules/estatisticas/estatisticas.service.ts`, `src/modules/nugecid/nugecid-pdf.service.ts`
Why this stood out: both statistics and document generation can become CPU/memory heavy in the request path.
Answer:

### Q098. Are the `system_settings` values expected to actively drive runtime behavior today, or are they currently just persisted admin metadata?
Files: `src/modules/backup/services/system-settings.service.ts`, `frontend/src/pages/Configuracoes/SystemSettings.tsx`, `frontend/src/pages/Configuracoes/SecuritySettings.tsx`
Why this stood out: I found the settings CRUD flow, but almost none of the settings appear to be consumed elsewhere in the codebase.
Answer:

### Q099. What is the canonical restore path for backups, and has it been tested end-to-end recently?
Files: `src/modules/backup/services/backup.service.ts`, `scripts/backup-cli.sh`, `scripts/restore-database.sh`
Why this stood out: backup creation is well represented, but restore safety and verification are more operationally sensitive.
Answer:

### Q100. Is it acceptable that backup/restore command building still relies on shell command composition and redirection?
Files: `src/modules/backup/services/backup.service.ts`
Why this stood out: the code sanitizes filenames, but command-string orchestration is still a fragile operational surface.
Answer:

## 8. Notifications, Realtime Sync, And Announcements

### Q101. Should `NotificacoesService` be split into smaller services by concern?
Files: `src/modules/notificacoes/services/notificacoes.service.ts`
Why this stood out: the service handles CRUD, SSE emission, push dispatch, preferences, stats, cache invalidation, and scheduled checks in one place.
Answer:

### Q102. Are per-user RxJS subjects stored in memory acceptable for SSE delivery in production?
Files: `src/modules/notificacoes/services/notificacoes.service.ts`
Why this stood out: SSE delivery is process-local today, which affects horizontal scaling and failover semantics.
Answer:

### Q103. Should SSE hooks keep retrying indefinitely on authorization failures, or should they stop and defer to the auth layer?
Files: `frontend/src/hooks/useNotificacoesSSE.ts`, `frontend/src/hooks/useDomainSyncSSE.ts`
Why this stood out: the current reconnect loops appear generic and do not differentiate between transient network failures and permanent auth failures.
Answer:

### Q104. Is the combination of SSE, polling fallback, and broad React Query refetch invalidation the intended realtime model?
Files: `frontend/src/hooks/useNotificacoes.ts`, `frontend/src/hooks/useRealtimeSync.ts`
Why this stood out: it is robust, but potentially noisy and expensive depending on user count and data volume.
Answer:

### Q105. What is the canonical notification type catalog?
Files: `src/modules/notificacoes/entities/**`, `frontend/src/pages/Configuracoes/GeneralSettings.tsx`, `frontend/src/services/notificacoesService.ts`
Why this stood out: notification types and labels are duplicated across backend entities, frontend settings labels, and frontend service DTOs.
Answer:

### Q106. What is the intended permission model for system announcements?
Files: `src/modules/announcements/controllers/announcements.controller.ts`, `frontend/src/pages/Configuracoes/AnnouncementsSettings.tsx`
Why this stood out: admins create/update/delete, coordinators can list and view stats, and active announcements are visible to authenticated users with optional target roles.
Answer:

### Q107. Should announcement images be treated as protected authenticated assets or public assets?
Files: `src/modules/announcements/controllers/announcements.controller.ts`, `src/common/middleware/static-auth.middleware.ts`
Why this stood out: images are served under `/uploads`, which is generally protected except for avatars.
Answer:

### Q108. Is the current frontend/back-end permission split for system/security settings intentional?
Files: `frontend/src/pages/Configuracoes/SystemSettings.tsx`, `frontend/src/pages/Configuracoes/SecuritySettings.tsx`, `src/modules/backup/controllers/system-settings.controller.ts`
Why this stood out: coordinators can open some settings tabs, but updates appear admin-only on the backend.
Answer:

### Q109. What should happen to push subscriptions when desktop notifications are disabled, permission is revoked, or the user logs out from another browser?
Files: `frontend/src/hooks/usePushNotifications.ts`, `frontend/src/services/pushSubscriptionService.ts`, backend push subscription flows
Why this stood out: subscription lifecycle correctness matters for notification accuracy and privacy.
Answer:

### Q110. Should domain sync event scopes and payload schema be centralized and versioned?
Files: `src/modules/sync/sync.controller.ts`, `frontend/src/hooks/useDomainSyncSSE.ts`, `frontend/src/hooks/useRealtimeSync.ts`
Why this stood out: scope strings like `desarquivamentos`, `pastas`, `planilhas`, and `global-search` are used across back and front as raw string literals.
Answer:

### Q111. Is it intentional that both notification events and domain sync events can trigger overlapping data reloads?
Files: `frontend/src/hooks/useNotificacoesSSE.ts`, `frontend/src/hooks/useRealtimeSync.ts`
Why this stood out: a single backend action may fan out into multiple frontend refresh triggers.
Answer:

### Q112. What is the retention policy for notifications, notification stats, and announcement view records?
Files: `src/modules/notificacoes/**`, `src/modules/announcements/**`
Why this stood out: these datasets can grow quietly over time and affect both UX and storage if left unbounded.
Answer:

## 9. Frontend Architecture, Data Fetching, And Shared State

### Q113. Should `frontend/src/services/api.ts` remain a monolithic API facade, or should it be split by domain?
Files: `frontend/src/services/api.ts`
Why this stood out: it is one of the largest frontend files and overlaps with multiple smaller domain services.
Answer:

### Q114. What is the intended division of responsibility between `api.ts` and domain-specific services like `tarefasService`, `kanbanService`, `backupService`, and `notificacoesService`?
Files: `frontend/src/services/**`
Why this stood out: the frontend currently has both a giant generic API service and several domain services that partially overlap with it.
Answer:

### Q115. What is the intended frontend state-management strategy: React Query first, Zustand first, or ad-hoc hook state by feature?
Files: `frontend/src/main.tsx`, `frontend/src/store/notificacoesStore.ts`, custom hooks across `frontend/src/hooks/**`
Why this stood out: the codebase mixes React Query, Zustand, context, and manual local component state patterns.
Answer:

### Q116. What is the approved `localStorage` usage policy on the frontend?
Files: `frontend/src/contexts/AuthContext.tsx`, `frontend/src/contexts/ThemeContext.tsx`, `frontend/src/components/layout/Layout.tsx`, `frontend/src/pages/TarefasPage.tsx`
Why this stood out: the app persists cached user data, theme, sidebar state, selected project, and board density locally.
Answer:

### Q117. Should route-level permission logic come from the backend payload, a shared capability model, or hardcoded role checks?
Files: `frontend/src/App.tsx`, `frontend/src/components/auth/ProtectedRoute.tsx`, `frontend/src/contexts/AuthContext.tsx`
Why this stood out: the frontend currently decides access from hardcoded role name logic instead of a backend-provided capabilities model.
Answer:

### Q118. Is the current global query invalidation strategy in `useRealtimeSync` intentionally broad?
Files: `frontend/src/hooks/useRealtimeSync.ts`
Why this stood out: one event can invalidate and refetch multiple broad query-key families, plus periodic refetch still runs globally.
Answer:

### Q119. Is it intentional that notification, desktop notification, push subscription, domain sync, and global realtime sync hooks all mount from `Layout` for every authenticated route?
Files: `frontend/src/components/layout/Layout.tsx`
Why this stood out: the shell now owns a lot of global side effects, which is practical but also centralizes many concerns in one component.
Answer:

### Q120. Should the app open two separate `EventSource` connections per logged-in browser session?
Files: `frontend/src/hooks/useNotificacoesSSE.ts`, `frontend/src/hooks/useDomainSyncSSE.ts`
Why this stood out: notifications and domain sync each maintain their own SSE connection and retry logic.
Answer:

### Q121. What is the canonical source of truth for frontend types?
Files: `frontend/src/types/index.ts`, service-specific DTO interfaces in `frontend/src/services/**`
Why this stood out: shared types, service-local interfaces, and normalization logic all coexist and sometimes drift.
Answer:

### Q122. Should the frontend continue to normalize backend payload drift locally, or should the backend be cleaned up until most adapters disappear?
Files: `frontend/src/pages/TarefasPage.tsx`, `frontend/src/hooks/useKanban.ts`, `frontend/src/services/kanbanService.ts`
Why this stood out: there is a significant amount of client-side adaptation for field names and nested shapes.
Answer:

### Q123. Is the current service response unwrapping pattern intentionally inconsistent?
Files: `frontend/src/services/api.ts`, `frontend/src/services/notificacoesService.ts`, `frontend/src/services/kanbanService.ts`, `frontend/src/services/backupService.ts`
Why this stood out: some services expect raw envelopes, some unwrap `.data`, some support both due to backend inconsistency.
Answer:

### Q124. What is the policy for direct browser APIs like `confirm`, `Notification`, `EventSource`, and `localStorage`?
Files: `frontend/src/pages/Configuracoes/AnnouncementsSettings.tsx`, notification hooks, layout/theme/auth contexts
Why this stood out: these APIs are used directly in multiple places and influence UX, SSR assumptions, and testability.
Answer:

### Q125. What is the frontend logging/monitoring policy for handled errors?
Files: `frontend/src/lib/monitoring.ts`, many `console.error` calls across pages/hooks/services
Why this stood out: the app initializes monitoring, but many flows still only print to console instead of using one reporting policy.
Answer:

### Q126. Is the theme-preference model intentionally split between browser storage and backend user settings?
Files: `frontend/src/contexts/ThemeContext.tsx`, `src/modules/users/**`
Why this stood out: theme is loaded from localStorage first, then reconciled with backend user settings later.
Answer:

## 10. Frontend Screens, Product Workflows, Testing, And Delivery

### Q127. Is the page-level Save button in `ConfiguracoesPage` intentionally simulated rather than wired to real persistence?
Files: `frontend/src/pages/ConfiguracoesPage.tsx`
Why this stood out: the page shows a Save CTA, but it only waits for a timeout while the actual child tabs manage their own persistence.
Answer:

### Q128. Is `SecuritySettings` intentionally auto-saving after debounce, even though the backend update endpoint is admin-only?
Files: `frontend/src/pages/Configuracoes/SecuritySettings.tsx`, `src/modules/backup/controllers/system-settings.controller.ts`
Why this stood out: coordinators can access the tab, but the backend write path is restricted to admins.
Answer:

### Q129. Is the password change flow in `UserSettings` intentionally still a simulation placeholder?
Files: `frontend/src/pages/Configuracoes/UserSettings.tsx`
Why this stood out: the UI presents a real password form, but the save action only sleeps and shows success.
Answer:

### Q130. Is it intentional that both `SystemSettings` and `SecuritySettings` read and write the same `system_settings` record?
Files: `frontend/src/pages/Configuracoes/SystemSettings.tsx`, `frontend/src/pages/Configuracoes/SecuritySettings.tsx`, `src/modules/backup/services/system-settings.service.ts`
Why this stood out: the split is clear in the UI, but both tabs persist into one shared backend entity/service.
Answer:

### Q131. Should the desarquivamento detail experience remain duplicated between a large modal and a large dedicated page?
Files: `frontend/src/components/desarquivamentos/DesarquivamentoDetailModal.tsx`, `frontend/src/pages/DetalhesDesarquivamentoPage.tsx`
Why this stood out: both surfaces are large and likely solve overlapping problems with partially separate logic.
Answer:

### Q132. Is it intentional that the main desarquivamentos list fixes page size to 100 instead of letting the user choose?
Files: `frontend/src/pages/DesarquivamentosPage.tsx`
Why this stood out: the page comments say “exibir todos”, but the actual limit is still capped at 100.
Answer:

### Q133. Should route preloading stay as broad as it is today?
Files: `frontend/src/components/layout/Layout.tsx`, `frontend/src/routes/lazyPages.ts`
Why this stood out: the layout eagerly preloads multiple major screens on idle, which improves navigation but increases initial background work.
Answer:

### Q134. What is the expected accessibility baseline for large dialogs, previews, and data-heavy screens?
Files: `frontend/src/components/desarquivamentos/**`, `frontend/src/pages/DesarquivamentosPage.tsx`, `frontend/src/pages/TarefasPage.tsx`
Why this stood out: these are dense screens with many actions, but I did not review a central accessibility standard or checklist in repo docs.
Answer:

### Q135. What is the intended mobile/responsive support level for the biggest screens?
Files: `frontend/src/pages/TarefasPage.tsx`, `frontend/src/pages/DetalhesDesarquivamentoPage.tsx`, `frontend/src/pages/DesarquivamentosPage.tsx`
Why this stood out: these are some of the largest frontend files and likely the hardest screens to keep usable on smaller devices.
Answer:

### Q136. Is the current automated test coverage level aligned with project expectations?
Files: whole repo
Why this stood out: I counted roughly 615 TS/TSX source files and roughly 40 test files, which suggests coverage is selective rather than broad.
Answer:

### Q137. What is the expected CI quality gate for this monorepo?
Files: `package.json`, `frontend/package.json`, current scripts
Why this stood out: there are many quality scripts, but it is not obvious which ones are mandatory in CI versus optional for local work.
Answer:

### Q138. Should root `npm format` be responsible for frontend formatting too?
Files: `package.json`, `frontend/package.json`
Why this stood out: the root format script only targets backend paths, while the frontend has its own separate format script.
Answer:

### Q139. What is the migration discipline going forward: one-off repair scripts, formal TypeORM migrations, or both?
Files: `src/migrations/**`, `scripts/*.sql`, `scripts/apply-*.js`, `scripts/check-*.js`
Why this stood out: the repo contains many migrations plus a sizeable collection of ad-hoc repair/check scripts.
Answer:

### Q140. Should the very large migration files be broken down or archived more carefully once applied?
Files: `src/migrations/1758124112456-014-create-projetos-table.ts` and other large migrations
Why this stood out: some migration files are very large and contain broad schema reshaping, which makes future auditing harder.
Answer:

### Q141. What is the intended local-development entrypoint: Dockerized stack only, local `npm run dev` only, or a supported hybrid?
Files: `package.json`, `docker-compose.yml`, `scripts/check-docker.js`
Why this stood out: when I validated `npm run dev`, the backend booted, but the frontend failed because port `3001` was already in use while Docker containers were also part of the expected local workflow.
Answer:

### Q142. Is `scripts/check-docker.js` still aligned with the current `docker compose` service names?
Files: `scripts/check-docker.js`, `docker-compose.yml`
Why this stood out: the script checks for `postgres` and `pgadmin`, but the current compose project exposes services named differently (`db`, `adminer`), so the script reported missing services even with containers already healthy.
Answer:

### Q143. Should the root `lint` and `typecheck` commands become monorepo-wide checks instead of backend-only checks?
Files: `package.json`, `frontend/package.json`
Why this stood out: `npm run lint` and `npm run typecheck` at the repo root validate only the Nest backend, while the frontend requires separate commands despite living in the same repository.
Answer:

### Q144. Should frontend test runs be treated as failing when they emit React `act(...)` warnings?
Files: `frontend/src/pages/__tests__/TermoDesarquivamentoPreviewPage.test.tsx`
Why this stood out: the frontend test suite passed, but the preview-page tests emitted React state-update warnings, which usually indicate test timing or effect-handling gaps.
Answer:

### Q145. Are both lockfiles expected to stay fully synchronized with the current manifests on every branch?
Files: `package-lock.json`, `frontend/package-lock.json`, `package.json`, `frontend/package.json`
Why this stood out: after running the required install command, both lockfiles changed substantially, which suggests either intentionally pending dependency work or lockfiles drifting behind manifest updates.
Answer:
