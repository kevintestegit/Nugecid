# 👥 Funcionalidade de Usuários Online - SGC-ITEP

## 📋 Visão Geral

A funcionalidade de **Usuários Online** permite rastrear e exibir em tempo real quais usuários estão ativos no sistema SGC-ITEP. Esta feature é exibida no dashboard principal e fornece informações valiosas sobre a atividade do sistema.

## 🎯 Funcionalidades

### **Rastreamento em Tempo Real**
- ✅ Detecção automática de usuários logados
- ✅ Atualização de atividade em cada requisição autenticada
- ✅ Limpeza automática de usuários inativos (5+ minutos)
- ✅ Persistência em memória com Map otimizado

### **Interface no Dashboard**
- ✅ Box dedicada no sidebar direito
- ✅ Lista de até 5 usuários mais recentes
- ✅ Indicador de contagem adicional (+X outros)
- ✅ Status visual com cores e ícones
- ✅ Atualização automática a cada 30 segundos

### **Backend Robusto**
- ✅ Endpoint RESTful `/api/auth/online-users`
- ✅ Endpoint de debug `/api/auth/online-users/debug`
- ✅ Integração com sistema de autenticação JWT
- ✅ Logs detalhados para monitoramento

## 🔧 Implementação Técnica

### **Arquitetura do Sistema**

```
Frontend (React)          Backend (NestJS)
    ↓                          ↓
useOnlineUsers() ──HTTP──→ AuthController
    ↓                          ↓
DashboardPage ──React Query─→ AuthService
    ↓                          ↓
UI Components ──Polling─────→ Map<number, Activity>
```

### **Componentes Principais**

#### **1. AuthService (`src/modules/auth/auth.service.ts`)**
```typescript
// Mapa de usuários online
private onlineUsers = new Map<number, { lastActivity: Date }>();

// Métodos principais
async getOnlineUsers(): Promise<OnlineUser[]>
async updateUserActivity(userId: number): Promise<void>
async cleanupInactiveUsers(): Promise<void>
```

#### **2. AuthController (`src/modules/auth/auth.controller.ts`)**
```typescript
@Get('online-users') // Endpoint principal
@Get('online-users/debug') // Endpoint de debug
```

#### **3. JwtAuthGuard (`src/modules/auth/guards/jwt-auth.guard.ts`)**
```typescript
// Atualiza atividade em cada requisição autenticada
handleRequest(err, user, info, context) {
  if (user?.id) {
    this.authService.updateUserActivity(user.id);
  }
  return user;
}
```

#### **4. Hook React (`frontend/src/hooks/useOnlineUsers.ts`)**
```typescript
export function useOnlineUsers() {
  return useQuery({
    queryKey: ['onlineUsers'],
    queryFn: async () => {
      const response = await api.get('/auth/online-users');
      return response.data;
    },
    refetchInterval: 30000, // 30 segundos
    staleTime: 15000, // 15 segundos
  });
}
```

#### **5. DashboardPage (`frontend/src/pages/DashboardPage.tsx`)**
```typescript
const { data: onlineUsers, isLoading, error } = useOnlineUsers();

// Renderização condicional
{onlineUsers && onlineUsers.length > 0 ? (
  // Lista de usuários
) : (
  // Mensagem "Nenhum usuário online"
)}
```

## 🧪 Testes e Validação

### **Script de Teste Automatizado**

Execute o script de teste para validar a funcionalidade:

```bash
# Configurar token de teste
export TEST_USER_TOKEN="seu_jwt_token_aqui"

# Executar testes
node scripts/test-online-users.js
```

### **Testes Manuais**

#### **1. Teste via Browser**
```javascript
// No console do navegador (F12)
fetch('/api/auth/online-users', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log('Usuários online:', data));
```

#### **2. Teste via cURL**
```bash
curl -X GET "http://localhost:3000/api/auth/online-users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### **3. Teste de Debug**
```bash
curl -X GET "http://localhost:3000/api/auth/online-users/debug" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### **Cenários de Teste**

