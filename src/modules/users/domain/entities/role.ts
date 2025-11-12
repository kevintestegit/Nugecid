import { RoleId } from "../value-objects/role-id";

export interface RoleProps {
  id?: RoleId;
  nome: string;
  descricao?: string;
  permissoes: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Role {
  private _id?: RoleId;
  private _nome: string;
  private _descricao?: string;
  private _permissoes: string[];
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: RoleProps) {
    this.validateProps(props);

    this._id = props.id;
    this._nome = props.nome;
    this._descricao = props.descricao;
    // Garantir que permissoes seja sempre um array válido
    const permissoesArray = Array.isArray(props.permissoes)
      ? props.permissoes
      : [];
    this._permissoes = permissoesArray.slice(); // Cópia para imutabilidade
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  private validateProps(props: RoleProps): void {
    if (!props.nome || props.nome.trim().length === 0) {
      throw new Error("Nome da role é obrigatório");
    }

    // Permissões serão sempre normalizadas para array no construtor;
    // não exigimos quantidade mínima aqui para evitar TypeError em cenários
    // onde a role ainda não possui permissões definidas.
  }

  get id(): RoleId | undefined {
    return this._id;
  }

  get nome(): string {
    return this._nome;
  }

  get descricao(): string | undefined {
    return this._descricao;
  }

  get permissoes(): string[] {
    return [...this._permissoes]; // Retorna cópia para manter imutabilidade
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  hasPermission(permission: string): boolean {
    return this._permissoes.includes(permission);
  }

  addPermission(permission: string): void {
    if (!this._permissoes.includes(permission)) {
      this._permissoes.push(permission);
      this._updatedAt = new Date();
    }
  }

  removePermission(permission: string): void {
    const index = this._permissoes.indexOf(permission);
    if (index > -1) {
      this._permissoes.splice(index, 1);
      this._updatedAt = new Date();
    }
  }

  updateDescricao(descricao: string): void {
    this._descricao = descricao;
    this._updatedAt = new Date();
  }

  equals(other: Role): boolean {
    if (!this._id || !other._id) {
      return false;
    }
    return this._id.equals(other._id);
  }
}
