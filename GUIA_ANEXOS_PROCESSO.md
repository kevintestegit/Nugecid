# Guia de Uso: Anexos Atrelados ao Processo

## 📌 Visão Geral

Agora é possível anexar documentos tanto a **solicitações individuais** quanto ao **processo como um todo**. Isso é especialmente útil quando um mesmo processo possui múltiplas solicitações de desarquivamento.

### Exemplo de Caso de Uso
- **Processo**: 2024.001.123456
- **Solicitações**: 21 solicitações diferentes do mesmo processo
- **Termo de Desarquivamento**: Um único documento assinado
- **Solução**: Anexar o termo ao **processo**, não a cada solicitação individual

---

## 🔧 Como Funciona

### 1. Upload de Anexo

#### **Anexar à Solicitação Individual** (comportamento padrão)
```bash
POST /api/nugecid/:desarquivamentoId/anexos/upload

FormData:
- file: [arquivo]
- descricao: "Documento específico da solicitação"
- tipoAnexo: "desarquivamento" ou "rearquivamento"
- anexarAoProcesso: false  # ⬅️ Anexa apenas a esta solicitação
```

#### **Anexar ao Processo** (todas as solicitações)
```bash
POST /api/nugecid/:desarquivamentoId/anexos/upload

FormData:
- file: [arquivo]
- descricao: "Termo de Desarquivamento Assinado"
- tipoAnexo: "desarquivamento"
- anexarAoProcesso: true  # ⬅️ Anexa ao processo inteiro
```

---

### 2. Listar Anexos

#### **Por Solicitação** (retorna anexos da solicitação + anexos do processo)
```bash
GET /api/nugecid/:desarquivamentoId/anexos
GET /api/nugecid/:desarquivamentoId/anexos?tipo=desarquivamento
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "desarquivamentoId": null,
      "numeroProcesso": "2024.001.123456",
      "nomeOriginal": "termo_desarquivamento.pdf",
      "tipoVinculo": "processo",  // ⬅️ Anexo do processo
      "descricao": "Termo assinado",
      "tipoAnexo": "desarquivamento"
    },
    {
      "id": 2,
      "desarquivamentoId": 45,
      "numeroProcesso": null,
      "nomeOriginal": "documento_especifico.pdf",
      "tipoVinculo": "solicitacao",  // ⬅️ Anexo da solicitação
      "descricao": "Documento específico",
      "tipoAnexo": "desarquivamento"
    }
  ]
}
```

#### **Por Processo** (retorna todos os anexos do processo)
```bash
GET /api/nugecid/processo/2024.001.123456/anexos
GET /api/nugecid/processo/2024.001.123456/anexos?tipo=rearquivamento
```

---

### 3. Download de Anexos

#### **Por Solicitação**
```bash
GET /api/nugecid/:desarquivamentoId/anexos/:id/download
GET /api/nugecid/:desarquivamentoId/anexos/:id/view
```

#### **Por Processo**
```bash
GET /api/nugecid/processo/:numeroProcesso/anexos/:id/download
GET /api/nugecid/processo/:numeroProcesso/anexos/:id/view
```

---

## 📊 Estrutura do Banco de Dados

### Tabela: `desarquivamento_anexos`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | integer | ID único do anexo |
| `desarquivamento_id` | integer (nullable) | ID da solicitação (NULL para anexos de processo) |
| `numero_processo` | varchar (nullable) | Número do processo (NULL para anexos de solicitação) |
| `usuario_id` | integer | ID do usuário que fez o upload |
| `nome_original` | varchar | Nome original do arquivo |
| `caminho_arquivo` | varchar | Caminho do arquivo no servidor |
| `tipo_mime` | varchar | Tipo MIME do arquivo |
| `tamanho_bytes` | bigint | Tamanho do arquivo em bytes |
| `descricao` | text | Descrição do anexo |
| `tipo_anexo` | enum | `desarquivamento` ou `rearquivamento` |
| `created_at` | timestamp | Data de criação |

### Constraints
- **CHECK**: `desarquivamento_id IS NOT NULL OR numero_processo IS NOT NULL`
  - Garante que todo anexo está vinculado a uma solicitação OU a um processo

### Índices
- `IDX_desarquivamento_anexos_desarquivamento_id` (para buscas por solicitação)
- `IDX_desarquivamento_anexos_numero_processo` (para buscas por processo)
- `IDX_desarquivamento_anexos_processo_tipo` (para buscas otimizadas)

---

## 🎯 Casos de Uso

