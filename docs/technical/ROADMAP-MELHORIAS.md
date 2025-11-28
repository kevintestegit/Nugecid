# 🚀 Roadmap de Melhorias - SGC-ITEP-NESTJS

> **Data de Criação:** 2025-11-15
> **Versão:** 1.0
> **Status:** Em Andamento

---

## 📊 Visão Geral

Este documento contém todas as melhorias recomendadas para o sistema SGC-ITEP-NESTJS, organizadas por prioridade e com instruções detalhadas de implementação.

### Estatísticas do Sistema
- **Arquivos analisados:** 150+
- **Problemas críticos:** 4
- **Problemas de alta prioridade:** 8
- **Melhorias recomendadas:** 19
- **Tempo estimado total:** 120-160 horas

---

## 🚨 FASE 1: CRÍTICO (Implementar IMEDIATAMENTE)

### ✅ Progresso: 0/4

---

### 1.1 - Segurança de Credenciais

**Prioridade:** 🔴 CRÍTICA
**Tempo estimado:** 30 minutos
**Responsável:** _______
**Status:** ☐ Não iniciado

#### Problema
Credenciais expostas no arquivo `.env` que podem estar no controle de versão:
- `POSTGRES_PASSWORD=@Sanfona1`
- `JWT_SECRET=your-super-secret-jwt-key-change-this-in-production`
- `SESSION_SECRET=your-super-secret-session-key-change-this-in-production`

#### Solução

**Passo 1: Gerar novos secrets fortes**
```bash
# Gerar JWT Secret (256 bits)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Gerar Session Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Gerar nova senha do banco
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Passo 2: Atualizar .env**
```bash
# Backup do .env atual
cp .env .env.backup

# Editar .env com novos valores
nano .env
```

**Passo 3: Remover .env do git (se estiver commitado)**
```bash
# Adicionar ao .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore

# Remover do histórico do git
git rm --cached .env
git commit -m "security: Remove .env from version control"

# Criar .env.example para referência
cp .env .env.example
# Editar .env.example e substituir valores reais por placeholders
sed -i 's/=.*/=CHANGE_ME/g' .env.example
git add .env.example
git commit -m "docs: Add .env.example template"
```

**Passo 4: Atualizar banco de dados**
```bash
# Conectar ao PostgreSQL
docker exec -it sgc-itep-nestjs-db-1 psql -U sgc -d sgc

# Alterar senha do usuário
ALTER USER sgc WITH PASSWORD 'NOVA_SENHA_GERADA';
\q
```

**Passo 5: Reiniciar sistema**
```bash
docker compose down
docker compose up -d
```

**Verificação:**
- [ ] Novos secrets gerados
- [ ] .env atualizado
- [ ] .env removido do git
- [ ] .env.example criado
- [ ] Senha do banco alterada
- [ ] Sistema reiniciado e funcionando
- [ ] Login ainda funciona

---

### 1.2 - Proteção CSRF

**Prioridade:** 🔴 CRÍTICA
**Tempo estimado:** 2 horas
**Responsável:** _______
**Status:** ☐ Não iniciado

#### Problema
Aplicação vulnerável a ataques Cross-Site Request Forgery em formulários e operações de mudança de estado.

#### Solução

**Passo 1: Instalar dependência**
```bash
npm install csurf
npm install --save-dev @types/csurf
```

**Passo 2: Configurar CSRF no main.ts**

Adicionar após a configuração de sessão:

```typescript
// src/main.ts
import * as csurf from 'csurf';

// Após app.use(session(...))
app.use(csurf({
  cookie: false, // Usa session storage
}));

// Middleware para adicionar token às respostas
app.use((req: any, res: any, next: any) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});
```

**Passo 3: Criar interceptor para incluir token nas respostas**

```typescript
// src/common/interceptors/csrf.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class CsrfInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map((data) => {
        // Adicionar CSRF token em rotas de renderização
        if (request.method === 'GET' && response.locals?.csrfToken) {
          return {
            ...data,
            csrfToken: response.locals.csrfToken,
          };
        }
        return data;
      }),
    );
  }
}
```

**Passo 4: Aplicar globalmente no main.ts**
```typescript
import { CsrfInterceptor } from './common/interceptors/csrf.interceptor';

