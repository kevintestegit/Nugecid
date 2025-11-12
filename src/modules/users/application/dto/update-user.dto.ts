export interface UpdateUserDto {
  nome?: string;
  usuario?: string;
  senha?: string;
  role?: string;
  matricula?: string | null;
  ativo?: boolean;
  avatarUrl?: string | null;
}
