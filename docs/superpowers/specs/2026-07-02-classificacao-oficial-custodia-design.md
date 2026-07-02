# Atualização da classificação oficial da custódia

## Fonte

O sistema seguirá o documento `/dados/Downloads/1. CLASSIFICAÇÃO - OFICIAL.docx`, modificado em 1º de julho de 2026.

## Escopo

- Substituir a árvore usada na geração de etiquetas pela hierarquia `000 Identificação`, `100 Criminalística` e `200 Medicina Legal`.
- Alinhar os schemas de catalogação às classes `001`, `101`–`109` e `201`–`207`.
- Corrigir prefixos evidentemente deslocados, duplicações, códigos vazios, erros ortográficos e textos concatenados.
- Atualizar apenas o frontend e seus testes; preservar contratos de API, estrutura do backend e registros existentes.

## Correções autorizadas

- Renumerar `102.14`, `102.141` e `102.15`–`102.154`, dentro de Toxicologia, para o prefixo `103`.
- Corrigir `203.10`, dentro de Psicologia Forense, para `202.10`.
- Usar `201.1`–`201.10` em Psiquiatria Forense e remover a sequência repetida `200.11`–`200.20`.
- Manter somente `104.1`–`104.10`, removendo as duplicações `104.11`–`104.19`.
- Omitir os códigos vazios `109.45`, `109.46` e `109.69`.
- Corrigir erros ortográficos evidentes e separar textos unidos por falha de formatação.

## Tratamento das ambiguidades

- Não criar códigos ausentes para as categorias biológicas sem numeração.
- Não inventar as facetas ausentes de Toxicologia, Psiquiatria ou Antropologia.
- Não reconstruir semanticamente os conteúdos conflitantes de Traumatologia.
- Corrigir apenas substituições textuais evidentes, como `Pete` para `Pele` e `SUBDIVISÃO` para `nível` quando usados dentro de uma pergunta.

## Fluxo e compatibilidade

A seleção hierárquica continuará gerando `codigoScv`, `classeCatalogacao`, `subclasseCatalogacao` e `tipoCatalogacao` no formato já aceito pela API. A catalogação continuará escolhendo o schema pelo código da classe, com critérios específicos quando o documento os fornecer. Nenhuma migração de registros históricos será executada.

## Verificação

- Testar a estrutura e os códigos representativos da árvore oficial.
- Testar a resolução dos schemas e critérios corrigidos.
- Testar a criação da etiqueta e o encaminhamento para catalogação.
- Executar testes direcionados, typecheck, lint, formatação e build disponíveis no frontend.
