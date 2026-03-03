# 🎯 Roadmap Priorizado - SGC-ITEP-NESTJS

> **Versão:** 2.0 - REVISADA E PRIORIZADA
> **Data:** 2025-11-15
> **Contexto:** Sistema em produção - Órgão Público - Recursos limitados
> **Foco:** Segurança + Estabilidade + Viabilidade

---

## 📋 RESUMO EXECUTIVO

Este roadmap foi **repriorizado** considerando:
- ✅ Sistema já em produção
- ✅ Backup funcionando (implementado recentemente)
- ✅ Recursos humanos e financeiros limitados
- ✅ Necessidade de mudanças graduais
- ✅ Foco em segurança real vs teórica

### Estatísticas Revisadas
- **Ações CRÍTICAS (fazer AGORA):** 2 (Credenciais será feita ao ativar sistema)
- **Ações IMPORTANTES (2-4 semanas):** 5
- **Ações RECOMENDADAS (1-3 meses):** 4
- **Ações FUTURAS (quando possível):** 7
- **Tempo total estimado:** 55-75 horas (vs 160 original)

### Atualização de Execução - 2026-03-06

Itens já concluídos fora da versão original deste roadmap:
- `Auth/logout/cookies`: logout limpa `access_token` e `connect.sid`; regra de `secure` foi alinhada com a configuração central.
- `Auth/refresh`: refresh token passou para cookie `httpOnly` (`refresh_token`), removendo a dependência de estado secreto em memória no frontend e endurecendo o contrato do login JSON.
- `Ambiente/deploy`: redirect raiz usa `FRONTEND_URL`, `FRONTEND_URL` voltou a ser obrigatório em produção e CSP foi ajustada para as fontes externas realmente usadas.
- `Frontend auth`: checagem inicial de sessão e refresh deixaram de manter UI autenticada stale.
- `Frontend operacional`: `getDesarquivamentos` voltou a propagar erro real; Carnaval e Corpus Christi foram corrigidos para `ponto_facultativo`.
- `Acessibilidade/consistência`: `PrazosCalendar` agora tem interação por clique/foco/teclado; `NugecidLogo` usa IDs SVG únicos; listeners globais ficaram seguros para HMR.
- `Validação`: backend e frontend foram revalidados com testes, typecheck e build.

Próximo foco recomendado:
- consolidar a estratégia de autenticação
- revisar padrão de deploy/configuração por ambiente
- priorizar observabilidade e backlog operacional

Backlog de produto consolidado:
- ver `docs/planning/BACKLOG-PRODUTO-PRIORIZADO.md`

### ⚠️ DECISÕES DO PROJETO
- **Email/Telefone em User:** NÃO SERÁ IMPLEMENTADO conforme decisão do projeto
- **Rotação de Credenciais:** Será feita quando o sistema for ativado (não agora)

---

## 🚨 NÍVEL 1: SEGURANÇA CRÍTICA (FAZER ESTA SEMANA)

### ⚡ Ações que NÃO PODEM esperar

---

### 1.1 - ⚠️ Rotação de Credenciais Expostas

**Por que é CRÍTICO:** Senhas visíveis no código = porta aberta para invasão
**Impacto:** 🔴 Sistema comprometido
**Tempo:** 30 minutos
**Complexidade:** 🟢 Baixa
**Status:** ☐ URGENTE

#### Ação Imediata

```bash
# 1. Gerar novos secrets (executar e anotar os valores)
node -e "console.log('JWT:', require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('SESSION:', require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('DB:', require('crypto').randomBytes(24).toString('base64'))"

# 2. Atualizar .env
nano .env
# Substituir:
# POSTGRES_PASSWORD=NOVO_VALOR_GERADO
# JWT_SECRET=NOVO_JWT_GERADO
# SESSION_SECRET=NOVO_SESSION_GERADO

# 3. Remover .env do git (se estiver commitado)
git rm --cached .env
echo ".env" >> .gitignore
git add .gitignore
git commit -m "security: Remove credentials from version control"

# 4. Atualizar senha do banco
docker exec -it sgc-itep-nestjs-db-1 psql -U sgc -d sgc -c "ALTER USER sgc WITH PASSWORD 'NOVO_VALOR_GERADO';"

# 5. Reiniciar sistema
docker compose down && docker compose up -d

# 6. Verificar se funciona
curl http://localhost:8080/api/health
```