// Antes de app.listen()
app.useGlobalInterceptors(new CsrfInterceptor());
```

**Passo 5: Atualizar frontend para incluir token**

Frontend deve incluir token em todas requisições POST/PUT/PATCH/DELETE:
```javascript
// Exemplo para axios
axios.defaults.headers.common['X-CSRF-Token'] = csrfToken;
```

**Verificação:**
- [ ] Dependência instalada
- [ ] CSRF configurado no main.ts
- [ ] Interceptor criado
- [ ] Frontend atualizado
- [ ] Testes de POST/PUT/DELETE funcionando
- [ ] Requisições sem token são bloqueadas

---

### 1.3 - Validação de Upload por Magic Bytes

**Prioridade:** 🔴 CRÍTICA
**Tempo estimado:** 3 horas
**Responsável:** _______
**Status:** ☐ Não iniciado

#### Problema
Validação de arquivos apenas por MIME type (pode ser falsificado). Arquivos maliciosos podem ser enviados.

**Localização:** `src/modules/nugecid/nugecid-anexos.service.ts`

#### Solução

**Passo 1: Instalar biblioteca**
```bash
npm install file-type
```

**Passo 2: Criar serviço de validação de arquivo**

```typescript
// src/common/services/file-validation.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';

@Injectable()
export class FileValidationService {
  private readonly allowedTypes = {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    documents: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  };

  async validateFile(
    buffer: Buffer,
    category: 'images' | 'documents',
  ): Promise<boolean> {
    // Validar magic bytes
    const fileType = await fileTypeFromBuffer(buffer);

    if (!fileType) {
      throw new BadRequestException('Tipo de arquivo não reconhecido');
    }

    const allowed = this.allowedTypes[category];

    if (!allowed.includes(fileType.mime)) {
      throw new BadRequestException(
        `Tipo de arquivo não permitido. Permitidos: ${allowed.join(', ')}`,
      );
    }

    return true;
  }

  async getFileInfo(buffer: Buffer) {
    return await fileTypeFromBuffer(buffer);
  }
}
```

**Passo 3: Registrar no módulo**

```typescript
// src/common/common.module.ts
import { Module } from '@nestjs/common';
import { FileValidationService } from './services/file-validation.service';

@Module({
  providers: [FileValidationService],
  exports: [FileValidationService],
})
export class CommonModule {}
```

**Passo 4: Atualizar nugecid-anexos.service.ts**

```typescript
import { FileValidationService } from '../../common/services/file-validation.service';

export class NugecidAnexosService {
  constructor(
    // ... outros injects
    private readonly fileValidationService: FileValidationService,
  ) {}

  async uploadAnexo(
    file: Express.Multer.File,
    desarquivamentoId: number,
  ): Promise<any> {
    // ANTES da validação de MIME type, adicionar:

    // Validar magic bytes do arquivo
    await this.fileValidationService.validateFile(file.buffer, 'images');

    // Obter informações reais do arquivo
    const fileInfo = await this.fileValidationService.getFileInfo(file.buffer);

    // Continuar com o resto da lógica...
  }
}
```

**Passo 5: Atualizar NugecidModule**

```typescript
// src/modules/nugecid/nugecid.module.ts
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    // ... outros imports
    CommonModule,
  ],
  // ...
})
export class NugecidModule {}
```

**Verificação:**
- [ ] file-type instalado
- [ ] FileValidationService criado
- [ ] CommonModule criado e exportado
- [ ] NugecidAnexosService atualizado
- [ ] Testes com arquivo renomeado (jpg→pdf) são bloqueados
- [ ] Upload normal funciona

---

### 1.4 - Remover unsafe-inline do CSP

**Prioridade:** 🔴 CRÍTICA
**Tempo estimado:** 4 horas
**Responsável:** _______
**Status:** ☐ Não iniciado

#### Problema
Content Security Policy permite `unsafe-inline`, o que anula proteção contra XSS.

**Localização:** `src/main.ts:40-69`

#### Solução

**Passo 1: Gerar nonces para scripts**

```typescript
// src/common/middleware/csp-nonce.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class CspNonceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Gerar nonce único para esta requisição
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
    next();
  }
}
```

**Passo 2: Atualizar CSP no main.ts**

```typescript
// src/main.ts
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      // Remover 'unsafe-inline'
      (req, res) => `'nonce-${res.locals.cspNonce}'`,
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Pode manter para CSS (menos crítico)
      'https://fonts.googleapis.com',
    ],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
},
```

**Passo 3: Aplicar middleware**

```typescript
// src/app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CspNonceMiddleware } from './common/middleware/csp-nonce.middleware';

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CspNonceMiddleware).forRoutes('*');
  }
}
```

**Passo 4: Atualizar templates para usar nonce**

Se usar templates EJS/Handlebars:
```html
<script nonce="<%= cspNonce %>">
  // código inline
