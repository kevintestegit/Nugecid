# Roadmap Codex 2026-03-17

## Contexto

Pedido do usuário: implementar a ordem de melhorias recomendada para o SGC-ITEP-NESTJS sem perder o raciocínio entre turnos.

## Diagnóstico Persistido

### Estado atual validado localmente

- Backend:
  - `npm run typecheck`: OK
  - `npm run build:backend`: OK
  - `npm run test:unit -- --runInBand`: OK
  - `npm run lint`: FALHA por problemas de Prettier em arquivos TS
- Frontend:
  - `npm run frontend:typecheck`: OK
  - `npm run frontend:build`: OK
  - `npm run frontend:bundle:check`: OK
  - `npm run frontend:test:unit`: FALHA em 1 teste do 404
  - `npm run frontend:lint`: FALHA por hooks chamados condicionalmente

### Problemas concretos encontrados

1. Observabilidade do frontend ainda não está integrada a um serviço real.
   - `frontend/src/utils/logger.ts` contém TODO explícito para Sentry/LogRocket.
   - `frontend/src/main.tsx` ainda faz captura global só com `console.error`.

2. Sessão/UI ainda depende de `localStorage` para cache do usuário.
   - `frontend/src/utils/tokenStorage.ts`

3. Uploads e backups dependem de filesystem local.
   - `src/config/app.config.ts`
   - `src/modules/backup/services/backup.service.ts`

4. Busca global existe, mas não há evidência de indexação/OCR de conteúdo documental.
   - `frontend/src/components/layout/GlobalSearch.tsx`

5. Há link funcional quebrado para auditoria.
   - `src/modules/notificacoes/services/notificacoes.service.ts` gera `link: "/auditoria"`
   - `frontend/src/App.tsx` não tinha rota correspondente

6. Quality gate não está verde.
   - hooks condicionais em:
     - `frontend/src/pages/EditDesarquivamentoPage.tsx`
     - `frontend/src/pages/ProjetoDetailPage.tsx`
     - `frontend/src/pages/tarefas/DetalheTarefaPage.tsx`
   - teste do 404 desatualizado:
     - `frontend/src/__tests__/DetalhesDesarquivamentoPage.test.tsx`
     - `frontend/src/pages/NotFoundPage.tsx`

## Ordem recomendada

1. Fase 0: estabilizar a base
   - quality gate
   - hooks
   - testes
   - rota/tela de auditoria

2. Fase 1: observabilidade e segurança operacional
   - `@sentry/react`
   - captura de erro/replay/tracing no frontend
   - antivírus em upload com ClamAV

3. Fase 2: camada documental
   - storage S3-compatible
   - versionamento/retenção
   - OCR com OCRmyPDF + Tesseract

4. Fase 3: busca documental
   - indexação dedicada com Meilisearch

5. Fase 4: automação operacional
   - n8n para prazos, webhooks e rotinas

6. Fase 5: BI operacional
   - Metabase para alertas, assinaturas e dashboards fora do sistema transacional

## Execução já concluída

- Persistência deste roadmap no repositório
- Fase 0 concluída:
  - quality gate do frontend corrigido
  - hooks condicionais removidos
  - teste do 404 estabilizado
  - rota/tela de auditoria implementadas no backend e frontend
  - Playwright ativado com smoke E2E real de login + auditoria
  - coexistência entre Jest e Playwright ajustada (`e2e/` fora do matcher do Jest)
  - script `test:e2e:api` restaurado com config dedicada
- Fase 1 parcialmente concluída:
  - `@sentry/react` integrado no frontend com init centralizado
  - captura de erros conectada ao logger/frontend auth context
  - `vite.config.ts` preparado para sourcemaps/release quando Sentry estiver configurado
  - camada opcional de varredura ClamAV criada no backend
  - uploads/importações principais protegidos por scan antes da persistência
  - `docker-compose.yml` ganhou serviço opcional `clamav` via profile `security`
- Fase 2 iniciada:
  - camada de storage abstrata criada no backend
  - driver local mantido como padrão
  - driver S3-compatible adicionado para MinIO/S3
  - `pastas`, `planilhas` e anexos do `nugecid` migrados para leitura/escrita por objeto
  - downloads não dependem mais de `sendFile()` nesses fluxos
  - compatibilidade legada preservada para arquivos já salvos no filesystem
  - `docker-compose.yml` ganhou serviço opcional `minio` via profile `storage`
  - pipeline OCR inicial implementado nos anexos PDF do NUGECID
  - OCR executa com `ocrmypdf` + `tesseract` (`por`) e gera PDF pesquisável sidecar + texto sidecar
  - PDF original nunca é sobrescrito
  - PDFs assinados digitalmente passam a ser marcados como `skipped_signed`, sem tentativa de OCR in-place
  - metadados de OCR passam a ser persistidos em `desarquivamento_anexos`
  - `Dockerfile` do backend agora inclui dependências de OCR em runtime
  - backend container validado com build local da imagem após a inclusão das dependências
- Fase 3 implementada na camada base:
  - módulo global de busca documental criado com Meilisearch
  - `globalSearch` do backend agora usa o índice para `desarquivamento`, `pasta` e `planilha`, com fallback SQL automático
  - índice documental passa a agregar OCR concluído dos anexos PDF do NUGECID no documento pai de desarquivamento
  - conteúdo textual de planilhas passa a ser extraído com `xlsx` para indexação full-text
  - sincronização incremental do índice foi ligada às mutações de desarquivamentos, anexos OCR, pastas e planilhas
  - profile `search` adicionado ao `docker-compose.yml` com serviço opcional do Meilisearch
  - endpoint autenticado `GET /health/search` adicionado para visibilidade operacional do índice
  - endpoint administrativo `POST /sync/search/reindex` adicionado para bootstrap/reindexação manual em background
  - checagem redundante de health a cada consulta foi removida da busca para não duplicar latência por request