### **Caso 1: Termo Único para Múltiplas Solicitações**
```javascript
// 1. Criar primeira solicitação do processo
const solicitacao1 = await criarDesarquivamento({
  numeroProcesso: "2024.001.123456",
  // ... outros campos
});

// 2. Anexar termo ao processo (não à solicitação)
await uploadAnexo(solicitacao1.id, {
  file: termoAssinado,
  descricao: "Termo de Desarquivamento - Processo 2024.001.123456",
  anexarAoProcesso: true  // ⬅️ IMPORTANTE
});

// 3. Criar outras 20 solicitações do mesmo processo
for (let i = 0; i < 20; i++) {
  await criarDesarquivamento({
    numeroProcesso: "2024.001.123456",
    // ... outros campos
  });
}

// 4. Todas as 21 solicitações terão acesso ao mesmo termo!
```

### **Caso 2: Documentos Específicos por Solicitação**
```javascript
// Anexar documento específico a uma solicitação
await uploadAnexo(solicitacaoId, {
  file: documentoEspecifico,
  descricao: "Laudo complementar",
  anexarAoProcesso: false  // ⬅️ Apenas esta solicitação
});
```

### **Caso 3: Buscar Todos os Anexos de um Processo**
```javascript
// Retorna anexos do processo + anexos de todas as solicitações
const anexos = await fetch(
  `/api/nugecid/processo/2024.001.123456/anexos`
);
```

---

## 🔍 Propriedade `tipoVinculo`

Cada anexo possui uma propriedade `tipoVinculo` que indica como ele está vinculado:

- **`"processo"`**: Anexo vinculado ao processo (disponível em todas as solicitações)
- **`"solicitacao"`**: Anexo vinculado a uma solicitação específica
- **`"ambos"`**: Anexo vinculado tanto ao processo quanto a uma solicitação (raro)

---

## ⚡ Migração Automática

Execute a migration para adicionar a funcionalidade:

```bash
npm run migration:run
```

A migration irá:
1. ✅ Adicionar coluna `numero_processo`
2. ✅ Tornar `desarquivamento_id` opcional (nullable)
3. ✅ Adicionar constraint de validação
4. ✅ Criar índices para performance
5. ✅ **Preservar todos os anexos existentes** (compatibilidade total)

---

## 🛡️ Validações

- Todo anexo DEVE ter `desarquivamento_id` OU `numero_processo` preenchido
- Anexos de processo só podem ser criados se a solicitação tiver `numeroProcesso`
- Busca por solicitação retorna anexos da solicitação + anexos do processo
- Anexos antigos continuam funcionando normalmente

---

## 📝 Exemplo Frontend (React/Angular)

```typescript
// Componente de Upload
function UploadAnexo({ desarquivamentoId, numeroProcesso }) {
  const [anexarAoProcesso, setAnexarAoProcesso] = useState(false);

  const handleUpload = async (file, descricao) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('descricao', descricao);
    formData.append('tipoAnexo', 'desarquivamento');
    formData.append('anexarAoProcesso', anexarAoProcesso);

    await fetch(`/api/nugecid/${desarquivamentoId}/anexos/upload`, {
      method: 'POST',
      body: formData,
    });
  };

  return (
    <div>
      <input type="file" onChange={e => handleUpload(e.target.files[0])} />
      
      {numeroProcesso && (
        <label>
          <input 
            type="checkbox" 
            checked={anexarAoProcesso}
            onChange={e => setAnexarAoProcesso(e.target.checked)}
          />
          Anexar ao processo inteiro (disponível em todas as solicitações)
        </label>
      )}
    </div>
  );
}
```

---

## 🚀 Benefícios

✅ **Evita duplicação**: Um único termo para 21 solicitações  
✅ **Flexibilidade**: Anexos podem ser de solicitação ou processo  
✅ **Compatibilidade**: Anexos antigos continuam funcionando  
✅ **Performance**: Índices otimizados para buscas rápidas  
✅ **Simplicidade**: Interface unificada para todos os anexos  

---

## ❓ Perguntas Frequentes

**Q: Os anexos antigos continuarão funcionando?**  
A: Sim! Todos os anexos existentes terão `desarquivamento_id` preenchido e funcionarão normalmente.

**Q: Posso anexar ao processo sem ter número de processo?**  
A: Não. A solicitação precisa ter `numeroProcesso` preenchido para anexar ao processo.

**Q: Como sei se um anexo é de processo ou solicitação?**  
A: Verifique a propriedade `tipoVinculo` na resposta da API.

**Q: Posso ter anexos tanto de processo quanto de solicitação?**  
A: Sim! Ao buscar anexos de uma solicitação, você receberá ambos os tipos.
