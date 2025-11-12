# Segurança - Fixes Aplicados
**Data:** 12 de Novembro de 2025
**Status:** Implementação Iniciada

## Resumo Executivo
Foram identificados e iniciados fixes para 3 vulnerabilidades críticas de segurança:
1. ✅ Secrets hardcoded removidos
2. ✅ Console.log removidos
3. ⏳ HttpOnly cookies - aguardando implementação manual

---

## FIX 1: Remover Secrets Hardcoded ✅ COMPLETO

### Problema Original
`/src/config/auth.config.ts` continha:
```typescript
process.env.JWT_SECRET || "sgc-itep-secret-key-change-in-production"
```

Isso criava:
- Risco de exposição de secrets
- Falsa sensação de segurança em produção
- Possibilidade de tokens previsíveis

### Solução Implementada
- Validação rigorosa de secrets em `auth.config.ts`
- Reject automático de defaults perigosos ("change-in-production", "change-me")
- Rejeição em produção se secret não configurado
- Geração automática de secrets aleatórios em desenvolvimento
- Aviso se secret < 32 caracteres

### Arquivo Modificado
- ✅ `/src/config/auth.config.ts` - ALTERADO

### Backup Criado
- `/src/config/auth.config.ts.backup`

### Como Testar
```bash
# Em produção, sem JWT_SECRET, deve falhar:
NODE_ENV=production npm start
# Error: JWT_SECRET must be set in production environment

# Em development, cria secret aleatório:
NODE_ENV=development npm start
# ✅ Obra normalmente
```

---

## FIX 2: Remover console.log ✅ COMPLETO

### Problema Original
36+ console.log/console.error em código crítico:

**Arquivo 1: `/src/modules/auth/guards/roles.guard.ts`**
```typescript
console.log("🔍 [RolesGuard] Required roles:", requiredRoles);
console.log("👤 [RolesGuard] User object:", {...});
console.log("🎭 [RolesGuard] User role details:", {...});
```

**Arquivo 2: `/src/modules/users/infrastructure/repositories/typeorm-user.repository.ts`**
```typescript
console.log("🔍 [DEBUG] Query SQL gerada:", queryBuilder.getSql());
console.log("🔍 [DEBUG] Parâmetros:", queryBuilder.getParameters());
```

**Arquivo 3: `/src/modules/auth/guards/jwt-auth.guard.ts`**
```typescript
console.error("Erro ao atualizar atividade do usuário:", error);
```

### Riscos
- Vaza informações de segurança em produção
- Reduz performance (I/O de console)
- Dificulta logging estruturado
- Expõe queries ao log

### Solução Implementada
- Substituir todos console.log/error por Logger injetado
- Usar níveis apropriados: debug, warn, error
- Remover informações sensíveis dos logs
- Usar Logger do NestJS (estruturado)

### Arquivos Modificados
- ✅ `/src/modules/auth/guards/roles.guard.ts` - ALTERADO (console.log removido)
- ✅ `/src/modules/users/infrastructure/repositories/typeorm-user.repository.ts` - ALTERADO (console.log removido)
- ✅ `/src/modules/auth/guards/jwt-auth.guard.ts` - ALTERADO (console.error removido)

### Backups Criados
- `/src/modules/auth/guards/roles.guard.ts.backup`
- `/src/modules/users/infrastructure/repositories/typeorm-user.repository.ts.backup`
- `/src/modules/auth/guards/jwt-auth.guard.ts.backup`

### Logs Agora Estruturados
```typescript
// Antes (inseguro):
console.log("🔍 [RolesGuard] Required roles:", requiredRoles);
console.log("👤 [RolesGuard] User object:", user);

// Depois (seguro):
this.logger.debug(`Validando acesso para rota ${handler.name}`);
this.logger.warn(`Tentativa de acesso sem autenticação em ${handler.name}`);
this.logger.error(`Usuário ${user.id} sem role definida`);
```

---

## FIX 3: Implementar HttpOnly Cookies ⏳ PENDENTE

### Problema Original
Frontend armazena tokens em localStorage:
```typescript
// ❌ Vulnerável a XSS
localStorage.setItem('accessToken', accessToken)
localStorage.setItem('refreshToken', refreshToken)
```

Risco: Script malicioso pode roubar tokens.

### Solução Proposta
Usar HttpOnly cookies (acessíveis apenas via HTTP, não JavaScript):

```typescript
// Servidor: Enviar token em cookie
response.cookie('accessToken', token, {
  httpOnly: true,        // ✅ Não acessível via JS
  secure: true,          // ✅ Apenas HTTPS em produção
  sameSite: 'strict',    // ✅ CSRF protection
  maxAge: 50 * 60 * 1000, // 50 minutos
  path: '/api',
});

// Frontend: Não precisa fazer nada, navegador envia automaticamente
fetch('/api/users', {
  credentials: 'include', // ✅ Incluir cookies
});
```