**Verificação Final:**
- [ ] Novos secrets gerados e anotados em local seguro
- [ ] .env atualizado
- [ ] .env REMOVIDO do git
- [ ] Senha do banco alterada
- [ ] Sistema reiniciado
- [ ] Login funciona normalmente

---

### 1.2 - 🔒 Validação de Upload por Magic Bytes

**Por que é CRÍTICO:** Arquivos maliciosos podem ser enviados atualmente
**Impacto:** 🔴 Malware/virus podem infectar o sistema
**Tempo:** 3 horas
**Complexidade:** 🟡 Média
**Status:** ☐ URGENTE

#### Implementação Simplificada

```bash
# Instalar biblioteca
npm install file-type
```

**Criar arquivo:** `src/common/utils/file-validator.ts`

```typescript
import { BadRequestException } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';

export class FileValidator {
  private static readonly ALLOWED_IMAGES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  private static readonly ALLOWED_DOCS = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  static async validateImage(buffer: Buffer): Promise<void> {
    const type = await fileTypeFromBuffer(buffer);

    if (!type || !this.ALLOWED_IMAGES.includes(type.mime)) {
      throw new BadRequestException(
        `Tipo de arquivo não permitido. Use: JPG, PNG, GIF ou WebP`
      );
    }
  }

  static async validateDocument(buffer: Buffer): Promise<void> {
    const type = await fileTypeFromBuffer(buffer);

    if (!type || !this.ALLOWED_DOCS.includes(type.mime)) {
      throw new BadRequestException(
        `Tipo de documento não permitido. Use: PDF, Word ou Excel`
      );
    }
  }
}
```

**Atualizar:** `src/modules/nugecid/nugecid-anexos.service.ts`

```typescript
import { FileValidator } from '../../common/utils/file-validator';

// No método uploadAnexo, ANTES da validação de MIME:
await FileValidator.validateImage(file.buffer);
```

**Atualizar:** `src/modules/users/users.controller.ts` (upload de avatar)

```typescript
import { FileValidator } from '../../common/utils/file-validator';

// No método uploadMyAvatar:
await FileValidator.validateImage(file.buffer);
```

**Verificação:**
- [ ] file-type instalado
- [ ] FileValidator criado
- [ ] nugecid-anexos atualizado
- [ ] users.controller atualizado
- [ ] Teste: renomear .exe para .jpg → deve bloquear
- [ ] Teste: upload normal de imagem → deve funcionar

---

### 1.3 - 🛡️ Rate Limiting Ajustado

**Por que é CRÍTICO:** Sistema vulnerável a brute force
**Impacto:** 🟠 Tentativas ilimitadas de senha
**Tempo:** 1 hora
**Complexidade:** 🟢 Baixa
**Status:** ☐ URGENTE

#### Solução Rápida

**Atualizar:** `src/main.ts` (já existe rate limiting, apenas ajustar)

```typescript
// ENCONTRAR esta seção (linha ~72):
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // ← MUDAR ESTE VALOR
    message: 'Muitas requisições deste IP, tente novamente mais tarde',
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// SUBSTITUIR POR:
const createRateLimiter = (max: number, message: string) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
  });

// Rate limit geral
app.use('/api/', createRateLimiter(300, 'Muitas requisições. Aguarde 15 minutos'));

// Rate limit de login (mais restritivo)
app.use(
  '/api/auth/login',
  createRateLimiter(10, 'Muitas tentativas de login. Aguarde 15 minutos'),
);
```

