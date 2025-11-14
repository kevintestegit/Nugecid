# ✅ IMPLEMENTAÇÃO CONCLUÍDA: Anexos Atrelados ao Processo

## 📋 Resumo da Solução

Foi implementada uma solução para permitir que **anexos de desarquivamento possam ser atrelados ao processo** em vez de apenas a solicitações individuais. Isso resolve o problema de ter que anexar o mesmo documento (como termo de desarquivamento) 21 vezes para 21 solicitações do mesmo processo.

---

## 🎯 Problema Resolvido

**ANTES:**
- Processo com 21 solicitações de desarquivamento
- Termo assinado único
- Necessário anexar 21 vezes manualmente

**DEPOIS:**
- Anexar o termo UMA VEZ ao processo
- Todas as 21 solicitações terão acesso ao mesmo anexo
- Economia de tempo e espaço em disco

---

## 🔧 Alterações Realizadas

### 1. **Migration** 
📄 `src/migrations/1763000000000-AddNumeroProcessoToDesarquivamentoAnexos.ts`

**Alterações no banco:**
- ✅ Nova coluna `numero_processo` (varchar 255, nullable)
- ✅ Coluna `desarquivamento_id` agora é NULLABLE
- ✅ Constraint: `(desarquivamento_id IS NOT NULL OR numero_processo IS NOT NULL)`
- ✅ Índices para performance:
  - `IDX_desarquivamento_anexos_numero_processo`
  - `IDX_desarquivamento_anexos_processo_tipo`

### 2. **Entidade Atualizada**
📄 `src/modules/nugecid/infrastructure/entities/desarquivamento-anexo.typeorm-entity.ts`

**Novos campos:**
```typescript
numeroProcesso?: string;  // Número do processo
```

**Novos métodos:**
```typescript
isAnexoDeProcesso(): boolean
isAnexoDeSolicitacao(): boolean
getTipoVinculo(): "processo" | "solicitacao" | "ambos"
```

### 3. **Service Atualizado**
📄 `src/modules/nugecid/nugecid-anexos.service.ts`

**Método modificado:**
```typescript
uploadAnexo(..., anexarAoProcesso: boolean = false)
```
- Se `anexarAoProcesso = true` → anexa ao processo
- Se `anexarAoProcesso = false` → anexa à solicitação

**Novo método:**
```typescript
findAnexosByProcesso(numeroProcesso: string, tipoAnexo?)
```
- Busca todos os anexos de um processo

**Método modificado:**
```typescript
findAnexosByDesarquivamento(desarquivamentoId, tipoAnexo?)
```
- Agora retorna anexos da solicitação + anexos do processo

### 4. **Controller Atualizado**
📄 `src/modules/nugecid/controllers/anexos.controller.ts`

**Endpoint modificado:**
```
POST /api/nugecid/:desarquivamentoId/anexos/upload
Body: { file, descricao, tipoAnexo, anexarAoProcesso }
```

**Novo Controller:** `AnexosProcessoController`
```
GET    /api/nugecid/processo/:numeroProcesso/anexos
GET    /api/nugecid/processo/:numeroProcesso/anexos/:id/download
GET    /api/nugecid/processo/:numeroProcesso/anexos/:id/view
```

### 5. **Módulo Atualizado**
📄 `src/modules/nugecid/nugecid.module.ts`
- Registrado novo controller `AnexosProcessoController`

---

## 📚 Documentação Criada

1. **PROPOSTA_ANEXOS_PROCESSO.md** - Análise e proposta de solução
2. **GUIA_ANEXOS_PROCESSO.md** - Guia completo de uso com exemplos

---

## 🚀 Como Usar

### **Passo 1: Executar Migration**
```bash
npm run migration:run
```

### **Passo 2: Anexar ao Processo**
```javascript
// Frontend/API Request
const formData = new FormData();
formData.append('file', termoAssinado);
formData.append('descricao', 'Termo de Desarquivamento Assinado');
formData.append('tipoAnexo', 'desarquivamento');
formData.append('anexarAoProcesso', 'true');  // ⬅️ IMPORTANTE!

fetch(`/api/nugecid/${solicitacaoId}/anexos/upload`, {
  method: 'POST',
  body: formData
});
```

### **Passo 3: Listar Anexos**
```javascript
// Buscar anexos de uma solicitação (inclui anexos do processo)
GET /api/nugecid/45/anexos

// Buscar todos os anexos de um processo
GET /api/nugecid/processo/2024.001.123456/anexos
```

---

