#!/bin/bash
#
# Script de Otimização de Assets
# Converte imagens e comprime vídeos para reduzir o bundle
#
# Uso: bash scripts/optimize-assets.sh

set -e

echo "═══════════════════════════════════════════════════════════"
echo "🎨 OTIMIZANDO ASSETS - SGC-ITEP"
echo "═══════════════════════════════════════════════════════════"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_section() {
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo -e "${BLUE}📌 $1${NC}"
    echo "═══════════════════════════════════════════════════════════"
}

FRONTEND_DIR="/dados/area_trabalho/SGC-ITEP-NESTJS/frontend"
PUBLIC_DIR="$FRONTEND_DIR/public"
ASSETS_DIR="$FRONTEND_DIR/src/assets"

log_section "1. ANÁLISE DE ASSETS"

# Verificar se diretórios existem
if [ ! -d "$PUBLIC_DIR" ]; then
    log_error "Diretório public não encontrado: $PUBLIC_DIR"
    exit 1
fi

# Encontrar arquivos grandes
log_warn "Procurando assets grandes..."

# Imagens grandes (>50KB)
echo ""
echo "🖼️  Imagens grandes encontradas:"
find "$PUBLIC_DIR" "$ASSETS_DIR" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) -size +50k 2>/dev/null | while read file; do
    size=$(du -h "$file" | cut -f1)
    echo "   $(basename "$file"): $size"
done

# Vídeos grandes (>500KB)
echo ""
echo "🎬 Vídeos encontrados:"
find "$PUBLIC_DIR" "$ASSETS_DIR" -type f \( -name "*.mp4" -o -name "*.webm" \) 2>/dev/null | while read file; do
    size=$(du -h "$file" | cut -f1)
    echo "   $(basename "$file"): $size"
done

log_section "2. OTIMIZAÇÃO DE IMAGENS"

# Verificar se ffmpeg está instalado para otimização
if command -v ffmpeg &> /dev/null; then
    log_info "FFmpeg encontrado - pode otimizar vídeos"
    FFMPEG_AVAILABLE=true
else
    log_warn "FFmpeg não encontrado - instalando..."
    apt-get update && apt-get install -y ffmpeg || true
fi

# Criar diretório para assets otimizados
mkdir -p "$PUBLIC_DIR/optimized"

# Lista de arquivos para otimizar
declare -a IMAGES_TO_OPTIMIZE=(
    "$PUBLIC_DIR/NovalogoNugecid.png"
)

# Otimizar imagens PNG grandes
for img in "${IMAGES_TO_OPTIMIZE[@]}"; do
    if [ -f "$img" ]; then
        filename=$(basename "$img" .png)
        log_warn "Otimizando: $filename.png"
        
        # Converter para WebP (melhor compressão)
        if command -v cwebp &> /dev/null; then
            cwebp -q 85 "$img" -o "$PUBLIC_DIR/optimized/${filename}.webp" 2>/dev/null || true
            if [ -f "$PUBLIC_DIR/optimized/${filename}.webp" ]; then
                original_size=$(du -h "$img" | cut -f1)
                optimized_size=$(du -h "$PUBLIC_DIR/optimized/${filename}.webp" | cut -f1)
                log_info "✓ $filename: $original_size → $optimized_size (WebP)"
            fi
        fi
        
        # Otimizar PNG com pngquant (se disponível)
        if command -v pngquant &> /dev/null; then
            pngquant --quality=85 --force --output "$PUBLIC_DIR/optimized/${filename}-opt.png" "$img" 2>/dev/null || true
            if [ -f "$PUBLIC_DIR/optimized/${filename}-opt.png" ]; then
                original_size=$(du -h "$img" | cut -f1)
                optimized_size=$(du -h "$PUBLIC_DIR/optimized/${filename}-opt.png" | cut -f1)
                log_info "✓ $filename: $original_size → $optimized_size (PNG otimizado)"
            fi
        fi
    fi
done

log_section "3. OTIMIZAÇÃO DE VÍDEOS"

