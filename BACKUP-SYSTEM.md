# Sistema de Backup Completo

## 📋 Visão Geral

O sistema de backup foi implementado para proteger tanto o **banco de dados** quanto os **arquivos físicos** (anexos das solicitações), garantindo que nenhum dado seja perdido em caso de restauração.

## 🔄 Tipos de Backup

### 1. Backup Completo (DB + Arquivos)
- **Formato**: `.tar.gz`
- **Conteúdo**:
  - Dump completo do banco PostgreSQL (`.sql`)
  - Diretório `uploads/` com todos os anexos
- **Frequência**: Diariamente às 2h da manhã (automático)
- **Acionamento manual**: `POST /api/backup/full`
- **Permissão**: Admin

### 2. Backup Incremental (Desarquivamentos)
- **Formato**: `.sql`
- **Conteúdo**: Apenas tabelas `desarquivamentos` e `desarquivamento_comments`
- **Frequência**: A cada 6 horas (automático)
- **Acionamento manual**: `POST /api/backup/desarquivamentos`
- **Permissão**: Admin, Coordenador

## 📦 Estrutura dos Backups

### Backup Completo (.tar.gz)
```
backup_full_2025-11-14T15-02-17.tar.gz
├── backup_full_2025-11-14T15-02-17.sql  (banco de dados)
└── uploads/
    ├── desarquivamentos/
    │   ├── arquivo1.png
    │   ├── arquivo2.jpeg
    │   └── ...
    ├── pastas/
    ├── planilhas/
    └── modelo.html
```

### Backup Incremental (.sql)
```
backup_desarquivamentos_2025-11-14T15-00-00.sql
└── [apenas tabelas de desarquivamentos]
```

## 🔧 API Endpoints

### Criar Backup Completo
```bash
POST /api/backup/full
Authorization: Bearer <token>
Role: admin
```

### Criar Backup de Desarquivamentos
```bash
POST /api/backup/desarquivamentos
Authorization: Bearer <token>
Role: admin, coordenador
```

### Listar Backups
```bash
GET /api/backup/list
Authorization: Bearer <token>
Role: admin, coordenador

Response:
{
  "total": 18,
  "backups": [
    {
      "filename": "backup_full_2025-11-14T15-02-17.tar.gz",
      "size": "1.1 MB",
      "created": "2025-11-14T15:02:17.000Z",
      "type": "full",
      "includesFiles": true  // indica que contém arquivos
    },
    {
      "filename": "backup_desarquivamentos_2025-11-14T15-00-00.sql",
      "size": "6.6 KB",
      "created": "2025-11-14T15:00:00.000Z",
      "type": "desarquivamentos",
      "includesFiles": false
    }
  ]
}
```

### Restaurar Backup
```bash
POST /api/backup/restore/:filename
Authorization: Bearer <token>
Role: admin

⚠️ ATENÇÃO: Esta operação:
- Sobrescreve o banco de dados atual
- Sobrescreve os arquivos do diretório uploads/
- Cria backup do uploads/ atual antes de sobrescrever
```

### Limpar Backups Antigos
```bash
POST /api/backup/clean
Authorization: Bearer <token>
Role: admin

# Remove backups com mais de 30 dias
```

## 🔄 Processo de Restauração

### Backup Completo (.tar.gz)

1. **Extração**: O arquivo `.tar.gz` é extraído em diretório temporário
2. **Backup de Segurança**: O diretório `uploads/` atual é copiado para `backups/uploads_old_<timestamp>`
3. **Restauração do Banco**: O arquivo `.sql` é restaurado no PostgreSQL
4. **Restauração de Arquivos**: O diretório `uploads/` do backup substitui o atual
5. **Limpeza**: Arquivos temporários são removidos

### Backup Incremental (.sql)

1. **Restauração**: O arquivo `.sql` é executado diretamente no banco
2. **Sem arquivos**: Apenas o banco é restaurado

## 📁 Armazenamento

- **Diretório**: `/app/backups` (dentro do container) → `./backups` (host)
- **Retenção**: 30 dias
- **Limpeza automática**: Após cada backup completo

## 🔐 Segurança

- Todos os endpoints protegidos com JWT
- Controle de acesso por roles (RBAC)
- Logs detalhados de todas as operações
- Backup de segurança do `uploads/` antes de restaurar

## 📊 Exemplo de Uso

### Via curl (para admins)

```bash
# 1. Fazer login
TOKEN=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"senha"}' \
  | jq -r '.token')

# 2. Criar backup completo
curl -X POST http://localhost:8080/api/backup/full \
  -H "Authorization: Bearer $TOKEN"

# 3. Listar backups
curl http://localhost:8080/api/backup/list \
  -H "Authorization: Bearer $TOKEN"

# 4. Restaurar backup (CUIDADO!)
curl -X POST http://localhost:8080/api/backup/restore/backup_full_2025-11-14T15-02-17.tar.gz \
  -H "Authorization: Bearer $TOKEN"
```

### Via Frontend

O sistema possui interface web para gerenciar backups através do módulo de administração.

## 🚨 Notas Importantes

1. **Backups automáticos**: Rodam via cron jobs do NestJS (`@nestjs/schedule`)
2. **Container Docker**: O sistema detecta automaticamente se está rodando em Docker
3. **Volumes**: O diretório `uploads/` é persistido via volume Docker (`app_uploads`)
4. **Performance**: Backups completos podem levar alguns segundos dependendo do tamanho do banco e dos arquivos

## 🐛 Troubleshooting

### Backup não inclui arquivos
- Verifique se o diretório `uploads/` existe
- Verifique permissões de leitura
- Confira os logs: `docker logs sgc-backend`

### Erro ao restaurar
- Certifique-se de que o backup é válido (`.tar.gz` para completo, `.sql` para incremental)
- Verifique espaço em disco
- Verifique conexão com o banco de dados

### Arquivos não encontrados após restauração
- Verifique se o backup usado era do tipo completo (`.tar.gz`)
- Backups incrementais (`.sql`) não incluem arquivos físicos
- Use apenas backups completos para restauração total

## ✅ Status do Sistema

- ✅ Backup de banco de dados
- ✅ Backup de arquivos físicos
- ✅ Compactação em tar.gz
- ✅ Restauração completa
- ✅ Backup automático agendado
- ✅ Limpeza automática de backups antigos
- ✅ API REST completa
- ✅ Controle de acesso por roles
- ✅ Logs detalhados

---

**Última atualização**: 14/11/2025
**Versão**: 2.0 (com suporte a arquivos físicos)
