# 🚀 Plano de Correção para Performance 10/10
## SGC-ITEP - Sistema de Gestão Documental

**Versão:** 1.0  
**Data:** 2026-04-01  
**Responsável:** Equipe de Engenharia de Performance  
**Prazo Estimado:** 4-6 semanas

---

## 📋 RESUMO EXECUTIVO

### Estado Atual
- **Nota Atual:** 7.5/10
- **P95 Latência:** ~200-500ms
- **Bundle Frontend:** ~2-3MB
- **Memory Usage:** ~500-800MB
- **Cache Hit Ratio:** ~78%

### Objetivo
- **Nota Alvo:** 10/10
- **P95 Latência:** < 100ms
- **Bundle Frontend:** < 500KB (initial)
- **Memory Usage:** < 400MB
- **Cache Hit Ratio:** > 90%

---

## 🎯 CRONOGRAMA DAS FASES

| Fase | Semanas | Prioridade | Impacto |
|------|---------|------------|---------|
| **Fase 1: Database** | 1-2 | 🔴 Alta | ⭐⭐⭐⭐⭐ |
| **Fase 2: Frontend** | 2-3 | 🔴 Alta | ⭐⭐⭐⭐⭐ |
| **Fase 3: Backend** | 3-4 | 🟡 Média | ⭐⭐⭐⭐ |
| **Fase 4: Cache** | 4-5 | 🟡 Média | ⭐⭐⭐⭐ |
| **Fase 5: Infra** | 5-6 | 🟢 Baixa | ⭐⭐⭐ |

---

## 🔴 FASE 1: Otimizações de Banco de Dados (Semanas 1-2)

### 1.1 Índices Estratégicos

**Arquivo:** `src/migrations/20250401000001-performance-indexes.ts` ✅ Criado

```typescript
// Índices implementados:
- idx_desarquivamentos_status_data (composto: status + data_criacao)
- idx_desarquivamentos_numero_processo (busca frequente)
- idx_desarquivamentos_instituto (filtro por instituto)
- idx_desarquivamentos_requerente (GIN para busca textual)
- idx_desarquivamentos_periodo (range queries)
- idx_tarefas_projeto_coluna (Kanban otimizado)
- idx_tarefas_responsavel (filtro por responsável)
- idx_tarefas_prazo (tarefas atrasadas)
- idx_auditoria_entidade (auditoria rápida)
- idx_notificacoes_usuario_lida (inbox otimizado)
- idx_anexos_desarquivamento (carregamento de anexos)
```

**Comando para executar:**
```bash
npm run migration:run
```

### 1.2 DataLoader para N+1 Queries

**Arquivos Criados:**
- `src/common/dataloader/dataloader.module.ts` ✅
- `src/common/dataloader/user.loader.ts` ✅
- `src/common/dataloader/desarquivamento.loader.ts` ✅
- `src/common/dataloader/pasta.loader.ts` ✅

**Instalação necessária:**
```bash
npm install dataloader
```

**Registro no AppModule:**
```typescript
@Module({
  imports: [
    // ... outros imports
    DataloaderModule, // Adicionar
  ],
})
export class AppModule {}
```

### 1.3 Query Optimization

**Antes (N+1):**
```typescript
// 1 query para listar desarquivamentos
// + N queries para buscar usuários
const desarquivamentos = await repo.find();
for (const d of desarquivamentos) {
  const user = await userRepo.findOne(d.responsavelId); // N queries!
}
```

**Depois (DataLoader):**
```typescript
// 1 query para listar desarquivamentos
// + 1 query para buscar todos usuários
const desarquivamentos = await repo.find();
const userIds = desarquivamentos.map(d => d.responsavelId);
const users = await userLoader.loadMany(userIds); // 1 query!
```

### Checklist Fase 1
- [x] Criar migration de índices
- [x] Implementar DataLoader
- [ ] Executar migration em produção
- [ ] Validar performance com `EXPLAIN ANALYZE`
- [ ] Monitorar cache hit ratio

---

## 🔴 FASE 2: Frontend Optimization (Semanas 2-3)

