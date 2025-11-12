export class NumeroRegistro {
  private readonly _value: string;
  private static readonly MIN_LENGTH = 5;
  private static readonly MAX_LENGTH = 50;

  constructor(value: string) {
    if (!value || typeof value !== "string") {
      throw new Error("Número de registro deve ser uma string válida");
    }

    const trimmedValue = value.trim();

    if (trimmedValue.length < NumeroRegistro.MIN_LENGTH) {
      throw new Error(
        `Número de registro deve ter pelo menos ${NumeroRegistro.MIN_LENGTH} caracteres`,
      );
    }

    if (trimmedValue.length > NumeroRegistro.MAX_LENGTH) {
      throw new Error(
        `Número de registro deve ter no máximo ${NumeroRegistro.MAX_LENGTH} caracteres`,
      );
    }

    // Validação básica de formato (pode conter letras, números, pontos, hífens e barras)
    const validPattern = /^[A-Za-z0-9.\-\/\s]+$/;
    if (!validPattern.test(trimmedValue)) {
      throw new Error("Número de registro contém caracteres inválidos");
    }

    this._value = trimmedValue;
  }

  get value(): string {
    return this._value;
  }

  equals(other: NumeroRegistro): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  static create(value: string): NumeroRegistro {
    return new NumeroRegistro(value);
  }

  // Método para normalizar o formato (remover espaços extras, etc.)
  static normalize(value: string): string {
    return value.trim().replace(/\s+/g, " ");
  }

  // Verifica se é um formato de ano específico (ex: 2024.001.123456)
  isYearFormat(): boolean {
    const yearPattern = /^\d{4}\.\d{3}\.\d+$/;
    return yearPattern.test(this._value);
  }

  // Extrai o ano se estiver no formato padrão
  getYear(): number | null {
    if (this.isYearFormat()) {
      return parseInt(this._value.substring(0, 4));
    }
    return null;
  }

  // Extrai o número sequencial se estiver no formato padrão
  getSequentialNumber(): string | null {
    if (this.isYearFormat()) {
      const parts = this._value.split(".");
      return parts.length >= 2 ? parts[1] : null;
    }
    return null;
  }
}
