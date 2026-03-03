export enum SeiCapturaStatus {
  NOVO = "novo",
  POSSIVEL_DUPLICIDADE = "possivel_duplicidade",
  INCOMPLETO = "incompleto",
  PRONTO_PARA_IMPORTAR = "pronto_para_importar",
  IGNORADO = "ignorado",
  IMPORTADO = "importado",
  ERRO = "erro",
}

export interface SeiRegistroCapturado {
  numeroProcessoSei: string | null;
  numeroPci: string | null;
  dataEntradaSei: Date | null;
  unidadeOrigem: string | null;
  unidadeAtual: string | null;
  interessado: string | null;
  assunto: string | null;
  tipoProcesso: string | null;
  textoResumo: string | null;
  linkSei: string | null;
}

export interface SeiCapturaValidacao {
  status: SeiCapturaStatus;
  motivo: string | null;
  camposAusentes: string[];
}
