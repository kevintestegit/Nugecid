# SGC-ITEP v2.0 — Sistema de Gestão do Conhecimento, Informação, Documentação e Memória

![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/react-%2361DAFB.svg?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

## Sobre o Projeto

O SGC-ITEP v2.0 é o sistema de gestão documental do Instituto Técnico-Científico de Perícia (ITEP/RN), desenvolvido para o Núcleo de Gestão do Conhecimento, Informação, Documentação e Memória (NUGECID). O sistema gerencia desarquivamentos, tarefas (kanban), vestígios, planilhas, pastas, estatísticas com geração de PDF, backups automatizados, notificações em tempo real e mais.

**Arquitetura**: Monolito modular (NestJS) com frontend SPA separado (React/Vite).

## Stack Tecnológica

### Backend

| Componente       | Tecnologia                                |
| ---------------- | ----------------------------------------- |
| Runtime          | Node.js 20 (Alpine)                       |
| Framework        | NestJS 10                                 |
| Linguagem        | TypeScript 5                              |
| Banco de dados   | PostgreSQL 16                             |
| ORM              | TypeORM 0.3                               |
| Cache / Sessões  | Redis 7 (ioredis)                         |
| Filas            | BullMQ (via `@nestjs/bullmq`)             |
| Autenticação     | Passport.js + JWT (cookie HttpOnly)       |
| Validação        | class-validator + class-transformer       |
| Documentação API | Swagger / OpenAPI 3.0 (`@nestjs/swagger`) |
| Geração de PDF   | PDFKit, pdfmake, Playwright (Chromium)    |
| Geração de DOCX  | docx, html-to-docx                        |
| Planilhas        | xlsx (SheetJS)                            |
| Monitoramento    | Sentry (`@sentry/nestjs`)                 |
| Agendamento      | `@nestjs/schedule` (cron jobs)            |
| Eventos          | `@nestjs/event-emitter`                   |
| WebSocket        | ws (notificações SSE)                     |
| HTTP Client      | Axios                                     |

### Frontend

| Componente    | Tecnologia                                |
| ------------- | ----------------------------------------- |
| Framework     | React 18                                  |
| Bundler       | Vite 4                                    |
| Linguagem     | TypeScript 5                              |
| Estilização   | TailwindCSS 3 + tailwind-merge            |
| Estado global | Zustand 5                                 |
| Data fetching | TanStack React Query 5                    |
| Formulários   | react-hook-form 7 + Zod 3                 |
| UI Components | Radix UI (dialog, select, checkbox, etc.) |
| Gráficos      | Recharts 3                                |
| Drag and Drop | DnD-Kit                                   |
| Roteamento    | React Router DOM 6                        |
| Ícones        | Lucide React                              |
| Testes        | Vitest + Testing Library                  |

## Módulos do Sistema

O backend possui **22 módulos**:

| Módulo            | Descrição                                                            |
| ----------------- | -------------------------------------------------------------------- |
| `auth`            | Login, logout, refresh token, perfil (cookie HttpOnly)               |
| `users`           | CRUD de usuários, avatar, preferências pessoais (settings JSONB)     |
| `nugecid`         | Desarquivamentos: CRUD, import/export Excel, código de barras, PDF   |
| `estatisticas`    | Dashboard, relatórios gerenciais em PDF (geral e mensal)             |
| `tarefas`         | Kanban completo: projetos, colunas, tarefas, checklists, comentários |
| `pastas`          | Gestão de pastas e documentos                                        |
| `planilhas`       | Gestão de planilhas                                                  |
| `vestigios`       | Registro e controle de vestígios                                     |
| `registros`       | Registros gerais do sistema                                          |
| `announcements`   | Comunicados e anúncios                                               |
| `notificacoes`    | Notificações em tempo real (SSE / WebSocket)                         |
| `audit`           | Auditoria completa de ações                                          |
| `backup`          | Backup automatizado + restauração + system settings                  |
| `security`        | Bloqueio por IP, conta lockout, monitoramento de segurança           |
| `queues`          | Filas BullMQ para processamento assíncrono                           |
| `sync`            | Sincronização de dados                                               |
| `escavador-seirn` | Integração com Escavador / SEIRN (webhook externo)                   |
| `search`          | Busca unificada                                                      |
| `health`          | Health checks (app, DB, Redis, disco, memória)                       |
| `observability`   | Métricas de runtime (RuntimeMetricsService)                          |
| `seeding`         | Seed automático de dados iniciais (SeedingService)                   |
| `redis`           | Módulo de conexão Redis                                              |

## Roles (RBAC)

O sistema implementa 4 roles:

| Role               | Descrição                                                  |
| ------------------ | ---------------------------------------------------------- |
| `ADMIN`            | Acesso total ao sistema                                    |
| `COORDENADOR`      | Gestão de equipe e acesso a backups parciais               |
| `NUGECID_OPERATOR` | Operador NUGECID com acesso a desarquivamentos e vestígios |
| `USUARIO`          | Acesso limitado às próprias solicitações                   |

## Pré-requisitos

- **Docker** e **Docker Compose** (recomendado para deploy)
- **Node.js 20** e **npm** (para desenvolvimento local)
- **PostgreSQL 16** (provido via Docker)
- **Redis 7** (provido via Docker, obrigatório para sessões e filas)

## Instalação e Execução

### Via Docker Compose (recomendado)

```bash
# Clone o repositório
git clone https://github.com/kevintestegit/Nugecid.git
cd SGC-ITEP-NESTJS

# Configure o ambiente
cp .env.example .env
# Edite .env com suas credenciais (JWT_SECRET, POSTGRES_PASSWORD, etc.)

# Suba toda a stack
docker compose up -d

# Verifique os serviços
docker compose ps
```

Isso inicia 5 containers:

| Serviço    | Container      | Porta padrão (host) |
| ---------- | -------------- | ------------------- |
| Backend    | `sgc-backend`  | `8080`              |
| Frontend   | `sgc-frontend` | `3001`              |
| PostgreSQL | (auto)         | `5432`              |
| Redis      | `sgc-redis`    | `6379`              |
| Adminer    | (auto)         | `8081`              |

Perfis opcionais disponíveis:

- `search`: sobe o Meilisearch
- `storage`: sobe o MinIO
- `security`: sobe o ClamAV
- `bi`: sobe o bootstrap do Metabase + Metabase

Portas podem ser alteradas no `.env`:

```env
HOST_BACKEND_PORT=8080
HOST_FRONTEND_PORT=3001
HOST_DB_PORT=5432
HOST_REDIS_PORT=6379
HOST_ADMINER_PORT=8081
HOST_METABASE_PORT=3002
```

### BI com Metabase

O repositório agora possui um profile opcional de BI:

```bash
docker compose --profile bi up -d metabase-bootstrap metabase
```

Isso sobe:

- `sgc-metabase-bootstrap`: provisiona o banco interno do Metabase e o usuário analítico read-only
- `sgc-metabase`: UI do Metabase em `http://localhost:3002`

O Metabase foi preparado para consumir o schema `analytics`, com views estáveis para:

- `analytics.vw_desarquivamentos`
- `analytics.vw_tarefas`
- `analytics.vw_notificacoes`

As instruções completas de conexão estão em [docs/metabase.md](./docs/metabase.md).

### Desenvolvimento Local

```bash
# Instale dependências do backend
npm install

# Instale dependências do frontend
cd frontend && npm install && cd ..

# Suba PostgreSQL e Redis via Docker
docker compose up -d db redis

# Execute as migrações
npm run migration:run

# Inicie backend + frontend simultaneamente
npm run dev
```

O sistema estará disponível em:

- **Frontend**: http://localhost:3001
- **API**: http://localhost:3000
- **API Docs (Swagger)**: http://localhost:3000/api/docs
- **Liveness**: http://localhost:3000/health
- **Readiness**: http://localhost:3000/ready

> **Nota**: O seed de dados iniciais é automático via `SeedingService` (não é necessário rodar `npm run seed` manualmente).

### Web Push

Para notificações com a aba fechada, o ambiente precisa de chaves VAPID e das migrations mais recentes:

```bash
# gera e grava WEB_PUSH_VAPID_* no .env
npm run webpush:setup-env

# aplica as migrations de notificações desktop / push
npm run migration:run
```

Depois disso:

- acesse a tela de configurações do usuário
- habilite `Notificações na área de trabalho`
- conceda permissão do navegador
- teste em `https` ou `localhost`, porque Service Worker e Push API não funcionam em HTTP comum

## Scripts Disponíveis

### Backend

| Comando                      | Descrição                                           |
| ---------------------------- | --------------------------------------------------- |
| `npm run dev`                | Backend + Frontend em modo watch (com Docker check) |
| `npm run dev:safe`           | Mesmo que `dev` sem verificar Docker                |
| `npm run start:backend`      | Apenas backend em modo watch                        |
| `npm run start:frontend`     | Apenas frontend (Vite dev server)                   |
| `npm run build`              | Build backend + frontend                            |
| `npm run build:backend`      | Build apenas backend (NestJS)                       |
| `npm run build:frontend`     | Build apenas frontend (Vite)                        |
| `npm run start:prod`         | Executa build de produção (`dist/src/main.js`)      |
| `npm run lint`               | ESLint no backend                                   |
| `npm run lint:fix`           | ESLint com auto-fix                                 |
| `npm run typecheck`          | TypeScript type-check (sem emitir)                  |
| `npm run format`             | Prettier no backend                                 |
| `npm run test`               | Roda testes (Jest)                                  |
| `npm run test:unit`          | Testes unitários (com `--passWithNoTests`)          |
| `npm run test:critical`      | Testes críticos do backend (auth, health, search, NUGECID, upload) |
| `npm run test:e2e`           | Smoke E2E com Playwright                            |
| `npm run test:e2e:api`       | E2E da API com Jest/Supertest                       |
| `npm run test:e2e:ui`        | Alias explícito para Playwright                     |
| `npm run test:e2e:ui:headed` | Playwright com navegador visível                    |
| `npm run test:e2e:install`   | Instala o Chromium usado pelo Playwright            |
| `npm run migration:run`      | Executa migrações pendentes                         |
| `npm run migration:generate` | Gera migração a partir de mudanças nas entities     |
| `npm run migration:revert`   | Reverte última migração                             |
| `npm run quality:critical`   | Lint + typecheck + testes críticos (backend + frontend) |
| `npm run quality:check`      | Lint + typecheck + tests (backend + frontend)       |
| `npm run quality:ci`         | Quality check + build + bundle size check           |

### E2E com Playwright

O repositório agora possui um smoke E2E real em `e2e/login.spec.ts`, cobrindo:

- login com usuário `admin`
- carregamento do dashboard após autenticação
- acesso à rota `/auditoria`

Execução recomendada:

```bash
# Instale o navegador uma vez
npm run test:e2e:install

# Rode o smoke E2E
npm run test:e2e
```

O Playwright sobe um backend local isolado na porta `3100` e um frontend Vite na porta `3101`, reaproveitando apenas `db` e `redis` do `docker compose`. O usuário admin é semeado automaticamente com a senha padrão `123456`, podendo ser sobrescrita por `E2E_ADMIN_PASSWORD`.

### Backup

| Comando                 | Descrição                  |
| ----------------------- | -------------------------- |
| `npm run backup:full`   | Backup completo do banco   |
| `npm run backup:desarq` | Backup de desarquivamentos |
| `npm run backup:list`   | Listar backups disponíveis |
| `npm run backup:clean`  | Limpar backups antigos     |
| `npm run backup:size`   | Tamanho total dos backups  |

### Verificação Operacional

| Comando                | Descrição                                                           |
| ---------------------- | ------------------------------------------------------------------- |
| `npm run system:check` | Verifica containers, frontend, liveness, readiness e URLs básicas   |
| `npm run smoke:test`   | Smoke test pós-deploy com frontend, health e, opcionalmente, auth   |
| `npm run debug:collect`| Coleta logs e snapshots de health para troubleshooting pós-deploy    |

Para validar autenticação real no smoke test:

```bash
SMOKE_USER=admin SMOKE_PASSWORD='sua_senha' npm run smoke:test
```

### Shell Scripts

```bash
./scripts/install.sh       # Instala Docker e Docker Compose (Ubuntu/Zorin)
./scripts/run.sh           # Sobe toda a stack via Docker Compose
./scripts/stop.sh          # Para todos os containers
./scripts/check-system.sh  # Verificação rápida de containers e endpoints
./scripts/smoke-test.sh    # Smoke test pós-deploy
./scripts/collect-debug-info.sh # Coleta logs e snapshots para diagnóstico
./scripts/backup_db.sh     # Backup PostgreSQL via pg_dump
./scripts/restore_db.sh    # Restaura backup .dump
```

## Autenticação

A API usa **JWT via cookie HttpOnly** (`access_token`). O fluxo:

1. `POST /api/auth/login` com `{ usuario, senha }` no body
2. O backend define `access_token` e `refresh_token` como cookies `HttpOnly`
3. O payload JSON pode incluir `accessToken` para compatibilidade, mas o frontend do projeto opera pelos cookies e não depende do refresh token em JavaScript
4. Todas as requisições subsequentes enviam os cookies automaticamente
5. `POST /api/auth/refresh` renova o `access_token` usando o `refresh_token` em cookie
6. `POST /api/auth/logout` limpa `access_token`, `refresh_token` e a sessão

> **Importante**: clientes web devem usar `credentials: 'include'` (fetch) ou `withCredentials: true` (axios).

## Deploy com Docker Compose

O `docker-compose.yml` agora sobe o frontend como build estático servido por `nginx`, com proxy local para `/api` e `/uploads`. Isso evita rodar `vite dev` em produção e mantém frontend e backend consistentes no mesmo host exposto ao navegador.

Checklist mínimo de produção:

```env
NODE_ENV=production
BASE_URL=http://SEU_HOST:8080
FRONTEND_URL=http://SEU_HOST:3001
CORS_ORIGIN=http://SEU_HOST:3001
SESSION_SECURE=auto
JWT_SECRET=<forte>
JWT_REFRESH_SECRET=<forte>
SESSION_SECRET=<forte>
REDIS_URL=redis://redis:6379/0
```

Fluxo recomendado:

```bash
cp .env.example .env
# editar .env
docker compose up -d --build
docker compose ps
curl http://localhost:8080/ready
curl http://localhost:3001
npm run system:check
npm run smoke:test
npm run debug:collect   # se precisar diagnosticar falha
```

Runbook operacional:

- [DEPLOY-RUNBOOK.md](/dados/area_trabalho/SGC-ITEP-NESTJS/docs/operations/DEPLOY-RUNBOOK.md)
- [BACKLOG-PRODUTO-PRIORIZADO.md](/dados/area_trabalho/SGC-ITEP-NESTJS/docs/planning/BACKLOG-PRODUTO-PRIORIZADO.md)

## Endpoints Principais

### Auth

- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout
- `POST /api/auth/refresh` — Refresh token
- `GET /api/auth/profile` — Perfil do usuário autenticado

### Usuários

- `GET /api/users` — Listar usuários
- `POST /api/users` — Criar usuário
- `GET /api/users/:id` — Buscar por ID
- `PUT /api/users/:id` — Atualizar
- `DELETE /api/users/:id` — Excluir (soft delete)
- `POST /api/users/me/avatar` — Upload de avatar
- `DELETE /api/users/me/avatar` — Remover avatar

### NUGECID (Desarquivamentos)

- `GET /api/nugecid` — Listar (com paginação e filtros)
- `POST /api/nugecid` — Criar
- `GET /api/nugecid/:id` — Buscar por ID
- `PUT /api/nugecid/:id` — Atualizar
- `DELETE /api/nugecid/:id` — Excluir
- `POST /api/nugecid/import` — Importar planilha Excel
- `GET /api/nugecid/export` — Exportar para Excel
- `GET /api/nugecid/barcode/:codigo` — Buscar por código de barras
- `GET /api/nugecid/:id/pdf` — Gerar Termo de Desarquivamento (PDF)
- `GET /api/nugecid/:id/anexos` — Listar anexos
- `POST /api/nugecid/:id/anexos` — Upload de anexo

### Estatísticas e Relatórios

- `GET /api/estatisticas` — Dados do dashboard
- `GET /api/estatisticas/pdf` — Relatório Geral em PDF (todas as requisições)
- `GET /api/estatisticas/pdf-mensal/:ano/:mes` — Relatório Mensal em PDF

### Tarefas (Kanban)

- `GET/POST /api/projetos` — CRUD de projetos
- `GET/POST /api/colunas` — CRUD de colunas do kanban
- `GET/POST /api/tarefas` — CRUD de tarefas
- `POST /api/tarefas/:id/comentarios` — Comentários em tarefas
- `POST /api/tarefas/:id/checklists` — Checklists em tarefas

### Backup

- `POST /api/backup/full` — Backup completo (admin)
- `POST /api/backup/desarquivamentos` — Backup parcial (admin, coordenador)
- `GET /api/backup/list` — Listar backups
- `POST /api/backup/restore/:filename` — Restaurar backup (admin)
- `POST /api/backup/clean` — Limpar backups antigos (admin)

### Outros

- `GET/POST /api/pastas` — Gestão de pastas
- `GET/POST /api/planilhas` — Gestão de planilhas
- `GET/POST /api/vestigios` — Registro de vestígios
- `GET/POST /api/announcements` — Comunicados
- `GET /api/notificacoes` — Notificações (SSE)
- `GET /api/security/*` — Endpoints de segurança
- `GET /api/queues/*` — Monitoramento de filas
- `GET /api/sync/*` — Sincronização
- `GET /health` — Liveness (processo ativo)
- `GET /ready` — Readiness (DB + Redis)

A documentação completa e interativa está disponível em **Swagger** (`/api/docs`) quando o backend está rodando.

## Geração de PDFs

O sistema gera 3 tipos de PDF:

### 1. Termo de Desarquivamento

- **Stack**: pdfmake
- **Rota**: `GET /api/nugecid/:id/pdf`
- Documento formal com cabeçalho institucional, dados da requisição, rodapé com data e paginação

### 2. Relatório Geral

- **Stack**: PDFKit (fallback quando Playwright não está disponível no container)
- **Rota**: `GET /api/estatisticas/pdf`
- Contém **todas** as requisições de desarquivamento do banco (não apenas as recentes)
- Cabeçalho institucional em todas as páginas, tabela paginada com `ensureSpaceForRow`, rodapé com numeração

### 3. Relatório Mensal

- **Stack**: Playwright (Chromium headless) com fallback para PDFKit
- **Rota**: `GET /api/estatisticas/pdf-mensal/:ano/:mes`
- Filtrado por mês/ano, mesmo layout do relatório geral

## Segurança

### Medidas Implementadas

- **Helmet.js** — Headers HTTP seguros (CSP em produção)
- **Rate Limiting em 4 níveis** — Global, login, registro, upload (configurável via `.env`)
- **CORS** — Origens controladas
- **Bloqueio por IP** — Módulo `security` com IP blocking
- **Account Lockout** — Bloqueio após N tentativas falhas (`MAX_LOGIN_ATTEMPTS`, `LOCKOUT_DURATION`)
- **Sessões Redis** — `express-session` com `connect-redis`
- **Criptografia de senhas** — bcrypt com rounds configuráveis
- **Cookie HttpOnly** — Token JWT nunca exposto ao JavaScript do client
- **Validação de entrada** — `class-validator` em todos os DTOs
- **Soft Delete** — Exclusão lógica de registros (`deleted_at`)
- **RBAC** — 4 roles com guards por rota

## Monitoramento

### Sentry

- Integrado via `@sentry/nestjs` e `@sentry/node`
- Inicializado em `src/instrument.ts` (antes de qualquer import)
- Captura automática de exceções via `@SentryExceptionCaptured()` no filtro global
- Breadcrumbs customizados nos serviços de PDF
- Configuração via env vars: `SENTRY_DSN`, `SENTRY_ENVIRONMENT`

### Observability

- `RuntimeMetricsService` — Métricas de runtime (memória, CPU, event loop)
- `LoggingInterceptor` — Log de todas as requisições HTTP (método, rota, status, duração)
- `AuditModule` — Registro de todas as ações de usuários

### Health Checks

- `GET /health` — liveness básico (sempre 200 quando o processo está de pé)
- `GET /ready` — readiness (retorna 200 apenas com DB e Redis OK; 503 quando indisponível)
- Endpoints auxiliares autenticados (debug): `GET /api/health/database`, `GET /api/health/database/test`, `GET /api/health/database/info`, `GET /api/health/metrics`

### Requisitos de produção

- Redis é obrigatório em produção para sessões/cache/filas.
- Fallback em memória é bloqueado em produção (mesmo se `ALLOW_MEMORY_SESSION_STORE=true`).
- Se Redis/DB estiverem indisponíveis no bootstrap, o processo falha startup.
- O deploy deve usar `/ready` para readiness probe e `/health` para liveness probe.

### Testando readiness localmente

```bash
# Liveness
curl -i http://localhost:3000/health

# Readiness (DB + Redis)
curl -i http://localhost:3000/ready
```

### Backups Automáticos

- **Backup completo**: Diariamente às 2h (cron via `@nestjs/schedule`)
- **Backup de desarquivamentos**: A cada 6 horas
- **Retenção**: 30 dias (limpeza automática)
- **Limite**: Configurável (`BACKUP_MAX_FILES`, `BACKUP_MAX_SIZE_GB`)

## CI / Quality Gate

O projeto usa **GitHub Actions** (`.github/workflows/quality.yml`):

```
Push/PR → Backend Quality (lint, typecheck, build, test)
        → Frontend Quality (lint, typecheck, build, test)
        → Quality Gate (ambos devem passar)
```

Node.js 20 em ambos os jobs. Lint e typecheck rodam com `continue-on-error: true` (não bloqueiam o pipeline).

Localmente: `npm run quality:check` roda tudo de uma vez.

## Estrutura do Projeto

```
SGC-ITEP-NESTJS/
├── src/                          # Código-fonte do backend
│   ├── main.ts                   # Ponto de entrada
│   ├── instrument.ts             # Sentry init (importado antes de tudo)
│   ├── app.module.ts             # Módulo raiz
│   ├── config/                   # Configurações (app, database, migration)
│   ├── common/                   # Recursos compartilhados
│   │   ├── decorators/           # Decorators customizados
│   │   ├── filters/              # Filtros de exceção (global + Sentry)
│   │   ├── guards/               # Guards de auth e roles
│   │   ├── interceptors/         # LoggingInterceptor
│   │   └── pipes/                # Pipes de validação
│   ├── database/                 # Migrações TypeORM
│   └── modules/                  # 22 módulos de domínio
│       ├── auth/                 # Autenticação JWT/Cookie
│       ├── users/                # Usuários e preferências
│       ├── nugecid/              # Desarquivamentos + PDF
│       ├── estatisticas/         # Dashboard + Relatórios PDF
│       ├── tarefas/              # Kanban (projetos/colunas/tarefas)
│       ├── pastas/               # Gestão de pastas
│       ├── planilhas/            # Gestão de planilhas
│       ├── vestigios/            # Registro de vestígios
│       ├── registros/            # Registros gerais
│       ├── announcements/        # Comunicados
│       ├── notificacoes/         # Notificações SSE/WebSocket
│       ├── audit/                # Auditoria
│       ├── backup/               # Backup automatizado
│       ├── security/             # IP blocking, lockout
│       ├── queues/               # Filas BullMQ
│       ├── sync/                 # Sincronização
│       ├── escavador-seirn/      # Integração externa
│       ├── search/               # Busca unificada
│       ├── health/               # Health checks
│       ├── observability/        # Métricas de runtime
│       ├── seeding/              # Seed automático
│       └── redis/                # Conexão Redis
├── frontend/                     # SPA React
│   ├── src/
│   │   ├── pages/                # ~30 páginas
│   │   ├── components/           # Componentes reutilizáveis (Radix UI)
│   │   ├── hooks/                # Custom hooks
│   │   ├── services/             # HTTP client (Axios)
│   │   ├── stores/               # Zustand stores
│   │   └── lib/                  # Utilitários
│   ├── package.json
│   └── Dockerfile
├── scripts/                      # 32 scripts (bash, js, ts, ps1, sql)
├── backups/                      # Diretório de backups (volume Docker)
├── uploads/                      # Diretório de uploads (volume Docker)
├── docker-compose.yml            # Stack completa (backend, frontend, db, redis, adminer)
├── Dockerfile                    # Multi-stage build (node:20-alpine)
├── .env.example                  # Todas as variáveis documentadas
├── .github/workflows/quality.yml # CI pipeline
└── package.json                  # Scripts e dependências
```

## Dockerfile

O projeto usa um build multi-stage para produção:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY . .
RUN npm run build:backend

# Production stage
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache postgresql-client
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/assets ./src/assets
COPY --from=builder /app/frontend/src/components/img ./frontend/src/components/img
RUN mkdir -p /app/uploads /app/backups
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
```

## Configuração por ambiente

O backend valida ENV no boot (`src/config/validation.ts`) e falha em produção quando faltam variáveis críticas.

### Produção (obrigatórias)

- Auth: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET`
- Banco: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_NAME`
- Redis/estado distribuído: `REDIS_URL` **ou** `REDIS_HOST` + `REDIS_PORT`
- URL e CORS: `FRONTEND_URL`, `CORS_ORIGIN`
- Em produção: `ALLOW_MEMORY_SESSION_STORE` deve permanecer `false`

### Opcionais (com defaults)

- Rate-limit: `RATE_LIMIT_*`, `TRUST_PROXY_HOPS`
- Sentry: `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE`
- Email: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`
- Portas Compose: `HOST_BACKEND_PORT`, `HOST_FRONTEND_PORT`, `HOST_DB_PORT`, `HOST_REDIS_PORT`, `HOST_ADMINER_PORT`

### Legado suportado (com warning de depreciação)

- `MAIL_*` -> `EMAIL_*`
- `HOST_HTTP_PORT` -> `HOST_BACKEND_PORT`

### Lista de variáveis críticas por módulo

- `auth`: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `MAX_LOGIN_ATTEMPTS`, `LOCKOUT_DURATION`
- `db`: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_NAME`, `DATABASE_SSL`, `DATABASE_TYPE`, `DATABASE_USE_NEON`
- `redis`: `REDIS_URL`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`, `ALLOW_MEMORY_SESSION_STORE`
- `email`: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`
- `rate-limit`: `RATE_LIMIT_ENABLED`, `RATE_LIMIT_GLOBAL_MAX`, `RATE_LIMIT_GLOBAL_WINDOW_MS`, `RATE_LIMIT_LOGIN_MAX`, `RATE_LIMIT_LOGIN_WINDOW_MS`, `RATE_LIMIT_REGISTER_MAX`, `RATE_LIMIT_REGISTER_WINDOW_MS`, `RATE_LIMIT_UPLOAD_MAX`, `RATE_LIMIT_UPLOAD_WINDOW_MS`, `TRUST_PROXY_HOPS`
- `sentry`: `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE`
- `frontend urls`: `FRONTEND_URL`, `BASE_URL`, `CORS_ORIGIN`, `HOST_BACKEND_PORT`, `HOST_FRONTEND_PORT`

## Migração de Uploads entre Máquinas

```bash
# Exportar uploads
docker run --rm -v sgc_app_uploads:/from -v "$(pwd)"/backups:/to alpine \
  sh -c "cd /from && tar -czf /to/uploads.tgz ."

# Importar uploads
docker run --rm -v sgc_app_uploads:/to -v "$(pwd)"/backups:/from alpine \
  sh -c "cd /to && tar -xzf /from/uploads.tgz"
```

## Preferências do Usuário

- Avatar: `POST /api/users/me/avatar` e `DELETE /api/users/me/avatar`
- Configurações pessoais (tema, exibição de dados, salvamento automático, visualização compacta, itens por página) persistidas em `usuarios.settings` (JSONB)
- O frontend aplica o tema automaticamente após login

## Licença

Este projeto é propriedade do Instituto Técnico-Científico de Perícia (ITEP/RN) e é licenciado sob termos proprietários.

---

**SGC-ITEP v2.0** — Desenvolvido para a PCI/RN
