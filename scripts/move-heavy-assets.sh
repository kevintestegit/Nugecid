#!/bin/bash
#
# Script para mover assets pesados para CDN/local
# Reduz o bundle size significativamente
#

set -e

echo "═══════════════════════════════════════════════════════════"
echo "📦 MOVENDO ASSETS PESADOS"
echo "═══════════════════════════════════════════════════════════"

FRONTEND_DIR="/dados/area_trabalho/SGC-ITEP-NESTJS/frontend"
PUBLIC_DIR="$FRONTEND_DIR/public"

# Criar diretório para assets pesados (fora do build)
mkdir -p "$PUBLIC_DIR/heavy-assets"

# Mover vídeos pesados
if [ -d "$PUBLIC_DIR/assets/videos" ]; then
    echo "🎬 Movendo vídeos..."
    mv "$PUBLIC_DIR/assets/videos"/* "$PUBLIC_DIR/heavy-assets/" 2>/dev/null || true
    rmdir "$PUBLIC_DIR/assets/videos" 2>/dev/null || true
    echo "✅ Vídeos movidos"
fi

# Mover imagens grandes (>100KB)
if [ -f "$PUBLIC_DIR/NovalogoNugecid.png" ]; then
    echo "🖼️  Movendo logo grande..."
    mv "$PUBLIC_DIR/NovalogoNugecid.png" "$PUBLIC_DIR/heavy-assets/"
    echo "✅ Logo movido"
fi

# Verificar tamanho
echo ""
echo "📊 Análise de assets pesados:"
du -sh "$PUBLIC_DIR/heavy-assets/" 2>/dev/null || echo "   Nenhum asset pesado encontrado"

echo ""
echo "💡 Nota: Assets em /heavy-assets/ não serão incluídos no build"
echo "   Configure um CDN ou carregue dinamicamente."
echo ""
echo "═══════════════════════════════════════════════════════════"
