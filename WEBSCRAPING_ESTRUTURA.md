# 🎯 Estrutura Completa do Módulo de Webscraping

## 📁 Estrutura de Arquivos Criada

```
SGC-ITEP-NESTJS/
│
├── webscraping-service/              # Microserviço Python
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI app
│   │   ├── config.py                 # Configurações
│   │   ├── models.py                 # Modelos Pydantic
│   │   ├── scraper.py                # Classes Selenium/BS4
│   │   ├── cache.py                  # Serviço Redis
│   │   ├── seirn_service.py          # Lógica de scraping SEIRN
│   │   └── exemplo_customizacao.py   # Exemplos de uso
│   │
│   ├── tests/                        # Testes unitários
│   ├── config/                       # Configs adicionais
│   ├── requirements.txt              # Dependências Python
│   ├── Dockerfile                    # Docker para Python service
│   ├── .env.example                  # Variáveis de ambiente
│   ├── .gitignore
│   ├── test-webscraping.sh           # Script de teste
│   └── README.md                     # Documentação completa
│
├── src/modules/webscraping/          # Módulo NestJS
│   ├── dto/
│   │   └── seirn.dto.ts              # DTOs de validação
│   ├── interfaces/
│   │   └── seirn.interface.ts        # Interfaces TypeScript
│   ├── services/
│   │   └── webscraping.service.ts    # Service HTTP client
│   ├── webscraping.controller.ts     # Controller REST
│   └── webscraping.module.ts         # Module definition
│
├── WEBSCRAPING_QUICKSTART.md         # Guia de início rápido
└── WEBSCRAPING_ESTRUTURA.md          # Este arquivo
```

## 🔄 Fluxo de Dados

```
┌─────────────┐
│   Cliente   │
│  (Frontend) │
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────────────────────────┐
│      NestJS API                 │
│  ┌──────────────────────────┐   │
│  │ WebscrapingController    │   │
│  └───────────┬──────────────┘   │
│              │                  │
│              ▼                  │
│  ┌──────────────────────────┐   │
│  │ WebscrapingService       │   │
│  │ (HTTP Client)            │   │
│  └───────────┬──────────────┘   │
└──────────────┼──────────────────┘
               │ HTTP Request
               ▼
┌──────────────────────────────────┐
│   Python FastAPI Service         │
│  ┌───────────────────────────┐   │
│  │ FastAPI Endpoints         │   │
│  └──────────┬────────────────┘   │
│             │                    │
│             ▼                    │
│  ┌───────────────────────────┐   │
│  │ SeirnService              │   │
│  │ - buscar_processo()       │   │
│  │ - buscar_ocorrencia()     │   │
│  └──────────┬────────────────┘   │
│             │                    │
│             ▼                    │
│  ┌───────────────────────────┐   │
│  │ SeleniumScraper           │   │
│  │ - navegação               │   │
│  │ - interação               │   │
│  └──────────┬────────────────┘   │
│             │                    │
│             ▼                    │
│  ┌───────────────────────────┐   │
│  │ BeautifulSoupScraper      │   │
│  │ - parsing HTML            │   │
│  │ - extração dados          │   │
│  └──────────┬────────────────┘   │
│             │                    │
│             ▼                    │
│  ┌───────────────────────────┐   │
│  │ CacheService (Redis)      │   │
│  │ - armazenamento           │   │
│  │ - recuperação             │   │
│  └───────────────────────────┘   │
└──────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│         SEIRN Website            │
│    (scraping target)             │
└──────────────────────────────────┘
```

## 🛠️ Componentes Principais

### 1. Python FastAPI Service

**Responsabilidades:**
- Gerenciar navegação web com Selenium
- Fazer parsing de HTML com BeautifulSoup
- Cache de resultados com Redis
- Expor API REST para consumo

**Principais arquivos:**
- `main.py`: Endpoints FastAPI
- `seirn_service.py`: Lógica de negócio
- `scraper.py`: Wrappers Selenium/BS4
- `cache.py`: Gerenciamento de cache

### 2. NestJS Module

**Responsabilidades:**
- Integrar com sistema principal
- Validar requisições
- Autenticar usuários
- Comunicar com microserviço Python

**Principais arquivos:**
- `webscraping.controller.ts`: Endpoints REST
- `webscraping.service.ts`: HTTP client
- `seirn.dto.ts`: Validação de dados

