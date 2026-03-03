# Demo rápido de abertura de URL com Selenium

Este diretório foi reduzido para o essencial: um script simples que abre uma URL em um navegador Chrome controlado pelo Selenium.

## Preparar ambiente
```bash
cd webscraping-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Executar o script visual
```bash
python scrapy.py
```

O script pergunta a URL (padrão: https://www.google.com), abre o Chrome visível (HEADLESS desativado) e deixa você interagir com a página.

## Ajustar URL padrão
- Edite `scrapy.py` e altere o valor padrão da URL na entrada do usuário, se desejar.

## Próximos passos
Depois de validar a automação visual, podemos reintroduzir login e scraping específico do SEIRN passo a passo.

## Webhook do backend

Quando `ESCAVADOR_WEBHOOK_URL` e `ESCAVADOR_WEBHOOK_TOKEN` estiverem definidos, o script envia um webhook assinado para o backend.

- Header `X-Escavador-Timestamp`: unix timestamp em segundos
- Header `X-Escavador-Signature`: `HMAC-SHA256` do payload canônico
- O backend valida a assinatura e rejeita replay fora da janela configurada

Formato canônico assinado:

```text
v1
<timestamp>
<numero>
<titulo>
<link>
<usuarioId>
```
