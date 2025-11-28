# 🔍 Análise de Módulos - SGC-ITEP-NESTJS

> **Data:** 2025-11-15
> **Módulos analisados:** Usuários, Desarquivamentos, Pastas, Tarefas, Projetos
> **Status:** Análise completa realizada

---

## 📊 RESUMO EXECUTIVO

| Módulo | Status | Crítico | Alto | Médio | Total |
|--------|--------|---------|------|-------|-------|
| Usuários | 🟡 OK | 2 | 3 | 4 | 9 |
| Desarquivamentos | 🟠 Atenção | 3 | 3 | 3 | 9 |
| Pastas/Arquivos | 🔴 Crítico | 4 | 4 | 2 | 10 |
| Tarefas | 🟠 Atenção | 2 | 4 | 3 | 9 |
| Projetos | 🔴 Duplicado | 1 | 0 | 0 | 1 |
| **TOTAL** | | **12** | **14** | **12** | **38** |

---

## 🚨 PROBLEMAS CRÍTICOS (12)

### 1. MÓDULO PROJETOS DUPLICADO

**Localização:**
- `src/modules/projetos/entities/projeto.entity.ts`
- `src/modules/tarefas/entities/projeto.entity.ts`

**Problema:** Mesma entidade definida em dois lugares
**Impacto:** 🔴 Confusão, possível inconsistência
**Prioridade:** CRÍTICA

**Solução:**
```bash
# Verificar diferenças
diff src/modules/projetos/entities/projeto.entity.ts \
     src/modules/tarefas/entities/projeto.entity.ts

# Decisão: Manter apenas em tarefas/ e deletar projetos/
rm -rf src/modules/projetos/
```

---

### 2. SQL INJECTION em Pastas

**Arquivo:** `src/modules/pastas/pastas.service.ts`
**Linhas:** 68-95

**Código problemático:**
```typescript
async createSchemaIfNeeded(): Promise<void> {
  const schemaName = 'public'; // OK se fixo
  await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
  // ❌ PERIGOSO se schemaName vier de variável dinâmica
}
```

**Impacto:** 🔴 SQL Injection potencial
**Prioridade:** CRÍTICA

**Solução:**
```typescript
// Se schema é sempre 'public', remover método
// OU validar estritamente:
const ALLOWED_SCHEMAS = ['public', 'dados'];
if (!ALLOWED_SCHEMAS.includes(schemaName)) {
  throw new Error('Schema inválido');
}
```

---

### 3. RACE CONDITION - Reordenação de Tarefas

**Arquivo:** `src/modules/tarefas/services/tarefas.service.ts`
**Linhas:** 694-744

**Código problemático:**
```typescript
async reorderTasks() {
  const tarefas = await this.find(...); // Query 1

  for (const tarefa of tarefas) {
    tarefa.ordem += 1;
    await this.save(tarefa); // Query 2, 3, 4...
  }
  // ❌ PROBLEMA: Entre find() e save(), outro usuário pode modificar
}
```

**Impacto:** 🔴 Ordem corrompida com usuários simultâneos
**Prioridade:** CRÍTICA

**Solução:**
```typescript
async reorderTasks(colunaId: string, fromOrder: number, toOrder: number) {
  // 1 query atômica, sem race condition
  await this.tarefaRepository
    .createQueryBuilder()
    .update(Tarefa)
    .set({ ordem: () => 'ordem + 1' })
    .where('coluna_id = :colunaId', { colunaId })
    .andWhere('ordem >= :fromOrder', { fromOrder })
    .andWhere('ordem < :toOrder', { toOrder })
    .execute();
}
```

---

### 4. TRANSAÇÕES AUSENTES

**Localizações:**
- `pastas.service.ts:622-677` - Upload de arquivo
- `tarefas.service.ts:521-632` - Mover tarefa
- `nugecid.controller.ts:101-117` - Criar desarquivamento

**Problema:**
```typescript
// ❌ SEM TRANSAÇÃO
async uploadArquivo(pasta, file) {
  const arquivo = await this.saveFileToDisk(file); // Passo 1
  const entity = await this.saveToDatabase(arquivo); // Passo 2
  await this.updatePastaCounters(pasta); // Passo 3
  // Se falhar no passo 3, arquivo fica órfão no disco
}
```

