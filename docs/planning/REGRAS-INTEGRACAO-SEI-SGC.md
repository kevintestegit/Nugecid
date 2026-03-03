# Regras e Logica de Integracao SEI -> SGC

> Objetivo: definir uma logica clara para evoluir o SGC sem depender inicialmente de automacao fragil de tela. Este documento orienta regras de negocio, captura de dados, validacao, auditoria e etapas futuras para integrar registros do SEI ao fluxo de desarquivamento.

## 1. Principio Geral

O SGC deve continuar sendo a base operacional do NUGECID para gestao de desarquivamentos, tarefas, anexos, prazos, historico, termos e auditoria.

O SEI deve ser tratado como origem externa de solicitacoes e documentos. A integracao deve trazer dados do SEI para o SGC de forma controlada, auditavel e reversivel.

Regra principal:

- Nenhum dado capturado do SEI deve sobrescrever automaticamente dados ja revisados manualmente no SGC sem regra explicita.
- Todo registro criado ou atualizado por integracao deve manter a origem, data/hora, usuario/sistema responsavel e evidencia minima da captura.
- A primeira versao deve priorizar pre-importacao e conferencia, nao criacao automatica irrestrita.

## 2. Fontes De Captura Permitidas

A ordem de preferencia tecnica deve ser:

1. API oficial, WSSEI REST ou web service institucional.
2. Relatorio/exportacao oficial do SEI em CSV, XLSX, XML ou formato equivalente.
3. E-mail institucional gerado pelo SEI.
4. Captura manual assistida por arquivo baixado pelo usuario.
5. Automacao de tela somente como ultimo recurso.

Automacao de tela nao deve ser a primeira solucao porque pode quebrar com mudancas de layout, sessao, 2FA, captcha, proxy, navegador ou regras de seguranca do SEI.

## 3. Conceitos Do Fluxo

### Registro SEI Capturado

Representa um item encontrado no SEI antes de virar desarquivamento no SGC.

Campos minimos esperados:

- numeroProcessoSei
- dataEntradaSei
- unidadeOrigem
- unidadeAtual
- interessado
- assunto
- tipoProcesso
- textoResumo
- linkSei, quando permitido
- documentosRelacionados
- statusCaptura
- hashOrigem ou identificador equivalente, quando possivel

### Pre-Importacao

Estado intermediario onde o SGC mostra registros capturados do SEI para revisao.

Possiveis status:

- novo
- possivel_duplicidade
- incompleto
- pronto_para_importar
- ignorado
- importado
- erro

### Desarquivamento Criado Pelo SEI

Registro oficial no modulo NUGECID criado a partir de uma captura aprovada.

Deve possuir vinculo permanente com a origem:

- origemCriacao = `sei`
- numeroProcessoSei
- dataImportacaoSei
- identificadorCapturaSei
- criadoPor = sistema ou usuario aprovador

## 4. Regra De Criacao

Um registro capturado do SEI so pode criar um desarquivamento quando atender aos requisitos minimos:

- possuir numero de processo SEI valido;
- possuir unidade ou origem identificavel;
- possuir assunto, tipo ou texto suficiente para classificar a demanda;
- nao existir desarquivamento ativo com o mesmo numeroProcessoSei;
- nao existir duplicidade forte por numero PCI, quando o PCI for identificado;
- passar pelas regras de permissao do usuario ou rotina responsavel.

Na primeira versao, a criacao deve ser semi-automatica:

- o sistema captura;
- o sistema valida;
- o usuario confere;
- o usuario aprova a importacao;
- o sistema cria o desarquivamento.

Criacao totalmente automatica deve ser uma evolucao posterior, apos historico confiavel de importacoes.

## 5. Regra De Duplicidade

O sistema deve classificar duplicidades em niveis.

Duplicidade forte:

- mesmo numeroProcessoSei;
- mesmo numero PCI;
- mesmo identificador externo unico.

Duplicidade provavel:

- mesmo interessado;
- mesmo assunto;
- mesma unidade;
- data proxima;
- documentos com nomes ou numeros semelhantes.

Duplicidade fraca:

- apenas interessado semelhante;
- apenas assunto semelhante;
- apenas unidade e periodo semelhantes.

Regras:

- Duplicidade forte bloqueia criacao automatica.
- Duplicidade provavel exige revisao manual.
- Duplicidade fraca apenas alerta o usuario.

## 6. Regra De Atualizacao

Quando um processo SEI ja vinculado a um desarquivamento for capturado novamente:

- atualizar apenas campos de sincronizacao e status externo;
- registrar nova movimentacao no historico;
- nao substituir campos preenchidos manualmente sem confirmacao;
- anexar novos documentos apenas se ainda nao existirem;
- registrar diferencas detectadas para revisao.

Campos que podem ser atualizados automaticamente:

- dataUltimaSincronizacaoSei
- statusSei
- unidadeAtualSei
- ultimaMovimentacaoSei
- novosDocumentosDetectados

Campos que exigem confirmacao:

- interessado
- requerente
- numero PCI
- tipo de desarquivamento
- observacoes internas
- status operacional do SGC

## 7. Regra De Classificacao

O sistema deve tentar classificar a captura em uma categoria operacional.

Categorias iniciais sugeridas:

- pedido de desarquivamento
- resposta a desarquivamento
- complemento de informacao
- documento anexado
- processo sem relacao com desarquivamento
- pendente de analise

Na primeira versao, a classificacao pode ser baseada em regras simples:

