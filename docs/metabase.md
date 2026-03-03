# Metabase

## Objetivo

A integração de BI do projeto usa o Metabase como ferramenta externa de análise, sem acoplar dashboards gerenciais ao backend transacional.

Nesta fase, o Metabase foi configurado para:

- usar um banco próprio de aplicação (`METABASE_APP_DB`) dentro do PostgreSQL já existente
- acessar os dados do sistema com um usuário separado e somente leitura (`METABASE_ANALYTICS_USER`)
- consumir apenas o schema analítico `analytics`, em vez do schema transacional `public`

## Como subir

```bash
docker compose --profile bi up -d metabase-bootstrap metabase
```

Após a subida:

- Metabase: `http://localhost:3002`
- Health: `http://localhost:3002/api/health`

## O que o bootstrap faz

O container `metabase-bootstrap` provisiona de forma idempotente:

- role de aplicação do Metabase
- banco interno do Metabase
- role analítica read-only
- grants de leitura no schema `analytics`

O bootstrap não cria dashboards nem configura automaticamente a fonte de dados dentro do Metabase.

## Fonte de dados recomendada no Metabase

Na UI inicial do Metabase, adicione um banco PostgreSQL com estes parâmetros:

- Host: `db`
- Port: `5432`
- Database name: valor de `METABASE_ANALYTICS_DB`
- Username: valor de `METABASE_ANALYTICS_USER`
- Password: valor de `METABASE_ANALYTICS_PASSWORD`

Preferência recomendada:

- sincronizar apenas o schema `analytics`

## Views analíticas entregues

As views iniciais ficam no schema `analytics`:

- `analytics.vw_desarquivamentos`
- `analytics.vw_tarefas`
- `analytics.vw_notificacoes`

Essas views servem como camada estável para:

- volume e status de desarquivamentos
- produtividade e prazo de tarefas
- leitura de notificações e carga operacional

## Limitação atual

Nesta entrega, o Metabase ainda consulta o banco primário com usuário read-only. A réplica de leitura continua como evolução futura, caso o volume e a concorrência justifiquem.
