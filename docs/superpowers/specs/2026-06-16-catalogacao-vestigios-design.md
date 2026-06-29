# Catalogacao de Vestigios Design

## Objetivo

Criar um fluxo em que a geracao da etiqueta de vestigio tambem cria o registro mestre para catalogacao. O item nasce como pendente de catalogacao e a tela de catalogacao exibe os campos correspondentes a categoria da etiqueta, conforme a planilha `METADADOS - CATALOGACAO DOS VESTIGIOS.xlsx`.

## Escopo

- A etiqueta continua sendo gerada no fluxo de custodia existente.
- Ao salvar a etiqueta, o vestigio passa a ter status inicial `catalogacao_pendente`.
- A pagina de catalogacao lista os vestigios pendentes e permite preencher metadados gerais e especificos.
- Ao salvar a ficha, o status passa para `catalogado`.
- O sistema deve usar schema local de campos inspirado na planilha, com classes 0 a 9 e suporte inicial forte para `0 - Papiloscopia`, incluindo a opcao `Papiloscopia - Iris`.

## Arquitetura

`vestigios` permanece como entidade principal. O backend ganha campos de catalogacao flexiveis em JSONB para evitar dezenas de colunas especificas por area:

- `classe_catalogacao`
- `subclasse_catalogacao`
- `tipo_catalogacao`
- `schema_versao`
- `metadados_gerais`
- `metadados_especificos`

O frontend compartilha um schema TypeScript de catalogacao para montar seletores, filtros e formularios dinamicos. A planilha fica representada no codigo como uma lista versionada de campos, com `name`, `label`, `type`, `required`, `section` e `helpText`.

## Fluxo

1. Usuario escolhe classe, grupo, subdivisao e tipo de vestigio no gerador de etiqueta.
2. Sistema monta a etiqueta e salva em `POST /vestigios`.
3. Backend grava o registro com status `catalogacao_pendente`.
4. Tela de catalogacao carrega `GET /vestigios?status=catalogacao_pendente`.
5. Usuario abre um vestigio, preenche os campos do schema daquela categoria e salva.
6. Backend persiste os JSONs de metadados e muda o status para `catalogado`.

## Validacao

O backend aceita objetos JSON para metadados, mas valida que os campos estruturais de catalogacao sao strings e que o status pertence aos estados conhecidos do fluxo. O frontend restringe o formulario aos campos definidos no schema, mas nao bloqueia campos opcionais vazios.

## Testes

- Testar que a criacao de vestigio sem status explicito usa `catalogacao_pendente`.
- Testar que atualizar metadados de catalogacao muda o status para `catalogado`.
- Testar que o schema de Papiloscopia contem os campos esperados, incluindo Iris.
- Testar que a tela de catalogacao renderiza itens pendentes e envia metadados ao salvar.