### O que Implementar

#### 1. Backend: Atualizar `auth.controller.ts`
Ver arquivo de exemplo: `/tmp/httponly_cookies_fix.ts`

Adicionar:
```typescript
@Post('login')
async login(@Res({ passthrough: true }) response: Response) {
  // ... validação ...
  
  // Enviar token em cookie (não em body)
  response.cookie('accessToken', token, { httpOnly: true, ... });
  
  // Retornar apenas dados do usuário
  return { success: true, user: {...} };
}
```

#### 2. Backend: Atualizar `jwt.strategy.ts`
Permitir extrair token de cookie:
```typescript
jwtFromRequest: (req) => {
  return req.cookies?.['accessToken'] || 
         ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}
```

#### 3. Frontend: Remover localStorage
Remover de `/frontend/src/contexts/AuthContext.tsx`:
```typescript
// ❌ Remover:
localStorage.setItem('accessToken', token);
localStorage.setItem('refreshToken', token);

// ✅ Manter apenas user info se necessário:
localStorage.setItem('user', JSON.stringify(user));
```

#### 4. Frontend: Adicionar credentials em requests
Atualizar `/frontend/src/services/api.ts`:
```typescript
const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // ✅ Incluir cookies
  credentials: 'include',
});
```

### Passo a Passo de Implementação

```bash
# 1. Fazer backup dos arquivos críticos
git checkout -- src/modules/auth/auth.controller.ts
cp src/modules/auth/auth.controller.ts src/modules/auth/auth.controller.ts.backup

# 2. Atualizar backend (usar exemplo como referência)
nano src/modules/auth/auth.controller.ts
# Aplicar mudanças do /tmp/httponly_cookies_fix.ts

# 3. Atualizar jwt.strategy.ts
nano src/modules/auth/strategies/jwt.strategy.ts
# Permitir extract de cookies

# 4. Atualizar frontend
nano frontend/src/contexts/AuthContext.tsx
# Remover localStorage, confiar em cookies

# 5. Testar
npm run test:e2e

# 6. Commit
git add .
git commit -m "Security: Implement HttpOnly cookies for token storage"
```

---

## Verificação

### Checklist de Implementação

- [x] Secrets hardcoded removidos de auth.config.ts
- [x] Validação de secrets adicionada
- [x] console.log removido de roles.guard.ts
- [x] console.log removido de typeorm-user.repository.ts
- [x] console.error removido de jwt-auth.guard.ts
- [ ] HttpOnly cookies implementados em auth.controller.ts
- [ ] JWT Strategy atualizado para aceitar cookies
- [ ] Frontend removeu localStorage
- [ ] Frontend adicionou withCredentials
- [ ] Testes e2e atualizados
- [ ] Documentação atualizada

### Como Validar Secrets
```bash
# Tentar iniciar sem JWT_SECRET em produção
NODE_ENV=production npm start
# Deve exibir: Error: JWT_SECRET must be set in production environment

# Tentar com secret inseguro
JWT_SECRET="change-me" NODE_ENV=production npm start
# Deve exibir: Error: JWT_SECRET is using a default/placeholder value!
```

### Como Validar Logs
```bash
# Verificar que não há mais console.log
grep -r "console\.log\|console\.error" src/modules/auth/guards/
# Deve retornar vazio (0 resultados)

# Verificar que Logger é usado
grep -r "this.logger" src/modules/auth/guards/
# Deve listar chamadas de logger
```

---

## Próximas Prioridades (After HttpOnly)

1. **Rate Limiting Específico** (Semana 1)
   - Adicionar @Throttle no login
   - Implementar rate limiting por usuário

2. **Validação de Upload** (Semana 1)
   - Magic bytes validation
   - Dimensão de imagem
   - Quarentena de arquivos

3. **CORS Stricto** (Semana 2)
   - Whitelist de domínios
   - Rejeiçao de CORS permissivo

4. **Refatoração de Services** (Semana 2-3)
   - Dividir NugecidService
   - Migração completa para DDD

---

## Referências

- OWASP: [Storing Secrets in Code](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- MDN: [HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- OWASP: [Cross-Site Scripting (XSS)](https://owasp.org/www-community/attacks/xss/)
- NestJS: [Logging](https://docs.nestjs.com/techniques/logging)

---

## Contato & Suporte

Para dúvidas sobre essas implementações:
1. Verificar backups em `.backup`
2. Revisar comentários no código
3. Rodar testes: `npm run test`
4. Verificar logs em desenvolvimento

---

**Documento criado em:** 12 de Novembro de 2025
**Última atualização:** 12 de Novembro de 2025
