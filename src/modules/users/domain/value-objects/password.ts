import * as bcrypt from "bcryptjs";

export class Password {
  private readonly _hashedValue: string;

  private constructor(hashedValue: string) {
    this._hashedValue = hashedValue;
  }

  static async create(plainPassword: string): Promise<Password> {
    if (!plainPassword) {
      throw new Error("Senha não pode estar vazia");
    }

    if (plainPassword.length < 6) {
      throw new Error("Senha deve ter pelo menos 6 caracteres");
    }

    const saltRounds = 10;
    const hashedValue = await bcrypt.hash(plainPassword, saltRounds);
    return new Password(hashedValue);
  }

  static fromHash(hashedValue: string): Password {
    if (!hashedValue) {
      throw new Error("Hash da senha não pode estar vazio");
    }
    return new Password(hashedValue);
  }

  get hashedValue(): string {
    return this._hashedValue;
  }

  async isValid(plainPassword: string): Promise<boolean> {
    if (!plainPassword) {
      return false;
    }
    return bcrypt.compare(plainPassword, this._hashedValue);
  }

  equals(other: Password): boolean {
    return this._hashedValue === other._hashedValue;
  }
}
