import { randomInt } from "crypto";

export class CodigoBarras {
  private readonly _value: string;
  private static readonly PATTERN = /^DES\d{10}$/; // Formato: DES + 10 dígitos

  constructor(value: string) {
    if (!value || typeof value !== "string") {
      throw new Error("Código de barras deve ser uma string válida");
    }

    const trimmedValue = value.trim();
    if (!CodigoBarras.PATTERN.test(trimmedValue)) {
      throw new Error(
        "Código de barras deve seguir o formato DES + 10 dígitos (ex: DES2024010001)",
      );
    }

    this._value = trimmedValue;
  }

  get value(): string {
    return this._value;
  }

  equals(other: CodigoBarras): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  static create(value: string): CodigoBarras {
    return new CodigoBarras(value);
  }

  static generateNew(): CodigoBarras {
    const year = String(new Date().getFullYear()).slice(-2); // Últimos 2 dígitos do ano
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const day = String(new Date().getDate()).padStart(2, "0");
    const random = String(randomInt(0, 10000)).padStart(4, "0");

    const codigo = `DES${year}${month}${day}${random}`; // Total: DES + 10 dígitos
    return new CodigoBarras(codigo);
  }

  getYear(): number {
    return parseInt(this._value.substring(3, 7));
  }

  getMonth(): number {
    return parseInt(this._value.substring(7, 9));
  }

  getDay(): number {
    return parseInt(this._value.substring(9, 11));
  }

  getSequence(): string {
    return this._value.substring(11);
  }
}
