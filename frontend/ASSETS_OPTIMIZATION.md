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
