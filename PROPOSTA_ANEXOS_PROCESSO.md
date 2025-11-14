# Proposta: Anexos Atrelados ao Processo

## Problema Atual
- Anexos estão vinculados a cada solicitação de desarquivamento individual
- Um processo com 21 solicitações requer anexar o mesmo termo 21 vezes
- Campo `numeroProcesso` existe mas não é usado para agrupamento de anexos

## Soluções Propostas

### **SOLUÇÃO 1: Adicionar campo numero_processo na tabela de anexos (RECOMENDADA)**

#### Vantagens:
✅ Simples de implementar
✅ Compatível com anexos existentes
✅ Permite anexos tanto por solicitação quanto por processo
✅ Não quebra funcionalidade atual

#### Implementação:
1. Adicionar coluna `numero_processo` na tabela `desarquivamento_anexos`
2. Tornar `desarquivamento_id` NULLABLE (para anexos de processo)
3. Adicionar constraint: `(desarquivamento_id IS NOT NULL OR numero_processo IS NOT NULL)`
4. Criar índice em `numero_processo`
5. Modificar serviço para buscar anexos por processo OU por solicitação

#### Casos de uso:
- **Anexo por solicitação**: `desarquivamento_id` preenchido, `numero_processo` NULL
- **Anexo por processo**: `desarquivamento_id` NULL, `numero_processo` preenchido
- **Anexo misto**: ambos preenchidos (opcional, para rastreabilidade)

---

### **SOLUÇÃO 2: Criar tabela separada para anexos de processo**

#### Vantagens:
✅ Separação clara de responsabilidades
✅ Não modifica estrutura existente
✅ Permite diferentes campos/validações

#### Desvantagens:
❌ Maior complexidade
❌ Duplicação de código
❌ Queries mais complexas para listar todos os anexos

#### Implementação:
1. Criar nova tabela `processo_anexos` (numero_processo, usuario_id, arquivo...)
2. Criar service e controller separados
3. Modificar front-end para diferenciar tipos de anexo

---

## Recomendação: SOLUÇÃO 1

A **Solução 1** é mais adequada pois:
- Mantém simplicidade
- Aproveita código existente
- Permite flexibilidade (anexo pode ser de solicitação ou processo)
- Interface unificada para anexos

### Fluxo de trabalho proposto:
1. Ao anexar documento, usuário escolhe:
   - "Anexar à esta solicitação" → `desarquivamento_id` preenchido
   - "Anexar ao processo (todas as solicitações)" → `numero_processo` preenchido

2. Ao listar anexos de uma solicitação, mostrar:
   - Anexos específicos da solicitação
   - Anexos do processo (se houver `numeroProcesso`)

3. Validações:
   - Termo de desarquivamento → Anexo de processo
   - Documento específico → Anexo de solicitação
