# Webscraping SEIRN – Notas de Uso e Próximos Passos

## Objetivo
- Suprir a ausência de API no SEIRN para leitura de processos/ocorrências.
- Expor um microserviço FastAPI (`webscraping-service/`) que o backend NestJS consome.
- Suporte a cache via Redis para reduzir hits na origem.

## Como está hoje (resumo)
- Endpoints REST:
  - `/api/v1/processo/{numero}` e `/api/v1/ocorrencia/{numero}`: retornam dados via Selenium + BeautifulSoup.
  - `/api/v1/search`: dispatch por tipo.
  - `/api/v1/cache` e `/api/v1/cache/status`: controle do cache.
- Scraper:
  - Selenium headless para páginas dinâmicas.
  - BeautifulSoup para extrair textos/atributos de HTML.
  - Chaves de cache `seirn:{md5(tipo:numero)}`.
- Situação: seletores/URLs de busca são placeholders e precisam ser ajustados ao HTML real do SEIRN.

## O que queremos agora
- Notificação de “novo processo recebido” assim que aparecer no SEIRN.
- Conteúdo mínimo: número do processo e o título/assunto exibido na lista ou no detalhe.

## Estratégia sugerida para notificação
1) **Ponto de coleta**: descobrir a página/lista do SEIRN que mostra os processos recém-recebidos (ex.: caixa de entrada, “Meus processos”, “Últimos”). Precisamos de:
   - URL da lista.
   - Seletor dos itens (linha da tabela, card, etc.).
   - Seletor para número e título/assunto dentro do item.
2) **Captura periódica**: criar um endpoint/rotina (cron) que:
   - Acessa a lista.
   - Extrai todos os itens visíveis (número, título, timestamp se houver).
   - Normaliza o número (`_normalize_numero` já faz remover caracteres não numéricos).
3) **Deduplicação**:
   - Persistir o último conjunto visto (Redis ou DB do backend) e comparar com a execução anterior.
   - Identificar números novos e gerar eventos/alertas.
4) **Entrega da notificação**:
   - Opção A: o próprio microserviço expõe um endpoint `GET /api/v1/processos/recentes` e o NestJS agenda um job para checar e publicar notificação (ex.: fila, websocket).
   - Opção B: microserviço envia webhook/fila direto (mais acoplado, menos recomendado sem combinar).
5) **Configuração**:
   - Intervalo de varredura (ex.: a cada 5–10 minutos).
   - Limite máximo de itens lidos por rodada para não sobrecarregar.
   - Cache TTL para resultados de lista (se fizer sentido).

## Dados faltantes para implementar
- URL real da lista de “novos processos”.
- Seletores/IDs/classes:
  - Campo de busca/filtro, se for necessário login.
  - Seletor de cada linha/card de processo.
  - Seletor para número do processo e título/assunto.
- Se há login/captcha: precisamos do fluxo (página de login, IDs dos inputs, botão submit) ou confirmar se o acesso é público.

## Pontos de atenção
- `webdriver_manager` baixa o ChromeDriver em runtime; em produção é melhor fixar driver/browser ou usar Playwright se quisermos mais robustez.
- Se o site usar CAPTCHA ou bloqueios por automação, a taxa de varredura precisa ser conservadora e talvez com user-agent/sleep configuráveis.
- Ajustar a limpeza de cache: chaves são `seirn:{md5(...)}`; se quisermos limpar por tipo, precisamos prefixar as chaves com o tipo ou mudar o padrão do `clear_pattern`.

## Próximos passos sugeridos
1) Coletar URLs e seletores reais (lista de novos processos, número e título).
2) Ajustar `seirn_service.py` com:
   - Navegação correta até a lista.
   - Extração dos campos (número, título/assunto, timestamp se houver).
   - Endpoint para expor a lista recente e rotina de deduplicação.
3) Implementar deduplicação + armazenamento (Redis ou DB) e publicar notificação no backend NestJS.
4) Testar manualmente via `/docs` e automatizar um teste básico de scraping mockado, se possível.
