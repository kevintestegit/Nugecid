# 🔧 Correção Aplicada: Anexos de Processo não Apareciam

## 📋 Problema Reportado

**Situação:**
- Anexo foi adicionado ao desarquivamento #628
- Processo: 039100157.000028/2025-82
- Desarquivamento #645 é do mesmo processo
- **Problema:** O anexo NÃO aparecia no desarquivamento #645

## 🔍 Diagnóstico

Ao investigar o banco de dados, foi identificado que:

```sql
SELECT id, desarquivamento_id, numero_processo, nome_original 
FROM desarquivamento_anexos 
WHERE id = 14;

-- Resultado:
id | desarquivamento_id | numero_processo | nome_original
14 | 628                |                 | WhatsApp Image 2025-09-15 at 09.24.06.jpeg
```

**Causa raiz:** O anexo foi criado com `desarquivamento_id = 628` mas **SEM** o `numero_processo` preenchido.

Isso aconteceu porque:
1. A migration que adiciona o campo `numero_processo` foi executada ✅
2. O backend já suporta anexos por processo ✅
3. **MAS o frontend ainda não tinha a interface para escolher "anexar ao processo"** ❌

## ✅ Soluções Aplicadas

### 1. **Correção do Anexo Existente (Banco de Dados)**

```sql
UPDATE desarquivamento_anexos 
SET numero_processo = '039100157.000028/2025-82', 
    desarquivamento_id = NULL 
WHERE id = 14;
```

Agora o anexo está vinculado ao **processo** em vez da solicitação individual.

### 2. **Atualização do Frontend**

#### **Arquivo:** `frontend/src/services/api.ts`
- Adicionado parâmetro `anexarAoProcesso` na função `uploadDesarquivamentoAnexo`

#### **Arquivo:** `frontend/src/hooks/useDesarquivamentosAnexos.ts`
- Atualizado hook `useUploadDesarquivamentoAnexo` para aceitar `anexarAoProcesso`
- Atualizada interface `DesarquivamentoAnexo` para incluir:
  - `numeroProcesso?: string | null`
  - `tipoVinculo?: 'processo' | 'solicitacao' | 'ambos'`

#### **Arquivo:** `frontend/src/components/desarquivamentos/AnexosSection.tsx`
- Adicionado state `anexarAoProcesso`
- Adicionado prop `numeroProcesso` ao componente
- **Adicionado checkbox** "Anexar ao processo inteiro" (só aparece se houver `numeroProcesso`)
- **Adicionado badges** mostrando se o anexo é de "Processo" ou "Solicitação"

#### **Arquivo:** `frontend/src/pages/DetalhesDesarquivamentoPage.tsx`
- Atualizado `handleUploadDesarquivamento` para aceitar `anexarAoProcesso`
- Atualizado `handleUploadRearquivamento` para aceitar `anexarAoProcesso`
- Passado `numeroProcesso` para os componentes `AnexosSection`

## 🎯 Como Usar Agora

### **Anexar ao Processo (Recomendado para Termos e Documentos Compartilhados)**

1. Acesse qualquer solicitação do processo
2. Na seção de anexos, clique em "Selecionar arquivo"
3. Escolha o arquivo
4. ✅ **MARQUE** o checkbox "Anexar ao processo inteiro"
5. Clique em "Enviar Anexo"

**Resultado:** O anexo ficará disponível em **todas** as solicitações do mesmo processo!

### **Anexar à Solicitação (Para Documentos Específicos)**

1. Acesse a solicitação específica
2. Na seção de anexos, clique em "Selecionar arquivo"
3. Escolha o arquivo
4. ❌ **NÃO marque** o checkbox
5. Clique em "Enviar Anexo"

**Resultado:** O anexo ficará disponível apenas nesta solicitação.

## 📊 Visualização

### Interface Atualizada

**Checkbox de Anexar ao Processo:**
```
┌─────────────────────────────────────────────────────────────┐
│ ✅ Anexar ao processo inteiro                              │
│    Este anexo ficará disponível em todas as outras          │
│    solicitações do processo 039100157.000028/2025-82        │
└─────────────────────────────────────────────────────────────┘
```

**Badges na Lista de Anexos:**
```
📄 termo_desarquivamento.pdf  [Processo]      ← Badge azul
📄 documento_especifico.pdf   [Solicitação]  ← Badge cinza
```

## 🧪 Validação

### Teste Realizado

```bash
# 1. Anexo atualizado no banco
UPDATE desarquivamento_anexos SET numero_processo = '039100157.000028/2025-82', desarquivamento_id = NULL WHERE id = 14;

# 2. Query de verificação (simulando busca do service)
SELECT * FROM desarquivamento_anexos 
WHERE desarquivamento_id = 645 
   OR numero_processo = (SELECT numero_processo FROM desarquivamentos WHERE id = 645);

# ✅ Resultado: Anexo ID 14 agora aparece!
```

### Compilação

```bash
✅ Backend compilado com sucesso
✅ Frontend compilado com sucesso
✅ Containers reiniciados
```

## 📝 Próximos Passos

1. ✅ **Testar no navegador**: Acesse http://localhost:3001
2. ✅ **Verificar o checkbox**: Deve aparecer ao anexar arquivo em processo com `numeroProcesso`
3. ✅ **Verificar badges**: Anexos devem mostrar se são de "Processo" ou "Solicitação"
4. ✅ **Testar anexo compartilhado**: Anexar com checkbox marcado e verificar se aparece em outras solicitações do mesmo processo

## 🎉 Status Final

| Item | Status |
|------|--------|
| Migration executada | ✅ |
| Backend atualizado | ✅ |
| Frontend atualizado | ✅ |
| Anexo #14 corrigido | ✅ |
| Checkbox implementado | ✅ |
| Badges implementados | ✅ |
| Código compilado | ✅ |
| Containers reiniciados | ✅ |

---

## 💡 Dica

**Para o seu caso específico (21 solicitações do mesmo processo):**

1. Abra qualquer uma das 21 solicitações
2. Anexe o termo de desarquivamento **UMA VEZ**
3. **Marque** o checkbox "Anexar ao processo inteiro"
4. O termo ficará disponível automaticamente nas 21 solicitações! 🎯

Não é mais necessário anexar 21 vezes! ✨
