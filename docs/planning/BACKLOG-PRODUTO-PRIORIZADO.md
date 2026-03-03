# Backlog de Produto Priorizado

> **Data:** 2026-03-06
> **Objetivo:** transformar a fase de estabilização em uma fila executável de features e melhorias funcionais
> **Base:** sistema já estabilizado em auth, deploy, observabilidade operacional e cobertura de fluxos críticos

---

## Critério de priorização

Cada item foi priorizado por:
- impacto operacional diário
- redução de retrabalho/manualidade
- risco de regressão
- dependência técnica já resolvida
- esforço estimado para entrega incremental

Escala usada:
- **Impacto:** alto | médio | baixo
- **Esforço:** baixo | médio | alto
- **Prioridade:** P1 | P2 | P3

---

## P1 - Próximas entregas

### 1. Feriados configuráveis por unidade

**Problema**
- hoje o calendário usa catálogo estático e não contempla variações institucionais por unidade/setor

**Valor**
- melhora cálculo e comunicação de prazos
- reduz divergência operacional entre áreas

**Impacto:** alto  
**Esforço:** médio  
**Prioridade:** P1

**Escopo sugerido**
- cadastro de feriados extras por unidade
- distinção entre nacional, estadual, municipal e ponto facultativo
- exibição clara no `PrazosCalendar`

**Critério de aceite**
- usuário admin consegue cadastrar/editar/remover feriado local
- calendário reflete feriado configurado sem depender de código hardcoded
- prazo/ocorrência visualiza origem do feriado

---

### 2. Observabilidade funcional do fluxo de login e sessão

**Problema**
- a operação técnica já foi endurecida, mas ainda falta visibilidade funcional de login, refresh, logout e falhas frequentes

**Valor**
- reduz tempo de diagnóstico
- permite agir antes de virar incidente percebido pelo usuário

**Impacto:** alto  
**Esforço:** médio  
**Prioridade:** P1

**Escopo sugerido**
- eventos padronizados para login bem-sucedido, falha de login, refresh falho e logout
- painel simples em configuração/segurança ou endpoint resumido para suporte
- separação entre erro funcional e indisponibilidade de infraestrutura

**Critério de aceite**
- fluxo de auth gera eventos legíveis para suporte
- falhas recorrentes por usuário/IP ficam visíveis
- suporte consegue diferenciar “credencial inválida”, “sessão expirada” e “backend indisponível”

---

### 3. Testes de fluxos críticos de autenticação na UI

**Problema**
- já há cobertura de `AuthContext`, mas ainda faltam testes de tela de login/navegação protegida

**Valor**
- reduz regressão em mudanças futuras do fluxo de sessão

**Impacto:** alto  
**Esforço:** baixo  
**Prioridade:** P1

**Escopo sugerido**
- LoginPage com sucesso/erro
- redirecionamento ao voltar de rota protegida
- logout refletindo navegação esperada

**Critério de aceite**
- testes automatizados cobrem login com sucesso e erro
- rota protegida volta ao destino esperado após autenticação

---

## P2 - Entregas em seguida

### 4. Configuração visual do dashboard por perfil

**Problema**
- o dashboard já tem personalização superficial, mas ainda não responde ao perfil operacional de cada role/setor

**Valor**
- reduz ruído visual
- acelera tarefas frequentes

**Impacto:** médio  
**Esforço:** médio  
**Prioridade:** P2

**Escopo sugerido**
- quick actions por role
- cards iniciais por área
- persistência de preferências por usuário

**Critério de aceite**
- cada role vê ações rápidas coerentes com seu uso principal
- preferências do dashboard persistem entre sessões

---

### 5. Melhorar feedback de importação/exportação de planilhas

**Problema**
- o fluxo existe, mas ainda depende de mensagens genéricas e recuperação manual em parte dos cenários

**Valor**
- reduz suporte operacional
- melhora confiabilidade percebida do módulo principal

**Impacto:** médio  
**Esforço:** médio  
**Prioridade:** P2

**Escopo sugerido**
- relatório resumido pós-importação
- erros por linha com download de inconsistências
- progresso de exportação/importação mais explícito

**Critério de aceite**
- usuário consegue saber quantos registros entraram, falharam e por quê
- importações com erro parcial não viram “caixa-preta”

---

### 6. Melhorias de busca e filtragem de desarquivamentos

**Problema**
- a página principal está estável, mas ainda pode ganhar produtividade com filtros salvos e combinações frequentes

**Valor**
- reduz tempo operacional diário

**Impacto:** médio  
**Esforço:** médio  
**Prioridade:** P2

**Escopo sugerido**
- filtros salvos
- filtros rápidos por prazo/status crítico
- compartilhamento de estado por URL de forma mais completa

**Critério de aceite**
- usuário consegue reaplicar filtros frequentes com um clique
- links compartilhados reproduzem o estado relevante da busca

---

## P3 - Evolução estrutural

### 7. Feature flag para identidade visual sazonal

**Problema**
- identidade sazonal ainda está embutida em componente, não em controle explícito de produto

**Valor**
- reduz risco de regressão visual
- melhora governança de branding

**Impacto:** baixo  
**Esforço:** baixo  
**Prioridade:** P3

---

### 8. Painel de métricas operacionais do sistema

**Problema**
- métricas técnicas já existem, mas o usuário administrativo não tem uma visão resumida e funcional

**Valor**
- aproxima observabilidade técnica e gestão do sistema

**Impacto:** médio  
**Esforço:** alto  
**Prioridade:** P3

**Escopo sugerido**
- status de banco/redis
- erros recentes
- tempo médio de resposta
- fila de tarefas críticas

---

### 9. Backlog de automação de suporte

**Problema**
- ainda há procedimentos manuais para diagnóstico, importação problemática e inconsistências operacionais

**Valor**
- reduz tempo do suporte técnico e dependência de intervenção direta

**Impacto:** médio  
**Esforço:** alto  
**Prioridade:** P3

---

## Sequência recomendada

1. Feriados configuráveis por unidade
2. Observabilidade funcional de auth/sessão
3. Testes de LoginPage e navegação protegida
4. Dashboard por perfil
5. Importação/exportação com feedback operacional melhor
6. Busca e filtros salvos

---

## Itens já estabilizados e que não devem voltar ao backlog técnico

- logout limpando cookies de auth
- refresh por cookie `httpOnly`
- `FRONTEND_URL` obrigatório em produção
- frontend em produção servido por `nginx`, não `vite dev`
- `getDesarquivamentos` propagando erro real
- `PrazosCalendar` acessível
- `NugecidLogo` com IDs únicos
- scripts `system:check`, `smoke:test` e `debug:collect`

---

## Recomendação prática

Se a meta for continuar com maior retorno por esforço, a próxima implementação deve ser:

**Feriados configuráveis por unidade**

É a entrega com melhor combinação de:
- impacto direto no domínio
- benefício visível para usuário
- reaproveitamento do trabalho já feito no calendário
- risco técnico controlado