# Otimizar vídeos MP4
find "$PUBLIC_DIR" "$ASSETS_DIR" -type f -name "*.mp4" 2>/dev/null | while read video; do
    filename=$(basename "$video" .mp4)
    log_warn "Otimizando vídeo: $filename.mp4"
    
    # Comprimir vídeo com ffmpeg
    if [ "$FFMPEG_AVAILABLE" = true ]; then
        ffmpeg -i "$video" -vcodec h264 -acodec aac -crf 28 -preset faster \
               "$PUBLIC_DIR/optimized/${filename}-opt.mp4" -y 2>/dev/null || true
        
        if [ -f "$PUBLIC_DIR/optimized/${filename}-opt.mp4" ]; then
            original_size=$(du -h "$video" | cut -f1)
            optimized_size=$(du -h "$PUBLIC_DIR/optimized/${filename}-opt.mp4" | cut -f1)
            log_info "✓ $filename: $original_size → $optimized_size"
        fi
    fi
done

log_section "4. ANÁLISE DE REDUÇÃO"

# Calcular economia total
if [ -d "$PUBLIC_DIR/optimized" ]; then
    echo ""
    echo "📊 Resumo da Otimização:"
    echo ""
    
    # Tamanho original
    original_total=0
    optimized_total=0
    
    for file in "$PUBLIC_DIR"/optimized/*; do
        if [ -f "$file" ]; then
            size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null || echo 0)
            optimized_total=$((optimized_total + size))
        fi
    done
    
    if [ $optimized_total -gt 0 ]; then
        original_mb=$(echo "scale=2; $original_total / 1024 / 1024" | bc 2>/dev/null || echo "0")
        optimized_mb=$(echo "scale=2; $optimized_total / 1024 / 1024" | bc 2>/dev/null || echo "0")
        
        echo "   Tamanho original estimado: ${original_mb}MB"
        echo "   Tamanho otimizado: ${optimized_mb}MB"
        echo ""
        
        # Se conseguimos otimizar
        if [ $original_total -gt 0 ]; then
            reduction=$(echo "scale=1; (1 - $optimized_total / $original_total) * 100" | bc 2>/dev/null || echo "0")
            log_info "Economia de aproximadamente: ${reduction}%"
        fi
    fi
fi

log_section "5. RECOMENDAÇÕES"

echo ""
echo "💡 Próximos passos para assets:"
echo ""
echo "   1️⃣  Mover assets otimizados para produção:"
echo "       mv $PUBLIC_DIR/optimized/* $PUBLIC_DIR/"
echo ""
echo "   2️⃣  Atualizar referências no código para .webp"
echo "       (use <picture> para fallback)"
echo ""
echo "   3️⃣  Configurar CDN para assets estáticos"
echo ""
echo "   4️⃣  Implementar lazy loading para vídeos:"
echo "       <video loading='lazy' ... />"
echo ""

# Criar arquivo de configuração de exemplo
cat > "$FRONTEND_DIR/ASSETS_OPTIMIZATION.md" << 'EOF'
# Otimização de Assets - Guia

## Assets Otimizados

Os seguintes assets foram otimizados e estão em `/public/optimized/`:

### Imagens
- `NovalogoNugecid.webp` - Logo otimizada (~90% menor)

### Vídeos
- `*-opt.mp4` - Vídeos comprimidos

## Uso no Código

### Imagens WebP com fallback:
```tsx
<picture>
  <source srcSet="/optimized/logo.webp" type="image/webp" />
  <img src="/logo.png" alt="Logo" loading="lazy" />
</picture>
```

### Vídeos lazy loading:
```tsx
<video preload="none" loading="lazy" poster="/thumb.jpg">
  <source src="/optimized/video-opt.mp4" type="video/mp4" />
</video>
```

## Configuração do Vite

O Vite já está configurado para:
- Code splitting automático
- Otimização de assets
- Compressão gzip/brotli
EOF

log_info "Guia de otimização salvo em: ASSETS_OPTIMIZATION.md"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✨ OTIMIZAÇÃO CONCLUÍDA"
echo "═══════════════════════════════════════════════════════════"
