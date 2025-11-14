# Módulo de Webscraping SEIRN

## 📋 Visão Geral

Módulo de webscraping integrado para extrair informações do SEIRN (Sistema Eletrônico de Informações da RN) usando Python + Selenium/BeautifulSoup como microserviço, integrado ao sistema NestJS principal.

## 🏗️ Arquitetura

```
┌─────────────────┐         HTTP/REST        ┌──────────────────────┐
│   NestJS API    │ ◄─────────────────────► │  Python FastAPI      │
│   (Backend)     │                          │  (Webscraping)       │
└─────────────────┘                          └──────────────────────┘
        │                                              │
        │                                              │
        ▼                                              ▼
┌─────────────────┐                          ┌──────────────────────┐
│   PostgreSQL    │                          │   Redis Cache        │
└─────────────────┘                          └──────────────────────┘
```

### Componentes

1. **Microserviço Python** (`webscraping-service/`)
   - FastAPI para API REST
   - Selenium para navegação web dinâmica
   - BeautifulSoup para parsing HTML
   - Redis para cache de resultados

2. **Módulo NestJS** (`src/modules/webscraping/`)
   - Controller para endpoints REST
   - Service para comunicação com microserviço
   - DTOs para validação de dados
   - Interfaces TypeScript

## 🚀 Instalação

### 1. Serviço Python

```bash
cd webscraping-service

# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env conforme necessário
```

### 2. Variáveis de Ambiente

Adicionar ao `.env` principal do NestJS:

```env
# Webscraping Service
WEBSCRAPING_SERVICE_URL=http://localhost:8001
WEBSCRAPING_TIMEOUT=30000
WEBSCRAPING_RETRIES=3
```

### 3. Docker (Opcional)

```bash
# Build da imagem
docker build -t seirn-webscraping ./webscraping-service

# Executar container
docker run -d -p 8001:8001 \
  --name seirn-scraper \
  -e REDIS_HOST=redis \
  -e SEIRN_BASE_URL=https://seirn.itep.rn.gov.br \
  seirn-webscraping
```

## 📖 Uso

### 1. Iniciar Serviço Python

```bash
cd webscraping-service
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

Acesse a documentação interativa: `http://localhost:8001/docs`

### 2. Usar via NestJS API

#### Buscar Processo

```bash
curl -X GET "http://localhost:3000/api/webscraping/seirn/processo/12345/2024" \
  -H "Authorization: Bearer {token}"
```

#### Buscar Ocorrência

```bash
curl -X GET "http://localhost:3000/api/webscraping/seirn/ocorrencia/987654" \
  -H "Authorization: Bearer {token}"
```

#### Busca Genérica

```bash
curl -X POST "http://localhost:3000/api/webscraping/seirn/buscar" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo_busca": "processo",
    "numero": "12345/2024",
    "use_cache": true
  }'
```

### 3. Uso Programático no NestJS

```typescript
import { WebscrapingService } from './modules/webscraping/services/webscraping.service';

@Injectable()
export class SeuService {
  constructor(
    private readonly webscrapingService: WebscrapingService
  ) {}

  async exemplo() {
    // Buscar processo
    const processo = await this.webscrapingService.buscarProcesso('12345/2024');
    console.log(processo.data);

    // Buscar ocorrência
    const ocorrencia = await this.webscrapingService.buscarOcorrencia('987654');
    console.log(ocorrencia.data);
  }
}
```

## ⚙️ Configuração

### Seletores CSS (IMPORTANTE)

Os seletores no arquivo `seirn_service.py` são **exemplos genéricos**. Você precisa adaptá-los conforme a estrutura real do SEIRN:

```python
# Exemplo atual (ADAPTAR)
"status": self.soup_parser.extract_text(soup, ".processo-status"),

# Inspecionar o HTML do SEIRN e atualizar com os seletores corretos
"status": self.soup_parser.extract_text(soup, "div#statusProcesso span.valor"),
```

### Estratégias de Scraping

1. **Identificar tipo de página**:
   - Estática → BeautifulSoup apenas
   - Dinâmica (JavaScript) → Selenium

2. **Customizar navegação**:
   - Edite `buscar_processo()` e `buscar_ocorrencia()`
   - Adicione novos métodos conforme necessário

## 🧪 Testes

```bash
# Testar serviço Python
cd webscraping-service
pytest tests/

# Testar integração NestJS
npm run test -- webscraping
```

## 📊 Cache

O sistema usa Redis para cache automático:

- **TTL padrão**: 3600 segundos (1 hora)
- **Chaves**: `seirn:{md5(tipo:numero)}`

Limpar cache:

```bash
curl -X DELETE "http://localhost:3000/api/webscraping/seirn/cache?tipo=processo" \
  -H "Authorization: Bearer {token}"
```

## 🔒 Segurança

- Todas as rotas requerem autenticação JWT
- Headers personalizados com User-Agent aleatório
- Rate limiting automático
- Logs detalhados de todas as operações

## 🐛 Debug

### Logs Python

```bash
# Ver logs em tempo real
tail -f webscraping-service/logs/app.log
```

### Screenshots

Para debug visual:

```python
# No seirn_service.py
scraper.take_screenshot('/tmp/debug.png')
```

### Modo Headless OFF

No `.env` do Python:

```env
HEADLESS=false
```

## 📝 Próximos Passos

1. **Analisar HTML do SEIRN real**
   - Inspecionar estrutura das páginas
   - Atualizar seletores CSS

2. **Implementar autenticação** (se necessário)
   - Login automático
   - Gerenciamento de sessão

3. **Adicionar mais tipos de busca**
   - Documentos
   - Certidões
   - Outros dados

4. **Melhorar tratamento de erros**
   - CAPTCHA detection
   - Fallback strategies

## 📚 Referências

- [Selenium Documentation](https://selenium-python.readthedocs.io/)
- [BeautifulSoup Documentation](https://beautiful-soup-4.readthedocs.io/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [NestJS Documentation](https://docs.nestjs.com/)

## 🆘 Suporte

Para problemas ou dúvidas:

1. Verifique logs: `webscraping-service/logs/`
2. Teste health check: `GET /health`
3. Verifique conectividade com SEIRN
4. Valide credenciais e permissões