</script>
```

Se usar React/Frontend separado:
```javascript
// No index.html, incluir meta tag
<meta property="csp-nonce" content="<%= cspNonce %>" />

// No código React
const nonce = document.querySelector('meta[property="csp-nonce"]')?.content;
```

**Verificação:**
- [ ] Middleware criado
- [ ] CSP atualizado
- [ ] unsafe-inline removido
- [ ] Nonces funcionando
- [ ] Scripts inline ainda carregam
- [ ] Console não mostra erros CSP

---

## ⚠️ FASE 2: ALTA PRIORIDADE (2-4 Semanas)

### ✅ Progresso: 0/4

---

### 2.1 - Corrigir SSL Database Validation

**Prioridade:** 🟠 ALTA
**Tempo estimado:** 30 minutos
**Responsável:** _______
**Status:** ☐ Não iniciado

#### Problema
```typescript
ssl: { rejectUnauthorized: false } // Permite MITM attacks
```

#### Solução

```typescript
// src/config/database.config.ts
ssl: env("DATABASE_SSL") === "true"
  ? {
      rejectUnauthorized: env("DATABASE_SSL_REJECT_UNAUTHORIZED", "true") === "true",
      ca: env("DATABASE_SSL_CA") ? fs.readFileSync(env("DATABASE_SSL_CA")).toString() : undefined,
    }
  : false,
```

Atualizar `.env`:
```bash
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true
# DATABASE_SSL_CA=/path/to/ca-certificate.crt  # Se necessário
```

**Verificação:**
- [ ] Código atualizado
- [ ] .env configurado
- [ ] Conexão com banco funciona
- [ ] SSL ativo (verificar logs)

---

### 2.2 - Habilitar TypeScript Strict Mode

**Prioridade:** 🟠 ALTA
**Tempo estimado:** 8-16 horas
**Responsável:** _______
**Status:** ☐ Não iniciado

#### Problema
Strict mode desabilitado permite bugs de tipo passarem despercebidos.

#### Solução (Incremental)

**Fase 1: strictNullChecks**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strictNullChecks": true
  }
}
```

Executar:
```bash
npm run build

# Corrigir erros que aparecerem
# Exemplo: obj.property -> obj?.property
```

**Fase 2: noImplicitAny**
```json
{
  "compilerOptions": {
    "strictNullChecks": true,
    "noImplicitAny": true
  }
}
```

**Fase 3: Strict completo**
```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

**Verificação:**
- [ ] strictNullChecks habilitado e erros corrigidos
- [ ] noImplicitAny habilitado e erros corrigidos
- [ ] strict: true habilitado
- [ ] Build passa sem erros
- [ ] Testes passam

---

### 2.3 - Implementar Testes Unitários

**Prioridade:** 🟠 ALTA
**Tempo estimado:** 20-30 horas
**Responsável:** _______
**Status:** ☐ Não iniciado

#### Objetivo
Atingir 80% de cobertura em código crítico.

#### Áreas Prioritárias

**1. Auth Service**
```typescript
// src/modules/auth/auth.service.spec.ts
describe('AuthService', () => {
  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      // ...
    });

    it('should return null when credentials are invalid', async () => {
      // ...
    });

    it('should increment failedLoginAttempts on failed login', async () => {
      // ...
    });

    it('should block user after 5 failed attempts', async () => {
      // ...
    });
  });

  describe('login', () => {
    it('should return JWT token on successful login', async () => {
      // ...
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      // ...
    });
  });
});
```

**2. Guards**
```typescript
// src/modules/auth/guards/jwt-auth.guard.spec.ts
// src/modules/auth/guards/roles.guard.spec.ts
```

**3. File Validation**
```typescript
// src/common/services/file-validation.service.spec.ts
```

**Comandos úteis:**
```bash
# Rodar testes
npm test

# Rodar com cobertura
npm run test:cov