**Impacto:** 🔴 Dados inconsistentes se falhar no meio
**Prioridade:** CRÍTICA

**Solução:**
```typescript
// ✅ COM TRANSAÇÃO
async uploadArquivo(pasta, file) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const arquivo = await this.saveFileToDisk(file);
    const entity = await queryRunner.manager.save(arquivo);
    await queryRunner.manager.update(Pasta, pasta.id, {
      imagens: () => 'imagens + 1'
    });

    await queryRunner.commitTransaction();
    return entity;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    await this.deleteFile(arquivo.caminho); // Limpar arquivo
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

---

### 5-12. ÍNDICES FALTANDO NO BANCO

**Impacto:** 🔴 Queries lentas, sistema trava com muitos dados

**Migration necessária:**

```typescript
// src/migrations/XXXXX-AddCriticalIndexes.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCriticalIndexes1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // USUÁRIOS
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_users_usuario ON usuarios(usuario)`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_users_matricula ON usuarios(matricula) WHERE matricula IS NOT NULL`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_users_ultimo_login ON usuarios(ultimo_login DESC NULLS LAST)`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_users_role_ativo ON usuarios(role_id, ativo)`
    );

    // DESARQUIVAMENTOS
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_desarq_nome ON desarquivamentos(nome_completo)`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_desarq_nic ON desarquivamentos(numero_nic_laudo_auto)`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_desarq_processo ON desarquivamentos(numero_processo)`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_desarq_status_data ON desarquivamentos(status, data_solicitacao DESC)`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_desarq_criador ON desarquivamentos(created_by, status)`
    );

    // PASTAS
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_pasta_nome ON pastas(nome)`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_pasta_data ON pastas(data_criacao DESC)`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_pasta_tags ON pastas USING GIN(tags)`
    );

    // PASTA ARQUIVOS
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_arquivo_pasta ON pasta_arquivos(pasta_id, tipo)`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_arquivo_data ON pasta_arquivos(data_upload DESC)`
    );

    // TAREFAS
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_tarefa_projeto_coluna ON tarefas(projeto_id, coluna_id, ordem)`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_tarefa_responsavel ON tarefas(responsavel_id, prazo) WHERE prazo IS NOT NULL`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_tarefa_prioridade ON tarefas(prioridade, prazo DESC NULLS LAST)`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_tarefa_created ON tarefas(created_at DESC)`
    );

    // PROJETOS
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_projeto_criador ON projetos(criador_id)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // USUÁRIOS
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_usuario`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_matricula`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_ultimo_login`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_role_ativo`);

    // DESARQUIVAMENTOS
    await queryRunner.query(`DROP INDEX IF EXISTS idx_desarq_nome`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_desarq_nic`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_desarq_processo`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_desarq_status_data`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_desarq_criador`);

    // PASTAS
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pasta_nome`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pasta_data`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_pasta_tags`);

    // PASTA ARQUIVOS
    await queryRunner.query(`DROP INDEX IF EXISTS idx_arquivo_pasta`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_arquivo_data`);

    // TAREFAS
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tarefa_projeto_coluna`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tarefa_responsavel`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tarefa_prioridade`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tarefa_created`);

    // PROJETOS
    await queryRunner.query(`DROP INDEX IF EXISTS idx_projeto_criador`);
  }
}
```

**Como aplicar:**
```bash
# 1. Criar migration
npm run migration:create AddCriticalIndexes

# 2. Copiar código acima para o arquivo criado

# 3. Executar
npm run migration:run

