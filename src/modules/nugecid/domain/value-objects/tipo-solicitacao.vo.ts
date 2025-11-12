export enum TipoSolicitacaoEnum {
  DESARQUIVAMENTO = "DESARQUIVAMENTO",
  COPIA = "COPIA",
  VISTA = "VISTA",
  CERTIDAO = "CERTIDAO",
}

export class TipoSolicitacao {
  private readonly _value: TipoSolicitacaoEnum;

  constructor(value: TipoSolicitacaoEnum) {
    if (!Object.values(TipoSolicitacaoEnum).includes(value)) {
      throw new Error(`Tipo de solicitação inválido: ${value}`);
    }
    this._value = value;
  }

  get value(): TipoSolicitacaoEnum {
    return this._value;
  }

  equals(other: TipoSolicitacao): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  static create(value: TipoSolicitacaoEnum): TipoSolicitacao {
    return new TipoSolicitacao(value);
  }

  static createDesarquivamento(): TipoSolicitacao {
    return new TipoSolicitacao(TipoSolicitacaoEnum.DESARQUIVAMENTO);
  }

  static createCopia(): TipoSolicitacao {
    return new TipoSolicitacao(TipoSolicitacaoEnum.COPIA);
  }

  static createVista(): TipoSolicitacao {
    return new TipoSolicitacao(TipoSolicitacaoEnum.VISTA);
  }

  static createCertidao(): TipoSolicitacao {
    return new TipoSolicitacao(TipoSolicitacaoEnum.CERTIDAO);
  }

  // Verifica se é desarquivamento
  isDesarquivamento(): boolean {
    return this._value === TipoSolicitacaoEnum.DESARQUIVAMENTO;
  }

  // Verifica se é cópia
  isCopia(): boolean {
    return this._value === TipoSolicitacaoEnum.COPIA;
  }

  // Verifica se é vista
  isVista(): boolean {
    return this._value === TipoSolicitacaoEnum.VISTA;
  }

  // Verifica se é certidão
  isCertidao(): boolean {
    return this._value === TipoSolicitacaoEnum.CERTIDAO;
  }

  // Obtém a descrição amigável do tipo
  getDescription(): string {
    switch (this._value) {
      case TipoSolicitacaoEnum.DESARQUIVAMENTO:
        return "Solicitação de desarquivamento de documento";
      case TipoSolicitacaoEnum.COPIA:
        return "Solicitação de cópia de documento";
      case TipoSolicitacaoEnum.VISTA:
        return "Solicitação de vista de documento";
      case TipoSolicitacaoEnum.CERTIDAO:
        return "Solicitação de certidão";
      default:
        return "Tipo de solicitação desconhecido";
    }
  }

  // Obtém o prazo padrão em dias para cada tipo de solicitação
  getDefaultDeadlineDays(): number {
    switch (this._value) {
      case TipoSolicitacaoEnum.DESARQUIVAMENTO:
        return 30; // 30 dias
      case TipoSolicitacaoEnum.COPIA:
        return 15; // 15 dias
      case TipoSolicitacaoEnum.VISTA:
        return 10; // 10 dias
      case TipoSolicitacaoEnum.CERTIDAO:
        return 20; // 20 dias
      default:
        return 30; // padrão
    }
  }

  // Verifica se requer localização física do documento
  requiresPhysicalLocation(): boolean {
    return (
      this._value === TipoSolicitacaoEnum.DESARQUIVAMENTO ||
      this._value === TipoSolicitacaoEnum.VISTA
    );
  }

  // Verifica se permite urgência
  allowsUrgency(): boolean {
    return true; // todos os tipos permitem urgência
  }

  // Obtém a cor associada ao tipo (para UI)
  getColor(): string {
    switch (this._value) {
      case TipoSolicitacaoEnum.DESARQUIVAMENTO:
        return "#3b82f6"; // azul
      case TipoSolicitacaoEnum.COPIA:
        return "#10b981"; // verde
      case TipoSolicitacaoEnum.VISTA:
        return "#f59e0b"; // amarelo
      case TipoSolicitacaoEnum.CERTIDAO:
        return "#8b5cf6"; // roxo
      default:
        return "#6b7280"; // cinza
    }
  }
}
