export class RoleId {
  private readonly _value: number;

  constructor(value: number) {
    if (!value || value <= 0) {
      throw new Error("ID da role deve ser um número positivo");
    }

    this._value = value;
  }

  get value(): number {
    return this._value;
  }

  equals(other: RoleId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value.toString();
  }
}