| Cenário | Resultado Esperado | Comando |
|---------|-------------------|---------|
| Usuário logado ativo | Aparece na lista | Login + requisição |
| Usuário inativo (5min+) | Removido automaticamente | Aguardar 5 minutos |
| Múltiplos usuários | Lista paginada (5+contador) | Múltiplos logins |
| Token expirado | Erro 401 | Usar token inválido |
| Backend offline | Erro de conectividade | Parar servidor |

## 📊 Monitoramento e Logs

### **Logs do Backend**
```
[AuthService] Login bem-sucedido para usuário: admin
[AuthService] Atividade atualizada para usuário 1
[ONLINE-USERS] Retornando 2 usuários online
[DEBUG] Informações de debug: {...}
```

### **Logs do Frontend**
```
[FRONTEND] Fazendo requisição para /auth/online-users
[FRONTEND] Resposta recebida: [...]
[DASHBOARD] Estado do hook useOnlineUsers atualizado: {...}
```

### **Métricas Disponíveis**
- ✅ Número total de usuários online
- ✅ Tempo desde última atividade
- ✅ Distribuição por roles
- ✅ Taxa de atualização (30s)
- ✅ Tempo de resposta das requisições

## 🔧 Configuração e Personalização

### **Variáveis de Ambiente**
```env
# Timeout de inatividade (minutos)
ONLINE_USERS_TIMEOUT=5

# Intervalo de atualização (segundos)
ONLINE_USERS_REFRESH_INTERVAL=30

# Limite de usuários exibidos
ONLINE_USERS_DISPLAY_LIMIT=5
```

### **Personalização Visual**
```typescript
// Cores e estilos no DashboardPage.tsx
className="glass rounded-2xl p-6 shadow-modern-lg border border-border/50"

// Ícone e cores
<Users className="h-5 w-5 text-green-600" />
bg-green-500/10
```

## 🚀 Melhorias Futuras

### **Funcionalidades Planejadas**
- 🔄 **WebSocket Integration**: Atualização em tempo real
- 📱 **Notificações Push**: Alertas de entrada/saída
- 📊 **Dashboard Admin**: Estatísticas detalhadas
- 🎯 **Filtros Avançados**: Por role/departamento
- 📈 **Histórico**: Logs de atividade

### **Otimização de Performance**
- ⚡ **Redis Cache**: Para escalabilidade
- 🔄 **Load Balancing**: Distribuição de carga
- 📊 **Metrics**: Monitoramento avançado
- 🚀 **CDN**: Para múltiplas regiões

## 🐛 Troubleshooting

### **Problemas Comuns**

#### **1. "Nenhum usuário online" sempre**
```bash
# Verificar se usuários estão logados
curl http://localhost:3000/api/auth/online-users/debug

# Verificar logs do backend
tail -f logs/backend.log | grep "online"
```

#### **2. Lista não atualiza**
```javascript
// Forçar atualização no frontend
const queryClient = useQueryClient();
queryClient.invalidateQueries(['onlineUsers']);
```

#### **3. Erro 401 Unauthorized**
```bash
# Verificar token JWT
curl -X GET "http://localhost:3000/api/auth/online-users" \
  -H "Authorization: Bearer $(cat ~/.jwt_token)"
```

#### **4. Performance lenta**
```typescript
// Otimizar query no backend
const users = await this.userRepository.find({
  where: { id: In(onlineUserIds) },
  select: ['id', 'nome', 'usuario'], // Remover campos desnecessários
  relations: ['role'],
});
```

## 📚 Referências

- **Arquivos relacionados:**
  - `src/modules/auth/auth.service.ts`
  - `src/modules/auth/auth.controller.ts`
  - `frontend/src/hooks/useOnlineUsers.ts`
  - `frontend/src/pages/DashboardPage.tsx`

- **Scripts de teste:**
  - `scripts/test-online-users.js`

- **Documentação relacionada:**
  - `docs/SIDEBAR_TOGGLE.md`
  - `README.md`

---

**Desenvolvido para SGC-ITEP v1.0** 🚀