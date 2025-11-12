export class UserId {
  private readonly _value: number;

  constructor(value: number) {
    if (!value || value <= 0) {
      throw new Error("ID do usuário deve ser um número positivo");
    }

    this._value = value;
  }

  get value(): number {
    return this._value;
  }

  equals(other: UserId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value.toString();
  }
}