## Ajustes estruturais encontrados ao ativar o Playwright

- Migração `1768100000000-AddMissingIndexes` tornada compatível com esquemas legados e atuais
- `AuditoriaModule` passou a importar `AuthModule`, corrigindo resolução do `JwtAuthGuard`
- `SeedingModule` foi ligado ao `AppModule`
- seeding do admin passou a reativar usuário existente (`ativo = true`)
- seeding de roles passou a alinhar `roles_id_seq` antes de inserir dados faltantes

## Validação mais recente

- `npm run lint`: OK
- `npm run typecheck`: OK
- `npm run test:unit -- --runInBand`: OK
- `npm run test:e2e:api`: OK
- `npm run test:e2e`: OK
- `docker build -t sgc-backend-ocr-check .`: OK
- `npm run lint`: OK após a inclusão do módulo de busca
- `npm run typecheck`: OK após a inclusão do módulo de busca
- `npm run test:unit -- --runInBand`: OK com 108 testes
- `npm run build:backend`: OK após a inclusão do módulo de busca
- `npm run test:e2e:api`: OK após a inclusão dos endpoints operacionais da busca
- `docker compose --profile search config`: OK

## Validação em runtime concluída

- Stack validada com serviços reais:
  - `docker compose --profile search up -d --build backend frontend meilisearch`
  - `sgc-backend`: healthy em `:8080`
  - `sgc-frontend`: healthy em `:3001`
  - `sgc-meilisearch`: disponível em `:7700`
- Migração de OCR aplicada no banco real:
  - `npm run migration:run`
  - tabela `desarquivamento_anexos` passou a ter os campos `ocr_status`, `ocr_pdf_caminho`, `ocr_texto_caminho`, `ocr_texto`, `ocr_processado_em` e `ocr_erro`
- Saúde da busca validada em runtime:
  - `GET /api/health/search`: `status = ready`
  - `POST /api/sync/search/reindex`: aceito e executado em background
  - índice `global_documents` populado com `199` documentos
- Busca indexada validada com dados reais:
  - consulta por número de processo retornando desarquivamentos indexados
  - consulta por texto de pastas retornando resultados indexados
- Visualização de anexos de processo validada ponta a ponta:
  - backend direto em `GET /api/nugecid/processo/anexos/:id/view?numeroProcesso=...`: `200 OK`
  - frontend via proxy em `GET /api/nugecid/processo/anexos/:id/view?numeroProcesso=...`: `200 OK`

## Correção aplicada para anexos de processo

- Causa real do `404` na visualização:
  - rota com `numeroProcesso` no path era frágil por conter `/`
  - havia conflito entre controllers sob o prefixo `nugecid/.../anexos`
  - o banco em runtime ainda não tinha as colunas de OCR, quebrando a carga do anexo por entidade
- Correções implementadas:
  - `AnexosController` passou a aceitar apenas `desarquivamentoId` numérico no path
  - nova rota estável por query string:
    - `GET /api/nugecid/processo/anexos/:id/view?numeroProcesso=...`
    - `GET /api/nugecid/processo/anexos/:id/download?numeroProcesso=...`
  - frontend passou a montar URLs de preview/download de anexos de processo usando query string
  - backend valida que o anexo realmente pertence ao `numeroProcesso` antes de devolver o arquivo
  - `buildSearchDocumentId()` passou de `tipo:id` para `tipo_id`, corrigindo falha de chave primária rejeitada pelo Meilisearch

## Reavaliação da Fase 4

- Adoção de `n8n` foi reavaliada com base no código atual
- decisão atual: adiar a Fase 4 conscientemente
- justificativa:
  - as automações existentes ainda são poucas, estáveis e centradas no domínio
  - o sistema já cobre agendamentos internos com `@nestjs/schedule`
  - há webhook externo do Escavador e filas BullMQ opcionais, mas ainda não há explosão de fluxos administrativos mutáveis
  - neste momento, `n8n` adicionaria custo operacional antes de resolver um gargalo real
- gatilhos para reabrir a Fase 4:
  - múltiplas integrações externas novas
  - fluxos multietapa com exceções frequentes
  - necessidade de alterar regras operacionais sem deploy
  - aumento de endpoints manuais para disparo de rotinas

## Fase 5 iniciada

- profile opcional `bi` adicionado ao `docker-compose.yml`
- serviço `metabase` adicionado com banco interno separado
- bootstrap idempotente de Postgres adicionado para provisionar:
  - role do Metabase
  - banco interno do Metabase
  - role analítica read-only
- schema `analytics` introduzido no banco para BI
- views analíticas iniciais criadas:
  - `analytics.vw_desarquivamentos`
  - `analytics.vw_tarefas`
  - `analytics.vw_notificacoes`
- documentação operacional criada em `docs/metabase.md`
- decisão arquitetural:
  - nesta etapa o Metabase usa o banco primário com usuário read-only
  - réplica de leitura permanece como evolução futura, se a carga justificar

## Pendências para os próximos turnos

- Definir estratégia de storage:
  - escolher rollout final entre MinIO self-hosted ou S3 gerenciado
  - migrar uploads públicos restantes (`avatars`, `announcements`) se fizer sentido
- Estender OCR para outros fluxos documentais que passem a aceitar PDF além do NUGECID
- Decidir se o PDF pesquisável sidecar será exposto por rota dedicada ou mantido apenas para backend/search
- Validar Meilisearch em ambiente com dados reais e calibrar ranking/facets se a UX da busca pedir filtros adicionais
- Subir automações com n8n
- Conectar Metabase em réplica ou leitura controlada