**Verificação:**
- [ ] Código atualizado
- [ ] Sistema reiniciado
- [ ] Teste: 11 logins errados → deve bloquear
- [ ] Aguardar 15min → deve liberar novamente

---

## ⚠️ NÍVEL 2: IMPORTANTE (2-4 SEMANAS)

### 🎯 Ações importantes mas não urgentes

---

### 2.1 - 📊 Monitoramento com Sentry

**Por que é IMPORTANTE:** Ver erros em produção antes dos usuários reclamarem
**Impacto:** 🟡 Melhor suporte e detecção de bugs
**Tempo:** 2 horas
**Custo:** Grátis até 5k eventos/mês
**Status:** ☐ Recomendado

#### Setup Rápido

1. Criar conta: https://sentry.io (usar email institucional)
2. Criar projeto NestJS
3. Copiar DSN

```bash
npm install @sentry/node
```

**Adicionar ao `src/main.ts`** (no início da função bootstrap):

```typescript
import * as Sentry from '@sentry/node';

async function bootstrap() {
  // ANTES de criar o app
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1, // 10% das transações
    });
  }

  const app = await NestFactory.create(AppModule);
  // ... resto do código
}
```

**Adicionar ao `.env`:**
```bash
SENTRY_DSN=https://seu-dsn@sentry.io/projeto
```

**Verificação:**
- [ ] Conta Sentry criada
- [ ] SDK instalado
- [ ] DSN configurado
- [ ] Erro de teste aparece no dashboard

---

### 2.2 - 🔍 TypeScript Strict Mode (Fase 1)

**Por que é IMPORTANTE:** Prevenir bugs de tipo
**Impacto:** 🟡 Menos bugs em produção
**Tempo:** 6-8 horas
**Status:** ☐ Recomendado

#### Abordagem Incremental

**Etapa 1: strictNullChecks apenas**

```json
// tsconfig.json
{
  "compilerOptions": {
    "strictNullChecks": true
  }
}
```

```bash
# Compilar e ver erros
npm run build

# Corrigir erros do tipo:
# ANTES: user.name
# DEPOIS: user?.name ou if (user) { user.name }
```

**NÃO fazer tudo de uma vez.** Corrigir aos poucos:
- Semana 1: Módulo auth
- Semana 2: Módulo users
- Semana 3: Módulo nugecid
- Semana 4: Resto

**Verificação:**
- [ ] strictNullChecks habilitado
- [ ] Build passa sem erros
- [ ] Testes passam
- [ ] Sistema funciona normalmente

---

### 2.3 - 🔐 Validação de Senha Forte

**Por que é IMPORTANTE:** Senhas fracas facilitam invasão
**Impacto:** 🟡 Segurança de contas
**Tempo:** 1 hora
**Status:** ☐ Recomendado

#### Solução

**Atualizar:** `src/modules/users/application/dto/create-user.dto.ts`

```typescript
import { MinLength, Matches } from 'class-validator';

export class CreateUserDto {
  // ... outros campos

  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Senha deve conter letra maiúscula, minúscula e número',
  })
  senha: string;
}
```

**Atualizar:** `src/modules/users/application/dto/update-user.dto.ts` (mesma validação)

**Verificação:**
- [ ] Validação aplicada
- [ ] Senha "123" é rejeitada
- [ ] Senha "Senha123" é aceita
- [ ] Mensagem de erro clara para usuários

---

### 2.4 - ⚡ Async File Operations

**Por que é IMPORTANTE:** Evitar travamento do servidor em uploads
**Impacto:** 🟡 Performance
**Tempo:** 2 horas
**Status:** ☐ Recomendado

#### Solução

**Buscar e substituir** em todos os arquivos:

```typescript
// ANTES:
import * as fs from 'fs';
fs.writeFileSync(path, data);
fs.readFileSync(path);
fs.unlinkSync(path);

// DEPOIS:
import { promises as fs } from 'fs';
await fs.writeFile(path, data);
await fs.readFile(path);
await fs.unlink(path);
```

