export class DesarquivamentoId {
  private readonly _value: number;

  constructor(value: number) {
    if (!value || value <= 0) {
      throw new Error("DesarquivamentoId deve ser um número positivo");
    }
    this._value = value;
  }

  get value(): number {
    return this._value;
  }

  equals(other: DesarquivamentoId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value.toString();
  }

  static create(value: number): DesarquivamentoId {
    return new DesarquivamentoId(value);
  }
}
