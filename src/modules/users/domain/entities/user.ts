import { UserId } from "../value-objects/user-id";
import { Usuario } from "../value-objects/usuario";
import { Password } from "../value-objects/password";
import { Role } from "./role";
import { RoleId } from "../value-objects/role-id";

export interface UserSettings {
  theme?: "light" | "dark";
  showEmail?: boolean;
  showPhone?: boolean;
  autoSave?: boolean;
  compactView?: boolean;
  itemsPerPage?: number;
  [key: string]: unknown;
}

export interface UserProps {
  id?: UserId;
  nome: string;
  usuario: Usuario;
  password: Password;
  roleId: RoleId;
  role?: Role;
  matricula?: string | null;
  settings?: UserSettings;
  avatarUrl?: string | null;
  ativo?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class User {
  private _id?: UserId;
  private _nome: string;
  private _usuario: Usuario;
  private _password: Password;
  private _roleId: RoleId;
  private _role?: Role;
  private _matricula?: string | null;
  private _settings?: UserSettings;
  private _avatarUrl?: string | null;
  private _ativo: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt?: Date;

  constructor(props: UserProps) {
    this.validateProps(props);

    this._id = props.id;
    this._nome = props.nome;
    this._usuario = props.usuario;
    this._password = props.password;
    this._roleId = props.roleId;
    this._role = props.role;
    this._matricula = props.matricula ?? null;
    this._settings = props.settings;
    this._avatarUrl = props.avatarUrl;
    this._ativo = props.ativo ?? true;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
    this._deletedAt = props.deletedAt;
  }

  private validateProps(props: UserProps): void {
    if (!props.nome || props.nome.trim().length === 0) {
      throw new Error("Nome do usuário é obrigatório");
    }

    if (props.nome.trim().length < 2) {
      throw new Error("Nome deve ter pelo menos 2 caracteres");
    }

    if (!props.usuario) {
      throw new Error("Usuário é obrigatório");
    }

    if (!props.password) {
      throw new Error("Senha é obrigatória");
    }

    if (!props.roleId) {
      throw new Error("Role é obrigatória");
    }
  }

  get id(): UserId | undefined {
    return this._id;
  }

  get nome(): string {
    return this._nome;
  }

  get usuario(): Usuario {
    return this._usuario;
  }

  get password(): Password {
    return this._password;
  }

  get roleId(): RoleId {
    return this._roleId;
  }

  get role(): Role | undefined {
    return this._role;
  }

  get matricula(): string | null | undefined {
    return this._matricula;
  }

  get settings(): UserSettings | undefined {
    return this._settings;
  }

  get avatarUrl(): string | null | undefined {
    return this._avatarUrl;
  }

  get ativo(): boolean {
    return this._ativo;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this._deletedAt;
  }

  get isDeleted(): boolean {
    return this._deletedAt !== undefined;
  }

  updateNome(nome: string): void {
    if (!nome || nome.trim().length === 0) {
      throw new Error("Nome não pode estar vazio");
    }

    if (nome.trim().length < 2) {
      throw new Error("Nome deve ter pelo menos 2 caracteres");
    }

    this._nome = nome.trim();
    this._updatedAt = new Date();
  }

  updateUsuario(usuario: Usuario): void {
    this._usuario = usuario;
    this._updatedAt = new Date();
  }

  async updatePassword(newPassword: string): Promise<void> {
    this._password = await Password.create(newPassword);
    this._updatedAt = new Date();
  }

  updateRole(roleId: RoleId, role?: Role): void {
    this._roleId = roleId;
    this._role = role;
    this._updatedAt = new Date();
  }

  updateMatricula(matricula?: string | null): void {
    if (matricula && matricula.trim().length === 0) {
      this._matricula = null;
    } else {
      this._matricula = matricula ? matricula.trim() : null;
    }
    this._updatedAt = new Date();
  }

  updateSettings(settings: UserSettings | undefined): void {
    this._settings = settings;
    this._updatedAt = new Date();
  }

  updateAvatarUrl(avatarUrl: string | null | undefined): void {
    this._avatarUrl = avatarUrl;
    this._updatedAt = new Date();
  }

  activate(): void {
    this._ativo = true;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._ativo = false;
    this._updatedAt = new Date();
  }

  softDelete(): void {
    this._deletedAt = new Date();
    this._ativo = false;
    this._updatedAt = new Date();
  }

  restore(): void {
    this._deletedAt = undefined;
    this._ativo = true;
    this._updatedAt = new Date();
  }

  async validatePassword(plainPassword: string): Promise<boolean> {
    return this._password.isValid(plainPassword);
  }

  hasPermission(permission: string): boolean {
    if (!this._role) {
      return false;
    }
    return this._role.hasPermission(permission);
  }

  equals(other: User): boolean {
    if (!this._id || !other._id) {
      return false;
    }
    return this._id.equals(other._id);
  }
}