**Arquivos a atualizar:**
- `src/modules/nugecid/nugecid-anexos.service.ts`
- `src/modules/users/users.controller.ts`
- `src/modules/announcements/announcements.service.ts`

**Verificação:**
- [ ] Todos os `fs.writeFileSync` removidos
- [ ] Upload/download funciona
- [ ] Performance melhorou

---

### 2.5 - 📈 Otimizar Queries do Banco

**Por que é IMPORTANTE:** Queries lentas afetam usuários
**Impacto:** 🟡 Performance
**Tempo:** 4 horas
**Status:** ☐ Recomendado

#### Ação 1: Remover Eager Loading

**Atualizar:** `src/modules/audit/entities/auditoria.entity.ts`

```typescript
// ANTES:
@ManyToOne(() => User, { eager: true })

// DEPOIS:
@ManyToOne(() => User, { eager: false })
```

#### Ação 2: Adicionar Índices

```bash
npm run migration:create AddSearchIndexes
```

```typescript
// src/migrations/XXXXX-AddSearchIndexes.ts
export class AddSearchIndexes1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_desarquivamento_nome ON desarquivamentos(nome_completo)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_desarquivamento_nic ON desarquivamentos(numero_nic_laudo_auto)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_usuario ON users(usuario)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_desarquivamento_nome`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_desarquivamento_nic`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_usuario`);
  }
}
```

```bash
npm run migration:run
```

**Verificação:**
- [ ] Eager loading removido
- [ ] Migration executada
- [ ] Busca mais rápida (testar com muitos registros)

---

## 💡 NÍVEL 3: MELHORIAS (1-3 MESES)

### 🚀 Quando tiver tempo/recursos

---

### 3.1 - 🗄️ Cache Redis

**Benefício:** Reduzir carga no banco
**Tempo:** 6 horas
**Custo:** Grátis (já tem Docker)
**Status:** ☐ Opcional

Ver `ROADMAP-MELHORIAS.md` seção 3.3 para detalhes completos.

**Quando implementar:**
- Sistema com >100 usuários simultâneos
- OU queries ficando lentas
- OU banco sobrecarregado

---

### 3.2 - 🧪 Testes Unitários

**Benefício:** Evitar regressões
**Tempo:** 20-30 horas
**Status:** ☐ Opcional

**Prioridade de testes:**
1. AuthService (login, validação)
2. Guards (JWT, Roles)
3. FileValidator
4. Serviços críticos de negócio

**Meta realista:** 60% de cobertura em código crítico

Ver `ROADMAP-MELHORIAS.md` seção 2.3 para detalhes.

---

### 3.3 - 📦 Backup para S3/Cloud

**Benefício:** Proteção contra falha do servidor
**Tempo:** 4 horas
**Custo:** ~R$5-20/mês
**Status:** ☐ Opcional

**Quando implementar:**
- Backup local já funcionando (✅ FEITO)
- Dados críticos aumentando
- Possibilidade de perda de hardware

Ver `ROADMAP-MELHORIAS.md` seção 3.6 para detalhes.

---

### 3.4 - 🔒 Implementar CSRF Protection

**Benefício:** Proteção contra ataques cross-site
**Tempo:** 2 horas
**Status:** ☐ Opcional (baixo risco atual)

**Contexto:** Se o sistema usa principalmente API REST com JWT (sem sessões HTML), o risco de CSRF é menor.

**Quando implementar:**
- Se tiver muitos formulários HTML
- Se usar autenticação baseada em sessão
- Se não estiver usando apenas SPA (React/Vue)

---

## 🌟 NÍVEL 4: FUTURO (6+ MESES)

### 📅 Quando expandir infraestrutura

---

### 4.1 - ☁️ Migração para Cloud/Kubernetes

**Quando considerar:**
- Sistema crescer muito (>1000 usuários)
- Precisar de alta disponibilidade (99.9% uptime)
- Ter orçamento para infraestrutura (~R$200-500/mês)

**Opções:**
1. **DigitalOcean Kubernetes** - R$60-120/mês (mais barato)
2. **AWS EKS / Google GKE** - R$400-800/mês (mais robusto)
3. **K3s em servidor próprio** - Grátis (se tiver servidor)

---

### 4.2 - 🛡️ WAF + DDoS Protection

**Quando considerar:**
- Sistema público na internet
- Recebendo ataques
- Tráfego alto

**Opção mais simples:** Cloudflare (grátis básico)

---

### 4.3 - 📊 ELK Stack (Logs Centralizados)

**Quando considerar:**
- Múltiplos servidores
- Difícil debugar problemas
- Equipe grande

**Alternativa mais simples:** Sentry já faz 80% disso

---

### 4.4 - 🔍 CI/CD Pipeline

**Quando considerar:**
- Equipe >2 desenvolvedores
- Deploys frequentes
- Precisa de testes automáticos

---

### 4.5 - 🏆 Auditoria de Segurança (Pentest)

**Quando considerar:**
- Dados muito sensíveis
- Conformidade legal necessária
- Sistema maduro e estável

**Custo:** R$5.000 - R$20.000 (profissional)

---

## 📊 CRONOGRAMA RECOMENDADO

### 🔥 Semana 1 (CRÍTICO - 8h)
```
Segunda    [████] 1.1 Rotação de Credenciais (30min)
Terça      [████] 1.2 File Validation - Parte 1 (2h)
Quarta     [████] 1.2 File Validation - Parte 2 (1h)
Quinta     [████] 1.3 Rate Limiting (1h)
Sexta      [████] Testes e Validação (3h)
```

### 📅 Semanas 2-3 (IMPORTANTE - 12h)
```
Semana 2   [████] 2.1 Sentry (2h)
           [████] 2.3 Validação de Senha (1h)
           [████] 2.4 Async Files (2h)