### 2.1 Code Splitting com Lazy Loading

**Arquivo Criado:** `frontend/src/routes/lazyRoutes.tsx` ✅

**Implementação:**
```typescript
const DashboardPage = lazy(
  () => import(/* webpackChunkName: "dashboard" */ "@/pages/DashboardPage")
);
```

**Componente de Loading:** `frontend/src/components/ui/LoadingSpinner.tsx` ✅

### 2.2 Bundle Optimization

**Arquivo Modificado:** `frontend/vite.config.ts` ✅

**Configurações adicionadas:**
```typescript
build: {
  target: "esnext",
  minify: "terser",
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ["react", "react-dom", "react-router-dom"],
        ui: [/* componentes radix */],
        forms: ["react-hook-form", "zod"],
        charts: ["recharts"], // Lazy load
        dnd: ["@dnd-kit/*"],
      }
    }
  },
  terserOptions: {
    compress: {
      drop_console: true,      // Remove console.log
      drop_debugger: true,     // Remove debugger
    }
  }
}
```

**Resultado esperado:**
- Antes: 1 bundle de ~2-3MB
- Depois: ~7 chunks menores, inicial < 500KB

### 2.3 Hooks Otimizados

**Arquivo Criado:** `frontend/src/hooks/useTarefasOptimized.ts` ✅

**Melhorias implementadas:**
```typescript
// ✅ Estado consolidado (evita re-renders em cascata)
const [state, setState] = useState<TarefasState>({...});

// ✅ Cache em memória com TTL
class TarefasCache { ... }

// ✅ Cancelamento de requisições pendentes
const abortControllerRef = useRef<AbortController | null>(null);

// ✅ Memoização de estatísticas
const estatisticas = useMemo(() => {...}, [state.tarefas]);
```

### 2.4 React Query Optimization

**Configurações recomendadas:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,      // 1 minuto
      gcTime: 5 * 60 * 1000,     // 5 minutos
      retry: 1,                  // 1 retry
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
    },
  },
});
```

### Checklist Fase 2
- [x] Criar lazyRoutes
- [x] Configurar manualChunks no Vite
- [x] Criar hook otimizado useTarefasOptimized
- [ ] Migrar todos os hooks para versão otimizada
- [ ] Verificar bundle size com `npm run check:bundle-size`

---

## 🟡 FASE 3: Backend Optimizations (Semanas 3-4)

### 3.1 Multer - Disk Storage

**Localização:** `src/modules/nugecid/nugecid.module.ts`

**Mudança necessária:**
```typescript
// ❌ Antes: memoryStorage (consumo de RAM)
storage: multer.memoryStorage()

// ✅ Depois: diskStorage (persistência em disco)
storage: multer.diskStorage({
  destination: './uploads/temp',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
})

// Adicionar cleanup
limits: {
  fileSize: 10 * 1024 * 1024, // 10MB
  files: 5,
}
```

### 3.2 SSE Optimization

**Problema:** Conexões SSE podem vazar

**Solução:** Heartbeat + Reconexão

```typescript
// Server-side: Adicionar heartbeat
setInterval(() => {
  if (client.readyState === 1) {
    client.write('data: {"type":"heartbeat"}\n\n');
  }
}, 30000); // 30s

