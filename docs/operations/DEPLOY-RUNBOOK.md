# Runbook de Deploy e Troubleshooting

## Deploy padrão

```bash
docker compose up -d --build
npm run system:check
npm run smoke:test
```

Para validar login real no smoke:

```bash
SMOKE_USER=admin SMOKE_PASSWORD='sua_senha' npm run smoke:test
```

## Se `/ready` falhar

1. Verificar status da stack:

```bash
docker compose ps
```

2. Coletar diagnóstico:

```bash
npm run debug:collect
```

3. Ler primeiro:
- `backend.log`
- `db.log`
- `redis.log`
- `ready.json`

## Falhas comuns

### Backend não fica healthy
- conferir `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET`
- conferir `FRONTEND_URL`, `BASE_URL`, `CORS_ORIGIN`
- conferir conectividade com `db` e `redis`

### `/ready` retorna `not_ready`
- abrir `ready.json`
- se `database.status != healthy`, inspecionar `db.log`
- se `redis.connected = false`, inspecionar `redis.log`

### Frontend sobe mas API falha
- validar se o container `frontend` foi rebuildado
- validar proxy do nginx para `/api` e `/uploads`
- abrir `frontend.log` e `backend.log`

## Rollback rápido

Se o deploy falhar logo após rebuild:

```bash
docker compose down
docker compose up -d
npm run system:check
```

Se houver necessidade de análise antes de nova tentativa:

```bash
npm run debug:collect
```

## Artefatos de diagnóstico

`npm run debug:collect` salva:
- `compose-ps.txt`
- `backend.log`
- `frontend.log`
- `db.log`
- `redis.log`
- `health.json`
- `ready.json`
- `database-health.json`
- `runtime-metrics.json`
- `compose-config.yml`
