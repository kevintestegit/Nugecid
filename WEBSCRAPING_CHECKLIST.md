# 📋 Checklist de Implementação - Módulo Webscraping SEIRN

## ✅ Fase 1: Setup Inicial (CONCLUÍDO)

- [x] Estrutura de diretórios criada
- [x] Arquivos Python básicos criados
- [x] Módulo NestJS estruturado
- [x] Documentação gerada
- [x] Scripts de teste criados
- [x] Integração com app.module.ts

## 🔧 Fase 2: Configuração (A FAZER)

### Python Service
- [ ] Instalar dependências Python
  ```bash
  cd webscraping-service
  python3 -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  ```

- [ ] Configurar variáveis de ambiente
  ```bash
  cp .env.example .env
  nano .env
  ```

- [ ] Testar instalação
  ```bash
  python -c "import selenium; print('Selenium OK')"
  python -c "import bs4; print('BeautifulSoup OK')"
  python -c "import fastapi; print('FastAPI OK')"
  ```

### NestJS
- [ ] Adicionar variáveis ao .env principal
  ```env
  WEBSCRAPING_SERVICE_URL=http://localhost:8001
  WEBSCRAPING_TIMEOUT=30000
  WEBSCRAPING_RETRIES=3
  ```

- [ ] Verificar se Redis está rodando
  ```bash
  docker ps | grep redis
  # ou
  redis-cli ping
  ```

## 🎯 Fase 3: Customização SEIRN (CRÍTICO)

### Análise do SEIRN
- [ ] Acessar SEIRN no navegador
- [ ] Testar busca manual de processo
- [ ] Testar busca manual de ocorrência
- [ ] Identificar se requer login/autenticação
- [ ] Verificar se há CAPTCHA
- [ ] Testar com dados reais

### Inspeção HTML
- [ ] Abrir DevTools (F12) no SEIRN
- [ ] Inspecionar formulário de busca
  - [ ] Identificar input de número
  - [ ] Identificar botão de submit
  - [ ] Anotar IDs e classes

- [ ] Inspecionar página de resultados
  - [ ] Identificar container de resultado
  - [ ] Mapear campos de dados
  - [ ] Anotar seletores CSS

### Atualizar Código
- [ ] Editar `webscraping-service/app/seirn_service.py`
- [ ] Atualizar URL base no `.env`
- [ ] Ajustar seletores CSS
- [ ] Implementar fluxo de navegação correto
- [ ] Adicionar tratamento de erros específicos

### Checklist de Seletores
```python
# Verificar e atualizar cada seletor:
- [ ] Input de número do processo: By.ID, "???"
- [ ] Botão de busca: By.ID, "???"
- [ ] Container de resultado: By.CLASS_NAME, "???"
- [ ] Número do processo: ".???"
- [ ] Status: ".???"
- [ ] Tipo: ".???"
- [ ] Data de abertura: ".???"
- [ ] Interessado: ".???"
- [ ] Assunto: ".???"
- [ ] Localização: ".???"
```

## 🧪 Fase 4: Testes (A FAZER)

### Testes Unitários Python
- [ ] Criar testes para scraper
- [ ] Criar testes para cache
- [ ] Criar testes para SEIRN service
- [ ] Executar pytest
  ```bash
  cd webscraping-service
  pytest tests/ -v
  ```

### Testes de Integração
- [ ] Iniciar serviço Python
  ```bash
  uvicorn app.main:app --reload
  ```

- [ ] Executar script de teste
  ```bash
  ./test-webscraping.sh
  ```

- [ ] Testar manualmente via Swagger
  - Abrir: http://localhost:8001/docs
  - Testar cada endpoint

### Testes com NestJS
- [ ] Iniciar ambos os serviços
- [ ] Testar endpoint de health
- [ ] Testar busca de processo
- [ ] Testar busca de ocorrência
- [ ] Verificar cache funcionando
- [ ] Testar com token JWT válido

### Casos de Teste
- [ ] Busca com número válido
- [ ] Busca com número inexistente
- [ ] Busca com formato inválido
- [ ] Timeout de requisição
- [ ] Falha de rede
- [ ] Cache hit/miss
- [ ] Múltiplas buscas simultâneas

## 🚀 Fase 5: Deploy (FUTURO)

### Preparação
- [ ] Revisar variáveis de ambiente
- [ ] Configurar logs persistentes
- [ ] Ajustar timeouts para produção
- [ ] Configurar HEADLESS=true
- [ ] Revisar configurações de segurança

### Docker
- [ ] Build da imagem
  ```bash
  docker build -t seirn-webscraping ./webscraping-service
  ```

- [ ] Testar container
  ```bash
  docker run -p 8001:8001 seirn-webscraping
  ```

- [ ] Atualizar docker-compose.yml principal
- [ ] Testar orquestração completa

### Monitoramento
- [ ] Configurar alertas de erro
- [ ] Implementar métricas
- [ ] Configurar backup de logs
- [ ] Criar dashboard de monitoramento

## 📊 Fase 6: Otimização (FUTURO)

### Performance
- [ ] Analisar tempo de resposta
- [ ] Otimizar seletores CSS
- [ ] Ajustar TTL do cache
- [ ] Implementar rate limiting
- [ ] Considerar pool de browsers

### Melhorias
- [ ] Adicionar mais tipos de busca
- [ ] Implementar webhooks
- [ ] Criar fila de processamento
- [ ] Adicionar scraping paralelo
- [ ] Persistir histórico de buscas

## 📝 Checklist de Documentação

- [x] README.md principal
- [x] Quick Start Guide
- [x] Documentação de arquitetura
- [x] Exemplos de uso
- [ ] Documentação de APIs
- [ ] Guia de troubleshooting
- [ ] Changelog
- [ ] Contributing guide

## 🔍 Troubleshooting Comum

### Problema: Chrome driver não encontrado
```bash
# Solução:
sudo apt-get install chromium-browser chromium-chromedriver
# ou usar webdriver-manager (já incluído)
```

### Problema: Timeout em buscas
```bash
# Aumentar timeout no .env:
TIMEOUT=60
WEBSCRAPING_TIMEOUT=60000
```

### Problema: Elementos não encontrados
```bash
# Debug:
1. Desativar headless: HEADLESS=false
2. Adicionar screenshots: scraper.take_screenshot('debug.png')
3. Verificar logs: tail -f webscraping-service/logs/app.log
```

### Problema: Cache não funciona
```bash
# Verificar Redis:
redis-cli ping
# Verificar logs do Python service
# Verificar variáveis REDIS_HOST e REDIS_PORT
```

### Problema: 401 Unauthorized no NestJS
```bash
# Verificar token JWT
# Testar endpoint público primeiro (/health)
# Revisar guards no controller
```

## ✅ Próximos Passos Imediatos

1. **Instalar dependências Python** ⭐ URGENTE
2. **Analisar HTML do SEIRN** ⭐ URGENTE
3. **Atualizar seletores CSS** ⭐ URGENTE
4. Testar com dados reais
5. Ajustar timeouts e configurações
6. Implementar testes
7. Documentar casos específicos

## 📞 Suporte

- Documentação: `webscraping-service/README.md`
- Exemplos: `src/modules/webscraping/exemplos-uso.service.ts`
- Customização: `webscraping-service/app/exemplo_customizacao.py`

---

**Última atualização**: 14/11/2024
**Status**: ✅ Estrutura criada - Aguardando customização
