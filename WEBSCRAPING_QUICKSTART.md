# 🚀 Quick Start - Webscraping SEIRN

## Início Rápido em 5 Passos

### 1️⃣ Instalar Dependências Python

```bash
cd webscraping-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2️⃣ Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar conforme necessário
nano .env
```

Configurações principais:
```env
SEIRN_BASE_URL=https://seirn.itep.rn.gov.br  # URL do SEIRN
HEADLESS=true                                 # false para ver o browser
LOG_LEVEL=INFO                                # DEBUG para mais detalhes
```

### 3️⃣ Iniciar Serviço Python

```bash
# Ativar ambiente virtual
source venv/bin/activate

# Iniciar servidor
uvicorn app.main:app --reload --port 8001
```

Acesse: http://localhost:8001/docs

### 4️⃣ Adicionar ao NestJS

No arquivo `src/app.module.ts`:

```typescript
import { WebscrapingModule } from './modules/webscraping/webscraping.module';

@Module({
  imports: [
    // ... outros módulos
    WebscrapingModule,
  ],
})
export class AppModule {}
```

Adicione ao `.env` do NestJS:

```env
WEBSCRAPING_SERVICE_URL=http://localhost:8001
WEBSCRAPING_TIMEOUT=30000
WEBSCRAPING_RETRIES=3
```

### 5️⃣ Adaptar Seletores SEIRN

**IMPORTANTE**: Você precisa inspecionar o HTML real do SEIRN e atualizar os seletores!

1. Acesse o SEIRN no navegador
2. Inspecione a página (F12)
3. Identifique os seletores CSS dos elementos
4. Atualize em `webscraping-service/app/seirn_service.py`

Exemplo:

```python
# ANTES (exemplo genérico)
"status": self.soup_parser.extract_text(soup, ".processo-status"),

# DEPOIS (conforme HTML real do SEIRN)
"status": self.soup_parser.extract_text(soup, "#divStatus span.valor-campo"),
```

## ✅ Testar Instalação

```bash
# 1. Testar serviço Python
./webscraping-service/test-webscraping.sh

# 2. Testar via NestJS (com token válido)
curl -X GET "http://localhost:3000/api/webscraping/seirn/health" \
     -H "Authorization: Bearer SEU_TOKEN_JWT"
```

## 📖 Próximos Passos

1. **Inspecionar SEIRN**: Analise a estrutura HTML real
2. **Atualizar Seletores**: Modifique `seirn_service.py`
3. **Testar Busca Real**: Use números válidos de processos/ocorrências
4. **Ajustar Timeout**: Configure conforme velocidade do SEIRN
5. **Implementar Autenticação**: Se SEIRN requer login

## 🔧 Comandos Úteis

```bash
# Ver logs do Python
tail -f webscraping-service/logs/app.log

# Limpar cache
curl -X DELETE "http://localhost:8001/api/v1/cache"

# Status do cache
curl "http://localhost:8001/api/v1/cache/status"

# Buscar processo (exemplo)
curl "http://localhost:8001/api/v1/processo/12345%2F2024"
```

## 🐳 Docker (Alternativa)

```bash
# Build
docker build -t seirn-scraper ./webscraping-service

# Run
docker run -d -p 8001:8001 \
  --name seirn-scraper \
  -e HEADLESS=true \
  seirn-scraper

# Logs
docker logs -f seirn-scraper
```

## ❓ Troubleshooting

### Erro: Chrome driver não encontrado
```bash
# Instalar Chrome/Chromium
sudo apt-get install chromium-browser chromium-chromedriver
```

### Erro: Timeout ao buscar
- Aumente `TIMEOUT` no `.env`
- Verifique conectividade com SEIRN
- Desative `HEADLESS` para ver o que está acontecendo

### Erro: Elemento não encontrado
- Inspecione o HTML do SEIRN
- Atualize seletores CSS no código
- Verifique se página carregou completamente

## 📞 Suporte

Documentação completa: `webscraping-service/README.md`
