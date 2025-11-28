# Impressão em Massa de Etiquetas - Banco de Vestígios

## ✅ Implementação Completa

### **Funcionalidade de Seleção e Impressão em Massa**

Foi implementado um sistema completo de seleção múltipla e impressão em massa de etiquetas de vestígios.

---

## 🎯 Recursos Implementados

### **1. Seleção de Vestígios**

#### **Checkbox Individual**
- ✅ Cada linha da tabela possui um checkbox
- ✅ Ao clicar, adiciona/remove o vestígio da seleção
- ✅ Estado visual indica itens selecionados

#### **Seleção em Massa**
- ✅ Checkbox no cabeçalho da tabela
- ✅ Clique seleciona/desseleciona TODOS os vestígios filtrados
- ✅ Estado indeterminado quando apenas alguns estão selecionados

### **2. Painel de Controle de Impressão**

Quando há vestígios selecionados, aparece um painel destacado com:

#### **Informações**
- ✅ Ícone de checkbox
- ✅ Contador de vestígios selecionados (ex: "3 vestígio(s) selecionado(s)")
- ✅ Instrução de uso

#### **Controles**
- ✅ **Select de Layout**:
  - **"Múltiplas por página"** - Várias etiquetas na mesma página
  - **"Uma por página"** - Cada etiqueta em uma página separada (ideal para etiquetas grandes)
  
- ✅ **Botão "Imprimir Selecionados"**:
  - Ícone de impressora
  - Gera janela de impressão com as etiquetas
  - Fecha automaticamente após impressão
  
- ✅ **Botão "Limpar Seleção"**:
  - Remove todos os vestígios da seleção
  - Esconde o painel de controle

### **3. Sistema de Impressão**

#### **Layout: Múltiplas por Página**
```
┌─────────────────────────────────┐
│  Etiqueta 1    [QR]             │
├─────────────────────────────────┤
│  Etiqueta 2    [QR]             │
├─────────────────────────────────┤
│  Etiqueta 3    [QR]             │
└─────────────────────────────────┘
```
- Etiquetas empilhadas verticalmente
- Margem reduzida (10mm)
- Espaçamento de 30px entre etiquetas
- Ideal para imprimir várias etiquetas e recortar

#### **Layout: Uma por Página**
```
┌─────────────────────────────────┐
│                                 │
│      Etiqueta 1    [QR]         │
│                                 │
└─────────────────────────────────┘
         [Page Break]
┌─────────────────────────────────┐
│                                 │
│      Etiqueta 2    [QR]         │
│                                 │
└─────────────────────────────────┘
```
- Cada etiqueta centralizada em página A4
- Margem de 20mm
- `page-break-after: always` entre etiquetas
- Ideal para etiquetas individuais de qualidade

### **4. Estilo das Etiquetas Impressas**

#### **Estrutura**
- Grid de 2 colunas (texto + QR code)
- Borda arredondada (12px)
- Borda sólida de 2px
- Padding generoso (20px vertical, 40px horizontal)
- Sombra suave (removida na impressão)

#### **Texto**
- Fonte: Courier New (monoespaçada)
- Tamanho: 14px
- Negrito (font-weight: 500)
- Espaçamento de linha: 1.6
- Centralizado

#### **QR Code**
- Tamanho: 120x120px
- Base64 embedded (não requer internet)
- Mantém proporções

---

## 🚀 Como Usar

### **Passo 1: Selecionar Vestígios**

**Opção A - Seleção Individual:**
1. Navegue até `/custodia/banco-vestigios`
2. Localize os vestígios desejados (use filtros se necessário)
3. Clique no checkbox de cada vestígio

**Opção B - Seleção em Massa:**
1. Use os filtros para refinar a lista (status, categoria, busca)
2. Clique no checkbox do cabeçalho da tabela
3. Todos os vestígios filtrados serão selecionados

### **Passo 2: Escolher Layout**

No painel que aparece após seleção:
- Escolha **"Múltiplas por página"** para economizar papel
- Escolha **"Uma por página"** para etiquetas grandes ou individuais

### **Passo 3: Imprimir**

1. Clique em **"Imprimir Selecionados"**
2. Aguarde a janela de impressão abrir
3. Janela mostrará preview das etiquetas
4. Diálogo de impressão abre automaticamente
5. Configure impressora e clique em "Imprimir"
6. Janela fecha automaticamente após impressão

---

## 📋 Validações

- ✅ Não é possível imprimir sem selecionar vestígios
- ✅ Toast de erro se tentar imprimir sem seleção
- ✅ Bloqueio de popup mostra mensagem amigável
- ✅ Array vazio nunca causa erro

---

## 🎨 Design

### **Painel de Controle**
- Background: `bg-primary/5` (azul muito suave)
- Borda: `border-primary/20` (azul translúcido)
- Borda arredondada: `rounded-lg`
- Padding: `p-4`
- Layout responsivo (stack em mobile)

### **Estados Visuais**
1. **Nenhum selecionado**: Painel oculto
2. **Alguns selecionados**: Painel visível com contador
3. **Todos selecionados**: Checkbox do cabeçalho marcado

---

## 🔧 Tecnologias Utilizadas

- **React Hooks**: `useState`, `useMemo`, `useCallback`
- **TypeScript**: Tipagem forte para segurança
- **Set**: Estrutura de dados eficiente para seleções
- **CSS Print**: Estilos específicos para impressão
- **Base64 QR Code**: Embedded para funcionar offline

---

## ✨ Melhorias Futuras Sugeridas

1. **Persistência**: Salvar seleção no localStorage
2. **Exportação**: PDF download em vez de apenas impressão
3. **Templates**: Múltiplos layouts de etiqueta
4. **Preview**: Modal de preview antes de imprimir
5. **Lote**: Salvar "cestas" de seleção para reutilização
6. **Atalhos**: Ctrl+A para selecionar todos, Ctrl+P para imprimir
7. **Estatísticas**: Mostrar total de etiquetas por página estimado

---

## 🎯 Status: ✅ PRONTO PARA TESTES

O sistema está completamente funcional e pronto para uso em produção!

### **Para Testar:**
1. Acesse `/custodia` e crie alguns vestígios
2. Navegue para `/custodia/banco-vestigios`
3. Selecione vestígios usando os checkboxes
4. Escolha o layout de impressão
5. Clique em "Imprimir Selecionados"
6. Verifique a qualidade das etiquetas impressas

---

## 📝 Notas Técnicas

- **Performance**: `useMemo` otimiza filtragem e categorias
- **Memória**: `Set` é mais eficiente que Array para seleções
- **Print**: `window.open` com HTML dinâmico para impressão
- **UX**: Auto-close após impressão para limpeza
- **Acessibilidade**: Labels ARIA em todos os checkboxes