# Rodar específico
npm test -- auth.service.spec
```

**Verificação:**
- [ ] AuthService testado (>80% coverage)
- [ ] Guards testados
- [ ] FileValidationService testado
- [ ] UsersService testado
- [ ] Coverage total >60%

---

### 2.4 - Ajustar Rate Limiting

**Prioridade:** 🟠 ALTA
**Tempo estimado:** 2 horas
**Responsável:** _______
**Status:** ☐ Não iniciado

#### Problema
Rate limit muito permissivo: 1000 req/15min permite brute force.

#### Solução

```bash
npm install express-rate-limit
```

```typescript
// src/main.ts
import rateLimit from 'express-rate-limit';

// Rate limit geral (API)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições
  message: 'Muitas requisições deste IP, tente novamente mais tarde',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit para login (mais restritivo)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Apenas 5 tentativas
  skipSuccessfulRequests: true, // Não conta logins bem-sucedidos
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos',
});

// Aplicar
app.use('/api/', generalLimiter);
app.use('/api/auth/login', loginLimiter);
```

**Verificação:**
- [ ] Rate limiting diferenciado implementado
- [ ] Login limitado a 5 tentativas
- [ ] API limitada a 100 requisições
- [ ] Mensagens amigáveis retornadas
- [ ] Testes com múltiplas tentativas funcionam

---

## 📊 FASE 3: MÉDIA PRIORIDADE (1-2 Meses)

### ✅ Progresso: 0/6

---

### 3.1 - Implementar Monitoramento com Sentry

**Prioridade:** 🟡 MÉDIA
**Tempo estimado:** 2 horas
**Responsável:** _______
**Status:** ☐ Não iniciado

#### Solução

**Passo 1: Criar conta no Sentry**
- Acesse https://sentry.io
- Crie projeto Node.js/NestJS
- Copie o DSN

**Passo 2: Instalar SDK**
```bash
npm install @sentry/node @sentry/tracing
```

**Passo 3: Configurar no main.ts**

```typescript
// src/main.ts
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

async function bootstrap() {
  // Inicializar Sentry ANTES de criar app
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0, // 100% em dev, reduzir para 0.1 em prod
    profilesSampleRate: 1.0,
    integrations: [
      new ProfilingIntegration(),
    ],
  });

  const app = await NestFactory.create(AppModule);

  // ... resto do código
}
```

**Passo 4: Criar filtro de exceção**

```typescript
// src/common/filters/sentry-exception.filter.ts
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    Sentry.captureException(exception);
    super.catch(exception, host);
  }
}
```

**Passo 5: Aplicar filtro**
```typescript
// src/main.ts
import { SentryExceptionFilter } from './common/filters/sentry-exception.filter';

const { httpAdapter } = app.get(HttpAdapterHost);
app.useGlobalFilters(new SentryExceptionFilter(httpAdapter));
```

**Passo 6: Adicionar ao .env**
```bash
SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

**Verificação:**
- [ ] Sentry configurado
- [ ] Erros aparecem no dashboard
- [ ] Performance monitoring ativo
- [ ] Source maps configurados (opcional)

---

### 3.2 - Otimizar Queries do Banco

**Prioridade:** 🟡 MÉDIA
**Tempo estimado:** 8 horas
**Responsável:** _______
**Status:** ☐ Não iniciado

#### Problema 1: Auditoria com eager loading

```typescript
// src/modules/audit/entities/auditoria.entity.ts
// ANTES:
@ManyToOne(() => User, { eager: true })

// DEPOIS:
@ManyToOne(() => User, { eager: false, lazy: true })
```

#### Problema 2: Falta de índices

Criar migration:
```bash
npm run migration:create AddIndexesForSearch
```

```typescript
// src/migrations/TIMESTAMP-AddIndexesForSearch.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexesForSearch1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Índices para búsqueda
    await queryRunner.query(`
      CREATE INDEX idx_desarquivamento_nome
      ON desarquivamentos(nome_completo);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_desarquivamento_nic
      ON desarquivamentos(numero_nic_laudo_auto);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_desarquivamento_processo
      ON desarquivamentos(numero_processo);
    `);

    // Índice para usuários
    await queryRunner.query(`
      CREATE INDEX idx_users_usuario
      ON users(usuario);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_desarquivamento_nome`);
    await queryRunner.query(`DROP INDEX idx_desarquivamento_nic`);
    await queryRunner.query(`DROP INDEX idx_desarquivamento_processo`);
    await queryRunner.query(`DROP INDEX idx_users_usuario`);
  }
}
```

Executar:
```bash
npm run migration:run
```

