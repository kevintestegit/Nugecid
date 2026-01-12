# SGC-ITEP v1.0 - Sistema de Gestão de Conteúdo

![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)

## 📋 Sobre o Projeto

O SGC-ITEP v1.0 é um sistema moderno de gestão de conteúdo desenvolvido para o Instituto Técnico-Científico de Perícia (ITEP/RN). Esta versão representa uma evolução completa do sistema anterior, implementando uma arquitetura de microserviços com foco em:

- **Gestão de Desarquivamentos (NUGECID)**
- **Controle de Acesso Baseado em Funções (RBAC)**
- **Auditoria Completa de Ações**
- **Interface Web Responsiva**
- **API RESTful Documentada**

## 🏗️ Arquitetura

### Stack Tecnológica

- **Backend**: Node.js + NestJS + TypeScript
- **Banco de Dados**: PostgreSQL em Docker
- **Autenticação**: JWT + Passport.js
- **Documentação**: Swagger/OpenAPI 3.0
- **Validação**: Class-validator + Class-transformer

### Padrões Arquiteturais

- **Arquitetura Hexagonal** (Portas e Adaptadores)
- **Domain-Driven Design (DDD)**
- **SOLID Principles**
- **Clean Code**

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js >= 18.0.0
- npm >= 8.0.0
- Git

### Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd sgc-itep-nestjs

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env

# Execute as migrações do banco de dados
npm run migration:run

# Execute os seeds (dados iniciais)
npm run seed
```

## 🏃‍♂️ Executando o Projeto

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod

# Debug
npm run start:debug
```

O sistema estará disponível em:
- **Frontend (Vite)**: http://localhost:3001
- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/health

## 🐳 Deploy com Docker Compose

O projeto inclui um fluxo padronizado para subir toda a stack em qualquer máquina com Docker:

- `./scripts/install.sh`: instala Docker e Docker Compose plugin em distribuições baseadas em Ubuntu (ex.: Zorin OS).
- `./scripts/run.sh`: garante `.env`, baixa imagens necessárias e sobe app, banco (`db`) e Adminer (`adminer`).
- `./scripts/stop.sh`: derruba os serviços em execução.

Backups e restauros são feitos via `./scripts/backup_db.sh` e `./scripts/restore_db.sh backups/sgc_YYYYMMDD_HHMMSS.dump`. Os arquivos `.dump` ficam em `backups/`, compartilhada com o container do Postgres via volume. Uploads persistem em um volume nomeado (`app_uploads`); para migrar entre máquinas:

```bash
# exportar uploads
docker run --rm -v sgc_app_uploads:/from -v "$(pwd)"/backups:/to alpine \
  sh -c "cd /from && tar -czf /to/uploads.tgz ."

# importar uploads
docker run --rm -v sgc_app_uploads:/to -v "$(pwd)"/backups:/from alpine \
  sh -c "cd /to && tar -xzf /from/uploads.tgz"
```

Portas padrão (sobreponha no `.env` conforme necessário):
- App: `HOST_HTTP_PORT` → 3000 (mapeia para `APP_PORT`)
- Banco: `HOST_DB_PORT` → 5432
- Adminer: `HOST_ADMINER_PORT` → 8081

Após o primeiro `run.sh`, revise o `.env` e ajuste segredos/senhas antes de colocar em produção.

## 👤 Preferências do Usuário

- Cada usuário pode definir foto de perfil; o backend salva o avatar em `/uploads/avatars` e expõe as rotas `POST /users/me/avatar` e `DELETE /users/me/avatar`.
- Preferências pessoais (tema, exibição de e-mail/telefone, salvamento automático, visualização compacta e itens por página) ficam persistidas em `usuarios.settings` (JSONB).
- O frontend lê essas preferências durante o login e aplica automaticamente o tema escolhido, mantendo comportamento consistente em novos acessos.
- Execute a migration `1762105000000-AddAvatarUrlToUsuarios` para adicionar a coluna `avatar_url` antes de aplicar as novas funcionalidades em produção.

## 🔒 Sistema de Backup

O SGC-ITEP possui um sistema automatizado de backup para proteção dos dados. Ver documentação completa em [`docs/BACKUP.md`](docs/BACKUP.md).

### Backups Automáticos

- **Backup Completo**: Diariamente às 2h da manhã
- **Backup de Desarquivamentos**: A cada 6 horas (0h, 6h, 12h, 18h)
- **Retenção**: 30 dias (limpeza automática)

### Uso Rápido

```bash
# Via CLI
./scripts/backup-cli.sh full              # Backup completo
./scripts/backup-cli.sh desarq            # Backup de desarquivamentos
./scripts/backup-cli.sh list              # Listar backups
./scripts/backup-cli.sh restore <arquivo> # Restaurar backup

# Via API
curl -X POST http://localhost:3000/backup/full \
  -H "Authorization: Bearer $SGC_TOKEN"
```

Os backups são salvos em `./backups/` e podem ser restaurados a qualquer momento.