# 4. Verificar
docker exec sgc-itep-nestjs-db-1 psql -U sgc -d sgc -c "\d+ usuarios"
```

---

## ⚠️ PROBLEMAS IMPORTANTES (14)

### 13. N+1 QUERIES - Usuários

**Arquivo:** `src/modules/users/infrastructure/repositories/typeorm-user.repository.ts`
**Linhas:** 29-32, 38-41

**Problema:**
```typescript
async findById(id: number) {
  return this.repo.findOne({
    where: { id },
    relations: ['role'], // ❌ Sempre carrega role mesmo sem usar
  });
}
```

**Impacto:** 🟠 2 queries quando precisa de 1
**Solução:**
```typescript
async findById(id: number, loadRole = false) {
  const query = this.repo.createQueryBuilder('u')
    .where('u.id = :id', { id });

  if (loadRole) {
    query.leftJoinAndSelect('u.role', 'r');
  }

  return query.getOne();
}
```

---

### 14. N+1 QUERIES - Desarquivamentos Dashboard

**Arquivo:** `src/modules/nugecid/infrastructure/repositories/desarquivamento.typeorm-repository.ts`
**Linhas:** 359-378

**Problema:**
```typescript
async getDashboardStats() {
  const desarquivamentos = await this.repo
    .createQueryBuilder('d')
    .leftJoin('d.responsavel', 'u') // ❌ JOIN mas não SELECT
    .getMany();

  // Para cada desarquivamento, acessa u.nome = nova query
  for (const d of desarquivamentos) {
    console.log(d.responsavel.nome); // Query extra!
  }
}
```

**Impacto:** 🟠 Para 100 registros = 101 queries
**Solução:**
```typescript
async getDashboardStats() {
  const desarquivamentos = await this.repo
    .createQueryBuilder('d')
    .leftJoin('d.responsavel', 'u')
    .addSelect(['u.id', 'u.nome']) // ✅ SELECT só o necessário
    .getMany();
}
```

---

### 15. N+1 QUERIES - Tarefas

**Arquivo:** `src/modules/tarefas/services/tarefas.service.ts`
**Linhas:** 370-407

**Problema:**
```typescript
async findOne(id: number) {
  const tarefa = await this.repo.findOne({ id }); // Query 1

  // Cada acesso abaixo = query extra
  tarefa.comentarios; // Query 2
  tarefa.checklists; // Query 3
  tarefa.anexos; // Query 4
  tarefa.responsavel; // Query 5

  return tarefa; // Total: 5 queries
}
```

**Impacto:** 🟠 5 queries quando precisa de 1
**Solução:**
```typescript
async findOne(id: number) {
  return this.repo
    .createQueryBuilder('t')
    .leftJoinAndSelect('t.comentarios', 'c')
    .leftJoinAndSelect('t.checklists', 'ch')
    .leftJoinAndSelect('t.anexos', 'a')
    .leftJoinAndSelect('t.responsavel', 'u')
    .where('t.id = :id', { id })
    .getOne(); // Total: 1 query
}
```

---

### 16. VALIDAÇÕES DE DTO FALTANDO

**Arquivo:** `src/modules/users/application/dto/create-user.dto.ts`

**Problema:**
```typescript
// ❌ ERRADO - Interface não valida em runtime
export interface CreateUserDto {
  nome: string;
  usuario: string;
  senha: string;
}
```

**Impacto:** 🟠 Dados inválidos chegam ao banco
**Solução:**
```typescript
// ✅ CORRETO - Classe com validação
import { IsString, IsNotEmpty, MinLength, Matches, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'Nome deve ser texto' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  nome: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @Matches(/^[a-z0-9_]+$/, {
    message: 'Usuário deve conter apenas letras minúsculas, números e underline'
  })
  usuario: string;

  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  senha: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  matricula?: string;
}
```

---

### 17. BLOQUEIO AUTOMÁTICO DE CONTAS

**Arquivo:** `src/modules/users/entities/user.entity.ts`

**Problemas:**
1. **Bloqueio automático não funciona**
   - Linhas 49-53: Campos `tentativasLogin` e `bloqueadoAte` existem
   - Mas nenhum código usa para bloquear automaticamente

**NOTA:** Campos `email` e `telefone` foram considerados mas NÃO SERÃO implementados conforme decisão do projeto.

**Solução:**

```typescript
// user.entity.ts
@Column({ unique: true, nullable: true })
email?: string;

@Column({ length: 20, nullable: true })
telefone?: string;