Semana 3   [████] 2.2 TypeScript Strict - Fase 1 (4h)
           [████] 2.5 Query Optimization (3h)
```

### 📆 Mês 2 (MELHORIAS - 10h)
```
Flexível   [    ] 3.1 Redis Cache (6h)
           [    ] 3.2 Testes Básicos (4h)
```

### 🎯 Meses 3-6 (OPCIONAL)
```
Conforme necessidade e recursos
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Para Aprovar Este Roadmap

**Gestão deve responder:**

- [ ] **Recursos Humanos:**
  - Temos 1 desenvolvedor disponível?
  - Pode dedicar 8h na primeira semana?
  - Pode dedicar 4-6h/semana nas próximas 3 semanas?

- [ ] **Recursos Técnicos:**
  - Temos ambiente de testes/homologação?
  - Podemos fazer mudanças gradualmente?
  - Temos como reverter se algo der errado?

- [ ] **Aprovações:**
  - Podemos mudar senhas do banco de dados?
  - Podemos modificar código em produção?
  - Podemos investir em ferramentas (Sentry grátis)?

- [ ] **Riscos Aceitos:**
  - Entendemos que Nível 1 é URGENTE
  - Entendemos que Nível 2 é importante mas não urgente
  - Entendemos que Níveis 3-4 podem esperar

### Para Cada Implementação

**Antes de começar:**
- [ ] Backup completo realizado
- [ ] Ambiente de testes disponível
- [ ] Responsável definido
- [ ] Tempo estimado aprovado

**Após implementar:**
- [ ] Testes realizados
- [ ] Sistema funcionando
- [ ] Documentação atualizada
- [ ] Equipe treinada (se necessário)

---

## 🎯 MÉTRICAS DE SUCESSO

### Após Nível 1 (1 semana)
- ✅ 0 credenciais expostas em código
- ✅ 0 arquivos maliciosos aceitos
- ✅ Máximo 10 tentativas de login por IP
- ✅ Sistema funcionando normalmente