## 📚 Documentação da API

### Endpoints Principais

#### Autenticação
- `POST /api/auth/login` - Login do usuário
- `POST /api/auth/logout` - Logout do usuário
- `GET /api/auth/profile` - Perfil do usuário autenticado
- `POST /api/auth/refresh` - Renovar token JWT

#### Usuários
- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário
- `GET /api/users/:id` - Buscar usuário por ID
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Excluir usuário

#### NUGECID (Desarquivamentos)
- `GET /api/nugecid` - Listar desarquivamentos
- `POST /api/nugecid` - Criar desarquivamento
- `GET /api/nugecid/:id` - Buscar desarquivamento por ID
- `PUT /api/nugecid/:id` - Atualizar desarquivamento
- `DELETE /api/nugecid/:id` - Excluir desarquivamento
- `POST /api/nugecid/import` - Importar planilha Excel
- `GET /api/nugecid/export` - Exportar para Excel
- `GET /api/nugecid/barcode/:codigo` - Buscar por código de barras

#### Backup
- `POST /api/backup/full` - Criar backup completo (admin)
- `POST /api/backup/desarquivamentos` - Backup de desarquivamentos (admin, coordenador)
- `GET /api/backup/list` - Listar backups disponíveis
- `POST /api/backup/restore/:filename` - Restaurar backup (admin)
- `POST /api/backup/clean` - Remover backups antigos (admin)

### Autenticação

A API utiliza autenticação JWT. Inclua o token no header:

```http
Authorization: Bearer <seu-jwt-token>
```
## 📁 Estrutura do Projeto

```
src/
├── modules/                 # Módulos da aplicação
│   ├── auth/               # Autenticação e autorização
│   ├── users/              # Gestão de usuários
│   ├── nugecid/            # NUGECID - Desarquivamentos
│   └── audit/              # Auditoria do sistema
├── common/                 # Recursos compartilhados
│   ├── decorators/         # Decorators customizados
│   ├── filters/            # Filtros de exceção
│   ├── guards/             # Guards de autenticação/autorização
│   ├── interceptors/       # Interceptors
│   └── pipes/              # Pipes de validação
├── config/                 # Configurações
├── database/               # Migrações e seeds
└── main.ts                 # Ponto de entrada da aplicação
```

## 🔐 Segurança

### Medidas Implementadas

- **Helmet.js** - Proteção de headers HTTP
- **Rate Limiting** - Limitação de requisições
- **CORS** - Controle de origem cruzada
- **Validação de Entrada** - Sanitização de dados
- **Criptografia de Senhas** - bcrypt
- **JWT Tokens** - Autenticação stateless
- **RBAC** - Controle de acesso baseado em funções

### Funções de Usuário

- **ADMIN** - Acesso total ao sistema
- **USUARIO** - Acesso limitado às próprias solicitações

## 📊 Monitoramento e Logs

### Auditoria

Todas as ações importantes são registradas:
- Login/Logout de usuários
- Criação/Edição/Exclusão de registros
- Tentativas de acesso não autorizado
- Erros do sistema

### Health Check

Endpoint `/api/health` fornece informações sobre:
- Status da aplicação
- Conectividade com banco de dados
- Uso de memória
- Tempo de atividade

## 🚀 Deploy

### Desenvolvimento

```bash
npm run start:dev
```

### Produção

```bash
# Build da aplicação
npm run build

# Executar migrações
npm run migration:run

# Iniciar aplicação
npm run start:prod
```

### Docker (Opcional)

```dockerfile
# Dockerfile exemplo
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
```

## 🤝 Contribuição

### Padrões de Código

- **ESLint** - Linting de código
- **Prettier** - Formatação de código
- **Conventional Commits** - Padrão de commits
- **Husky** - Git hooks (opcional)

### Fluxo de Desenvolvimento

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Changelog

### v1.0.0 (2025)

- ✨ Reescrita completa em NestJS + TypeScript
- 🏗️ Implementação de arquitetura hexagonal
- 🔐 Sistema de autenticação JWT + RBAC
- 📊 Dashboard com estatísticas em tempo real
- 📤 Import/Export de planilhas Excel
- 🔍 Busca por código de barras
- 📱 Interface responsiva
- 🧪 Cobertura de testes
- 📚 Documentação completa da API

## 📞 Suporte

Para suporte técnico ou dúvidas:

- **Email**: arquivo@pcirn.rn.gov.br

## 📄 Licença

Este projeto é propriedade do Instituto Técnico-Científico de Perícia (ITEP/RN) e é licenciado sob termos proprietários.

---

**Desenvolvido para a PCI/RN**

## Execução (atualizado)

- Backend produção: `npm run build:backend && npm run start:prod` (equivalente a `node dist/src/main.js`).
- Frontend: build e deploy separados na pasta `frontend/` (o backend não serve mais `frontend/dist`).

Para desenvolvimento:
- Backend: `npm run start:backend`
- Frontend: `npm run start:frontend` (em `frontend/`)


