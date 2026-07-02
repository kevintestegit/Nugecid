# Guia de Integração — Hermes × SGC-ITEP API

Este guia documenta como o Hermes (bot Telegram) pode interagir com a API do SGC-ITEP para listar, consultar e imprimir solicitações de desarquivamento.

---

## 1. Autenticação

### Login (obter token)

O endpoint v2 retorna o token no body (ideal para bots):

```bash
curl -s -X POST http://127.0.0.1:3000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario": "HERMES", "senha": "SUA_SENHA"}'
```

Resposta:
```json
{
  "user": { "userId": 1, "usuario": "HERMES", "role": "admin" },
  "accessToken": "eyJhbG...",
  "expiresIn": "50m"
}
```

Guarde o `accessToken` para usar em todas as requisições seguintes.

### Usar o token

Envie como header Bearer em todas as requisições:

```
Authorization: Bearer eyJhbG...
```

---

## 2. Listar solicitações por status

### Listar todas as solicitações com status DESARQUIVADO

```bash
curl -s -X GET "http://127.0.0.1:3000/api/nugecid?status=DESARQUIVADO&limit=50" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

### Status válidos

| Status | Descrição |
|--------|-----------|
| `SOLICITADO` | Solicitação criada, aguardando processamento |
| `DESARQUIVADO` | Documento desarquivado, pronto para retirada |
| `REARQUIVAMENTO_SOLICITADO` | Rearquivamento solicitado |
| `RETIRADO_PELO_SETOR` | Retirado pelo setor solicitante |
| `FINALIZADO` | Processo finalizado |
| `NAO_COLETADO` | Não coletado |
| `NAO_LOCALIZADO` | Documento não localizado |

### Filtrar por múltiplos status

```bash
curl -s -X GET "http://127.0.0.1:3000/api/nugecid?status=DESARQUIVADO&status=SOLICITADO&limit=50" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

### Buscar por nome

```bash
curl -s -X GET "http://127.0.0.1:3000/api/nugecid?search=MAGNO&status=DESARQUIVADO" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

---

## 3. Listar candidatos à impressão (com URLs de PDF)

Este endpoint retorna apenas solicitações elegíveis para impressão do termo de entrega, já com as URLs dos PDFs:

```bash
curl -s -X GET "http://127.0.0.1:3000/api/nugecid/impressao/candidatos?status=DESARQUIVADO" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

Resposta:
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "numeroProcesso": "03910025.000938",
      "nomeCompleto": "MAGNO ALVES MOURA",
      "status": "DESARQUIVADO",
      "dataDesarquivamentoSAG": "2026-05-20T00:00:00.000Z",
      "pdfUrl": "/api/nugecid/123/termo-pdf",
      "previewUrl": "/api/nugecid/123/termo-preview",
      "detailUrl": "/api/nugecid/123"
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 5, "totalPages": 1 }
}
```

---

## 4. Gerar e baixar o PDF do termo de entrega

### Gerar PDF (retorna binário)

```bash
curl -s -X GET "http://127.0.0.1:3000/api/nugecid/123/termo-pdf" \
  -H "Authorization: Bearer $TOKEN" \
  -o termo_123.pdf
```

### Gerar DOCX

```bash
curl -s -X GET "http://127.0.0.1:3000/api/nugecid/123/termo-docx" \
  -H "Authorization: Bearer $TOKEN" \
  -o termo_123.docx
```

### Preview HTML (redireciona para o frontend)

```bash
curl -s -X GET "http://127.0.0.1:3000/api/nugecid/123/termo-preview" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 5. Consultar detalhes de uma solicitação

```bash
curl -s -X GET "http://127.0.0.1:3000/api/nugecid/123" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json"
```

---

## 6. Fluxo completo recomendado para o Hermes

### Passo 1: Login

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:3000/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario": "HERMES", "senha": "SENHA"}' | jq -r '.accessToken')
```

### Passo 2: Listar candidatos à impressão com status DESARQUIVADO

```bash
CANDIDATOS=$(curl -s -X GET "http://127.0.0.1:3000/api/nugecid/impressao/candidatos?status=DESARQUIVADO" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json")
```

### Passo 3: Extrair o primeiro candidato

```bash
ID=$(echo $CANDIDATOS | jq -r '.data[0].id')
NOME=$(echo $CANDIDATOS | jq -r '.data[0].nomeCompleto')
PDF_URL=$(echo $CANDIDATOS | jq -r '.data[0].pdfUrl')
```

### Passo 4: Baixar o PDF

```bash
curl -s -X GET "http://127.0.0.1:3000$PDF_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -o "termo_${ID}.pdf"
```

### Passo 5: Enviar via Telegram

Use a API do Telegram Bot para enviar o arquivo `termo_${ID}.pdf` como documento.

---

## 7. Exemplo completo em Python (para o Hermes)

```python
import requests

BASE_URL = "http://127.0.0.1:3000"

# Login
login_resp = requests.post(f"{BASE_URL}/v2/auth/login", json={
    "usuario": "HERMES",
    "senha": "SUA_SENHA"
})
token = login_resp.json()["accessToken"]
headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}

# Listar candidatos à impressão (desarquivados)
resp = requests.get(f"{BASE_URL}/api/nugecid/impressao/candidatos", 
                    params={"status": "DESARQUIVADO"}, headers=headers)
candidatos = resp.json()["data"]

if not candidatos:
    print("Nenhuma solicitação desarquivada encontrada.")
else:
    for c in candidatos:
        print(f"ID: {c['id']} | {c['nomeCompleto']} | Status: {c['status']}")
    
    # Baixar PDF do primeiro
    primeiro = candidatos[0]
    pdf_resp = requests.get(f"{BASE_URL}{primeiro['pdfUrl']}", 
                           headers={"Authorization": f"Bearer {token}"})
    
    with open(f"termo_{primeiro['id']}.pdf", "wb") as f:
        f.write(pdf_resp.content)
    
    print(f"PDF salvo: termo_{primeiro['id']}.pdf")
```

---

## 8. Notas importantes

- **Rate limiting**: o endpoint de login aceita 20 req/15min. Demais endpoints aceitam 1000 req/15min.
- **CORS**: o Hermes roda no mesmo servidor, então CORS não é problema. Se remoto, configure `CORS_ORIGIN`.
- **Swagger**: documentação interativa disponível em `http://127.0.0.1:3000/api/docs` (apenas em dev/test).
- **Autenticação via cookie**: o endpoint v1 (`POST /auth/login`) usa httpOnly cookies — não funcional para bots. Use sempre v2.
- **PDF generation**: usa Playwright (headless Chromium). Pode demorar ~2-5s na primeira chamada (cold start).