## 📊 Estrutura de Resposta

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "desarquivamentoId": null,
      "numeroProcesso": "2024.001.123456",
      "nomeOriginal": "termo_desarquivamento.pdf",
      "descricao": "Termo assinado",
      "tipoAnexo": "desarquivamento",
      "tipoVinculo": "processo",  // ⬅️ Indica que é anexo de processo
      "url": "/api/nugecid/processo/2024.001.123456/anexos/1/download",
      "previewUrl": "/api/nugecid/processo/2024.001.123456/anexos/1/view"
    },
    {
      "id": 2,
      "desarquivamentoId": 45,
      "numeroProcesso": null,
      "nomeOriginal": "documento_especifico.pdf",
      "descricao": "Documento específico da solicitação",
      "tipoAnexo": "desarquivamento",
      "tipoVinculo": "solicitacao",  // ⬅️ Indica que é anexo de solicitação
      "url": "/api/nugecid/45/anexos/2/download",
      "previewUrl": "/api/nugecid/45/anexos/2/view"
    }
  ]
}
```

---

## ✅ Benefícios

| Benefício | Descrição |
|-----------|-----------|
| **Economia** | Um anexo para N solicitações |
| **Flexibilidade** | Anexos de processo OU solicitação |
| **Compatibilidade** | Anexos antigos continuam funcionando |
| **Performance** | Índices otimizados |
| **Simplicidade** | API unificada |

---

## 🔍 Validações Implementadas

✅ Todo anexo deve ter `desarquivamento_id` OU `numero_processo`  
✅ Anexar ao processo só funciona se a solicitação tiver `numeroProcesso`  
✅ Busca por solicitação retorna anexos da solicitação + do processo  
✅ Anexos antigos (com `desarquivamento_id`) continuam funcionando  

---

## 🧪 Testes

### Cenário 1: Anexar ao Processo
```bash
# 1. Criar solicitação com numeroProcesso
POST /api/nugecid/desarquivamentos
{
  "numeroProcesso": "2024.001.123456",
  ...
}

# 2. Anexar termo ao processo
POST /api/nugecid/1/anexos/upload
FormData: { file, anexarAoProcesso: true }

# 3. Criar outras solicitações do mesmo processo
POST /api/nugecid/desarquivamentos
{
  "numeroProcesso": "2024.001.123456",
  ...
}

# 4. Verificar que todas têm acesso ao anexo
GET /api/nugecid/1/anexos  # ✅ Retorna o termo
GET /api/nugecid/2/anexos  # ✅ Retorna o termo
GET /api/nugecid/3/anexos  # ✅ Retorna o termo
```

### Cenário 2: Anexar à Solicitação
```bash
POST /api/nugecid/1/anexos/upload
FormData: { file, anexarAoProcesso: false }

GET /api/nugecid/1/anexos  # ✅ Retorna este anexo
GET /api/nugecid/2/anexos  # ❌ NÃO retorna este anexo
```

---

## 📝 Próximos Passos (Frontend)

Para integrar no frontend, você precisa:

1. **Adicionar checkbox** "Anexar ao processo inteiro" no formulário de upload
2. **Exibir badge** indicando se anexo é de "Processo" ou "Solicitação"
3. **Filtrar anexos** por tipo de vínculo (opcional)

Exemplo:
```tsx
// No formulário de upload
{numeroProcesso && (
  <FormControlLabel
    control={
      <Checkbox 
        checked={anexarAoProcesso}
        onChange={(e) => setAnexarAoProcesso(e.target.checked)}
      />
    }
    label="Anexar ao processo inteiro (disponível em todas as solicitações)"
  />
)}

// Na listagem de anexos
{anexo.tipoVinculo === 'processo' && (
  <Chip label="Processo" color="primary" size="small" />
)}
{anexo.tipoVinculo === 'solicitacao' && (
  <Chip label="Solicitação" color="default" size="small" />
)}
```

---

## 🎉 Status

✅ **IMPLEMENTAÇÃO CONCLUÍDA**  
✅ **CÓDIGO COMPILADO COM SUCESSO**  
✅ **MIGRATION CRIADA**  
✅ **DOCUMENTAÇÃO COMPLETA**  
⏳ **AGUARDANDO: Execução da migration e testes**

---

## 📞 Suporte

Consulte os seguintes arquivos para mais detalhes:
- `PROPOSTA_ANEXOS_PROCESSO.md` - Análise técnica
- `GUIA_ANEXOS_PROCESSO.md` - Guia de uso completo

Para dúvidas, verifique a seção **Perguntas Frequentes** no guia.
