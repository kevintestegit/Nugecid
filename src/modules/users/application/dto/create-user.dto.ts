export interface CreateUserDto {
  nome: string;
  usuario: string;
  senha: string;
  role: string;
  matricula?: string | null;
}
