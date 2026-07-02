# Escavador SEIRN – integração por webhook

O backend não inicia nem controla scraper local. O coletor externo deve detectar
novos processos no SEIRN e chamar o webhook assinado:

```http
POST /api/escavador-seirn/hook
X-Escavador-Timestamp: <unix-seconds>
X-Escavador-Signature: <hmac-sha256>
Content-Type: application/json
```

Corpo:

```json
{
  "numero": "0800123-12.2026.8.20.5001",
  "titulo": "Novo processo SEI-RN",
  "link": "https://seirn.itep.rn.gov.br/processo/123",
  "usuarioId": 11
}
```

A assinatura usa `ESCAVADOR_WEBHOOK_TOKEN` e o payload canônico:

```text
v1
<timestamp>
<numero>
<titulo>
<link>
<usuarioId>
```

Se `usuarioId` não vier no corpo, configure `ESCAVADOR_NOTIFY_USER_ID`.