**Verificação:**
- [ ] Eager loading removido
- [ ] Migration criada
- [ ] Índices criados
- [ ] Queries mais rápidas (testar com EXPLAIN)

---

### 3.3 - Implementar Cache Redis

**Prioridade:** 🟡 MÉDIA
**Tempo estimado:** 6 horas
**Responsável:** _______
**Status:** ☐ Não iniciado

#### Solução

**Passo 1: Adicionar Redis ao docker-compose.yml**

```yaml
services:
  # ... serviços existentes

  redis:
    image: redis:7-alpine
    container_name: sgc-redis
    ports:
      - "${HOST_REDIS_PORT:-6379}:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  # ... volumes existentes
  redis_data:
```

**Passo 2: Instalar dependências**
```bash
npm install cache-manager cache-manager-redis-store
npm install --save-dev @types/cache-manager
```

**Passo 3: Configurar cache no app.module.ts**

```typescript
// src/app.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      ttl: 300, // 5 minutos padrão
    }),
    // ... outros imports
  ],
})
```

**Passo 4: Usar cache em endpoints**

```typescript
// src/modules/users/users.controller.ts
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { UseInterceptors } from '@nestjs/common';

@Controller('users')
export class UsersController {

  @Get('roles')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('all_roles')
  @CacheTTL(3600) // 1 hora
  async findAllRoles() {
    // ...
  }
}
```

**Passo 5: Adicionar ao .env**
```bash
REDIS_HOST=redis
REDIS_PORT=6379
FEATURE_CACHE_ENABLED=true
```

**Passo 6: Invalidar cache em updates**

```typescript
// src/modules/users/users.service.ts
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export class UsersService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async updateUser(id: number, data: UpdateUserDto) {
    const result = await this.usersRepo.save(...);

    // Invalidar cache
    await this.cacheManager.del('all_roles');
    await this.cacheManager.del(`user_${id}`);

    return result;
  }
}
```

**Verificação:**
- [ ] Redis rodando
- [ ] Cache configurado
- [ ] Endpoints com cache funcionam
- [ ] Cache invalidado em updates
- [ ] Performance melhorou

---

### 3.4 - Async File Operations

**Prioridade:** 🟡 MÉDIA
**Tempo estimado:** 3 horas
**Responsável:** _______
**Status:** ☐ Não iniciado

#### Problema
`fs.writeFileSync()` bloqueia thread.

#### Solução

```typescript
// src/modules/nugecid/nugecid-anexos.service.ts
import { promises as fs } from 'fs';

// ANTES:
fs.writeFileSync(filePath, file.buffer);

// DEPOIS:
await fs.writeFile(filePath, file.buffer);

// Para leitura:
// ANTES:
const data = fs.readFileSync(filePath);

// DEPOIS:
const data = await fs.readFile(filePath);

// Para exclusão:
// ANTES:
fs.unlinkSync(filePath);

// DEPOIS:
await fs.unlink(filePath);
```

**Aplicar em:**
- `nugecid-anexos.service.ts`
- `users.controller.ts` (upload de avatar)
- `backup.service.ts` (verificar se já usa)

**Verificação:**
- [ ] Todos fs.writeFileSync substituídos
- [ ] Todos fs.readFileSync substituídos
- [ ] Todos fs.unlinkSync substituídos
- [ ] Upload/download funciona normalmente
- [ ] Performance melhorou

---

### 3.5 - Validação de Senha Forte

**Prioridade:** 🟡 MÉDIA
**Tempo estimado:** 2 horas
**Responsável:** _______
**Status:** ☐ Não iniciado

#### Solução

```typescript
// src/modules/auth/dto/login.dto.ts
import { MinLength, MaxLength, Matches } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'Usuário deve ser uma string' })
  @IsNotEmpty({ message: 'Usuário é obrigatório' })
  @MinLength(3, { message: 'Usuário deve ter no mínimo 3 caracteres' })
  @MaxLength(50, { message: 'Usuário deve ter no máximo 50 caracteres' })
  usuario: string;

  @IsString({ message: 'Senha deve ser uma string' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @MaxLength(255, { message: 'Senha deve ter no máximo 255 caracteres' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Senha deve conter maiúscula, minúscula e número ou símbolo',
  })
  senha: string;
}
```

```typescript
// src/modules/users/application/dto/create-user.dto.ts
export class CreateUserDto {
  // ... outros campos

  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @MaxLength(255)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Senha deve conter letra maiúscula, minúscula e número ou símbolo',
  })
  senha: string;
}
```