// Client-side: Reconexão automática
const setupSSE = () => {
  const eventSource = new EventSource(url);
  eventSource.onerror = () => {
    setTimeout(setupSSE, 5000); // Reconnect after 5s
  };
};
```

### 3.3 Rate Limiting por Usuário

**Localização:** `src/main.ts`

**Melhoria:**
```typescript
// Adicionar identificador de usuário ao key
keyGenerator: (req) => {
  const userId = req.user?.id || 'anonymous';
  return `${userId}:${req.ip}:${req.path}`;
}
```

### Checklist Fase 3
- [ ] Migrar Multer para diskStorage
- [ ] Implementar heartbeat em SSE
- [ ] Adicionar rate limiting por usuário
- [ ] Configurar timeouts de conexão

---

## 🟡 FASE 4: Multi-Level Caching (Semanas 4-5)

### 4.1 Estratégia de Cache

```
┌─────────────────────────────────────────────────┐
│  CACHE HIERARCHY                                │
├─────────────────────────────────────────────────┤
│  L1: Browser Cache (Service Worker)            │
│  L2: React Query Cache (In-Memory)           │
│  L3: Redis Cache (Distribuído)               │
│  L4: PostgreSQL (Source of Truth)            │
└─────────────────────────────────────────────────┘
```

### 4.2 Redis Cache Configuration

**Arquivo:** `src/config/cache.config.ts`

```typescript
CacheModule.registerAsync({
  useFactory: async (configService: ConfigService) => {
    const redisUrl = configService.get<string>('REDIS_URL');
    return {
      store: redisStore,
      url: redisUrl,
      ttl: 60,           // 1 minuto default
      max: 1000,         // Max 1000 itens
    };
  },
});
```

### 4.3 Cache Decorators

```typescript
@Controller('nugecid')
export class NugecidController {
  @Get(':id')
  @CacheTTL(30)
  @CacheKey((req) => `desarquivamento:${req.params.id}`)
  async findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }
}
```

### Checklist Fase 4
- [ ] Configurar Redis em produção
- [ ] Implementar cache decorators
- [ ] Configurar cache invalidation
- [ ] Testar consistência de dados

---

## 🟢 FASE 5: Infrastructure (Semanas 5-6)

### 5.1 Compression Brotli

**Localização:** `src/main.ts`

```typescript
import compression from 'compression';

app.use(compression({
  filter: (req, res) => {
    if (req.headers['accept-encoding']?.includes('br')) {
      return compression.filter(req, res);
    }
    return false;
  },
  brotli: {
    enabled: true,
    zlib: {
      level: 11, // Brotli máximo
    },
  },
}));
```

### 5.2 Service Worker

**Instalação:**
```bash
npm install -D workbox-cli
```

**Configuração:** `frontend/public/service-worker.js`

```javascript
// Workbox precaching
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

// Cache API responses
workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'api-cache',
  })
);
```

### 5.3 CDN Configuration

**Assets para CDN:**
- Imagens: `https://cdn.sgci.rn.gov.br/images/`
- Fontes: `https://cdn.sgci.rn.gov.br/fonts/`
- Estáticos: `https://cdn.sgci.rn.gov.br/static/`

### Checklist Fase 5
- [ ] Configurar Brotli compression
- [ ] Implementar Service Worker
- [ ] Configurar CDN
- [ ] Testar offline capability

---

## 📊 TESTES E MONITORAMENTO

### Testes de Carga (k6)

**Arquivos criados:**
- `scripts/performance-tests/load-test.js` ✅
- `scripts/performance-tests/api-benchmark.js` ✅
- `scripts/performance-tests/db-query-analysis.sql` ✅

**Execução:**
```bash
# Instalar k6
curl -s https://dl.k6.io/key.gpg | sudo apt-key add -
sudo apt-get update
sudo apt-get install k6

# Run smoke test
k6 run --vus 10 --duration 1m scripts/performance-tests/load-test.js

# Run full load test
k6 run scripts/performance-tests/load-test.js

# Run API benchmark
k6 run --env BASE_URL=http://localhost:3000 \
       --env AUTH_TOKEN=your-token \
       scripts/performance-tests/api-benchmark.js
```

### Dashboard de Performance

**Métricas a monitorar:**

| Métrica | Alerta Crítico | Alerta Atenção | Normal |
|---------|---------------|----------------|--------|
| P95 Latency | > 500ms | > 200ms | < 200ms |
| P99 Latency | > 1000ms | > 500ms | < 500ms |
| Error Rate | > 5% | > 1% | < 1% |
| Memory Usage | > 800MB | > 600MB | < 400MB |
| DB Connections | > 15 | > 10 | < 8 |
| Cache Hit | < 50% | < 80% | > 90% |

### Sentry APM

**Configuração adicional:**
```typescript
// src/instrument.ts
import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Postgres(),
  ],
});
```

---

## 🎓 GUIA PARA DESENVOLVEDORES

### Checklist de Performance para PRs

