#!/bin/bash
# Script para verificar status do sistema SGC-ITEP

echo "======================================"
echo "  SGC-ITEP - Verificação do Sistema"
echo "======================================"
echo ""

echo "📦 Status dos Containers:"
/usr/bin/docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "🔗 Testando Conectividade:"
echo -n "  Backend (8080): "
if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ FALHOU"
fi

echo -n "  Frontend (3001): "
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ FALHOU"
fi

echo -n "  Database (5432): "
if PGPASSWORD=@Sanfona1 psql -h localhost -U postgres -d sgc_itep -c "SELECT 1" > /dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ FALHOU (psql não instalado ou DB offline)"
fi

echo -n "  Adminer (8081): "
if curl -s http://localhost:8081 > /dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ FALHOU"
fi

echo ""
echo "🌐 URLs de Acesso:"
echo "  Frontend:  http://localhost:3001"
echo "  Backend:   http://localhost:8080/api"
echo "  Adminer:   http://localhost:8081"
echo ""
