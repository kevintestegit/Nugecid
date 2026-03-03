# Matriz de Exposicao de Rotas

Atualizado em `2026-03-06`.

## Publico por desenho

- `GET /`
  - Redireciona para o frontend.
- `GET /health`
  - Liveness.
- `GET /ready`
  - Readiness.
- `GET /health/ping`
  - Ping basico.
- `GET /auth/login`
  - Pagina de login.
- `POST /auth/login`
  - Login principal.
- `POST /v2/auth/login`
  - Login v2.
- `POST /auth/refresh`
  - Refresh por cookie httpOnly.
- `POST /escavador-seirn/hook`
  - Webhook externo protegido por assinatura HMAC e janela anti-replay.

## Protegido por autenticacao

- `GET /sync/stream`
  - Exige `JwtAuthGuard`.
  - Nao aceita mais token por query string.
- `GET /notificacoes/stream`
  - Exige `JwtAuthGuard`.
  - Nao aceita mais token por query string.
- `GET /health/database`
- `GET /health/database/test`
- `GET /health/database/info`
- `GET /health/metrics`
  - Todos exigem autenticacao.

## Protegido no frontend

- Todas as rotas da aplicacao React, exceto `/login`, estao sob `ProtectedRoute`.
- Rotas de usuarios exigem `requiredRole={UserRole.COORDENADOR}`.

## Observacoes

- O webhook `POST /escavador-seirn/hook` continua publico por necessidade de integracao externa.
- O modelo atual usa segredo compartilhado com assinatura HMAC e timestamp.
- O risco residual mais relevante agora e operacional: rotacao do segredo, armazenamento seguro no host do watcher e observabilidade de falhas repetidas de assinatura.
