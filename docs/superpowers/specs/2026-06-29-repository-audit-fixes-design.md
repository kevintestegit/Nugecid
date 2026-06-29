# Correções da auditoria do repositório

## Objetivo

Corrigir os achados confirmados de performance, funcionalidade, usabilidade e manutenção sem alterar o texto protegido do rodapé do login.

## Escopo

### Escavador SEIRN

O módulo passará a operar somente como receptor de webhook externo. O endpoint autenticado de webhook, a criação de capturas e as notificações SEIRN serão preservados. Serão removidos o gerenciamento de processo Python local, endpoints `start`, `stop` e `status`, DTOs e tipos exclusivos desse gerenciamento, o serviço frontend e o painel de controle correspondente. Assim, nenhum clone dependerá de `webscraping-service/scrapy.py`.

### Performance e bundle

O agrupamento manual de chunks será removido para que o Vite/Rolldown preserve os limites naturais dos imports dinâmicos. A verificação de bundle medirá separadamente a carga inicial referenciada pelo `index.html` e o tamanho total implantado; o acervo estático do Arquivo Ribeira continuará reportado, mas não invalidará o orçamento da carga inicial. O build deverá provar que o login não pré-carrega o chunk de gráficos.

### Autenticação e acessibilidade

O refresh de autenticação retornará sucesso ou falha explicitamente. Quando o refresh anônimo falhar, `checkAuthStatus` não repetirá a consulta de perfil. O botão de exibição da senha voltará à ordem de tabulação. O texto `Em caso de acesso bloqueado, To nem ai` será preservado sem qualquer alteração.

### Qualidade e simplificação

- adicionar `.nvmrc` com Node 24, alinhado aos Dockerfiles e a `package.json`;
- remover `ConfirmDialog`, `LoadingSpinner`, `DateRangePicker` e `SearchIconTest`, junto com exports e rota de desenvolvimento sem uso;
- remover as dependências frontend `@types/recharts` e `follow-redirects` após confirmar build e typecheck;
- substituir `window.confirm` e `alert` por `EnhancedConfirmDialog` ou feedback já existente;
- aplicar Prettier aos 29 arquivos reportados;
- eliminar avisos `no-console` em código de aplicação usando o logger existente, mantendo exceções explícitas apenas no próprio adaptador de logging e no setup de testes.

Arquivos grandes não serão divididos apenas por tamanho. Nenhuma abstração nova será criada sem consumidor real.

## Fluxo e tratamento de erros

O webhook externo continuará validando assinatura e timestamp antes de processar dados. A remoção do launcher local elimina estados falsos de “rodando” sem script disponível. Falhas de autenticação anônima limparão o estado uma vez e encerrarão o fluxo sem chamadas redundantes. Os diálogos de confirmação manterão cancelamento, foco e confirmação destrutiva acessíveis.

## Verificação

As mudanças comportamentais seguirão TDD com falha observada antes da implementação. A conclusão exige:

- testes unitários backend e frontend;
- testes específicos de webhook-only, autenticação e navegação por teclado;
- typecheck, lint sem avisos, Prettier e build;
- gate de bundle aprovado e ausência de `charts` entre os preloads do login;
- smoke HTTP dos containers e inspeção desktop/mobile do login;
- confirmação automatizada de que o texto protegido continua presente.

## Fora de escopo

- restaurar ou versionar `webscraping-service`;
- alterar contratos do webhook externo;
- reformular visualmente a tela de login;
- modificar o texto protegido do item 3;
- reintroduzir GitHub Actions ou outros arquivos removidos por solicitação anterior.
