export class Usuario {
  private readonly _value: string;

  constructor(value: string) {
    this.validate(value);
    this._value = value.trim().toLowerCase();
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error("Usuário não pode estar vazio");
    }

    const trimmedValue = value.trim();

    if (trimmedValue.length < 3) {
      throw new Error("Usuário deve ter pelo menos 3 caracteres");
    }

    if (trimmedValue.length > 50) {
      throw new Error("Usuário não pode ter mais de 50 caracteres");
    }

    // Validar caracteres permitidos (letras, números, underscore, hífen)
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(trimmedValue)) {
      throw new Error(
        "Usuário pode conter apenas letras, números, underscore e hífen",
      );
    }

    // Não pode começar ou terminar com underscore ou hífen
    if (
      trimmedValue.startsWith("_") ||
      trimmedValue.startsWith("-") ||
      trimmedValue.endsWith("_") ||
      trimmedValue.endsWith("-")
    ) {
      throw new Error(
        "Usuário não pode começar ou terminar com underscore ou hífen",
      );
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: Usuario): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  static create(value: string): Usuario {
    return new Usuario(value);
  }
}
