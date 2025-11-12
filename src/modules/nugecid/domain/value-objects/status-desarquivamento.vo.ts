export enum StatusDesarquivamentoEnum {
  FINALIZADO = "FINALIZADO",
  DESARQUIVADO = "DESARQUIVADO",
  NAO_COLETADO = "NAO_COLETADO",
  SOLICITADO = "SOLICITADO",
  REARQUIVAMENTO_SOLICITADO = "REARQUIVAMENTO_SOLICITADO",
  RETIRADO_PELO_SETOR = "RETIRADO_PELO_SETOR",
  NAO_LOCALIZADO = "NAO_LOCALIZADO",
}

export class StatusDesarquivamento {
  private readonly _value: StatusDesarquivamentoEnum;

  // Mapa de transições válidas baseado na referência do documento
  private static readonly VALID_TRANSITIONS: Map<
    StatusDesarquivamentoEnum,
    StatusDesarquivamentoEnum[]
  > = new Map([
    [
      StatusDesarquivamentoEnum.SOLICITADO,
      [
        StatusDesarquivamentoEnum.DESARQUIVADO,
        StatusDesarquivamentoEnum.NAO_LOCALIZADO,
      ],
    ],
    [
      StatusDesarquivamentoEnum.DESARQUIVADO,
      [
        StatusDesarquivamentoEnum.RETIRADO_PELO_SETOR,
        StatusDesarquivamentoEnum.NAO_COLETADO,
        StatusDesarquivamentoEnum.REARQUIVAMENTO_SOLICITADO,
      ],
    ],
    [
      StatusDesarquivamentoEnum.RETIRADO_PELO_SETOR,
      [StatusDesarquivamentoEnum.FINALIZADO],
    ],
    [
      StatusDesarquivamentoEnum.NAO_COLETADO,
      [StatusDesarquivamentoEnum.REARQUIVAMENTO_SOLICITADO],
    ],
    [
      StatusDesarquivamentoEnum.REARQUIVAMENTO_SOLICITADO,
      [StatusDesarquivamentoEnum.FINALIZADO],
    ],
    [StatusDesarquivamentoEnum.NAO_LOCALIZADO, []], // Status final
    [StatusDesarquivamentoEnum.FINALIZADO, []], // Status final
  ]);

  constructor(value: StatusDesarquivamentoEnum) {
    if (!Object.values(StatusDesarquivamentoEnum).includes(value)) {
      throw new Error(`Status inválido: ${value}`);
    }
    this._value = value;
  }

  get value(): StatusDesarquivamentoEnum {
    return this._value;
  }

  equals(other: StatusDesarquivamento): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  static create(value: StatusDesarquivamentoEnum): StatusDesarquivamento {
    return new StatusDesarquivamento(value);
  }

  static createSolicitado(): StatusDesarquivamento {
    return new StatusDesarquivamento(StatusDesarquivamentoEnum.SOLICITADO);
  }

  static createDesarquivado(): StatusDesarquivamento {
    return new StatusDesarquivamento(StatusDesarquivamentoEnum.DESARQUIVADO);
  }

  static createFinalizado(): StatusDesarquivamento {
    return new StatusDesarquivamento(StatusDesarquivamentoEnum.FINALIZADO);
  }

  static createNaoLocalizado(): StatusDesarquivamento {
    return new StatusDesarquivamento(StatusDesarquivamentoEnum.NAO_LOCALIZADO);
  }

  static createNaoColetado(): StatusDesarquivamento {
    return new StatusDesarquivamento(StatusDesarquivamentoEnum.NAO_COLETADO);
  }

  static createRetiradoPeloSetor(): StatusDesarquivamento {
    return new StatusDesarquivamento(
      StatusDesarquivamentoEnum.RETIRADO_PELO_SETOR,
    );
  }

  static createRearquivamentoSolicitado(): StatusDesarquivamento {
    return new StatusDesarquivamento(
      StatusDesarquivamentoEnum.REARQUIVAMENTO_SOLICITADO,
    );
  }