- [ ] Query passou por `EXPLAIN ANALYZE`
- [ ] Novo hook usa cache quando apropriado
- [ ] Componente usa lazy loading se > 100KB
- [ ] Testes de carga passaram
- [ ] Bundle size não aumentou > 10%

### Patterns Otimizados

#### ✅ DO
```typescript
// Use DataLoader para evitar N+1
const users = await userLoader.loadMany(userIds);

// Memoize cálculos pesados
const stats = useMemo(() => computeStats(data), [data]);

// Cache com TTL apropriado
staleTime: 60 * 1000 // 1 minuto

// Cancelar requisições pendentes
useEffect(() => {
  const controller = new AbortController();
  fetch(url, { signal: controller.signal });
  return () => controller.abort();
}, []);
```

#### ❌ DON'T
```typescript
// N+1 query
for (const id of ids) {
  await repo.findOne(id); // ❌ N queries
}

// Cálculos sem memoização
const stats = computeStats(data); // ❌ Recalcula toda vez

// Cache infinito
staleTime: Infinity // ❌ Dados nunca atualizam

// Requisições sem cleanup
useEffect(() => {
  fetch(url); // ❌ Pode causar memory leak
}, []);
```

---

## 📈 RESULTADOS ESPERADOS

### Antes vs Depois

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Nota | 7.5/10 | 10/10 | +33% |
| P95 Latency | ~500ms | < 100ms | -80% |
| Bundle Initial | ~2.5MB | < 500KB | -80% |
| Memory Usage | ~700MB | < 400MB | -43% |
| Cache Hit | 78% | > 90% | +15% |
| Queries/sec | ~100 | > 500 | +400% |

### ROI (Return on Investment)

- **Tempo de carregamento da página:** -60%
- **Tempo de resposta da API:** -80%
- **Custo de infraestrutura:** -30% (menos recursos)
- **Satisfação do usuário:** +40% (faster perceived performance)

---

## 🚀 ROTEIRO DE IMPLEMENTAÇÃO

### Semana 1: Database
- [ ] Executar migration de índices
- [ ] Implementar DataLoader
- [ ] Validar queries com EXPLAIN

### Semana 2: Frontend Bundle
- [ ] Implementar lazy loading
- [ ] Configurar manualChunks
- [ ] Otimizar hooks principais

### Semana 3: Backend Core
- [ ] Migrar Multer
- [ ] Otimizar SSE
- [ ] Rate limiting por usuário

### Semana 4: Caching
- [ ] Configurar Redis
- [ ] Implementar cache decorators
- [ ] Testar invalidation

### Semana 5: Infrastructure
- [ ] Brotli compression
- [ ] Service Worker
- [ ] CDN setup

### Semana 6: Testing & Monitoring
- [ ] Load testing
- [ ] Sentry APM
- [ ] Documentação final

---

## 📝 APÊNDICES

### A. Comandos Úteis

```bash
# Analisar bundle
npm run frontend:bundle:check

# Executar migration
npm run migration:run

# Testes de performance
npm run test:performance

# Monitorar recursos
docker stats

# Analisar queries PostgreSQL
psql -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Testar endpoint específico
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/health
```

### B. Troubleshooting

| Problema | Causa Provável | Solução |
|----------|---------------|---------|
| Alta latência | Query sem índice | Verificar EXPLAIN ANALYZE |
| Bundle grande | Sem code splitting | Implementar lazy loading |
| Memory leak | Sem cleanup de requisições | Adicionar AbortController |
| Cache stale | TTL muito alto | Ajustar staleTime |
| DB connection pool | Conexões não fechadas | Verificar TypeORM config |

### C. Referências

- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [React Performance Patterns](https://react.dev/learn/render-and-commit)
- [NestJS Performance](https://docs.nestjs.com/techniques/performance)
- [Vite Optimization](https://vitejs.dev/guide/performance.html)
- [k6 Load Testing](https://k6.io/docs/)

---

**Status:** ✅ Planejamento Completo  
**Próximo Passo:** Iniciar Fase 1 - Database Optimization

*Documento gerado automaticamente em 2026-04-01*