## 📊 Endpoints Disponíveis

### Python Service (porta 8001)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Health check |
| GET | `/api/v1/processo/{numero}` | Buscar processo |
| GET | `/api/v1/ocorrencia/{numero}` | Buscar ocorrência |
| POST | `/api/v1/search` | Busca genérica |
| DELETE | `/api/v1/cache` | Limpar cache |
| GET | `/api/v1/cache/status` | Status do cache |
| GET | `/docs` | Swagger UI |

### NestJS API (porta 3000)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/webscraping/seirn/processo/:numero` | Buscar processo |
| GET | `/api/webscraping/seirn/ocorrencia/:numero` | Buscar ocorrência |
| POST | `/api/webscraping/seirn/buscar` | Busca genérica |
| DELETE | `/api/webscraping/seirn/cache` | Limpar cache |
| GET | `/api/webscraping/seirn/cache/status` | Status cache |
| GET | `/api/webscraping/seirn/health` | Health check |

## 🔐 Segurança

1. **Autenticação**: Todas as rotas NestJS requerem JWT
2. **Rate Limiting**: Configurável via ThrottlerModule
3. **Headers**: User-Agent rotativo para evitar bloqueio
4. **Timeout**: Configurable para evitar requests infinitos
5. **Retry Logic**: Até 3 tentativas automáticas

## 💾 Cache Strategy

```
Cache Key Format: seirn:{md5(tipo:numero)}
TTL: 3600 segundos (1 hora) - configurável
Storage: Redis
```

**Exemplo:**
```
Key: seirn:abc123def456...
Value: {
  "success": true,
  "data": {...},
  "timestamp": "2024-11-14T14:00:00Z"
}
```

## 🔍 Customização Necessária

### ⚠️ IMPORTANTE: Ajustes Obrigatórios

1. **URL do SEIRN**
   - Configurar `SEIRN_BASE_URL` no `.env`

2. **Seletores CSS**
   - Inspecionar HTML real do SEIRN
   - Atualizar em `seirn_service.py`

3. **Fluxo de Navegação**
   - Adaptar passos de busca
   - Tratar formulários específicos

4. **Autenticação** (se necessário)
   - Implementar login automático
   - Gerenciar sessão

## 📈 Melhorias Futuras

- [ ] Fila de processamento (Celery/Bull)
- [ ] Suporte a múltiplos navegadores
- [ ] Detecção automática de CAPTCHA
- [ ] Métricas e monitoramento
- [ ] Webhooks para resultados
- [ ] Scraping paralelo
- [ ] Persistência de histórico

## 🧪 Como Testar

1. **Teste básico Python:**
```bash
cd webscraping-service
./test-webscraping.sh
```

2. **Teste integração NestJS:**
```bash
npm run test -- webscraping
```

3. **Teste manual:**
```bash
# Python
curl http://localhost:8001/health

# NestJS (com token)
curl http://localhost:3000/api/webscraping/seirn/health \
  -H "Authorization: Bearer {token}"
```

## 📝 Variáveis de Ambiente

### Python (.env)
```env
SEIRN_BASE_URL=https://seirn.itep.rn.gov.br
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_TTL=3600
LOG_LEVEL=INFO
MAX_RETRIES=3
TIMEOUT=30
HEADLESS=true
API_PORT=8001
```

### NestJS (.env)
```env
WEBSCRAPING_SERVICE_URL=http://localhost:8001
WEBSCRAPING_TIMEOUT=30000
WEBSCRAPING_RETRIES=3
```

## 🎓 Recursos de Aprendizado

- [Selenium Python](https://selenium-python.readthedocs.io/)
- [BeautifulSoup](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [CSS Selectors](https://www.w3schools.com/cssref/css_selectors.asp)
- [XPath Tutorial](https://www.w3schools.com/xml/xpath_intro.asp)

## 💡 Dicas Profissionais

1. **Sempre inspecione o HTML antes de codificar**
2. **Use mode headless=false para debug**
3. **Implemente tratamento de erros robusto**
4. **Cache agressivamente para poupar recursos**
5. **Monitore performance e ajuste timeouts**
6. **Respeite robots.txt do site**
7. **Implemente backoff exponencial**
8. **Use logs estruturados**

---

**Status**: ✅ Módulo estruturado e pronto para customização
**Próximo passo**: Adaptar seletores conforme SEIRN real