- palavras-chave no assunto;
- tipo do processo;
- unidade de origem;
- unidade atual;
- marcadores;
- conteudo textual exportado;
- numero PCI identificado.

Exemplos de palavras-chave:

- desarquivamento
- arquivo
- pasta
- PCI
- prontuario
- solicitacao
- nucleo
- NUGECID

## 8. Regra De Prazos

Quando um desarquivamento for criado a partir do SEI:

- a data de entrada deve vir preferencialmente do SEI;
- o prazo operacional deve ser calculado pelo SGC;
- feriados e pontos facultativos devem seguir as regras ja existentes do sistema;
- o prazo deve ser recalculavel apenas enquanto o registro nao estiver concluido;
- alteracoes manuais de prazo devem ser auditadas.

Se a data do SEI estiver ausente ou inconsistente:

- marcar captura como `incompleto`;
- exigir preenchimento manual antes da importacao.

## 9. Regra De Anexos

Anexos vindos do SEI devem ser tratados como documentos externos.

Regras:

- validar tipo real do arquivo antes de salvar;
- evitar duplicidade por hash, nome e tamanho;
- preservar nome original quando possivel;
- registrar origem SEI no anexo;
- nunca confiar apenas na extensao do arquivo;
- aplicar antivirus/validacao ja prevista no modulo de seguranca quando disponivel.

Metadados recomendados:

- origem = `sei`
- numeroProcessoSei
- idDocumentoSei
- nomeOriginal
- mimeType
- tamanhoBytes
- hashArquivo
- dataCaptura

## 10. Regra Do Termo Ao Concluir

Quando um desarquivamento for concluido:

- gerar automaticamente o termo oficial em PDF;
- salvar o PDF como anexo/documento permanente do registro;
- registrar data/hora de geracao;
- registrar usuario que concluiu;
- registrar versao do modelo usado;
- registrar hash do PDF;
- impedir que o termo salvo mude silenciosamente depois.

Se o usuario clicar em baixar termo apos a conclusao:

- entregar o PDF salvo;
- nao regerar automaticamente.

Se for necessario corrigir:

- usar acao explicita de regerar termo;
- registrar motivo;
- manter historico ou substituir com auditoria, conforme decisao administrativa.

## 11. Auditoria Obrigatoria

Toda acao automatizada ou assistida deve gerar auditoria.

Eventos minimos:

- captura iniciada;
- captura concluida;
- captura falhou;
- registro classificado;
- duplicidade detectada;
- pre-importacao criada;
- importacao aprovada;
- desarquivamento criado;
- desarquivamento atualizado por origem SEI;
- anexo importado;
- termo gerado ao concluir;
- termo regerado;
- captura ignorada.

Cada evento deve registrar:

- data/hora;
- origem;
- usuario, quando houver;
- identificador do processo SEI;
- identificador do desarquivamento;
- resumo da alteracao;
- erro tecnico, quando houver.

## 12. Permissoes

Somente perfis autorizados devem poder:

- iniciar sincronizacao manual;
- aprovar importacao;
- ignorar captura;
- resolver duplicidade;
- alterar dados importados;
- regerar termo;
- configurar origem de captura.

Usuarios comuns podem visualizar apenas registros conforme suas permissoes atuais no SGC.

## 13. Tela Recomendada

Criar futuramente uma tela chamada "Capturas do SEI" ou "Pre-importacao SEI".

Filtros recomendados:

- status da captura;
- periodo;
- unidade;
- tipo;
- duplicidade;
- importado/nao importado;
- com erro;
- numero processo SEI;
- numero PCI.

Acoes recomendadas:

- visualizar dados capturados;
- comparar com registro existente;
- importar;
- vincular a desarquivamento existente;
- ignorar;
- marcar como pendente;
- tentar capturar novamente.

## 14. Fluxo Inicial Recomendado

Fase 1: Captura manual assistida

- usuario baixa relatorio/exportacao do SEI;
- SGC importa arquivo;
- SGC valida e mostra pre-importacao;
- usuario aprova criacao.

Fase 2: Captura recorrente

- SGC executa rotina agendada;
- busca novas entradas na origem configurada;
- cria pre-importacoes automaticamente;
- notifica responsaveis.

Fase 3: Integracao completa

- SGC consulta API oficial, se disponivel;
- baixa anexos autorizados;
- atualiza status;
- detecta movimentacoes;
- gera alertas e relatorios.

## 15. Criterios De Aceite

Uma primeira entrega da integracao so deve ser considerada pronta quando:

- importar origem sem quebrar registros manuais;
- detectar duplicidade forte;
- criar pre-importacao auditada;
- permitir revisao antes de criar desarquivamento;
- criar desarquivamento com vinculo SEI;
- registrar auditoria completa;
- lidar com arquivo invalido, linha incompleta e erro de formato;
- permitir reprocessamento seguro;
- ter testes para mapeamento, duplicidade e criacao.

## 16. Decisoes A Confirmar

Antes da implementacao, ainda precisam ser definidas:

- qual sera a primeira fonte real: relatorio, exportacao, e-mail ou API;
- quais campos do SEI sao obrigatorios para criar desarquivamento;
- qual regra identifica numero PCI;
- quais unidades do SEI entram no fluxo;
- se anexos serao importados na primeira versao;
- se o termo salvo ao concluir substitui o fluxo atual de geracao sob demanda;
- quem pode aprovar importacoes;
- por quanto tempo manter capturas ignoradas ou com erro.
