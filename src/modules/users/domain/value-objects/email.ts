export class Email {
  private readonly _value: string;

  constructor(value: string) {
    if (!value) {
      throw new Error("Email não pode estar vazio");
    }

    if (!this.isValidEmail(value)) {
      throw new Error("Email inválido");
    }

    this._value = value.toLowerCase().trim();
  }

  get value(): string {
    return this._value;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
