# Navegação - Banco de Vestígios

## ✅ Implementação Completa

### **Barra Lateral Atualizada**

Foi adicionado um submenu expansível no item "Custódia de Vestígios" da barra lateral com as seguintes opções:

1. **Etiquetas** (`/custodia`) - Página existente para geração de etiquetas
2. **Banco de Vestígios** (`/custodia/banco-vestigios`) - Nova página com a tabela de vestígios

### **Arquivos Modificados**

#### 1. **Layout.tsx** (`frontend/src/components/layout/Layout.tsx`)
- ✅ Adicionados imports: `ChevronDown`, `Database`
- ✅ Adicionado estado `custodiaExpanded` para controlar expansão do submenu
- ✅ Modificada estrutura de navegação para suportar submenus:
  ```typescript
  {
    name: 'Custódia de Vestígios',
    hasSubmenu: true,
    submenu: [
      { name: 'Etiquetas', href: '/custodia', icon: Shield },
      { name: 'Banco de Vestígios', href: '/custodia/banco-vestigios', icon: Database }
    ]
  }
  ```
- ✅ Atualizado renderização do sidebar mobile para suportar submenus
- ✅ Atualizado renderização do sidebar desktop para suportar submenus
- ✅ Submenu se expande automaticamente quando usuário está em uma rota de custódia
- ✅ Ícone de chevron rotaciona ao expandir/colapsar
- ✅ Submenu se esconde quando sidebar está colapsado (desktop)

#### 2. **App.tsx** (`frontend/src/App.tsx`)
- ✅ Adicionado import: `BancoVestigiosPage`
- ✅ Adicionada rota: `/custodia/banco-vestigios`

#### 3. **BancoVestigiosPage.tsx** (`frontend/src/pages/BancoVestigiosPage.tsx`)
- ✅ Criada página wrapper para o componente `BancoVestigios`
- ✅ Adiciona container responsivo com padding adequado

### **Funcionalidades**

#### **Mobile** (< 1024px)
- Submenu expansível ao clicar em "Custódia de Vestígios"
- Ícone de chevron indica estado expandido/colapsado
- Ao clicar em um item do submenu, o sidebar mobile fecha automaticamente

#### **Desktop** (≥ 1024px)
- Submenu expansível ao clicar em "Custódia de Vestígios"
- Quando sidebar está colapsado, submenu fica oculto (evita quebra de layout)
- Quando sidebar está expandido, submenu aparece indentado com ícones menores
- Hover states preservados para melhor UX

### **Estados Visuais**

1. **Item Pai (Custódia de Vestígios)**:
   - Background primário suave quando expandido
   - Ícone de chevron rotaciona 180° ao expandir

2. **Itens do Submenu**:
   - Indentados à esquerda (ml-4)
   - Ícones menores (h-4 w-4)
   - Hover e active states mantidos
   - Destaque quando rota está ativa

### **Navegação**

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/custodia` | CustodiaVestigiosPage | Geração de etiquetas SCV |
| `/custodia/banco-vestigios` | BancoVestigiosPage | Listagem e gerenciamento de vestígios |

### **Como Usar**

1. **Acessar Etiquetas**:
   - Clicar em "Custódia de Vestígios" → "Etiquetas"
   - Ou navegar diretamente para `/custodia`

2. **Acessar Banco de Vestígios**:
   - Clicar em "Custódia de Vestígios" → "Banco de Vestígios"
   - Ou navegar diretamente para `/custodia/banco-vestigios`

3. **Expansão Automática**:
   - Ao acessar qualquer rota que comece com `/custodia`, o submenu se expande automaticamente

### **Próximos Passos Sugeridos**

1. ✨ Adicionar breadcrumbs para melhor navegação
2. ✨ Adicionar badge com contagem de vestígios no menu
3. ✨ Implementar navegação entre as páginas com botões de ação
4. ✨ Adicionar atalhos de teclado para navegação rápida

## 🎯 Status: ✅ IMPLEMENTAÇÃO COMPLETA

A navegação está totalmente funcional e responsiva!