**Verificação:**
- [ ] Validação aplicada no LoginDto
- [ ] Validação aplicada no CreateUserDto
- [ ] Senhas fracas são rejeitadas
- [ ] Mensagens de erro claras

---

### 3.6 - Backup para Cloud (S3)

**Prioridade:** 🟡 MÉDIA
**Tempo estimado:** 4 horas
**Responsável:** _______
**Status:** ☐ Não iniciado

#### Solução

**Passo 1: Instalar AWS SDK**
```bash
npm install @aws-sdk/client-s3
npm install @aws-sdk/lib-storage
```

**Passo 2: Configurar credenciais AWS**

```bash
# .env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=sgc-backups
AWS_S3_REGION=us-east-1
BACKUP_S3_ENABLED=true
```

**Passo 3: Criar serviço S3**

```typescript
// src/modules/backup/services/s3-backup.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createReadStream } from 'fs';

@Injectable()
export class S3BackupService {
  private readonly logger = new Logger(S3BackupService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    this.enabled = this.configService.get('BACKUP_S3_ENABLED') === 'true';
    this.bucket = this.configService.get('AWS_S3_BUCKET', '');

    if (this.enabled) {
      this.s3Client = new S3Client({
        region: this.configService.get('AWS_S3_REGION', 'us-east-1'),
        credentials: {
          accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID', ''),
          secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY', ''),
        },
      });
    }
  }

  async uploadBackup(filePath: string, fileName: string): Promise<boolean> {
    if (!this.enabled) {
      this.logger.warn('S3 backup desabilitado');
      return false;
    }

    try {
      this.logger.log(`Enviando backup para S3: ${fileName}`);

      const fileStream = createReadStream(filePath);

      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucket,
          Key: `backups/${fileName}`,
          Body: fileStream,
          ServerSideEncryption: 'AES256', // Criptografia em repouso
        },
      });

      await upload.done();

      this.logger.log(`✅ Backup enviado para S3: ${fileName}`);
      return true;
    } catch (error) {
      this.logger.error(`Erro ao enviar backup para S3: ${error.message}`);
      return false;
    }
  }
}
```

**Passo 4: Integrar no BackupService**

```typescript
// src/modules/backup/services/backup.service.ts
import { S3BackupService } from './s3-backup.service';

export class BackupService {
  constructor(
    private configService: ConfigService,
    private s3BackupService: S3BackupService, // Injetar
  ) {}

  async createFullBackup(): Promise<BackupResult> {
    // ... código existente de backup

    // Após criar backup local, enviar para S3
    if (result.success && result.filepath) {
      await this.s3BackupService.uploadBackup(
        result.filepath,
        result.filename,
      );
    }

    return result;
  }
}
```

**Passo 5: Registrar no módulo**

```typescript
// src/modules/backup/backup.module.ts
import { S3BackupService } from './services/s3-backup.service';

@Module({
  providers: [BackupService, S3BackupService],
  // ...
})
```

**Verificação:**
- [ ] AWS SDK instalado
- [ ] Credenciais configuradas
- [ ] S3BackupService criado
- [ ] Integrado ao BackupService
- [ ] Backup aparece no S3
- [ ] Criptografia ativa

---

## 🚀 FASE 4: LONGO PRAZO (3-6 Meses)

### ✅ Progresso: 0/5

---

### 4.1 - Implementar CI/CD Pipeline

**Prioridade:** 🟢 BAIXA
**Tempo estimado:** 8 horas
**Responsável:** _______
**Status:** ☐ Não iniciado

#### Solução - GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: sgc
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: sgc_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm run test:cov
        env:
          DATABASE_HOST: localhost
          DATABASE_PORT: 5432
          DATABASE_USERNAME: sgc
          DATABASE_PASSWORD: test_password
          DATABASE_NAME: sgc_test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Build Docker image
        run: docker build -t sgc-itep:${{ github.sha }} .

      - name: Security scan
        run: npm audit --audit-level=high

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to production
        run: |
          echo "Deploy steps here"
          # Pode usar SSH, Docker registry, etc.