// auth.service.ts - adicionar na validação
async validateUser(usuario: string, senha: string) {
  const user = await this.usersRepo.findOne({ where: { usuario } });

  // Verificar se está bloqueado
  if (user.bloqueadoAte && new Date() < user.bloqueadoAte) {
    throw new UnauthorizedException(
      `Conta bloqueada até ${user.bloqueadoAte.toLocaleString()}`
    );
  }

  const valid = await bcrypt.compare(senha, user.senha);

  if (!valid) {
    // Incrementar tentativas
    user.tentativasLogin += 1;

    // Bloquear após 5 tentativas
    if (user.tentativasLogin >= 5) {
      user.bloqueadoAte = new Date(Date.now() + 30 * 60 * 1000); // 30min
      await this.usersRepo.save(user);
      throw new UnauthorizedException('Conta bloqueada por 30 minutos');
    }

    await this.usersRepo.save(user);
    throw new UnauthorizedException('Credenciais inválidas');
  }

  // Reset tentativas em login bem-sucedido
  user.tentativasLogin = 0;
  user.bloqueadoAte = null;
  await this.usersRepo.save(user);

  return user;
}
```

---

### 18-20. SOFT DELETE FALTANDO

**Problema:** Tarefas, Pastas e Projetos usam hard delete

**Impacto:** 🟠 Dados deletados por engano não podem ser recuperados

**Arquivos:**
- `src/modules/tarefas/entities/tarefa.entity.ts:96`
- `src/modules/pastas/entities/pasta.entity.ts`
- `src/modules/tarefas/entities/projeto.entity.ts`

**Solução:**
```typescript
import { DeleteDateColumn } from 'typeorm';

