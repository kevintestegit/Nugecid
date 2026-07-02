# Banco de Vestígios visível após catalogação

## Objetivo

Fazer o vestígio permanecer acessível depois da catalogação e conduzir o usuário diretamente ao registro salvo.

## Fluxo

1. O usuário salva uma catalogação.
2. A API mantém o registro com status `catalogado`.
3. A interface abre `/custodia/banco-vestigios?vestigioId=<id>`.
4. O Banco de Vestígios carrega a resposta paginada, encontra o registro, abre seus detalhes e destaca a linha.

## Alterações

- Restaurar “Banco de Vestígios” no submenu de Custódia.
- Reutilizar uma extração segura para respostas diretas, envelopadas e paginadas da API.
- Exibir no filtro os status válidos: pendente de catalogação, catalogado, em análise e finalizado.
- Redirecionar para o Banco de Vestígios somente depois de a atualização da catalogação concluir com sucesso.
- Preservar o comportamento atual em caso de erro: mostrar mensagem e manter o formulário aberto.

## Limites

- Nenhuma alteração no backend, banco, contratos da API ou registros existentes.
- Nenhuma nova dependência.
- Nenhuma mudança no fluxo de criação da etiqueta.

## Verificação

- Teste do redirecionamento após salvar.
- Teste da leitura da resposta paginada e exibição do catalogado.
- Teste de presença do item no submenu.
- Testes direcionados, typecheck, lint, formatação e build do frontend.