```

**Verificação:**
- [ ] Workflow criado
- [ ] Testes rodam automaticamente
- [ ] Build automático
- [ ] Deploy configurado

---

### 4.2 - Migrar para Kubernetes

**Prioridade:** 🟢 BAIXA
**Tempo estimado:** 40 horas
**Responsável:** _______
**Status:** ☐ Não iniciado

#### Opções de Infraestrutura

##### Opção 1: Cloud Gerenciado (Recomendado)
- **AWS EKS** - Elastic Kubernetes Service
- **Google GKE** - Google Kubernetes Engine
- **Azure AKS** - Azure Kubernetes Service
- **DigitalOcean Kubernetes**

##### Opção 2: On-Premise (Servidor Próprio)
- **Minikube** - Desenvolvimento local
- **K3s** - Kubernetes leve para servidores pequenos
- **kubeadm** - Instalação completa do Kubernetes

#### Recomendação para SGC-ITEP

**Para Produção:**
- Se orçamento permite: **AWS EKS** ou **Google GKE**
- Orçamento limitado: **DigitalOcean Kubernetes** (mais barato)
- Servidor próprio: **K3s** (leve e eficiente)

**Especificações mínimas do cluster:**
- 3 nodes (1 master + 2 workers)
- 4 GB RAM por node
- 2 vCPUs por node
- 50 GB SSD por node

#### Solução - Kubernetes Manifests

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: sgc-itep
```

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: sgc-backend-config
  namespace: sgc-itep
data:
  NODE_ENV: "production"
  DATABASE_HOST: "postgres-service"
  DATABASE_PORT: "5432"
```

```yaml
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: sgc-secrets
  namespace: sgc-itep
type: Opaque
stringData:
  database-password: "CHANGE_ME"
  jwt-secret: "CHANGE_ME"
  session-secret: "CHANGE_ME"
```

```yaml
# k8s/postgres-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: sgc-itep
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16
        env:
        - name: POSTGRES_DB
          value: sgc
        - name: POSTGRES_USER
          value: sgc
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: sgc-secrets
              key: database-password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: sgc-itep
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sgc-backend
  namespace: sgc-itep
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sgc-backend
  template:
    metadata:
      labels:
        app: sgc-backend
    spec:
      containers:
      - name: backend
        image: sgc-itep-backend:latest
        envFrom:
        - configMapRef:
            name: sgc-backend-config
        env:
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: sgc-secrets
              key: database-password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: sgc-secrets
              key: jwt-secret
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: sgc-itep
spec:
  selector:
    app: sgc-backend
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

**Comandos de deploy:**
```bash
# Criar namespace
kubectl apply -f k8s/namespace.yaml

# Criar secrets (gerar valores fortes antes!)
kubectl apply -f k8s/secret.yaml

# Deploy database
kubectl apply -f k8s/postgres-deployment.yaml

# Deploy backend
kubectl apply -f k8s/backend-deployment.yaml

# Verificar status
kubectl get pods -n sgc-itep
kubectl get services -n sgc-itep
```

**Verificação:**
- [ ] Cluster Kubernetes configurado
- [ ] Manifests criados
- [ ] Aplicação deployada
- [ ] LoadBalancer funcionando
- [ ] Escalabilidade testada

---

### 4.3 - Implementar WAF

**Prioridade:** 🟢 BAIXA
**Tempo estimado:** 16 horas
**Responsável:** _______
**Status:** ☐ Não iniciado

#### Opções

**1. ModSecurity + Nginx (On-Premise)**
**2. AWS WAF (Cloud)**
**3. Cloudflare (CDN + WAF)**

Recomendação: **Cloudflare** (mais fácil e inclui DDoS)

#### Solução Cloudflare

1. Criar conta no Cloudflare
2. Adicionar domínio
3. Configurar DNS para apontar para Cloudflare
4. Ativar WAF rules
5. Configurar rate limiting

**Regras recomendadas:**
- OWASP Core Rule Set
- Block SQL Injection
- Block XSS
- Rate limiting: 100 req/min por IP
- Challenge em login excessivo

**Verificação:**
- [ ] WAF configurado
- [ ] Regras ativas
- [ ] Testes de segurança passam
- [ ] False positives corrigidos

---

### 4.4 - Logging Centralizado (ELK Stack)

**Prioridade:** 🟢 BAIXA
**Tempo estimado:** 12 horas
**Responsável:** _______
**Status:** ☐ Não iniciado

#### Solução

Adicionar ao docker-compose.yml:

```yaml
services:
  # ... serviços existentes

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: sgc-elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    container_name: sgc-logstash
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    ports:
      - "5000:5000"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: sgc-kibana
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

**Configurar Winston para Logstash:**

```bash
npm install winston winston-logstash-transport
```

```typescript
// src/config/logger.config.ts
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as LogstashTransport from 'winston-logstash-transport';

