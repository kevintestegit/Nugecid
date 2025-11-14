#!/bin/bash

# Script de teste do serviço de webscraping
# Uso: ./test-webscraping.sh

set -e

BASE_URL="${WEBSCRAPING_URL:-http://localhost:8001}"
API_URL="${API_URL:-http://localhost:3000}"

echo "🧪 Testando Serviço de Webscraping SEIRN"
echo "=========================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função de teste
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $name... "
    
    response=$(curl -s -w "\n%{http_code}" "$url")
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $status_code)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $status_code)"
        echo "$body"
        return 1
    fi
}

# 1. Health Check do Python Service
echo "1️⃣  Python Service Health Check"
test_endpoint "Health" "$BASE_URL/health"
echo ""

# 2. Cache Status
echo "2️⃣  Cache Status"
test_endpoint "Cache Status" "$BASE_URL/api/v1/cache/status"
echo ""

# 3. Documentação
echo "3️⃣  API Documentation"
test_endpoint "Swagger UI" "$BASE_URL/docs"
echo ""

# 4. Teste de Busca (se quiser testar com número real)
echo "4️⃣  Teste de Busca (exemplo)"
echo -e "${YELLOW}⚠️  Ajuste o número do processo para testar busca real${NC}"
# test_endpoint "Buscar Processo" "$BASE_URL/api/v1/processo/12345%2F2024" 404
echo "   (Pulando teste de busca - ajuste o script para testar)"
echo ""

echo "=========================================="
echo "✅ Testes básicos concluídos!"
echo ""
echo "📚 Documentação interativa disponível em:"
echo "   $BASE_URL/docs"
echo ""
echo "💡 Para testar a integração completa com NestJS:"
echo "   curl -X GET \"$API_URL/api/webscraping/seirn/health\" \\"
echo "        -H \"Authorization: Bearer {seu_token}\""
