#!/bin/bash

# Script de teste para upload de anexo ao processo

# Criar um arquivo de teste
echo "Teste de anexo ao processo" > /tmp/teste_anexo.txt

# Fazer upload com anexarAoProcesso=true
echo "Testando upload com anexarAoProcesso=true..."
curl -X POST http://localhost:8080/api/nugecid/628/anexos/upload \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -F "file=@/tmp/teste_anexo.txt" \
  -F "descricao=Teste de anexo ao processo via curl" \
  -F "tipoAnexo=desarquivamento" \
  -F "anexarAoProcesso=true" \
  -v

echo ""
echo "Verificando no banco de dados..."
docker exec sgc-itep-nestjs-db-1 psql -U postgres -d sgc_itep -c "SELECT id, desarquivamento_id, numero_processo, nome_original FROM desarquivamento_anexos ORDER BY id DESC LIMIT 1;"