  // Verifica se pode transicionar para um novo status
  canTransitionTo(newStatus: StatusDesarquivamento): boolean {
    const allowedTransitions =
      StatusDesarquivamento.VALID_TRANSITIONS.get(this._value) || [];
    return allowedTransitions.includes(newStatus._value);
  }

  // Obtém os status válidos para transição
  getValidTransitions(): StatusDesarquivamentoEnum[] {
    return StatusDesarquivamento.VALID_TRANSITIONS.get(this._value) || [];
  }

  // Verifica se é um status final
  isFinal(): boolean {
    return (
      this._value === StatusDesarquivamentoEnum.FINALIZADO ||
      this._value === StatusDesarquivamentoEnum.NAO_LOCALIZADO
    );
  }

  // Verifica se está finalizado
  isFinalized(): boolean {
    return this._value === StatusDesarquivamentoEnum.FINALIZADO;
  }

  // Verifica se foi desarquivado
  isDesarquivado(): boolean {
    return this._value === StatusDesarquivamentoEnum.DESARQUIVADO;
  }

  // Verifica se está solicitado (equivalente ao antigo pendente)
  isPending(): boolean {
    return this._value === StatusDesarquivamentoEnum.SOLICITADO;
  }

  // Verifica se está em andamento (qualquer status intermediário)
  isInProgress(): boolean {
    return (
      this._value === StatusDesarquivamentoEnum.DESARQUIVADO ||
      this._value === StatusDesarquivamentoEnum.RETIRADO_PELO_SETOR ||
      this._value === StatusDesarquivamentoEnum.REARQUIVAMENTO_SOLICITADO
    );
  }

  // Verifica se pode ser cancelado (não há cancelamento no novo fluxo)
  canBeCancelled(): boolean {
    return false; // Novo fluxo não permite cancelamento
  }

  // Verifica se pode ser concluído
  canBeCompleted(): boolean {
    return this.canTransitionTo(StatusDesarquivamento.createFinalizado());
  }

  // Obtém a cor associada ao status (para UI)
  getColor(): string {
    switch (this._value) {
      case StatusDesarquivamentoEnum.SOLICITADO:
        return "#8b5cf6"; // roxo
      case StatusDesarquivamentoEnum.DESARQUIVADO:
        return "#3b82f6"; // azul
      case StatusDesarquivamentoEnum.RETIRADO_PELO_SETOR:
        return "#06b6d4"; // ciano
      case StatusDesarquivamentoEnum.FINALIZADO:
        return "#10b981"; // verde
      case StatusDesarquivamentoEnum.NAO_COLETADO:
        return "#f59e0b"; // amarelo
      case StatusDesarquivamentoEnum.REARQUIVAMENTO_SOLICITADO:
        return "#6b7280"; // cinza
      case StatusDesarquivamentoEnum.NAO_LOCALIZADO:
        return "#ef4444"; // vermelho
      default:
        return "#6b7280"; // cinza
    }
  }

  // Obtém a descrição amigável do status
  getDescription(): string {
    switch (this._value) {
      case StatusDesarquivamentoEnum.SOLICITADO:
        return "Aguardando desarquivamento";
      case StatusDesarquivamentoEnum.DESARQUIVADO:
        return "Desarquivado e disponível";
      case StatusDesarquivamentoEnum.RETIRADO_PELO_SETOR:
        return "Retirado pelo setor solicitante";
      case StatusDesarquivamentoEnum.FINALIZADO:
        return "Processo finalizado";
      case StatusDesarquivamentoEnum.NAO_COLETADO:
        return "Não coletado pelo setor";
      case StatusDesarquivamentoEnum.REARQUIVAMENTO_SOLICITADO:
        return "Rearquivamento solicitado";
      case StatusDesarquivamentoEnum.NAO_LOCALIZADO:
        return "Documento não localizado";
      default:
        return "Status desconhecido";
    }
  }
}