export const loggerConfig = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console(),
    new LogstashTransport({
      host: 'logstash',
      port: 5000,
    }),
  ],
});
```

**Verificação:**
- [ ] ELK Stack rodando
- [ ] Logs chegando no Elasticsearch
- [ ] Kibana acessível
- [ ] Dashboards criados

---

### 4.5 - Auditoria de Segurança

**Prioridade:** 🟢 BAIXA
**Tempo estimado:** Contratar serviço
**Responsável:** _______
**Status:** ☐ Não iniciado

#### Checklist de Segurança

**Antes de contratar pentest:**
- [ ] Todas correções críticas implementadas
- [ ] Backups testados
- [ ] Monitoramento ativo
- [ ] Documentação atualizada

**Serviços recomendados:**
- **Pentest:** Contratar empresa especializada
- **Bug Bounty:** HackerOne, Bugcrowd
- **Scan automatizado:** Snyk, SonarQube

**Ferramentas gratuitas:**
```bash
# OWASP ZAP
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://seu-app.com

# npm audit
npm audit --audit-level=moderate

# Dependency check
npm install -g snyk
snyk test
```

**Verificação:**
- [ ] Pentest realizado
- [ ] Vulnerabilidades corrigidas
- [ ] Relatório documentado
- [ ] Re-teste passou

---

## 📈 Métricas de Acompanhamento

### KPIs de Segurança
- [ ] 0 credenciais em código
- [ ] 0 vulnerabilidades críticas
- [ ] 100% endpoints com autenticação
- [ ] Rate limiting ativo
- [ ] CSRF proteção ativa

### KPIs de Qualidade
- [ ] >80% cobertura de testes
- [ ] 0 erros de TypeScript strict
- [ ] <10 avisos de linter
- [ ] Documentação Swagger completa

### KPIs de Performance
- [ ] <500ms tempo de resposta (p95)
- [ ] >99% uptime
- [ ] 0 N+1 queries críticas
- [ ] Cache hit ratio >60%

### KPIs de Infraestrutura
- [ ] Backups diários funcionando
- [ ] Backup offsite configurado
- [ ] Monitoramento 24/7
- [ ] Alertas configurados

---

## 🎯 Priorização Resumida

### Semana 1 (URGENTE)
- [x] 1.1 - Credenciais
- [x] 1.2 - CSRF
- [x] 1.3 - File validation
- [x] 1.4 - CSP

### Semana 2-3
- [x] 2.1 - SSL Database
- [x] 2.2 - TypeScript Strict (fase 1)
- [x] 2.4 - Rate Limiting

### Semana 4-6
- [x] 2.3 - Testes (fase 1)
- [x] 3.1 - Sentry
- [x] 3.2 - Query optimization

### Mês 2
- [x] 2.2 - TypeScript Strict (completo)
- [x] 2.3 - Testes (completo)
- [x] 3.3 - Redis Cache
- [x] 3.4 - Async files
- [x] 3.5 - Password validation
- [x] 3.6 - S3 Backup

### Mês 3-6
- [x] 4.1 - CI/CD
- [x] 4.2 - Kubernetes
- [x] 4.3 - WAF
- [x] 4.4 - ELK
- [x] 4.5 - Security Audit

---

## 📞 Contatos e Recursos

### Documentação
- NestJS: https://docs.nestjs.com
- TypeORM: https://typeorm.io
- Docker: https://docs.docker.com
- Kubernetes: https://kubernetes.io/docs

### Ferramentas de Segurança
- OWASP: https://owasp.org
- Snyk: https://snyk.io
- npm audit: Built-in

### Monitoramento
- Sentry: https://sentry.io
- Datadog: https://www.datadoghq.com
- New Relic: https://newrelic.com

---

## 📝 Log de Alterações

| Data | Fase | Item | Status | Observações |
|------|------|------|--------|-------------|
| 2025-11-15 | - | Roadmap criado | ✅ Completo | Versão inicial |
| | | | | |
| | | | | |

---

## ✅ Assinaturas

**Criado por:** Claude Code
**Revisado por:** _____________
**Aprovado por:** _____________
**Data de aprovação:** ___/___/______

---

**Última atualização:** 2025-11-15
**Próxima revisão:** ___/___/______