### Após Nível 2 (1 mês)
- ✅ Erros reportados automaticamente (Sentry)
- ✅ Código TypeScript mais seguro
- ✅ Senhas fortes obrigatórias
- ✅ Queries 30-50% mais rápidas

### Após Nível 3 (3 meses)
- ✅ Cache reduzindo carga do banco
- ✅ Testes cobrindo código crítico
- ✅ Backup offsite configurado

---

## 💰 ESTIMATIVA DE CUSTOS

### Custos Necessários (Nível 1-2)
- **Total:** R$ 0,00
- Sentry: Grátis (até 5k eventos/mês)
- Demais: Apenas tempo de desenvolvimento

### Custos Opcionais (Nível 3)
- Backup S3: R$ 10-30/mês
- Redis Cloud (alternativa): R$ 0 (grátis local)
- **Total:** R$ 10-30/mês

### Custos Futuros (Nível 4)
- Kubernetes: R$ 60-800/mês (depende da plataforma)
- WAF/CDN: R$ 0-200/mês (Cloudflare grátis básico)
- Pentest: R$ 5.000+ (uma vez)
- **Total:** Conforme expansão

---

## 📞 PRÓXIMOS PASSOS

### 1. VALIDAÇÃO (HOJE)
- [ ] Revisar este documento
- [ ] Aprovar cronograma
- [ ] Definir responsável
- [ ] Confirmar disponibilidade

### 2. PREPARAÇÃO (AMANHÃ)
- [ ] Criar backup completo
- [ ] Preparar ambiente de testes
- [ ] Separar 30 minutos para item 1.1

### 3. EXECUÇÃO (ESTA SEMANA)
- [ ] Implementar Nível 1 (8 horas)
- [ ] Testar cada item
- [ ] Documentar mudanças

### 4. CONTINUAÇÃO (PRÓXIMAS SEMANAS)
- [ ] Iniciar Nível 2 conforme cronograma
- [ ] Revisar progresso semanalmente
- [ ] Ajustar prioridades se necessário

---

## 📝 DECISÕES NECESSÁRIAS

### Para Aprovar e Começar:

**SIM ou NÃO:**

1. [ ] **APROVADO** - Implementar Nível 1 esta semana (CRÍTICO)
2. [ ] **APROVADO** - Implementar Nível 2 em 2-4 semanas (IMPORTANTE)
3. [ ] **APROVADO** - Considerar Nível 3 em 1-3 meses (MELHORIAS)
4. [ ] **DECIDIR DEPOIS** - Nível 4 quando necessário (FUTURO)

**Responsável pela implementação:**
Nome: ___________________________
Cargo: ___________________________
Disponibilidade: _______ horas/semana

**Aprovador:**
Nome: ___________________________
Cargo: ___________________________
Data: ____/____/______

---

## 📌 RESUMO PARA GESTÃO

### O que PRECISA ser feito:
1. **Trocar senhas expostas** (30 min) - URGENTE
2. **Proteger upload de arquivos** (3h) - URGENTE
3. **Limitar tentativas de login** (1h) - URGENTE

### O que É IMPORTANTE:
4. **Monitorar erros** (2h) - Recomendado
5. **Melhorar validações** (3h) - Recomendado
6. **Otimizar performance** (6h) - Recomendado

### O que pode ESPERAR:
7. Cache, testes, cloud - Quando tiver recursos

### Investimento Total Necessário:
- **Tempo:** 20-30 horas em 1 mês
- **Dinheiro:** R$ 0 (tudo grátis)
- **Risco:** Baixo (mudanças graduais)
- **Benefício:** Alto (segurança + performance)

---

**Documento revisado e pronto para validação.**
**Aguardando aprovação para início da implementação.**

---

_Última atualização: 2025-11-15_
_Próxima revisão: Após conclusão do Nível 1_