@Entity()
export class Tarefa {
  // ... outros campos

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
```

```bash
# Migration necessária
npm run migration:create AddSoftDelete
```

```typescript
// migration
public async up(queryRunner: QueryRunner) {
  await queryRunner.query(
    `ALTER TABLE tarefas ADD COLUMN deleted_at TIMESTAMP`
  );
  await queryRunner.query(
    `ALTER TABLE pastas ADD COLUMN deleted_at TIMESTAMP`
  );
  await queryRunner.query(
    `ALTER TABLE projetos ADD COLUMN deleted_at TIMESTAMP`
  );
}
```

---

### 21. CONTADORES DESINCRONIZADOS - Pastas

**Arquivo:** `src/modules/pastas/entities/pasta.entity.ts`
**Linhas:** 21-25

**Problema:**
```typescript
@Column({ default: 0 })
imagens: number; // ❌ Pode ficar diferente do COUNT real

@Column({ default: 0 })
planilhas: number;
```

**Impacto:** 🟠 Números incorretos na UI
**Solução:** Usar computed property ou COUNT query

```typescript
// Remover campos da entidade
// Adicionar método no service:
async getPastaWithCounts(id: string) {
  const pasta = await this.repo.findOne({ where: { id } });
  const counts = await this.arquivoRepo
    .createQueryBuilder('a')
    .select('a.tipo', 'tipo')
    .addSelect('COUNT(*)', 'count')
    .where('a.pasta_id = :id', { id })
    .groupBy('a.tipo')
    .getRawMany();

  return {
    ...pasta,
    imagens: counts.find(c => c.tipo === 'IMAGEM')?.count || 0,
    planilhas: counts.find(c => c.tipo === 'PLANILHA')?.count || 0,
  };
}
```

---

### 22-26. AUDITORIA INCOMPLETA

**Problema:** Falta rastrear QUEM modificou

**Arquivos afetados:**
- Pastas: sem `criadoPorId`
- Tarefas: sem `atualizadoPorId`
- Projetos: sem `atualizadoPorId`

**Solução:**
```typescript
@Column({ name: 'criado_por_id', nullable: true })
criadoPorId?: number;

@ManyToOne(() => User)
@JoinColumn({ name: 'criado_por_id' })
criadoPor?: User;

@Column({ name: 'atualizado_por_id', nullable: true })
atualizadoPorId?: number;

@ManyToOne(() => User)
@JoinColumn({ name: 'atualizado_por_id' })
atualizadoPor?: User;
```

---

## 💡 PLANO DE AÇÃO RECOMENDADO

### 🔴 SEMANA 1 (6-8 horas)

**Prioridade 1: Índices do Banco**
```bash
# Tempo: 2 horas
npm run migration:create AddCriticalIndexes
# Copiar código da seção 5-12
npm run migration:run
```

**Prioridade 2: Remover Duplicação de Projetos**
```bash
# Tempo: 1 hora
# Verificar se projetos/ é usado
grep -r "from.*projetos" src/
# Se não for usado, deletar
rm -rf src/modules/projetos/
```

**Prioridade 3: Adicionar Validações de DTO**
```bash
# Tempo: 3 horas
# Atualizar CreateUserDto, UpdateUserDto, CreateTarefaDto, etc
# Ver exemplo na seção 16
```

**Prioridade 4: Corrigir SQL Injection**
```bash
# Tempo: 30 minutos
# Ver seção 2
```

**Verificação:**
- [ ] Migrations executadas
- [ ] Índices criados (verificar com \d+)
- [ ] Projetos duplicados removidos
- [ ] DTOs validando corretamente
- [ ] SQL injection corrigido

---

### 🟡 SEMANA 2-3 (10-12 horas)

**Prioridade 5: Adicionar Transações**
```bash
# Tempo: 4 horas
# Atualizar pastas.service.ts, tarefas.service.ts
# Ver exemplo na seção 4
```

**Prioridade 6: Corrigir Race Condition**
```bash
# Tempo: 2 horas
# Atualizar tarefas.service.ts reorderTasks()
# Ver seção 3
```

**Prioridade 7: Otimizar N+1 Queries**
```bash
# Tempo: 4 horas
# Atualizar users.repository, desarquivamento.repository, tarefas.service
# Ver seções 13-15
```

**Prioridade 8: Adicionar Campos Faltando**
```bash
# Tempo: 2 horas
npm run migration:create AddMissingFields
# email, telefone em users
# criadoPorId em pastas
# atualizadoPorId em tarefas
```

**Verificação:**
- [ ] Transações funcionando
- [ ] Race condition corrigida
- [ ] N+1 queries otimizadas (testar com logs)
- [ ] Campos adicionados

---

### 🟢 SEMANAS 4-6 (8-10 horas)

**Prioridade 9: Soft Delete**
```bash
# Tempo: 3 horas
npm run migration:create AddSoftDelete
# Ver seção 18-20
```

**Prioridade 10: Bloqueio Automático de Contas**
```bash
# Tempo: 2 horas
# Atualizar auth.service.ts
# Ver seção 17
```

**Prioridade 11: Corrigir Contadores de Pastas**
```bash
# Tempo: 3 horas
# Ver seção 21
```

**Verificação:**
- [ ] Soft delete funcionando
- [ ] Bloqueio automático após 5 tentativas
- [ ] Contadores sincronizados

---

## 📊 GANHOS ESPERADOS

### Após Semana 1:
- ✅ Queries 50-90% mais rápidas (índices)
- ✅ Validação de dados funcionando
- ✅ Sem duplicação de código
- ✅ Sem SQL injection

### Após Semana 2-3:
- ✅ Dados sempre consistentes (transações)
- ✅ Sem corrupção de ordem de tarefas
- ✅ 60-80% menos queries ao banco
- ✅ Auditoria completa

### Após Semanas 4-6:
- ✅ Recuperação de dados deletados
- ✅ Contas protegidas contra brute force
- ✅ Dados sempre sincronizados

---

## 🎯 MÉTRICAS DE SUCESSO

### Performance
- [ ] Tempo de busca < 500ms (atualmente pode ser >2s)
- [ ] Queries por request < 5 (atualmente pode ser >20)
- [ ] Reordenação de tarefas < 100ms

### Segurança
- [ ] Todas validações de DTO implementadas
- [ ] Sem SQL injection
- [ ] Bloqueio automático funcionando

### Integridade de Dados
- [ ] Transações em todas operações críticas
- [ ] Soft delete em todas entidades principais
- [ ] Auditoria completa (quem criou/modificou)

---

## 📝 COMANDOS ÚTEIS

### Verificar Índices
```sql
-- Ver índices de uma tabela
\d+ usuarios

-- Ver índices de todas as tabelas
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Testar Performance
```sql
-- Ver plano de execução
EXPLAIN ANALYZE
SELECT * FROM usuarios WHERE usuario = 'teste';

-- Ver queries lentas
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Verificar N+1
```typescript
// Habilitar query logging
// ormconfig.ts
{
  logging: true,
  logger: 'advanced-console',
}

// Contar queries em um endpoint
let queryCount = 0;
typeorm.on('query', () => queryCount++);
await controller.findAll();
console.log('Total queries:', queryCount); // Deve ser < 5
```

---

**Documento completo. Pronto para implementação.**

---

_Última atualização: 2025-11-15_
