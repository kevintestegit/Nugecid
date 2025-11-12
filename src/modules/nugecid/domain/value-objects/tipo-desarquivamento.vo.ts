import { ValueObject } from "./value-object";

export enum TipoDesarquivamentoEnum {
  FISICO = "FISICO",
  DIGITAL = "DIGITAL",
  NAO_LOCALIZADO = "NAO_LOCALIZADO",
}

interface TipoDesarquivamentoProps {
  value: TipoDesarquivamentoEnum;
}

export class TipoDesarquivamento extends ValueObject<TipoDesarquivamentoProps> {
  public static readonly FISICO = new TipoDesarquivamento({
    value: TipoDesarquivamentoEnum.FISICO,
  });
  public static readonly DIGITAL = new TipoDesarquivamento({
    value: TipoDesarquivamentoEnum.DIGITAL,
  });
  public static readonly NAO_LOCALIZADO = new TipoDesarquivamento({
    value: TipoDesarquivamentoEnum.NAO_LOCALIZADO,
  });

  private constructor(props: TipoDesarquivamentoProps) {
    super(props);
  }

  public static create(value: string): TipoDesarquivamento {
    if (
      !Object.values(TipoDesarquivamentoEnum).includes(
        value as TipoDesarquivamentoEnum,
      )
    ) {
      throw new Error(`Tipo de desarquivamento inválido: ${value}`);
    }
    return new TipoDesarquivamento({ value: value as TipoDesarquivamentoEnum });
  }

  public get value(): TipoDesarquivamentoEnum {
    return this.props.value;
  }
}
