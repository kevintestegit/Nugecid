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

Portas podem ser alteradas no `.env`:

```env
HOST_BACKEND_PORT=8080
HOST_FRONTEND_PORT=3001
HOST_DB_PORT=5432
HOST_REDIS_PORT=6379
HOST_ADMINER_PORT=8081
```

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
- **Health Check**: http://localhost:3000/api/health

> **Nota**: O seed de dados iniciais é automático via `SeedingService` (não é necessário rodar `npm run seed` manualmente).

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
| `npm run test:e2e`           | Testes end-to-end                                   |
| `npm run migration:run`      | Executa migrações pendentes                         |
| `npm run migration:generate` | Gera migração a partir de mudanças nas entities     |
| `npm run migration:revert`   | Reverte última migração                             |
| `npm run quality:check`      | Lint + typecheck + tests (backend + frontend)       |
| `npm run quality:ci`         | Quality check + build + bundle size check           |

### Backup

| Comando                 | Descrição                  |
| ----------------------- | -------------------------- |
| `npm run backup:full`   | Backup completo do banco   |
| `npm run backup:desarq` | Backup de desarquivamentos |
| `npm run backup:list`   | Listar backups disponíveis |
| `npm run backup:clean`  | Limpar backups antigos     |
| `npm run backup:size`   | Tamanho total dos backups  |

### Shell Scripts

```bash
./scripts/install.sh       # Instala Docker e Docker Compose (Ubuntu/Zorin)
./scripts/run.sh           # Sobe toda a stack via Docker Compose
./scripts/stop.sh          # Para todos os containers
./scripts/backup_db.sh     # Backup PostgreSQL via pg_dump
./scripts/restore_db.sh    # Restaura backup .dump
./scripts/check-system.sh  # Verifica saúde do sistema
```

## Autenticação

A API usa **JWT via cookie HttpOnly** (`access_token`). O fluxo:

1. `POST /api/auth/login` com `{ usuario, senha }` no body
2. O backend retorna o token como cookie `Set-Cookie: access_token=<jwt>; HttpOnly; Path=/`
3. Todas as requisições subsequentes enviam o cookie automaticamente
4. `POST /api/auth/logout` limpa o cookie
5. `POST /api/auth/refresh` renova o token

> **Importante**: O token NÃO é retornado no body JSON. Clientes devem usar `credentials: 'include'` (fetch) ou `withCredentials: true` (axios).

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
- `GET /api/health` — Health check principal

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
- **Account Lockout** — Bloqueio após N tentativas falhas (`LOCKOUT_ATTEMPTS`, `LOCKOUT_DURATION`)
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

- `GET /api/health` — Status geral da aplicação
- Verifica: conectividade DB, conectividade Redis, espaço em disco, uso de memória

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

## Variáveis de Ambiente

Todas as variáveis estão documentadas em `.env.example`. As principais:

| Variável             | Descrição                        | Padrão                 |
| -------------------- | -------------------------------- | ---------------------- |
| `APP_PORT`           | Porta interna do backend         | `3000`                 |
| `HOST_BACKEND_PORT`  | Porta exposta do backend (host)  | `8080`                 |
| `HOST_FRONTEND_PORT` | Porta exposta do frontend (host) | `3001`                 |
| `POSTGRES_USER`      | Usuário PostgreSQL               | `sgc`                  |
| `POSTGRES_PASSWORD`  | Senha PostgreSQL                 | (obrigatório)          |
| `POSTGRES_DB`        | Nome do banco                    | `sgc`                  |
| `JWT_SECRET`         | Segredo para assinar JWT         | (obrigatório)          |
| `SESSION_SECRET`     | Segredo para sessões             | (obrigatório)          |
| `REDIS_HOST`         | Host do Redis                    | `localhost`            |
| `SENTRY_DSN`         | DSN do Sentry (opcional)         | (vazio = desabilitado) |
| `SENTRY_ENVIRONMENT` | Ambiente Sentry                  | `production`           |
| `BACKUP_ENABLED`     | Ativar backups automáticos       | `true`                 |
| `CORS_ORIGIN`        | Origens permitidas               | `localhost:3000,3001`  |

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
